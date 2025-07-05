#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const cron = require('node-cron');
const SelfHealingSystem = require('./heal');

class NetworkRecoverySystem {
  constructor() {
    this.healer = new SelfHealingSystem();
    this.networkHistory = [];
    this.endpoints = new Map();
    this.retryAttempts = new Map();
    this.config = {
      pingInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      timeoutMs: 10000, // 10 seconds
      criticalEndpoints: [
        'google.com',
        'github.com',
        'npmjs.com'
      ]
    };
    this.recoveryStrategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    this.recoveryStrategies.set('DNS_RESOLUTION', this.recoverDNSResolution.bind(this));
    this.recoveryStrategies.set('CONNECTION_TIMEOUT', this.recoverConnectionTimeout.bind(this));
    this.recoveryStrategies.set('NETWORK_UNREACHABLE', this.recoverNetworkUnreachable.bind(this));
    this.recoveryStrategies.set('PROXY_ERROR', this.recoverProxyError.bind(this));
    this.recoveryStrategies.set('SSL_ERROR', this.recoverSSLError.bind(this));
    this.recoveryStrategies.set('RATE_LIMIT', this.recoverRateLimit.bind(this));
  }

  async startNetworkMonitoring() {
    console.log(chalk.blue('🌐 Starting network recovery monitoring...'));
    
    // Monitor critical endpoints every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.monitorCriticalEndpoints();
    });
    
    // Check network adapter status every 2 minutes
    cron.schedule('0 */2 * * * *', async () => {
      await this.checkNetworkAdapters();
    });
    
    // DNS health check every 5 minutes
    cron.schedule('0 */5 * * * *', async () => {
      await this.checkDNSHealth();
    });
    
    // Network performance analysis every 10 minutes
    cron.schedule('0 */10 * * * *', async () => {
      await this.analyzeNetworkPerformance();
    });
    
    console.log(chalk.green('✅ Network monitoring started'));
  }

  async monitorCriticalEndpoints() {
    for (const endpoint of this.config.criticalEndpoints) {
      try {
        const result = await this.pingEndpoint(endpoint);
        await this.recordEndpointStatus(endpoint, result);
        
        if (!result.success) {
          await this.handleEndpointFailure(endpoint, result);
        }
      } catch (error) {
        console.log(chalk.red(`❌ Failed to monitor ${endpoint}: ${error.message}`));
      }
    }
  }

  async pingEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const isWindows = process.platform === 'win32';
      const pingCmd = isWindows 
        ? `ping -n 1 -w ${this.config.timeoutMs} ${endpoint}`
        : `ping -c 1 -W ${Math.ceil(this.config.timeoutMs / 1000)} ${endpoint}`;
      
      const result = execSync(pingCmd, { 
        encoding: 'utf8',
        timeout: this.config.timeoutMs,
        stdio: 'pipe'
      });
      
      const responseTime = Date.now() - startTime;
      
      // Extract response time from ping output
      const timeMatch = result.match(/time[<=](\d+(?:\.\d+)?)/i);
      const actualTime = timeMatch ? parseFloat(timeMatch[1]) : responseTime;
      
      return {
        success: true,
        endpoint,
        responseTime: actualTime,
        timestamp: new Date().toISOString(),
        output: result.trim()
      };
      
    } catch (error) {
      return {
        success: false,
        endpoint,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message,
        code: error.code || 'UNKNOWN'
      };
    }
  }

  async recordEndpointStatus(endpoint, result) {
    if (!this.endpoints.has(endpoint)) {
      this.endpoints.set(endpoint, {
        history: [],
        consecutiveFailures: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }
    
    const endpointData = this.endpoints.get(endpoint);
    endpointData.history.push(result);
    
    // Keep only last 100 entries
    if (endpointData.history.length > 100) {
      endpointData.history.shift();
    }
    
    if (result.success) {
      endpointData.consecutiveFailures = 0;
      endpointData.lastSuccess = result.timestamp;
    } else {
      endpointData.consecutiveFailures++;
      endpointData.lastFailure = result.timestamp;
    }
  }

  async handleEndpointFailure(endpoint, result) {
    const endpointData = this.endpoints.get(endpoint);
    
    console.log(chalk.yellow(`⚠️  Network failure: ${endpoint} (${endpointData.consecutiveFailures} consecutive)`));
    
    if (endpointData.consecutiveFailures >= this.config.maxRetries) {
      console.log(chalk.red(`🚨 Critical network failure: ${endpoint}`));
      
      const errorType = this.classifyNetworkError(result);
      await this.attemptNetworkRecovery(endpoint, errorType, result);
    }
  }

  classifyNetworkError(result) {
    const error = result.error || '';
    const code = result.code || '';
    
    if (error.includes('Temporary failure in name resolution') || 
        error.includes('Name or service not known')) {
      return 'DNS_RESOLUTION';
    }
    
    if (error.includes('Connection timed out') || 
        code === 'TIMEOUT') {
      return 'CONNECTION_TIMEOUT';
    }
    
    if (error.includes('Network is unreachable') || 
        error.includes('No route to host')) {
      return 'NETWORK_UNREACHABLE';
    }
    
    if (error.includes('proxy') || error.includes('Proxy')) {
      return 'PROXY_ERROR';
    }
    
    if (error.includes('SSL') || error.includes('TLS') || 
        error.includes('certificate')) {
      return 'SSL_ERROR';
    }
    
    if (error.includes('rate limit') || error.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    
    return 'UNKNOWN';
  }

  async attemptNetworkRecovery(endpoint, errorType, result) {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (strategy) {
      console.log(chalk.blue(`🔧 Attempting network recovery for ${errorType}...`));
      
      const recoveryResult = await strategy(endpoint, result);
      
      // Log the recovery attempt
      const error = new Error(`Network failure: ${endpoint} - ${errorType}`);
      error.code = 'NETWORK_FAILURE';
      
      await this.healer.attemptHealing(error, {
        endpoint,
        errorType,
        result,
        recoveryResult
      });
      
      return recoveryResult;
    } else {
      console.log(chalk.yellow(`⚠️  No recovery strategy for ${errorType}`));
      return { success: false, error: `No strategy for ${errorType}` };
    }
  }

  async recoverDNSResolution(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting DNS resolution recovery...'));
    
    try {
      // Try different DNS servers
      const dnsServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
      
      for (const dns of dnsServers) {
        try {
          const isWindows = process.platform === 'win32';
          const nslookupCmd = isWindows 
            ? `nslookup ${endpoint} ${dns}`
            : `nslookup ${endpoint} ${dns}`;
          
          const result = execSync(nslookupCmd, { 
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe'
          });
          
          if (result.includes('Address:') || result.includes('answer:')) {
            console.log(chalk.green(`✅ DNS resolution successful with ${dns}`));
            
            // Try to set this as temporary DNS
            if (!isWindows) {
              try {
                execSync(`echo "nameserver ${dns}" | sudo tee /etc/resolv.conf.backup`, { stdio: 'pipe' });
                console.log(chalk.green(`✅ Set temporary DNS to ${dns}`));
              } catch (dnsError) {
                console.log(chalk.yellow(`⚠️  Could not set DNS: ${dnsError.message}`));
              }
            }
            
            return { success: true, action: `dns_recovery_${dns}` };
          }
        } catch (dnsError) {
          console.log(chalk.yellow(`⚠️  DNS ${dns} failed: ${dnsError.message}`));
        }
      }
      
      return { success: false, error: 'All DNS servers failed' };
      
    } catch (error) {
      console.log(chalk.red(`❌ DNS recovery failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async recoverConnectionTimeout(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting connection timeout recovery...'));
    
    try {
      // Increase timeout and retry
      const longPingCmd = process.platform === 'win32'
        ? `ping -n 1 -w ${this.config.timeoutMs * 2} ${endpoint}`
        : `ping -c 1 -W ${Math.ceil(this.config.timeoutMs * 2 / 1000)} ${endpoint}`;
      
      const result = execSync(longPingCmd, { 
        encoding: 'utf8',
        timeout: this.config.timeoutMs * 2,
        stdio: 'pipe'
      });
      
      console.log(chalk.green(`✅ Connection recovered with extended timeout`));
      return { success: true, action: 'extended_timeout_recovery' };
      
    } catch (error) {
      // Try traceroute to identify where the connection fails
      try {
        const traceCmd = process.platform === 'win32'
          ? `tracert -h 10 ${endpoint}`
          : `traceroute -m 10 ${endpoint}`;
        
        const traceResult = execSync(traceCmd, { 
          encoding: 'utf8',
          timeout: 30000,
          stdio: 'pipe'
        });
        
        console.log(chalk.blue(`📊 Traceroute completed for ${endpoint}`));
        console.log(chalk.gray(traceResult.substring(0, 500)));
        
        return { success: false, error: 'Connection timeout persists', trace: traceResult };
        
      } catch (traceError) {
        console.log(chalk.red(`❌ Timeout recovery failed: ${error.message}`));
        return { success: false, error: error.message };
      }
    }
  }

  async recoverNetworkUnreachable(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting network unreachable recovery...'));
    
    try {
      // Check network adapter status
      const adapters = await this.getNetworkAdapters();
      
      for (const adapter of adapters) {
        if (adapter.status === 'down') {
          console.log(chalk.yellow(`⚠️  Network adapter ${adapter.name} is down`));
          
          // Try to bring it up (Linux/Mac)
          if (process.platform !== 'win32') {
            try {
              execSync(`sudo ifconfig ${adapter.name} up`, { stdio: 'pipe' });
              console.log(chalk.green(`✅ Brought up network adapter ${adapter.name}`));
              
              // Wait a moment and test
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const testResult = await this.pingEndpoint(endpoint);
              if (testResult.success) {
                return { success: true, action: `network_adapter_recovery_${adapter.name}` };
              }
              
            } catch (adapterError) {
              console.log(chalk.yellow(`⚠️  Could not bring up adapter: ${adapterError.message}`));
            }
          }
        }
      }
      
      // Try to restart network manager (Linux)
      if (process.platform === 'linux') {
        try {
          execSync('sudo systemctl restart NetworkManager', { stdio: 'pipe' });
          console.log(chalk.green('✅ Restarted NetworkManager'));
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const testResult = await this.pingEndpoint(endpoint);
          if (testResult.success) {
            return { success: true, action: 'network_manager_restart' };
          }
          
        } catch (nmError) {
          console.log(chalk.yellow(`⚠️  Could not restart NetworkManager: ${nmError.message}`));
        }
      }
      
      return { success: false, error: 'Network unreachable persists' };
      
    } catch (error) {
      console.log(chalk.red(`❌ Network unreachable recovery failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async recoverProxyError(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting proxy error recovery...'));
    
    try {
      // Clear proxy settings temporarily
      const originalProxy = process.env.HTTP_PROXY || process.env.http_proxy;
      const originalProxyHttps = process.env.HTTPS_PROXY || process.env.https_proxy;
      
      delete process.env.HTTP_PROXY;
      delete process.env.http_proxy;
      delete process.env.HTTPS_PROXY;
      delete process.env.https_proxy;
      
      const testResult = await this.pingEndpoint(endpoint);
      
      if (testResult.success) {
        console.log(chalk.green('✅ Connection successful without proxy'));
        return { success: true, action: 'proxy_bypass_recovery' };
      } else {
        // Restore proxy settings
        if (originalProxy) {
          process.env.HTTP_PROXY = originalProxy;
          process.env.http_proxy = originalProxy;
        }
        if (originalProxyHttps) {
          process.env.HTTPS_PROXY = originalProxyHttps;
          process.env.https_proxy = originalProxyHttps;
        }
        
        return { success: false, error: 'Proxy bypass did not help' };
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Proxy recovery failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async recoverSSLError(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting SSL error recovery...'));
    
    try {
      // Try with different SSL/TLS settings
      const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      
      // Temporarily disable SSL verification (for testing only)
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      const testResult = await this.pingEndpoint(endpoint);
      
      // Restore SSL verification
      if (originalReject) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      
      if (testResult.success) {
        console.log(chalk.yellow('⚠️  SSL issue detected - certificate may be invalid'));
        return { success: true, action: 'ssl_bypass_recovery', warning: 'Certificate validation bypassed' };
      }
      
      return { success: false, error: 'SSL recovery failed' };
      
    } catch (error) {
      console.log(chalk.red(`❌ SSL recovery failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async recoverRateLimit(endpoint, result) {
    console.log(chalk.blue('🔧 Attempting rate limit recovery...'));
    
    try {
      // Wait for rate limit to reset
      const waitTime = 60000; // 1 minute
      console.log(chalk.yellow(`⏱️  Waiting ${waitTime / 1000} seconds for rate limit reset...`));
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      const testResult = await this.pingEndpoint(endpoint);
      
      if (testResult.success) {
        console.log(chalk.green('✅ Rate limit recovery successful'));
        return { success: true, action: 'rate_limit_wait_recovery' };
      }
      
      return { success: false, error: 'Rate limit persists' };
      
    } catch (error) {
      console.log(chalk.red(`❌ Rate limit recovery failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async getNetworkAdapters() {
    try {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows 
        ? 'wmic path win32_networkadapter get name,netenabled'
        : 'ip link show';
      
      const result = execSync(cmd, { encoding: 'utf8' });
      
      const adapters = [];
      
      if (isWindows) {
        const lines = result.split('\n').slice(1); // Skip header
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            adapters.push({
              name: parts.slice(1).join(' '),
              status: parts[0] === 'TRUE' ? 'up' : 'down'
            });
          }
        }
      } else {
        const lines = result.split('\n');
        for (const line of lines) {
          const match = line.match(/^\d+:\s+(\w+):.+state\s+(\w+)/);
          if (match) {
            adapters.push({
              name: match[1],
              status: match[2].toLowerCase()
            });
          }
        }
      }
      
      return adapters;
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not get network adapters: ${error.message}`));
      return [];
    }
  }

  async checkNetworkAdapters() {
    const adapters = await this.getNetworkAdapters();
    
    for (const adapter of adapters) {
      if (adapter.status === 'down' && !adapter.name.includes('lo')) {
        console.log(chalk.yellow(`⚠️  Network adapter ${adapter.name} is down`));
        
        const error = new Error(`Network adapter down: ${adapter.name}`);
        error.code = 'NETWORK_ADAPTER_DOWN';
        
        await this.healer.attemptHealing(error, { adapter });
      }
    }
  }

  async checkDNSHealth() {
    const testDomains = ['google.com', 'cloudflare.com', 'github.com'];
    let successCount = 0;
    
    for (const domain of testDomains) {
      try {
        const isWindows = process.platform === 'win32';
        const nslookupCmd = `nslookup ${domain}`;
        
        const result = execSync(nslookupCmd, { 
          encoding: 'utf8',
          timeout: 5000,
          stdio: 'pipe'
        });
        
        if (result.includes('Address:') || result.includes('answer:')) {
          successCount++;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  DNS lookup failed for ${domain}`));
      }
    }
    
    const dnsHealthPercent = (successCount / testDomains.length) * 100;
    
    if (dnsHealthPercent < 50) {
      console.log(chalk.red(`🚨 DNS health critical: ${dnsHealthPercent}%`));
      
      const error = new Error(`DNS health critical: ${dnsHealthPercent}%`);
      error.code = 'DNS_HEALTH_CRITICAL';
      
      await this.healer.attemptHealing(error, { 
        dnsHealthPercent,
        successCount,
        totalTests: testDomains.length
      });
    }
  }

  async analyzeNetworkPerformance() {
    const performanceData = {
      timestamp: new Date().toISOString(),
      endpoints: {}
    };
    
    for (const [endpoint, data] of this.endpoints) {
      const recentHistory = data.history.slice(-10);
      const successfulPings = recentHistory.filter(h => h.success);
      
      if (successfulPings.length > 0) {
        const avgResponseTime = successfulPings.reduce((sum, ping) => sum + ping.responseTime, 0) / successfulPings.length;
        const maxResponseTime = Math.max(...successfulPings.map(p => p.responseTime));
        const minResponseTime = Math.min(...successfulPings.map(p => p.responseTime));
        
        performanceData.endpoints[endpoint] = {
          successRate: (successfulPings.length / recentHistory.length) * 100,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          consecutiveFailures: data.consecutiveFailures
        };
      }
    }
    
    this.networkHistory.push(performanceData);
    
    // Keep only last 50 performance snapshots
    if (this.networkHistory.length > 50) {
      this.networkHistory.shift();
    }
  }

  async generateReport() {
    console.log(chalk.cyan('📊 Network Recovery Report'));
    console.log(chalk.cyan('==========================='));
    
    console.log(chalk.green('Monitored Endpoints:'));
    for (const [endpoint, data] of this.endpoints) {
      const recentHistory = data.history.slice(-10);
      const successRate = recentHistory.length > 0 
        ? (recentHistory.filter(h => h.success).length / recentHistory.length) * 100
        : 0;
      
      console.log(`  ${endpoint}: ${successRate.toFixed(1)}% success rate`);
      console.log(`    Consecutive failures: ${data.consecutiveFailures}`);
      console.log(`    Last success: ${data.lastSuccess || 'Never'}`);
      console.log(`    Last failure: ${data.lastFailure || 'Never'}`);
    }
    
    console.log(chalk.blue('Network Performance:'));
    if (this.networkHistory.length > 0) {
      const latest = this.networkHistory[this.networkHistory.length - 1];
      for (const [endpoint, stats] of Object.entries(latest.endpoints)) {
        console.log(`  ${endpoint}:`);
        console.log(`    Success Rate: ${stats.successRate.toFixed(1)}%`);
        console.log(`    Avg Response: ${stats.avgResponseTime.toFixed(1)}ms`);
        console.log(`    Response Range: ${stats.minResponseTime.toFixed(1)}ms - ${stats.maxResponseTime.toFixed(1)}ms`);
      }
    }
    
    const errors = await this.healer.loadErrorHistory();
    const networkErrors = errors.filter(e => e.error_type === 'NETWORK_FAILURE');
    
    console.log(chalk.blue('Network Errors:'));
    console.log(`  Total: ${networkErrors.length}`);
    console.log(`  Resolved: ${networkErrors.filter(e => e.resolved).length}`);
  }
}

async function main() {
  const recovery = new NetworkRecoverySystem();
  
  console.log(chalk.cyan('🌟 Cosmic Fountain Network Recovery'));
  console.log(chalk.cyan('==================================='));
  
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    await recovery.generateReport();
  } else if (args.includes('--test')) {
    const endpoint = args[args.indexOf('--test') + 1] || 'google.com';
    const result = await recovery.pingEndpoint(endpoint);
    console.log(chalk.green(`Test result for ${endpoint}:`));
    console.log(result);
  } else {
    await recovery.startNetworkMonitoring();
    
    // Keep the process running
    process.stdin.resume();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.blue('\n🛑 Stopping network recovery...'));
      process.exit(0);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NetworkRecoverySystem;