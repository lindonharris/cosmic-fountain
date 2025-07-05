#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const SelfHealingSystem = require('./heal');
const DependencyConflictResolver = require('./dependency-resolver');

class GitEnhancementSystem {
  constructor() {
    this.healer = new SelfHealingSystem();
    this.depResolver = new DependencyConflictResolver();
    this.gitHooksPath = path.join(process.cwd(), '.git/hooks');
    this.enhancementsLog = path.join(process.cwd(), 'logs/git-enhancements.json');
    this.commitPatterns = new Map();
    this.initializePatterns();
  }

  initializePatterns() {
    // Common issue patterns to detect and prevent
    this.commitPatterns.set('console.log', {
      pattern: /console\.(log|debug|info)/g,
      severity: 'warning',
      message: 'Found console statements',
      autoFix: true
    });
    
    this.commitPatterns.set('debugger', {
      pattern: /debugger;/g,
      severity: 'error',
      message: 'Found debugger statements',
      autoFix: true
    });
    
    this.commitPatterns.set('todo', {
      pattern: /\/\/\s*(TODO|FIXME|HACK)/gi,
      severity: 'info',
      message: 'Found TODO/FIXME comments',
      autoFix: false
    });
    
    this.commitPatterns.set('hardcodedSecrets', {
      pattern: /(api[_-]?key|password|secret|token)\s*[:=]\s*["'][^"']+["']/gi,
      severity: 'critical',
      message: 'Potential hardcoded secrets detected',
      autoFix: false
    });
    
    this.commitPatterns.set('largeFile', {
      sizeThreshold: 10 * 1024 * 1024, // 10MB
      severity: 'warning',
      message: 'Large file detected',
      autoFix: false
    });
  }

  async installGitHooks() {
    console.log(chalk.blue('🔧 Installing git enhancement hooks...'));
    
    try {
      await fs.ensureDir(this.gitHooksPath);
      
      // Create pre-commit hook
      await this.createPreCommitHook();
      
      // Create commit-msg hook
      await this.createCommitMsgHook();
      
      // Create post-commit hook
      await this.createPostCommitHook();
      
      // Create prepare-commit-msg hook
      await this.createPrepareCommitMsgHook();
      
      console.log(chalk.green('✅ Git hooks installed successfully'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to install git hooks: ${error.message}`));
      throw error;
    }
  }

  async createPreCommitHook() {
    const hookPath = path.join(this.gitHooksPath, 'pre-commit');
    const hookContent = `#!/bin/sh
# Cosmic Fountain Pre-Commit Hook
# Automatically heals and enhances code before commit

node ${path.join(__dirname, 'git-enhancement.js')} pre-commit "$@"
`;
    
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, '755');
    console.log(chalk.green('✅ Created pre-commit hook'));
  }

  async createCommitMsgHook() {
    const hookPath = path.join(this.gitHooksPath, 'commit-msg');
    const hookContent = `#!/bin/sh
# Cosmic Fountain Commit Message Hook
# Enhances commit messages with context and insights

node ${path.join(__dirname, 'git-enhancement.js')} commit-msg "$@"
`;
    
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, '755');
    console.log(chalk.green('✅ Created commit-msg hook'));
  }

  async createPostCommitHook() {
    const hookPath = path.join(this.gitHooksPath, 'post-commit');
    const hookContent = `#!/bin/sh
# Cosmic Fountain Post-Commit Hook
# Learns from commit patterns and updates error history

node ${path.join(__dirname, 'git-enhancement.js')} post-commit "$@"
`;
    
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, '755');
    console.log(chalk.green('✅ Created post-commit hook'));
  }

  async createPrepareCommitMsgHook() {
    const hookPath = path.join(this.gitHooksPath, 'prepare-commit-msg');
    const hookContent = `#!/bin/sh
# Cosmic Fountain Prepare Commit Message Hook
# Adds helpful context to commit messages

node ${path.join(__dirname, 'git-enhancement.js')} prepare-commit-msg "$@"
`;
    
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, '755');
    console.log(chalk.green('✅ Created prepare-commit-msg hook'));
  }

  async runPreCommit() {
    console.log(chalk.cyan('🌟 Running Cosmic Fountain pre-commit enhancements...'));
    
    const enhancements = {
      timestamp: new Date().toISOString(),
      type: 'pre-commit',
      actions: [],
      prevented: [],
      fixed: []
    };
    
    try {
      // Get list of staged files
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim());
      
      // 1. Check for code quality issues
      for (const file of stagedFiles) {
        if (!await fs.pathExists(file)) continue;
        
        const ext = path.extname(file);
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
          await this.analyzeAndFixFile(file, enhancements);
        }
        
        // Check file size
        const stats = await fs.stat(file);
        const largeFilePattern = this.commitPatterns.get('largeFile');
        if (stats.size > largeFilePattern.sizeThreshold) {
          enhancements.prevented.push({
            file,
            issue: 'large_file',
            size: stats.size,
            message: `File ${file} is ${(stats.size / 1024 / 1024).toFixed(2)}MB`
          });
          
          console.log(chalk.yellow(`⚠️  Large file detected: ${file}`));
          console.log(chalk.yellow(`   Consider using Git LFS for files over 10MB`));
        }
      }
      
      // 2. Run dependency check
      console.log(chalk.blue('📦 Checking dependencies...'));
      const depAnalysis = await this.depResolver.analyzeDependencies();
      
      if (depAnalysis.vulnerabilities.length > 0) {
        console.log(chalk.yellow(`⚠️  Found ${depAnalysis.vulnerabilities.length} security vulnerabilities`));
        enhancements.actions.push({
          type: 'security_warning',
          count: depAnalysis.vulnerabilities.length,
          severity: depAnalysis.vulnerabilities.map(v => v.severity)
        });
      }
      
      // 3. Check for potential memory leaks
      await this.checkForMemoryLeaks(stagedFiles, enhancements);
      
      // 4. Verify no broken imports
      await this.verifyImports(stagedFiles, enhancements);
      
      // 5. Auto-format code if possible
      await this.autoFormatCode(stagedFiles, enhancements);
      
      // Save enhancement log
      await this.saveEnhancementLog(enhancements);
      
      // If critical issues found, prevent commit
      if (enhancements.prevented.some(p => p.severity === 'critical')) {
        console.log(chalk.red('❌ Commit blocked due to critical issues'));
        console.log(chalk.red('   Please fix the issues and try again'));
        process.exit(1);
      }
      
      console.log(chalk.green('✅ Pre-commit enhancements completed'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Pre-commit hook failed: ${error.message}`));
      
      // Log error to self-healing system
      await this.healer.attemptHealing(error, {
        hook: 'pre-commit',
        enhancements
      });
      
      // Don't block commit on hook failure
      console.log(chalk.yellow('⚠️  Continuing with commit despite hook failure'));
    }
  }

