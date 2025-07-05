#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const si = require('systeminformation');
const cron = require('node-cron');
const SelfHealingSystem = require('./heal');

class MemoryLeakDetector {
  constructor() {
    this.healer = new SelfHealingSystem();
    this.memoryHistory = [];
    this.processHistory = new Map();
    this.thresholds = {
      memoryGrowthRate: 10, // MB per minute
      memoryUsagePercent: 85, // Percentage of total memory
      processMemoryMB: 1000, // MB per process
      consecutiveAlerts: 3
    };
    this.alertCounts = new Map();
  }

  async startMonitoring() {
    console.log(chalk.blue('🔍 Starting memory leak detection...'));
    
    // Monitor system memory every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.checkSystemMemory();
    });

    // Monitor process memory every minute
    cron.schedule('0 * * * * *', async () => {
      await this.checkProcessMemory();
    });

    // Run garbage collection every 5 minutes
    cron.schedule('0 */5 * * * *', async () => {
      await this.performMaintenance();
    });

    // Weekly cleanup
    cron.schedule('0 0 * * 0', async () => {
      await this.weeklyCleanup();
    });

    console.log(chalk.green('✅ Memory monitoring started'));
  }

  async checkSystemMemory() {
    try {
      const memInfo = await si.mem();
      const usagePercent = (memInfo.used / memInfo.total) * 100;
      
      const memorySnapshot = {
        timestamp: Date.now(),
        used: memInfo.used,
        total: memInfo.total,
        free: memInfo.free,
        usagePercent: usagePercent
      };

      this.memoryHistory.push(memorySnapshot);
      
      // Keep only last 100 snapshots
      if (this.memoryHistory.length > 100) {
        this.memoryHistory.shift();
      }

      // Check for memory issues
      if (usagePercent > this.thresholds.memoryUsagePercent) {
        await this.handleMemoryAlert('HIGH_MEMORY_USAGE', {
          current: usagePercent,
          threshold: this.thresholds.memoryUsagePercent,
          memInfo
        });
      }

      // Check for memory growth trend
      if (this.memoryHistory.length >= 10) {
        const growthRate = this.calculateMemoryGrowthRate();
        if (growthRate > this.thresholds.memoryGrowthRate) {
          await this.handleMemoryAlert('MEMORY_LEAK_DETECTED', {
            growthRate,
            threshold: this.thresholds.memoryGrowthRate,
            history: this.memoryHistory.slice(-10)
          });
        }
      }

    } catch (error) {
      console.log(chalk.red(`❌ Memory check failed: ${error.message}`));
    }
  }

  async checkProcessMemory() {
    try {
      const processes = await si.processes();
      
      for (const proc of processes.list) {
        if (proc.mem > this.thresholds.processMemoryMB) {
          const processKey = `${proc.name}_${proc.pid}`;
          
          if (!this.processHistory.has(processKey)) {
            this.processHistory.set(processKey, []);
          }
          
          const history = this.processHistory.get(processKey);
          history.push({
            timestamp: Date.now(),
            memory: proc.mem,
            cpu: proc.cpu
          });
          
          // Keep only last 50 snapshots per process
          if (history.length > 50) {
            history.shift();
          }
          
          // Check for process memory leak
          if (history.length >= 5) {
            const memoryTrend = this.calculateProcessMemoryTrend(history);
            if (memoryTrend > 50) { // Growing by 50MB consistently
              await this.handleProcessMemoryLeak(proc, memoryTrend);
            }
          }
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Process memory check failed: ${error.message}`));
    }
  }

  calculateMemoryGrowthRate() {
    const recent = this.memoryHistory.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000 / 60; // minutes
    const memoryDiff = (newest.used - oldest.used) / 1024 / 1024; // MB
    
    return memoryDiff / timeDiff; // MB per minute
  }

  calculateProcessMemoryTrend(history) {
    const recent = history.slice(-5);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    return newest.memory - oldest.memory; // MB difference
  }

  async handleMemoryAlert(alertType, data) {
    const alertKey = `${alertType}_${Date.now()}`;
    
    if (!this.alertCounts.has(alertType)) {
      this.alertCounts.set(alertType, 0);
    }
    
    this.alertCounts.set(alertType, this.alertCounts.get(alertType) + 1);
    
    console.log(chalk.yellow(`⚠️  Memory Alert: ${alertType}`));
    console.log(chalk.yellow(`   Count: ${this.alertCounts.get(alertType)}`));
    
    if (this.alertCounts.get(alertType) >= this.thresholds.consecutiveAlerts) {
      console.log(chalk.red('🚨 Critical memory issue detected, attempting healing...'));
      
      const error = new Error(`Memory alert: ${alertType}`);
      error.code = 'ENOMEM';
      
      await this.healer.attemptHealing(error, {
        alertType,
        data,
        alertCount: this.alertCounts.get(alertType)
      });
      
      // Reset count after healing attempt
      this.alertCounts.set(alertType, 0);
    }
  }

  async handleProcessMemoryLeak(process, trend) {
    console.log(chalk.yellow(`⚠️  Process Memory Leak: ${process.name} (PID: ${process.pid})`));
    console.log(chalk.yellow(`   Memory: ${process.mem}MB, Trend: +${trend}MB`));
    
    const error = new Error(`Process memory leak: ${process.name}`);
    error.code = 'PROCESS_MEMORY_LEAK';
    
    await this.healer.attemptHealing(error, {
      process: {
        name: process.name,
        pid: process.pid,
        memory: process.mem,
        trend
      }
    });
  }

  async performMaintenance() {
    console.log(chalk.blue('🧹 Performing maintenance...'));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log(chalk.green('✅ Forced garbage collection'));
    }
    
    // Clean up old process history
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [key, history] of this.processHistory) {
      const filtered = history.filter(h => h.timestamp > cutoffTime);
      if (filtered.length === 0) {
        this.processHistory.delete(key);
      } else {
        this.processHistory.set(key, filtered);
      }
    }
    
    // Reset alert counts that are too old
    const resetThreshold = 10;
    for (const [alertType, count] of this.alertCounts) {
      if (count > resetThreshold) {
        this.alertCounts.set(alertType, Math.floor(count / 2));
      }
    }
  }

  async weeklyCleanup() {
    console.log(chalk.blue('📅 Weekly cleanup started...'));
    
    try {
      // Clean up error history
      const errors = await this.healer.loadErrorHistory();
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const filteredErrors = errors.filter(error => {
        const errorDate = new Date(error.timestamp);
        return errorDate > cutoffDate || error.confidence_score >= 7;
      });
      
      await this.healer.saveErrorHistory(filteredErrors);
      
      console.log(chalk.green(`✅ Cleaned up ${errors.length - filteredErrors.length} old errors`));
      
      // Clear memory history
      this.memoryHistory = [];
      this.processHistory.clear();
      this.alertCounts.clear();
      
      console.log(chalk.green('✅ Weekly cleanup completed'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Weekly cleanup failed: ${error.message}`));
    }
  }

  async generateReport() {
    console.log(chalk.cyan('📊 Memory Monitoring Report'));
    console.log(chalk.cyan('=========================='));
    
    try {
      const memInfo = await si.mem();
      const currentUsage = (memInfo.used / memInfo.total) * 100;
      
      console.log(chalk.green('Current Status:'));
      console.log(`  Memory Usage: ${currentUsage.toFixed(1)}%`);
      console.log(`  Free Memory: ${(memInfo.free / 1024 / 1024 / 1024).toFixed(2)}GB`);
      console.log(`  Total Memory: ${(memInfo.total / 1024 / 1024 / 1024).toFixed(2)}GB`);
      
      if (this.memoryHistory.length > 0) {
        const growthRate = this.calculateMemoryGrowthRate();
        console.log(`  Growth Rate: ${growthRate.toFixed(2)}MB/min`);
      }
      
      console.log(chalk.blue('Alert Counts:'));
      for (const [alertType, count] of this.alertCounts) {
        console.log(`  ${alertType}: ${count}`);
      }
      
      console.log(chalk.blue('Process Monitoring:'));
      console.log(`  Tracked Processes: ${this.processHistory.size}`);
      
      const errors = await this.healer.loadErrorHistory();
      const memoryErrors = errors.filter(e => e.error_type === 'ENOMEM');
      
      console.log(chalk.blue('Memory Errors:'));
      console.log(`  Total: ${memoryErrors.length}`);
      console.log(`  Resolved: ${memoryErrors.filter(e => e.resolved).length}`);
      
    } catch (error) {
      console.log(chalk.red(`❌ Report generation failed: ${error.message}`));
    }
  }
}

async function main() {
  const detector = new MemoryLeakDetector();
  
  console.log(chalk.cyan('🌟 Cosmic Fountain Memory Monitor'));
  console.log(chalk.cyan('=================================='));
  
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    await detector.generateReport();
  } else {
    await detector.startMonitoring();
    
    // Keep the process running
    process.stdin.resume();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.blue('\n🛑 Stopping memory monitor...'));
      process.exit(0);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MemoryLeakDetector;