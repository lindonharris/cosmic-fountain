#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const winston = require('winston');
const SelfHealingSystem = require('../scripts/heal');
const MemoryLeakDetector = require('../scripts/monitor');
const DependencyConflictResolver = require('../scripts/dependency-resolver');
const NetworkRecoverySystem = require('../scripts/network-recovery');

class CosmicFountain {
  constructor() {
    this.logger = this.setupLogger();
    this.healer = new SelfHealingSystem();
    this.memoryDetector = new MemoryLeakDetector();
    this.dependencyResolver = new DependencyConflictResolver();
    this.networkRecovery = new NetworkRecoverySystem();
    
    this.setupGlobalErrorHandlers();
  }

  setupLogger() {
    const logDir = path.join(__dirname, '../logs');
    
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(logDir, 'cosmic-fountain.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  setupGlobalErrorHandlers() {
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught Exception:', error);
      await this.handleCriticalError(error, 'uncaughtException');
    });

    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await this.handleCriticalError(reason, 'unhandledRejection');
    });

    process.on('warning', (warning) => {
      this.logger.warn('Process Warning:', warning);
    });
  }

  async handleCriticalError(error, type) {
    console.log(chalk.red(`🚨 Critical Error (${type}): ${error.message}`));
    
    try {
      // Attempt automatic healing
      const result = await this.healer.attemptHealing(error, {
        type,
        timestamp: new Date().toISOString(),
        process: {
          pid: process.pid,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Critical error automatically resolved`));
      } else {
        console.log(chalk.red(`❌ Critical error could not be resolved automatically`));
      }
      
    } catch (healingError) {
      console.log(chalk.red(`❌ Healing system failed: ${healingError.message}`));
    }
  }

  async startFullMonitoring() {
    console.log(chalk.cyan('🌟 Starting Cosmic Fountain Full Monitoring'));
    console.log(chalk.cyan('=========================================='));
    
    try {
      // Start all monitoring systems
      await this.memoryDetector.startMonitoring();
      await this.networkRecovery.startNetworkMonitoring();
      
      this.logger.info('All monitoring systems started successfully');
      console.log(chalk.green('✅ All monitoring systems active'));
      
      // Keep the process running
      process.stdin.resume();
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.blue('\n🛑 Shutting down Cosmic Fountain...'));
        this.logger.info('Cosmic Fountain shutting down');
        process.exit(0);
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to start monitoring: ${error.message}`));
      this.logger.error('Failed to start monitoring', error);
    }
  }

  async runSystemDiagnostics() {
    console.log(chalk.cyan('🔍 Running System Diagnostics'));
    console.log(chalk.cyan('=============================='));
    
    try {
      // System health check
      const systemDiagnostics = await this.healer.runDiagnostics();
      
      // Memory analysis
      console.log(chalk.blue('\n📊 Memory Analysis'));
      await this.memoryDetector.generateReport();
      
      // Dependency analysis
      console.log(chalk.blue('\n📦 Dependency Analysis'));
      await this.dependencyResolver.generateReport();
      
      // Network analysis
      console.log(chalk.blue('\n🌐 Network Analysis'));
      await this.networkRecovery.generateReport();
      
      this.logger.info('System diagnostics completed successfully');
      console.log(chalk.green('\n✅ System diagnostics completed'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Diagnostics failed: ${error.message}`));
      this.logger.error('Diagnostics failed', error);
    }
  }

  async healAllSystems() {
    console.log(chalk.cyan('🔧 Healing All Systems'));
    console.log(chalk.cyan('======================='));
    
    try {
      // Resolve dependency issues
      console.log(chalk.blue('📦 Resolving dependency conflicts...'));
      const depResult = await this.dependencyResolver.resolveAllIssues();
      console.log(chalk.green(`✅ Dependencies: ${depResult.resolved} resolved, ${depResult.failed} failed`));
      
      // Run system diagnostics to identify other issues
      console.log(chalk.blue('🔍 Running system diagnostics...'));
      await this.healer.runDiagnostics();
      
      // Test network connectivity
      console.log(chalk.blue('🌐 Testing network connectivity...'));
      const networkTest = await this.networkRecovery.pingEndpoint('google.com');
      if (networkTest.success) {
        console.log(chalk.green('✅ Network connectivity verified'));
      } else {
        console.log(chalk.yellow('⚠️  Network issues detected'));
      }
      
      this.logger.info('System healing completed');
      console.log(chalk.green('\n✅ System healing completed'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Healing failed: ${error.message}`));
      this.logger.error('Healing failed', error);
    }
  }

  async showSystemStatus() {
    console.log(chalk.cyan('📊 Cosmic Fountain System Status'));
    console.log(chalk.cyan('================================='));
    
    try {
      // Load error history
      const errors = await this.healer.loadErrorHistory();
      const recentErrors = errors.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      console.log(chalk.green('Error History:'));
      console.log(`  Total Errors: ${errors.length}`);
      console.log(`  Recent Errors (24h): ${recentErrors.length}`);
      console.log(`  Resolved Errors: ${errors.filter(e => e.resolved).length}`);
      
      // System uptime
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      console.log(chalk.blue('System Info:'));
      console.log(`  Process ID: ${process.pid}`);
      console.log(`  Uptime: ${hours}h ${minutes}m ${seconds}s`);
      console.log(`  Node.js Version: ${process.version}`);
      console.log(`  Platform: ${process.platform}`);
      
      // Memory usage
      const memUsage = process.memoryUsage();
      console.log(chalk.blue('Memory Usage:'));
      console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.log(chalk.red(`❌ Status check failed: ${error.message}`));
      this.logger.error('Status check failed', error);
    }
  }

  async showVersion() {
    const packageJson = require('../package.json');
    console.log(chalk.cyan(`🌟 Cosmic Fountain v${packageJson.version}`));
    console.log(chalk.gray(packageJson.description));
  }
}

