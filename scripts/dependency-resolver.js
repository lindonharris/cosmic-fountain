#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const SelfHealingSystem = require('./heal');

class DependencyConflictResolver {
  constructor() {
    this.healer = new SelfHealingSystem();
    this.packageManagers = {
      npm: {
        lockFile: 'package-lock.json',
        installCmd: 'npm install',
        updateCmd: 'npm update',
        auditCmd: 'npm audit',
        auditFixCmd: 'npm audit fix',
        listCmd: 'npm list',
        outdatedCmd: 'npm outdated'
      },
      yarn: {
        lockFile: 'yarn.lock',
        installCmd: 'yarn install',
        updateCmd: 'yarn upgrade',
        auditCmd: 'yarn audit',
        auditFixCmd: 'yarn audit fix',
        listCmd: 'yarn list',
        outdatedCmd: 'yarn outdated'
      },
      pnpm: {
        lockFile: 'pnpm-lock.yaml',
        installCmd: 'pnpm install',
        updateCmd: 'pnpm update',
        auditCmd: 'pnpm audit',
        auditFixCmd: 'pnpm audit fix',
        listCmd: 'pnpm list',
        outdatedCmd: 'pnpm outdated'
      }
    };
    this.conflictStrategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    this.conflictStrategies.set('PEER_DEPENDENCY', this.resolvePeerDependency.bind(this));
    this.conflictStrategies.set('VERSION_CONFLICT', this.resolveVersionConflict.bind(this));
    this.conflictStrategies.set('MISSING_DEPENDENCY', this.resolveMissingDependency.bind(this));
    this.conflictStrategies.set('CIRCULAR_DEPENDENCY', this.resolveCircularDependency.bind(this));
    this.conflictStrategies.set('DEPRECATED_PACKAGE', this.resolveDeprecatedPackage.bind(this));
    this.conflictStrategies.set('SECURITY_VULNERABILITY', this.resolveSecurityVulnerability.bind(this));
  }

  async detectPackageManager() {
    const cwd = process.cwd();
    
    if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
      return 'yarn';
    }
    if (await fs.pathExists(path.join(cwd, 'package-lock.json'))) {
      return 'npm';
    }
    
