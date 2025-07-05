#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const SelfHealingSystem = require('./heal');
const MemoryLeakDetector = require('./monitor');
const DependencyConflictResolver = require('./dependency-resolver');
const NetworkRecoverySystem = require('./network-recovery');

class GitPostCommitEnhancer {
  constructor() {
    this.healer = new SelfHealingSystem();
    this.memoryDetector = new MemoryLeakDetector();
    this.depResolver = new DependencyConflictResolver();
    this.networkRecovery = new NetworkRecoverySystem();
    this.gitHooksPath = path.join(process.cwd(), '.git/hooks');
    this.intelligenceLog = path.join(process.cwd(), 'logs/commit-intelligence.json');
  }

  async installPostCommitHook() {
    console.log(chalk.blue('🔧 Installing intelligent post-commit hook...'));
    
    try {
      await fs.ensureDir(this.gitHooksPath);
      
      const hookPath = path.join(this.gitHooksPath, 'post-commit');
      const hookContent = `#!/bin/sh
# Cosmic Fountain Post-Commit Intelligence Hook
# Learns from commits, prevents future errors, and enhances development

node ${path.join(__dirname, 'git-post-commit.js')} run
`;
      
      await fs.writeFile(hookPath, hookContent);
      await fs.chmod(hookPath, '755');
      
      console.log(chalk.green('✅ Post-commit hook installed successfully'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to install post-commit hook: ${error.message}`));
      throw error;
    }
  }

  async runPostCommitIntelligence() {
    console.log(chalk.cyan('🧠 Running post-commit intelligence...'));
    
    const intelligence = {
      timestamp: new Date().toISOString(),
      commitHash: '',
      commitMessage: '',
      analysis: {},
      learnings: [],
      preventions: [],
      optimizations: [],
      healingActions: []
    };
    
    try {
      // Get commit information
      intelligence.commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      intelligence.commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      
      console.log(chalk.green(`📝 Analyzing commit: ${intelligence.commitHash.substring(0, 7)}`));
      
      // 1. Analyze code changes for patterns
      await this.analyzeCodeChanges(intelligence);
      
      // 2. Learn from any errors that were fixed
      await this.learnFromFixes(intelligence);
      
      // 3. Update error prevention patterns
      await this.updatePreventionPatterns(intelligence);
      
      // 4. Run automated tests on changed files
      await this.runTargetedTests(intelligence);
      
      // 5. Check for performance regressions
      await this.checkPerformanceImpact(intelligence);
      
      // 6. Generate documentation if needed
      await this.generateSmartDocumentation(intelligence);
      
      // 7. Create automated healing rules
      await this.createHealingRules(intelligence);
      
      // 8. Optimize dependencies if changed
      await this.optimizeDependencies(intelligence);
      
      // Save intelligence log
      await this.saveIntelligenceLog(intelligence);
      
      // Display summary
      this.displayIntelligenceSummary(intelligence);
      
    } catch (error) {
      console.log(chalk.red(`❌ Post-commit intelligence failed: ${error.message}`));
      
      // Self-heal the error
      await this.healer.attemptHealing(error, {
        hook: 'post-commit',
        intelligence
      });
    }
  }

  async analyzeCodeChanges(intelligence) {
    try {
      const files = execSync('git diff HEAD~1 --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim());
      
      intelligence.analysis.changedFiles = files;
      intelligence.analysis.patterns = {};
      
      for (const file of files) {
        if (!await fs.pathExists(file)) continue;
        
        const ext = path.extname(file);
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
          const diff = execSync(`git diff HEAD~1 -- ${file}`, { encoding: 'utf8' });
          
          // Detect common patterns
          if (diff.includes('try {') && diff.includes('catch')) {
            intelligence.learnings.push({
              type: 'error_handling_added',
              file,
              pattern: 'try-catch block added'
            });
          }
          
          if (diff.includes('.close()') || diff.includes('.removeEventListener')) {
            intelligence.learnings.push({
              type: 'memory_leak_prevented',
              file,
              pattern: 'Resource cleanup added'
            });
          }
          
          if (diff.includes('TODO') || diff.includes('FIXME')) {
            intelligence.analysis.patterns.todos = (intelligence.analysis.patterns.todos || 0) + 1;
          }
          
          // Check for performance improvements
          if (diff.includes('useMemo') || diff.includes('useCallback') || diff.includes('memo')) {
            intelligence.optimizations.push({
              type: 'performance_optimization',
              file,
              pattern: 'React optimization added'
            });
          }
        }
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not analyze code changes: ${error.message}`));
    }
  }