async function main() {
  const program = new Command();
  const fountain = new CosmicFountain();
  
  program
    .name('cosmic-fountain')
    .description('A self-healing development environment with intelligent error recovery')
    .version('1.0.0');
  
  program
    .command('start')
    .description('Start full monitoring and self-healing systems')
    .action(async () => {
      await fountain.startFullMonitoring();
    });
  
  program
    .command('diagnose')
    .description('Run comprehensive system diagnostics')
    .action(async () => {
      await fountain.runSystemDiagnostics();
    });
  
  program
    .command('heal')
    .description('Attempt to heal all detected system issues')
    .action(async () => {
      await fountain.healAllSystems();
    });
  
  program
    .command('status')
    .description('Show current system status and health')
    .action(async () => {
      await fountain.showSystemStatus();
    });
  
  program
    .command('version')
    .description('Show version information')
    .action(async () => {
      await fountain.showVersion();
    });
  
  // Memory monitoring commands
  program
    .command('memory')
    .description('Memory leak detection and monitoring')
    .option('--report', 'Generate memory usage report')
    .action(async (options) => {
      if (options.report) {
        await fountain.memoryDetector.generateReport();
      } else {
        await fountain.memoryDetector.startMonitoring();
      }
    });
  
  // Dependency commands
  program
    .command('deps')
    .description('Dependency conflict resolution')
    .option('--report', 'Generate dependency analysis report')
    .option('--resolve', 'Resolve all detected dependency issues')
    .action(async (options) => {
      if (options.resolve) {
        await fountain.dependencyResolver.resolveAllIssues();
      } else {
        await fountain.dependencyResolver.generateReport();
      }
    });
  
  // Network commands
  program
    .command('network')
    .description('Network recovery and monitoring')
    .option('--report', 'Generate network status report')
    .option('--test <endpoint>', 'Test connectivity to specific endpoint')
    .action(async (options) => {
      if (options.test) {
        const result = await fountain.networkRecovery.pingEndpoint(options.test);
        console.log(result);
      } else if (options.report) {
        await fountain.networkRecovery.generateReport();
      } else {
        await fountain.networkRecovery.startNetworkMonitoring();
      }
    });
  
  // If no command provided, show help
  if (process.argv.length === 2) {
    program.outputHelp();
    return;
  }
  
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.log(chalk.red(`❌ Command failed: ${error.message}`));
    fountain.logger.error('Command failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CosmicFountain;