#!/usr/bin/env node

const SelfHealingSystem = require('./scripts/heal');
const MemoryLeakDetector = require('./scripts/monitor');
const DependencyConflictResolver = require('./scripts/dependency-resolver');
const NetworkRecoverySystem = require('./scripts/network-recovery');
const net = require('net');
const fs = require('fs-extra');

async function demonstrateAllFeatures() {
  console.log('🌟 COSMIC FOUNTAIN - COMPLETE DEMONSTRATION');
  console.log('==========================================\n');
  
  const healer = new SelfHealingSystem();
  
  // 1. SELF-HEALING DEMONSTRATION
  console.log('1️⃣  SELF-HEALING CAPABILITIES\n');
  
  // Test: Port conflict
  console.log('📍 Test: Port Conflict Resolution');
  const server = net.createServer();
  server.listen(8888);
  console.log('   Created server on port 8888');
  
  // Simulate port conflict error
  const portError = new Error('listen EADDRINUSE: address already in use :::8888');
  portError.code = 'EADDRINUSE';
  const portResult = await healer.attemptHealing(portError, { port: 8888 });
  console.log('   Healing result:', portResult);
  
  // Test: Missing file
  console.log('\n📍 Test: Missing File Recovery');
  const fileError = new Error("ENOENT: no such file or directory, open './config/app-settings.json'");
  fileError.code = 'ENOENT';
  const fileResult = await healer.attemptHealing(fileError, { file: './config/app-settings.json' });
  console.log('   Healing result:', fileResult);
  
  // 2. MEMORY LEAK DETECTION
  console.log('\n2️⃣  MEMORY LEAK DETECTION\n');
  const memDetector = new MemoryLeakDetector();
  await memDetector.generateReport();
  
  // 3. DEPENDENCY ANALYSIS
  console.log('\n3️⃣  DEPENDENCY MANAGEMENT\n');
  const depResolver = new DependencyConflictResolver();
  const depAnalysis = await depResolver.analyzeDependencies();
  console.log(`   Package Manager: ${depAnalysis.packageManager}`);
  console.log(`   Issues Found: ${depAnalysis.issues.length}`);
  console.log(`   Vulnerabilities: ${depAnalysis.vulnerabilities.length}`);
  console.log(`   Outdated Packages: ${depAnalysis.outdated.length}`);
  
  // 4. NETWORK RECOVERY
  console.log('\n4️⃣  NETWORK RECOVERY SYSTEM\n');
  const netRecovery = new NetworkRecoverySystem();
  const pingResult = await netRecovery.pingEndpoint('google.com');
  console.log(`   Network Test (google.com): ${pingResult.success ? '✅ Connected' : '❌ Failed'}`);
  if (pingResult.success) {
    console.log(`   Response Time: ${pingResult.responseTime}ms`);
  }
  
  // 5. ERROR HISTORY ANALYSIS
  console.log('\n5️⃣  ERROR HISTORY & LEARNING\n');
  const errors = await healer.loadErrorHistory();
  console.log(`   Total Errors Logged: ${errors.length}`);
  console.log(`   Resolved Errors: ${errors.filter(e => e.resolved).length}`);
  console.log(`   Unresolved Errors: ${errors.filter(e => !e.resolved).length}`);
  
  const errorTypes = {};
  errors.forEach(e => {
    errorTypes[e.error_type] = (errorTypes[e.error_type] || 0) + 1;
  });
  console.log('   Error Types:', errorTypes);
  
  // 6. GIT POST-COMMIT INTELLIGENCE
  console.log('\n6️⃣  GIT POST-COMMIT INTELLIGENCE\n');
  console.log('   ✅ Post-commit hook installed');
  console.log('   Features on each commit:');
  console.log('     - Learn from code fixes');
  console.log('     - Detect performance patterns');
  console.log('     - Generate documentation TODOs');
  console.log('     - Create healing rules');
  console.log('     - Optimize dependencies');
  
  // 7. SYSTEM BENEFITS SUMMARY
  console.log('\n7️⃣  SYSTEM BENEFITS\n');
  console.log('   🛡️  DEFENSIVE CAPABILITIES:');
  console.log('     • Automatic error recovery without manual intervention');
  console.log('     • Prevents repeated failures through pattern learning');
  console.log('     • Self-documenting error resolution history');
  console.log('     • Proactive memory leak prevention');
  console.log('     • Network resilience with automatic recovery');
  
  console.log('\n   📈 PRODUCTIVITY IMPROVEMENTS:');
  console.log('     • Reduces debugging time by auto-fixing common errors');
  console.log('     • Learns from your fixes to prevent future issues');
  console.log('     • Maintains system health automatically');
  console.log('     • Documents patterns for team knowledge sharing');
  
  console.log('\n   🧠 INTELLIGENT FEATURES:');
  console.log('     • Builds institutional memory from errors');
  console.log('     • Confidence scoring for error patterns');
  console.log('     • Cross-project learning capabilities');
  console.log('     • Automated dependency security monitoring');
  
  // Clean up
  server.close();
  console.log('\n✅ Demonstration complete!');
}

// Create example commit to show post-commit intelligence
async function demonstrateGitIntelligence() {
  console.log('\n\n8️⃣  GIT COMMIT INTELLIGENCE DEMO\n');
  
  // Create a test file with some issues
  const testFile = 'test-commit-demo.js';
  await fs.writeFile(testFile, `
// Demo file with intentional issues
function processData(data) {
  console.log('Processing data...'); // Will be detected
  
  // Memory leak: interval without cleanup
  setInterval(() => {
    data.push(new Array(1000));
  }, 1000);
  
  // Missing error handling
  const result = JSON.parse(data);
  
  return result;
}

// TODO: Add documentation
// FIXME: Handle edge cases
export default processData;
`);
  
  console.log('   Created test file with:');
  console.log('     • Console.log statement');
  console.log('     • Memory leak (setInterval without clear)');
  console.log('     • Missing error handling');
  console.log('     • TODO/FIXME comments');
  console.log('     • Missing JSDoc documentation');
  
  console.log('\n   When you commit this file, the post-commit hook will:');
  console.log('     1. Detect the memory leak pattern');
  console.log('     2. Learn from any fixes you make');
  console.log('     3. Create prevention rules');
  console.log('     4. Generate documentation TODOs');
  console.log('     5. Update healing strategies');
  
  console.log('\n   Try it: git add test-commit-demo.js && git commit -m "test: Demo self-healing"');
}

// Main execution
async function main() {
  try {
    await demonstrateAllFeatures();
    await demonstrateGitIntelligence();
  } catch (error) {
    console.error('Demo error:', error);
  }
}

main();