    // Default to npm if no lock file found
    return 'npm';
  }

  async analyzeDependencies() {
    console.log(chalk.blue('🔍 Analyzing dependencies...'));
    
    const packageManager = await this.detectPackageManager();
    const pm = this.packageManagers[packageManager];
    
    console.log(chalk.green(`📦 Detected package manager: ${packageManager}`));
    
    const analysis = {
      packageManager,
      conflicts: [],
      vulnerabilities: [],
      outdated: [],
      issues: []
    };
    
    try {
      // Check for missing dependencies
      const missingDeps = await this.checkMissingDependencies(pm);
      analysis.issues.push(...missingDeps);
      
      // Check for version conflicts
      const versionConflicts = await this.checkVersionConflicts(pm);
      analysis.conflicts.push(...versionConflicts);
      
      // Check for security vulnerabilities
      const vulns = await this.checkSecurityVulnerabilities(pm);
      analysis.vulnerabilities.push(...vulns);
      
      // Check for outdated packages
      const outdated = await this.checkOutdatedPackages(pm);
      analysis.outdated.push(...outdated);
      
      // Check for circular dependencies
      const circular = await this.checkCircularDependencies();
      analysis.issues.push(...circular);
      
    } catch (error) {
      console.log(chalk.red(`❌ Analysis failed: ${error.message}`));
      analysis.error = error.message;
    }
    
    return analysis;
  }

  async checkMissingDependencies(pm) {
    const issues = [];
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        return issues;
      }
      
      const packageJson = await fs.readJson(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };
      
      for (const [name, version] of Object.entries(allDeps)) {
        try {
          require.resolve(name);
        } catch (error) {
          if (error.code === 'MODULE_NOT_FOUND') {
            issues.push({
              type: 'MISSING_DEPENDENCY',
              package: name,
              version,
              message: `Missing dependency: ${name}@${version}`
            });
          }
        }
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not check missing dependencies: ${error.message}`));
    }
    
    return issues;
  }

  async checkVersionConflicts(pm) {
    const conflicts = [];
    
    try {
      const result = execSync(pm.listCmd, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      // Parse output for version conflicts (simplified)
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes('UNMET PEER DEPENDENCY') || line.includes('conflicting')) {
          const match = line.match(/(\S+)@(\S+)/);
          if (match) {
            conflicts.push({
              type: 'VERSION_CONFLICT',
              package: match[1],
              version: match[2],
              message: line.trim()
            });
          }
        }
      }
      
    } catch (error) {
      // List command might fail, but that's okay
      console.log(chalk.yellow(`⚠️  Could not check version conflicts: ${error.message}`));
    }
    
    return conflicts;
  }

  async checkSecurityVulnerabilities(pm) {
    const vulnerabilities = [];
    
    try {
      const result = execSync(pm.auditCmd + ' --json', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      const audit = JSON.parse(result);
      
      if (audit.vulnerabilities) {
        for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
          vulnerabilities.push({
            type: 'SECURITY_VULNERABILITY',
            package: name,
            severity: vuln.severity,
            title: vuln.title,
            message: `Security vulnerability in ${name}: ${vuln.title}`
          });
        }
      }
      
    } catch (error) {
      // Audit might fail or return non-zero exit code
      console.log(chalk.yellow(`⚠️  Could not check security vulnerabilities: ${error.message}`));
    }
    
    return vulnerabilities;
  }

  async checkOutdatedPackages(pm) {
    const outdated = [];
    
    try {
      const result = execSync(pm.outdatedCmd + ' --json', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      const outdatedPackages = JSON.parse(result);
      
      for (const [name, info] of Object.entries(outdatedPackages)) {
        outdated.push({
          type: 'OUTDATED_PACKAGE',
          package: name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          message: `${name}: ${info.current} → ${info.latest}`
        });
      }
      
    } catch (error) {
      // Outdated command might fail or return non-zero exit code
      console.log(chalk.yellow(`⚠️  Could not check outdated packages: ${error.message}`));
    }
    
    return outdated;
  }

  async checkCircularDependencies() {
    const issues = [];
    
    try {
      // Simple circular dependency detection
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        return issues;
      }
      
      const packageJson = await fs.readJson(packageJsonPath);
      const packageName = packageJson.name;
      
      if (packageName) {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        if (allDeps[packageName]) {
          issues.push({
            type: 'CIRCULAR_DEPENDENCY',
            package: packageName,
            message: `Package depends on itself: ${packageName}`
          });
        }
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not check circular dependencies: ${error.message}`));
    }
    
    return issues;
  }

  async resolvePeerDependency(conflict) {
    console.log(chalk.blue(`🔧 Resolving peer dependency: ${conflict.package}`));
    
    try {
      const packageManager = await this.detectPackageManager();
      const pm = this.packageManagers[packageManager];
      
      // Try to install the peer dependency
      execSync(`${pm.installCmd} ${conflict.package}`, { stdio: 'inherit' });
      
      console.log(chalk.green(`✅ Installed peer dependency: ${conflict.package}`));
      return { success: true, action: `installed_peer_dependency_${conflict.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve peer dependency: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveVersionConflict(conflict) {
    console.log(chalk.blue(`🔧 Resolving version conflict: ${conflict.package}`));
    
    try {
      const packageManager = await this.detectPackageManager();
      const pm = this.packageManagers[packageManager];
      
      // Try to update the conflicting package
      execSync(`${pm.updateCmd} ${conflict.package}`, { stdio: 'inherit' });
      
      console.log(chalk.green(`✅ Updated conflicting package: ${conflict.package}`));
      return { success: true, action: `updated_package_${conflict.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve version conflict: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveMissingDependency(issue) {
    console.log(chalk.blue(`🔧 Resolving missing dependency: ${issue.package}`));
    
    try {
      const packageManager = await this.detectPackageManager();
      const pm = this.packageManagers[packageManager];
      
      // Install the missing dependency
      execSync(`${pm.installCmd} ${issue.package}@${issue.version}`, { stdio: 'inherit' });
      
      console.log(chalk.green(`✅ Installed missing dependency: ${issue.package}`));
      return { success: true, action: `installed_missing_dependency_${issue.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve missing dependency: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveCircularDependency(issue) {
    console.log(chalk.blue(`🔧 Resolving circular dependency: ${issue.package}`));
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Remove self-dependency
      if (packageJson.dependencies && packageJson.dependencies[issue.package]) {
        delete packageJson.dependencies[issue.package];
      }
      if (packageJson.devDependencies && packageJson.devDependencies[issue.package]) {
        delete packageJson.devDependencies[issue.package];
      }
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      
      console.log(chalk.green(`✅ Removed circular dependency: ${issue.package}`));
      return { success: true, action: `removed_circular_dependency_${issue.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve circular dependency: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveDeprecatedPackage(issue) {
    console.log(chalk.blue(`🔧 Resolving deprecated package: ${issue.package}`));
    
    try {
      // This would typically require finding alternatives
      // For now, just update to latest version
      const packageManager = await this.detectPackageManager();
      const pm = this.packageManagers[packageManager];
      
      execSync(`${pm.updateCmd} ${issue.package}`, { stdio: 'inherit' });
      
      console.log(chalk.green(`✅ Updated deprecated package: ${issue.package}`));
      return { success: true, action: `updated_deprecated_package_${issue.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve deprecated package: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveSecurityVulnerability(vulnerability) {
    console.log(chalk.blue(`🔧 Resolving security vulnerability: ${vulnerability.package}`));
    
    try {
      const packageManager = await this.detectPackageManager();
      const pm = this.packageManagers[packageManager];
      
      // Try audit fix first
      execSync(pm.auditFixCmd, { stdio: 'inherit' });
      
      console.log(chalk.green(`✅ Fixed security vulnerability: ${vulnerability.package}`));
      return { success: true, action: `fixed_security_vulnerability_${vulnerability.package}` };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to resolve security vulnerability: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async resolveAllIssues() {
    console.log(chalk.blue('🔧 Resolving all dependency issues...'));
    
    const analysis = await this.analyzeDependencies();
    let resolvedCount = 0;
    let failedCount = 0;
    
    // Resolve missing dependencies first
    for (const issue of analysis.issues) {
      if (issue.type === 'MISSING_DEPENDENCY') {
        const result = await this.resolveMissingDependency(issue);
        if (result.success) resolvedCount++;
        else failedCount++;
      }
    }
    
    // Resolve conflicts
    for (const conflict of analysis.conflicts) {
      const strategy = this.conflictStrategies.get(conflict.type);
      if (strategy) {
        const result = await strategy(conflict);
        if (result.success) resolvedCount++;
        else failedCount++;
      }
    }
    
    // Resolve vulnerabilities
    for (const vulnerability of analysis.vulnerabilities) {
      const result = await this.resolveSecurityVulnerability(vulnerability);
      if (result.success) resolvedCount++;
      else failedCount++;
    }
    
    // Resolve circular dependencies
    for (const issue of analysis.issues) {
      if (issue.type === 'CIRCULAR_DEPENDENCY') {
        const result = await this.resolveCircularDependency(issue);
        if (result.success) resolvedCount++;
        else failedCount++;
      }
    }
    
    console.log(chalk.green(`\n✅ Resolution complete: ${resolvedCount} resolved, ${failedCount} failed`));
    
    return {
      resolved: resolvedCount,
      failed: failedCount,
      analysis
    };
  }

  async generateReport() {
    console.log(chalk.cyan('📊 Dependency Analysis Report'));
    console.log(chalk.cyan('============================='));
    
    const analysis = await this.analyzeDependencies();
    
    console.log(chalk.green(`Package Manager: ${analysis.packageManager}`));
    console.log(chalk.blue(`Issues Found: ${analysis.issues.length}`));
    console.log(chalk.blue(`Conflicts: ${analysis.conflicts.length}`));
    console.log(chalk.blue(`Vulnerabilities: ${analysis.vulnerabilities.length}`));
    console.log(chalk.blue(`Outdated Packages: ${analysis.outdated.length}`));
    
    if (analysis.issues.length > 0) {
      console.log(chalk.yellow('\nIssues:'));
      analysis.issues.forEach(issue => {
        console.log(`  - ${issue.message}`);
      });
    }
    
    if (analysis.conflicts.length > 0) {
      console.log(chalk.yellow('\nConflicts:'));
      analysis.conflicts.forEach(conflict => {
        console.log(`  - ${conflict.message}`);
      });
    }
    
    if (analysis.vulnerabilities.length > 0) {
      console.log(chalk.red('\nVulnerabilities:'));
      analysis.vulnerabilities.forEach(vuln => {
        console.log(`  - ${vuln.message} (${vuln.severity})`);
      });
    }
    
    return analysis;
  }
}

async function main() {
  const resolver = new DependencyConflictResolver();
  
  console.log(chalk.cyan('🌟 Cosmic Fountain Dependency Resolver'));
  console.log(chalk.cyan('======================================'));
  
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    await resolver.generateReport();
  } else if (args.includes('--resolve')) {
    await resolver.resolveAllIssues();
  } else {
    console.log(chalk.blue('Usage:'));
    console.log('  --report   Generate dependency analysis report');
    console.log('  --resolve  Resolve all detected issues');
    
    // Default to report
    await resolver.generateReport();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DependencyConflictResolver;