  async learnFromFixes(intelligence) {
    const message = intelligence.commitMessage.toLowerCase();
    
    if (message.includes('fix') || message.includes('resolve') || message.includes('patch')) {
      intelligence.analysis.isFix = true;
      
      // Extract what was fixed
      const fixPatterns = [
        { pattern: /fix(?:es|ed)?\s+(.+)/i, type: 'general_fix' },
        { pattern: /memory\s+leak/i, type: 'memory_leak_fix' },
        { pattern: /crash|error|exception/i, type: 'crash_fix' },
        { pattern: /performance|slow|optimize/i, type: 'performance_fix' },
        { pattern: /security|vulnerability|cve/i, type: 'security_fix' }
      ];
      
      for (const { pattern, type } of fixPatterns) {
        if (pattern.test(message)) {
          intelligence.learnings.push({
            type: 'fix_pattern',
            fixType: type,
            message: message,
            timestamp: new Date().toISOString()
          });
          
          // Update error history
          await this.updateErrorHistoryWithFix(intelligence.commitHash, type, message);
        }
      }
    }
  }

  async updatePreventionPatterns(intelligence) {
    const preventionFile = path.join(process.cwd(), 'logs/prevention-patterns.json');
    let patterns = {};
    
    try {
      if (await fs.pathExists(preventionFile)) {
        patterns = await fs.readJson(preventionFile);
      }
      
      // Add new patterns based on fixes
      for (const learning of intelligence.learnings) {
        if (learning.type === 'fix_pattern') {
          const key = learning.fixType;
          if (!patterns[key]) {
            patterns[key] = {
              count: 0,
              examples: [],
              preventionRules: []
            };
          }
          
          patterns[key].count++;
          patterns[key].examples.push({
            commit: intelligence.commitHash,
            message: learning.message,
            timestamp: learning.timestamp
          });
          
          // Generate prevention rules
          if (patterns[key].count >= 3) {
            intelligence.preventions.push({
              type: 'pattern_prevention',
              pattern: key,
              rule: `Frequently occurring ${key} - consider adding automated checks`
            });
          }
        }
      }
      
      await fs.ensureDir(path.dirname(preventionFile));
      await fs.writeJson(preventionFile, patterns, { spaces: 2 });
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not update prevention patterns: ${error.message}`));
    }
  }

  async runTargetedTests(intelligence) {
    try {
      // Check if test command exists
      const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'));
      
      if (packageJson.scripts && packageJson.scripts.test) {
        console.log(chalk.blue('🧪 Running tests on changed files...'));
        
        // Find test files related to changed files
        const testFiles = [];
        for (const file of intelligence.analysis.changedFiles || []) {
          const testFile = file.replace(/\.(js|ts)$/, '.test.$1');
          const specFile = file.replace(/\.(js|ts)$/, '.spec.$1');
          
          if (await fs.pathExists(testFile)) testFiles.push(testFile);
          if (await fs.pathExists(specFile)) testFiles.push(specFile);
        }
        
        if (testFiles.length > 0) {
          try {
            execSync(`npm test -- ${testFiles.join(' ')}`, { stdio: 'inherit' });
            intelligence.analysis.testsRun = testFiles.length;
            intelligence.analysis.testsPassed = true;
          } catch (testError) {
            intelligence.analysis.testsFailed = true;
            intelligence.healingActions.push({
              type: 'test_failure',
              files: testFiles,
              error: testError.message
            });
          }
        }
      }
      
    } catch (error) {
      // No tests available
    }
  }

  async checkPerformanceImpact(intelligence) {
    try {
      const changedFiles = intelligence.analysis.changedFiles || [];
      
      for (const file of changedFiles) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          const fileSize = (await fs.stat(file)).size;
          
          // Check file size growth
          try {
            const oldSize = parseInt(execSync(`git show HEAD~1:${file} | wc -c`, { encoding: 'utf8' }));
            const growth = fileSize - oldSize;
            
            if (growth > 10000) { // 10KB growth
              intelligence.analysis.performance = intelligence.analysis.performance || {};
              intelligence.analysis.performance.largeFileGrowth = {
                file,
                growth: `+${(growth / 1024).toFixed(1)}KB`
              };
            }
          } catch (e) {
            // File might be new
          }
        }
      }
      
      // Check for performance anti-patterns
      for (const file of changedFiles) {
        if (!await fs.pathExists(file)) continue;
        
        const content = await fs.readFile(file, 'utf8');
        const antiPatterns = [
          { pattern: /JSON\.parse\(JSON\.stringify/g, name: 'Deep clone anti-pattern' },
          { pattern: /for.*await/g, name: 'Sequential async operations' },
          { pattern: /document\.querySelector.*inside.*loop/g, name: 'DOM query in loop' }
        ];
        
        for (const { pattern, name } of antiPatterns) {
          if (pattern.test(content)) {
            intelligence.optimizations.push({
              type: 'performance_warning',
              file,
              pattern: name,
              suggestion: 'Consider optimizing this pattern'
            });
          }
        }
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not check performance impact: ${error.message}`));
    }
  }

  async generateSmartDocumentation(intelligence) {
    try {
      const changedFiles = intelligence.analysis.changedFiles || [];
      const needsDocs = [];
      
      for (const file of changedFiles) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          const content = await fs.readFile(file, 'utf8');
          
          // Check for undocumented exports
          const exportMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
          for (const match of exportMatches) {
            const funcName = match[1];
            const hasJsDoc = content.includes(`/**`) && content.includes(funcName);
            
            if (!hasJsDoc) {
              needsDocs.push({
                file,
                function: funcName,
                type: 'missing_jsdoc'
              });
            }
          }
        }
      }
      
      if (needsDocs.length > 0) {
        intelligence.analysis.documentation = {
          missing: needsDocs.length,
          items: needsDocs
        };
        
        // Create documentation task
        const todoFile = path.join(process.cwd(), 'logs/documentation-todos.json');
        let todos = [];
        
        if (await fs.pathExists(todoFile)) {
          todos = await fs.readJson(todoFile);
        }
        
        todos.push({
          commit: intelligence.commitHash,
          timestamp: new Date().toISOString(),
          todos: needsDocs
        });
        
        await fs.writeJson(todoFile, todos, { spaces: 2 });
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not generate documentation: ${error.message}`));
    }
  }

  async createHealingRules(intelligence) {
    try {
      // Based on learnings, create new healing rules
      for (const learning of intelligence.learnings) {
        if (learning.type === 'memory_leak_prevented') {
          intelligence.healingActions.push({
            type: 'new_healing_rule',
            rule: 'auto_cleanup_resources',
            pattern: learning.pattern,
            file: learning.file
          });
        }
        
        if (learning.type === 'error_handling_added') {
          intelligence.healingActions.push({
            type: 'new_healing_rule',
            rule: 'wrap_risky_operations',
            pattern: 'try-catch',
            file: learning.file
          });
        }
      }
      
      // Save healing rules
      if (intelligence.healingActions.length > 0) {
        const rulesFile = path.join(process.cwd(), 'logs/healing-rules.json');
        let rules = {};
        
        if (await fs.pathExists(rulesFile)) {
          rules = await fs.readJson(rulesFile);
        }
        
        for (const action of intelligence.healingActions) {
          if (action.type === 'new_healing_rule') {
            const key = action.rule;
            if (!rules[key]) {
              rules[key] = {
                created: new Date().toISOString(),
                examples: []
              };
            }
            
            rules[key].examples.push({
              commit: intelligence.commitHash,
              pattern: action.pattern,
              file: action.file
            });
          }
        }
        
        await fs.writeJson(rulesFile, rules, { spaces: 2 });
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not create healing rules: ${error.message}`));
    }
  }

  async optimizeDependencies(intelligence) {
    try {
      const changedFiles = intelligence.analysis.changedFiles || [];
      
      if (changedFiles.includes('package.json')) {
        console.log(chalk.blue('📦 Optimizing dependencies...'));
        
        // Check for unused dependencies
        const analysis = await this.depResolver.analyzeDependencies();
        
        if (analysis.vulnerabilities.length > 0) {
          intelligence.optimizations.push({
            type: 'security_vulnerabilities',
            count: analysis.vulnerabilities.length,
            action: 'Run npm audit fix to resolve'
          });
        }
        
        if (analysis.outdated.length > 0) {
          intelligence.optimizations.push({
            type: 'outdated_dependencies',
            count: analysis.outdated.length,
            packages: analysis.outdated.slice(0, 5).map(p => p.package)
          });
        }
        
        // Check package size impact
        try {
          const oldPackageJson = JSON.parse(execSync('git show HEAD~1:package.json', { encoding: 'utf8' }));
          const newPackageJson = await fs.readJson('package.json');
          
          const addedDeps = Object.keys(newPackageJson.dependencies || {})
            .filter(dep => !oldPackageJson.dependencies?.[dep]);
          
          if (addedDeps.length > 0) {
            intelligence.analysis.dependencies = {
              added: addedDeps,
              impact: 'Check bundle size impact'
            };
          }
        } catch (e) {
          // Could not compare
        }
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not optimize dependencies: ${error.message}`));
    }
  }

  async updateErrorHistoryWithFix(commitHash, fixType, message) {
    try {
      const errors = await this.healer.loadErrorHistory();
      
      // Find related errors
      const relatedErrors = errors.filter(error => {
        if (fixType === 'memory_leak_fix' && error.error_type === 'ENOMEM') return true;
        if (fixType === 'crash_fix' && error.message.includes('crash')) return true;
        if (fixType === 'performance_fix' && error.message.includes('timeout')) return true;
        return false;
      });
      
      // Mark as resolved
      relatedErrors.forEach(error => {
        if (!error.resolved) {
          error.resolved = true;
          error.resolution_commit = commitHash;
          error.resolution_message = message;
          error.resolution_timestamp = new Date().toISOString();
        }
      });
      
      await this.healer.saveErrorHistory(errors);
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not update error history: ${error.message}`));
    }
  }

  async saveIntelligenceLog(intelligence) {
    try {
      await fs.ensureDir(path.dirname(this.intelligenceLog));
      
      let log = [];
      if (await fs.pathExists(this.intelligenceLog)) {
        log = await fs.readJson(this.intelligenceLog);
      }
      
      log.push(intelligence);
      
      // Keep only last 200 entries
      if (log.length > 200) {
        log = log.slice(-200);
      }
      
      await fs.writeJson(this.intelligenceLog, log, { spaces: 2 });
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not save intelligence log: ${error.message}`));
    }
  }

  displayIntelligenceSummary(intelligence) {
    console.log(chalk.cyan('\n📊 Post-Commit Intelligence Summary'));
    console.log(chalk.cyan('==================================='));
    
    if (intelligence.learnings.length > 0) {
      console.log(chalk.green(`✅ Learnings: ${intelligence.learnings.length}`));
      intelligence.learnings.forEach(l => {
        console.log(`   - ${l.type}: ${l.pattern || l.fixType}`);
      });
    }
    
    if (intelligence.preventions.length > 0) {
      console.log(chalk.blue(`🛡️  Preventions: ${intelligence.preventions.length}`));
      intelligence.preventions.forEach(p => {
        console.log(`   - ${p.rule}`);
      });
    }
    
    if (intelligence.optimizations.length > 0) {
      console.log(chalk.yellow(`⚡ Optimizations: ${intelligence.optimizations.length}`));
      intelligence.optimizations.forEach(o => {
        console.log(`   - ${o.type}: ${o.pattern || o.count || ''}`);
      });
    }
    
    if (intelligence.healingActions.length > 0) {
      console.log(chalk.magenta(`🔧 Healing Actions: ${intelligence.healingActions.length}`));
      intelligence.healingActions.forEach(h => {
        console.log(`   - ${h.type}: ${h.rule || h.error || ''}`);
      });
    }
    
    if (intelligence.analysis.documentation?.missing > 0) {
      console.log(chalk.red(`📝 Missing Documentation: ${intelligence.analysis.documentation.missing} functions`));
    }
    
    console.log(chalk.gray(`\n💾 Intelligence saved to logs/commit-intelligence.json`));
  }

  async generateReport() {
    console.log(chalk.cyan('📊 Git Post-Commit Intelligence Report'));
    console.log(chalk.cyan('====================================='));
    
    try {
      if (await fs.pathExists(this.intelligenceLog)) {
        const log = await fs.readJson(this.intelligenceLog);
        
        console.log(chalk.green(`Total commits analyzed: ${log.length}`));
        
        // Aggregate statistics
        let totalLearnings = 0;
        let totalPreventions = 0;
        let totalOptimizations = 0;
        let totalHealingActions = 0;
        
        const fixTypes = {};
        const performanceIssues = [];
        
        log.forEach(entry => {
          totalLearnings += entry.learnings?.length || 0;
          totalPreventions += entry.preventions?.length || 0;
          totalOptimizations += entry.optimizations?.length || 0;
          totalHealingActions += entry.healingActions?.length || 0;
          
          entry.learnings?.forEach(l => {
            if (l.fixType) {
              fixTypes[l.fixType] = (fixTypes[l.fixType] || 0) + 1;
            }
          });
          
          if (entry.analysis?.performance) {
            performanceIssues.push(entry.analysis.performance);
          }
        });
        
        console.log(chalk.blue('\nIntelligence Statistics:'));
        console.log(`  Total Learnings: ${totalLearnings}`);
        console.log(`  Total Preventions: ${totalPreventions}`);
        console.log(`  Total Optimizations: ${totalOptimizations}`);
        console.log(`  Total Healing Actions: ${totalHealingActions}`);
        
        if (Object.keys(fixTypes).length > 0) {
          console.log(chalk.yellow('\nMost Common Fix Types:'));
          Object.entries(fixTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([type, count]) => {
              console.log(`  ${type}: ${count}`);
            });
        }
        
        if (performanceIssues.length > 0) {
          console.log(chalk.red(`\nPerformance Concerns: ${performanceIssues.length}`));
        }
      }
      
      // Show prevention patterns
      const preventionFile = path.join(process.cwd(), 'logs/prevention-patterns.json');
      if (await fs.pathExists(preventionFile)) {
        const patterns = await fs.readJson(preventionFile);
        
        console.log(chalk.magenta('\nPrevention Patterns:'));
        Object.entries(patterns).forEach(([pattern, data]) => {
          console.log(`  ${pattern}: ${data.count} occurrences`);
        });
      }
      
      // Show healing rules
      const rulesFile = path.join(process.cwd(), 'logs/healing-rules.json');
      if (await fs.pathExists(rulesFile)) {
        const rules = await fs.readJson(rulesFile);
        
        console.log(chalk.green('\nActive Healing Rules:'));
        Object.entries(rules).forEach(([rule, data]) => {
          console.log(`  ${rule}: ${data.examples?.length || 0} examples`);
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Report generation failed: ${error.message}`));
    }
  }
}

async function main() {
  const enhancer = new GitPostCommitEnhancer();
  const command = process.argv[2];
  
  switch (command) {
    case 'install':
      await enhancer.installPostCommitHook();
      break;
      
    case 'run':
      await enhancer.runPostCommitIntelligence();
      break;
      
    case 'report':
      await enhancer.generateReport();
      break;
      
    default:
      console.log(chalk.cyan('🌟 Cosmic Fountain Git Post-Commit Intelligence'));
      console.log(chalk.cyan('=============================================='));
      console.log('Usage:');
      console.log('  install  - Install post-commit hook');
      console.log('  run      - Run post-commit intelligence (called by hook)');
      console.log('  report   - Generate intelligence report');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GitPostCommitEnhancer;