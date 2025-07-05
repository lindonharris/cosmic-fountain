#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const si = require('systeminformation');

class SelfHealingSystem {
  constructor() {
    this.errorHistoryPath = path.join(__dirname, '../logs/error_history.json');
    this.healingStrategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    this.healingStrategies.set('EADDRINUSE', this.healPortConflict.bind(this));
    this.healingStrategies.set('ENOENT', this.healMissingFile.bind(this));
    this.healingStrategies.set('ENOMEM', this.healMemoryIssue.bind(this));
    this.healingStrategies.set('ECONNREFUSED', this.healConnectionRefused.bind(this));
    this.healingStrategies.set('MODULE_NOT_FOUND', this.healMissingModule.bind(this));
    this.healingStrategies.set('PROCESS_DIED', this.healDeadProcess.bind(this));
  }

  async loadErrorHistory() {
    try {
      if (await fs.pathExists(this.errorHistoryPath)) {
        const data = await fs.readJson(this.errorHistoryPath);
        return data.errors || [];
      }
      return [];
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not load error history, starting fresh'));
      return [];
    }
  }

  async saveErrorHistory(errors) {
    const data = {
      errors,
      metadata: {
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        next_maintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    await fs.ensureDir(path.dirname(this.errorHistoryPath));
    await fs.writeJson(this.errorHistoryPath, data, { spaces: 2 });
  }

  async logError(error, context = {}) {
    const errorEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      error_type: error.code || 'UNKNOWN',
      message: error.message,
      stack: error.stack,
      context: {
        pwd: process.cwd(),
        platform: process.platform,
        node_version: process.version,
        ...context
      },
      confidence_score: this.calculateConfidenceScore(error),
      resolution_attempts: [],
      resolved: false
    };

    const errors = await this.loadErrorHistory();
    errors.push(errorEntry);
    await this.saveErrorHistory(errors);
    
    return errorEntry.id;
  }

  calculateConfidenceScore(error) {
    if (error.code === 'EADDRINUSE') return 9;
    if (error.code === 'MODULE_NOT_FOUND') return 8;
    if (error.code === 'ENOENT') return 7;
    if (error.code === 'ENOMEM') return 6;
    if (error.message.includes('permission denied')) return 8;
    return 5;
  }

  async healPortConflict(error, context) {
    console.log(chalk.blue('🔧 Healing port conflict...'));
    
    try {
      const port = error.message.match(/port (\d+)/)?.[1];
      if (port) {
        const cmd = process.platform === 'win32' 
          ? `netstat -ano | findstr :${port}`
          : `lsof -ti:${port}`;
        
        const result = execSync(cmd, { encoding: 'utf8' });
        
        if (process.platform === 'win32') {
          const pid = result.split('\n')[0]?.split(/\s+/).pop();
          if (pid) execSync(`taskkill /F /PID ${pid}`);
        } else {
          const pids = result.trim().split('\n');
          pids.forEach(pid => {
            if (pid) execSync(`kill -9 ${pid}`);
          });
        }
        
        console.log(chalk.green(`✅ Killed process on port ${port}`));
        return { success: true, action: `killed_process_on_port_${port}` };
      }
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to heal port conflict: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async healMissingFile(error, context) {
    console.log(chalk.blue('🔧 Healing missing file...'));
    
    try {
      const filePath = error.message.match(/'([^']+)'/)?.[1];
      if (filePath) {
        await fs.ensureDir(path.dirname(filePath));
        
        if (path.extname(filePath) === '.json') {
          await fs.writeJson(filePath, {});
        } else {
          await fs.ensureFile(filePath);
        }
        
        console.log(chalk.green(`✅ Created missing file: ${filePath}`));
        return { success: true, action: `created_file_${filePath}` };
      }
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to heal missing file: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async healMemoryIssue(error, context) {
    console.log(chalk.blue('🔧 Healing memory issue...'));
    
    try {
      const memInfo = await si.mem();
      const freeMemGB = memInfo.available / (1024 * 1024 * 1024);
      
      if (freeMemGB < 1) {
        if (global.gc) {
          global.gc();
          console.log(chalk.green('✅ Forced garbage collection'));
        }
        
        process.nextTick(() => {
          if (global.gc) global.gc();
        });
        
        return { success: true, action: 'forced_garbage_collection' };
      }
      
      console.log(chalk.yellow('⚠️  Memory levels acceptable, issue may be elsewhere'));
      return { success: false, error: 'Memory levels acceptable' };
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to heal memory issue: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async healConnectionRefused(error, context) {
    console.log(chalk.blue('🔧 Healing connection refused...'));
    
    try {
      const url = error.message.match(/https?:\/\/[^\s]+/)?.[0];
      if (url) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const urlObj = new URL(url);
        const pingCmd = process.platform === 'win32' 
          ? `ping -n 1 ${urlObj.hostname}`
          : `ping -c 1 ${urlObj.hostname}`;
        
        try {
          execSync(pingCmd, { stdio: 'ignore' });
          console.log(chalk.green(`✅ Network connectivity restored to ${urlObj.hostname}`));
          return { success: true, action: `network_recovery_${urlObj.hostname}` };
        } catch (pingError) {
          console.log(chalk.red(`❌ Host ${urlObj.hostname} unreachable`));
          return { success: false, error: `Host unreachable: ${urlObj.hostname}` };
        }
      }
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to heal connection: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async healMissingModule(error, context) {
    console.log(chalk.blue('🔧 Healing missing module...'));
    
    try {
      const moduleName = error.message.match(/Cannot find module '([^']+)'/)?.[1];
      if (moduleName) {
        console.log(chalk.yellow(`Installing missing module: ${moduleName}`));
        execSync(`npm install ${moduleName}`, { stdio: 'inherit' });
        
        console.log(chalk.green(`✅ Installed missing module: ${moduleName}`));
        return { success: true, action: `installed_module_${moduleName}` };
      }
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to heal missing module: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async healDeadProcess(error, context) {
    console.log(chalk.blue('🔧 Resurrecting dead process...'));
    
    try {
      const processName = context.processName || 'main';
      const command = context.command || 'npm start';
      
      console.log(chalk.yellow(`Restarting process: ${processName}`));
      
      const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      
      console.log(chalk.green(`✅ Resurrected process: ${processName} (PID: ${child.pid})`));
      return { success: true, action: `resurrected_process_${processName}` };
    } catch (healError) {
      console.log(chalk.red(`❌ Failed to resurrect process: ${healError.message}`));
      return { success: false, error: healError.message };
    }
  }

  async attemptHealing(error, context = {}) {
    const errorType = error.code || 'UNKNOWN';
    const strategy = this.healingStrategies.get(errorType);
    
    if (strategy) {
      console.log(chalk.blue(`🔍 Attempting to heal ${errorType}...`));
      const result = await strategy(error, context);
      
      const errorId = await this.logError(error, context);
      const errors = await this.loadErrorHistory();
      const errorEntry = errors.find(e => e.id === errorId);
      
      if (errorEntry) {
        errorEntry.resolution_attempts.push({
          timestamp: new Date().toISOString(),
          strategy: errorType,
          result
        });
        
        if (result.success) {
          errorEntry.resolved = true;
        }
        
        await this.saveErrorHistory(errors);
      }
      
      return result;
    } else {
      console.log(chalk.yellow(`⚠️  No healing strategy for ${errorType}`));
      await this.logError(error, context);
      return { success: false, error: `No strategy for ${errorType}` };
    }
  }

  async runDiagnostics() {
    console.log(chalk.blue('🔍 Running system diagnostics...'));
    
    try {
      const memInfo = await si.mem();
      const cpuInfo = await si.cpu();
      const fsInfo = await si.fsSize();
      
      console.log(chalk.green('📊 System Status:'));
      console.log(`  Memory: ${((memInfo.used / memInfo.total) * 100).toFixed(1)}% used`);
      console.log(`  CPU: ${cpuInfo.manufacturer} ${cpuInfo.brand}`);
      console.log(`  Disk: ${fsInfo[0] ? ((fsInfo[0].used / fsInfo[0].size) * 100).toFixed(1) : 'N/A'}% used`);
      
      const errors = await this.loadErrorHistory();
      const recentErrors = errors.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      console.log(`  Recent Errors: ${recentErrors.length} in last 24h`);
      console.log(`  Total Errors: ${errors.length} logged`);
      
      return {
        memory: memInfo,
        cpu: cpuInfo,
        filesystem: fsInfo,
        errors: {
          recent: recentErrors.length,
          total: errors.length
        }
      };
    } catch (error) {
      console.log(chalk.red(`❌ Diagnostics failed: ${error.message}`));
      return null;
    }
  }
}

async function main() {
  const healer = new SelfHealingSystem();
  
  console.log(chalk.cyan('🌟 Cosmic Fountain Self-Healing System'));
  console.log(chalk.cyan('====================================='));
  
  await healer.runDiagnostics();
  
  console.log(chalk.green('✅ Self-healing system initialized and ready'));
  console.log(chalk.blue('💡 Use this system by calling healer.attemptHealing(error, context)'));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SelfHealingSystem;