  async analyzeAndFixFile(file, enhancements) {
    try {
      const content = await fs.readFile(file, 'utf8');
      let modified = false;
      let newContent = content;
      
      for (const [name, pattern] of this.commitPatterns) {
        if (pattern.pattern && pattern.pattern.test(content)) {
          const matches = content.match(pattern.pattern);
          
          enhancements.actions.push({
            file,
            pattern: name,
            matches: matches.length,
            severity: pattern.severity
          });
          
          if (pattern.autoFix && pattern.severity !== 'critical') {
            if (name === 'console.log') {
              // Comment out console statements instead of removing
              newContent = newContent.replace(pattern.pattern, '// $&');
              modified = true;
              
              enhancements.fixed.push({
                file,
                issue: name,
                action: 'commented_out',
                count: matches.length
              });
              
              console.log(chalk.blue(`🔧 Commented out ${matches.length} console statements in ${file}`));
            } else if (name === 'debugger') {
              // Remove debugger statements
              newContent = newContent.replace(pattern.pattern, '');
              modified = true;
              
              enhancements.fixed.push({
                file,
                issue: name,
                action: 'removed',
                count: matches.length
              });
              
              console.log(chalk.blue(`🔧 Removed ${matches.length} debugger statements from ${file}`));
            }
          }
          
          if (pattern.severity === 'critical') {
            enhancements.prevented.push({
              file,
              issue: name,
              severity: pattern.severity,
              message: pattern.message
            });
            
            console.log(chalk.red(`❌ ${pattern.message} in ${file}`));
          }
        }
      }
      
      if (modified) {
        await fs.writeFile(file, newContent);
        execSync(`git add ${file}`);
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not analyze ${file}: ${error.message}`));
    }
  }

  async checkForMemoryLeaks(files, enhancements) {
    const leakPatterns = [
      {
        pattern: /setInterval\s*\([^)]+\)/g,
        type: 'uncleared_interval',
        message: 'setInterval without clear'
      },
      {
        pattern: /addEventListener\s*\([^)]+\)(?![\s\S]*removeEventListener)/g,
        type: 'unremoved_listener',
        message: 'Event listener without removal'
      },
      {
        pattern: /new\s+WebSocket\s*\([^)]+\)(?![\s\S]*\.close\(\))/g,
        type: 'unclosed_websocket',
        message: 'WebSocket without close'
      }
    ];
    
    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        
        for (const leak of leakPatterns) {
          if (leak.pattern.test(content)) {
            enhancements.actions.push({
              file,
              type: 'potential_memory_leak',
              leak: leak.type,
              message: leak.message
            });
            
            console.log(chalk.yellow(`⚠️  Potential memory leak in ${file}: ${leak.message}`));
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  async verifyImports(files, enhancements) {
    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        const importMatches = content.matchAll(/(?:import|require)\s*\(?["']([^"']+)["']\)?/g);
        
        for (const match of importMatches) {
          const importPath = match[1];
          
          // Check if it's a relative import
          if (importPath.startsWith('.')) {
            const resolvedPath = path.resolve(path.dirname(file), importPath);
            const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts'];
            
            let found = false;
            for (const ext of extensions) {
              if (await fs.pathExists(resolvedPath + ext)) {
                found = true;
                break;
              }
            }
            
            if (!found) {
              enhancements.actions.push({
                file,
                type: 'broken_import',
                import: importPath,
                severity: 'error'
              });
              
              console.log(chalk.red(`❌ Broken import in ${file}: ${importPath}`));
            }
          }
        }
      } catch (error) {
        // Skip files that can't be analyzed
      }
    }
  }

  async autoFormatCode(files, enhancements) {
    // Check if prettier is available
    try {
      execSync('which prettier', { stdio: 'ignore' });
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
          try {
            execSync(`prettier --write ${file}`, { stdio: 'pipe' });
            execSync(`git add ${file}`);
            
            enhancements.fixed.push({
              file,
              action: 'formatted',
              tool: 'prettier'
            });
            
            console.log(chalk.blue(`🎨 Auto-formatted ${file}`));
          } catch (error) {
            // Formatting failed, skip
          }
        }
      }
    } catch (error) {
      // Prettier not available, skip formatting
    }
  }

  async runCommitMsg(messageFile) {
    console.log(chalk.cyan('📝 Enhancing commit message...'));
    
    try {
      const originalMessage = await fs.readFile(messageFile, 'utf8');
      let enhancedMessage = originalMessage;
      
      // Get commit stats
      const stats = this.getCommitStats();
      
      // Add helpful context if message is too short
      if (originalMessage.trim().length < 10) {
        console.log(chalk.yellow('⚠️  Commit message is very short'));
        enhancedMessage = await this.generateSmartCommitMessage(stats) + '\n\n' + originalMessage;
      }
      
      // Add statistics footer
      const footer = this.generateCommitFooter(stats);
      if (footer && !originalMessage.includes('Files changed:')) {
        enhancedMessage = enhancedMessage.trimRight() + '\n\n' + footer;
      }
      
      // Ensure conventional commit format
      enhancedMessage = this.ensureConventionalCommit(enhancedMessage);
      
      await fs.writeFile(messageFile, enhancedMessage);
      console.log(chalk.green('✅ Commit message enhanced'));
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not enhance commit message: ${error.message}`));
    }
  }

  getCommitStats() {
    try {
      const diffStat = execSync('git diff --cached --stat', { encoding: 'utf8' });
      const files = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim());
      
      const additions = execSync('git diff --cached --numstat', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .reduce((sum, line) => {
          const parts = line.split('\t');
          return sum + parseInt(parts[0]) || 0;
        }, 0);
      
      const deletions = execSync('git diff --cached --numstat', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .reduce((sum, line) => {
          const parts = line.split('\t');
          return sum + parseInt(parts[1]) || 0;
        }, 0);
      
      return {
        files: files.length,
        additions,
        deletions,
        fileList: files
      };
    } catch (error) {
      return null;
    }
  }

  async generateSmartCommitMessage(stats) {
    if (!stats) return 'Update files';
    
    // Analyze what type of changes were made
    const fileTypes = stats.fileList.map(f => path.extname(f));
    const uniqueTypes = [...new Set(fileTypes)];
    
    if (stats.fileList.some(f => f.includes('test'))) {
      return 'test: Add/update tests';
    }
    
    if (stats.fileList.some(f => f.includes('README') || f.includes('docs'))) {
      return 'docs: Update documentation';
    }
    
    if (stats.fileList.some(f => f.includes('package.json'))) {
      return 'deps: Update dependencies';
    }
    
    if (stats.additions > stats.deletions * 2) {
      return 'feat: Add new functionality';
    }
    
    if (stats.deletions > stats.additions * 2) {
      return 'refactor: Remove unused code';
    }
    
    return 'chore: Update ' + stats.fileList[0];
  }

  generateCommitFooter(stats) {
    if (!stats) return '';
    
    const lines = [];
    lines.push(`Files changed: ${stats.files}`);
    lines.push(`Insertions: +${stats.additions}`);
    lines.push(`Deletions: -${stats.deletions}`);
    
    const netChange = stats.additions - stats.deletions;
    lines.push(`Net change: ${netChange > 0 ? '+' : ''}${netChange}`);
    
    return lines.join('\n');
  }

  ensureConventionalCommit(message) {
    const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+/;
    
    const firstLine = message.split('\n')[0];
    if (!conventionalPattern.test(firstLine)) {
      // Try to infer type from message
      const lowerMessage = firstLine.toLowerCase();
      let type = 'chore';
      
      if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
        type = 'fix';
      } else if (lowerMessage.includes('add') || lowerMessage.includes('new')) {
        type = 'feat';
      } else if (lowerMessage.includes('doc') || lowerMessage.includes('readme')) {
        type = 'docs';
      } else if (lowerMessage.includes('test')) {
        type = 'test';
      } else if (lowerMessage.includes('refactor')) {
        type = 'refactor';
      }
      
      return `${type}: ${message}`;
    }
    
    return message;
  }

  async runPostCommit() {
    console.log(chalk.cyan('📊 Learning from commit...'));
    
    try {
      const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      const commitStats = execSync('git show --stat --format=', { encoding: 'utf8' }).trim();
      
      // Load or create learning data
      const learningFile = path.join(process.cwd(), 'logs/commit-patterns.json');
      let learningData = {};
      
      if (await fs.pathExists(learningFile)) {
        learningData = await fs.readJson(learningFile);
      }
      
      if (!learningData.commits) {
        learningData.commits = [];
      }
      
      // Record commit data
      const commitData = {
        hash: commitHash,
        timestamp: new Date().toISOString(),
        message: commitMessage,
        stats: this.getCommitStats(),
        enhancements: await this.getLatestEnhancements()
      };
      
      learningData.commits.push(commitData);
      
      // Keep only last 100 commits
      if (learningData.commits.length > 100) {
        learningData.commits = learningData.commits.slice(-100);
      }
      
      // Analyze patterns
      learningData.patterns = this.analyzeCommitPatterns(learningData.commits);
      
      await fs.ensureDir(path.dirname(learningFile));
      await fs.writeJson(learningFile, learningData, { spaces: 2 });
      
      console.log(chalk.green('✅ Commit patterns updated'));
      
      // If this commit fixed issues, update error history
      if (commitMessage.toLowerCase().includes('fix')) {
        await this.updateErrorHistoryWithFix(commitHash, commitMessage);
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not learn from commit: ${error.message}`));
    }
  }

  analyzeCommitPatterns(commits) {
    const patterns = {
      averageFilesPerCommit: 0,
      mostCommonFileTypes: {},
      commitFrequency: {},
      commonIssues: {}
    };
    
    if (commits.length === 0) return patterns;
    
    // Average files per commit
    const totalFiles = commits.reduce((sum, c) => sum + (c.stats?.files || 0), 0);
    patterns.averageFilesPerCommit = totalFiles / commits.length;
    
    // File type frequency
    commits.forEach(commit => {
      if (commit.stats?.fileList) {
        commit.stats.fileList.forEach(file => {
          const ext = path.extname(file);
          patterns.mostCommonFileTypes[ext] = (patterns.mostCommonFileTypes[ext] || 0) + 1;
        });
      }
    });
    
    // Commit frequency by hour
    commits.forEach(commit => {
      const hour = new Date(commit.timestamp).getHours();
      patterns.commitFrequency[hour] = (patterns.commitFrequency[hour] || 0) + 1;
    });
    
    // Common issues
    commits.forEach(commit => {
      if (commit.enhancements?.actions) {
        commit.enhancements.actions.forEach(action => {
          const key = action.type || action.pattern;
          patterns.commonIssues[key] = (patterns.commonIssues[key] || 0) + 1;
        });
      }
    });
    
    return patterns;
  }

  async getLatestEnhancements() {
    try {
      if (await fs.pathExists(this.enhancementsLog)) {
        const log = await fs.readJson(this.enhancementsLog);
        return log[log.length - 1];
      }
    } catch (error) {
      // No enhancements found
    }
    return null;
  }

  async updateErrorHistoryWithFix(commitHash, message) {
    try {
      const errors = await this.healer.loadErrorHistory();
      
      // Find recent unresolved errors
      const unresolvedErrors = errors.filter(e => !e.resolved);
      
      // Mark errors as potentially fixed by this commit
      unresolvedErrors.forEach(error => {
        if (message.toLowerCase().includes(error.error_type.toLowerCase())) {
          error.resolution_attempts.push({
            timestamp: new Date().toISOString(),
            method: 'git_commit_fix',
            commit: commitHash,
            message: message
          });
          error.potentially_resolved = true;
          error.resolution_commit = commitHash;
        }
      });
      
      await this.healer.saveErrorHistory(errors);
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not update error history: ${error.message}`));
    }
  }

  async saveEnhancementLog(enhancement) {
    try {
      await fs.ensureDir(path.dirname(this.enhancementsLog));
      
      let log = [];
      if (await fs.pathExists(this.enhancementsLog)) {
        log = await fs.readJson(this.enhancementsLog);
      }
      
      log.push(enhancement);
      
      // Keep only last 100 entries
      if (log.length > 100) {
        log = log.slice(-100);
      }
      
      await fs.writeJson(this.enhancementsLog, log, { spaces: 2 });
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not save enhancement log: ${error.message}`));
    }
  }

  async generateReport() {
    console.log(chalk.cyan('📊 Git Enhancement Report'));
    console.log(chalk.cyan('========================='));
    
    try {
      // Load commit patterns
      const patternsFile = path.join(process.cwd(), 'logs/commit-patterns.json');
      if (await fs.pathExists(patternsFile)) {
        const data = await fs.readJson(patternsFile);
        
        console.log(chalk.green('Commit Statistics:'));
        console.log(`  Total commits analyzed: ${data.commits?.length || 0}`);
        console.log(`  Average files per commit: ${data.patterns?.averageFilesPerCommit?.toFixed(1) || 0}`);
        
        if (data.patterns?.mostCommonFileTypes) {
          console.log(chalk.blue('Most common file types:'));
          Object.entries(data.patterns.mostCommonFileTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([ext, count]) => {
              console.log(`  ${ext || 'no extension'}: ${count}`);
            });
        }
        
        if (data.patterns?.commonIssues) {
          console.log(chalk.yellow('Common issues detected:'));
          Object.entries(data.patterns.commonIssues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([issue, count]) => {
              console.log(`  ${issue}: ${count}`);
            });
        }
      }
      
      // Load enhancement log
      if (await fs.pathExists(this.enhancementsLog)) {
        const log = await fs.readJson(this.enhancementsLog);
        
        console.log(chalk.green('\nRecent Enhancements:'));
        const recentEnhancements = log.slice(-10);
        
        let totalFixed = 0;
        let totalPrevented = 0;
        
        recentEnhancements.forEach(e => {
          totalFixed += e.fixed?.length || 0;
          totalPrevented += e.prevented?.length || 0;
        });
        
        console.log(`  Issues auto-fixed: ${totalFixed}`);
        console.log(`  Commits prevented: ${totalPrevented}`);
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Report generation failed: ${error.message}`));
    }
  }
}

async function main() {
  const enhancer = new GitEnhancementSystem();
  const command = process.argv[2];
  
  switch (command) {
    case 'install':
      await enhancer.installGitHooks();
      break;
      
    case 'pre-commit':
      await enhancer.runPreCommit();
      break;
      
    case 'commit-msg':
      const messageFile = process.argv[3];
      if (messageFile) {
        await enhancer.runCommitMsg(messageFile);
      }
      break;
      
    case 'post-commit':
      await enhancer.runPostCommit();
      break;
      
    case 'prepare-commit-msg':
      const prepareFile = process.argv[3];
      if (prepareFile) {
        await enhancer.runCommitMsg(prepareFile);
      }
      break;
      
    case 'report':
      await enhancer.generateReport();
      break;
      
    default:
      console.log(chalk.cyan('🌟 Cosmic Fountain Git Enhancement'));
      console.log(chalk.cyan('=================================='));
      console.log('Usage:');
      console.log('  install  - Install git hooks');
      console.log('  report   - Generate enhancement report');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GitEnhancementSystem;