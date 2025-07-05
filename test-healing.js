#!/usr/bin/env node

const SelfHealingSystem = require('./scripts/heal');

async function testHealing() {
  const healer = new SelfHealingSystem();
  
  console.log('🧪 Testing Self-Healing System...\n');
  
  // Test 1: Port conflict
  console.log('Test 1: Port Conflict (EADDRINUSE)');
  try {
    require('./test-errors').testPortConflict();
  } catch (error) {
    const result = await healer.attemptHealing(error, { test: 'port_conflict' });
    console.log('Healing result:', result);
  }
  
  // Test 2: Missing file
  console.log('\nTest 2: Missing File (ENOENT)');
  try {
    const fs = require('fs');
    fs.readFileSync('./test-missing-file.json');
  } catch (error) {
    const result = await healer.attemptHealing(error, { test: 'missing_file' });
    console.log('Healing result:', result);
  }
  
  // Test 3: Missing module
  console.log('\nTest 3: Missing Module');
  try {
    require('express'); // Assuming express is not installed
  } catch (error) {
    const result = await healer.attemptHealing(error, { test: 'missing_module' });
    console.log('Healing result:', result);
  }
  
  // Test 4: Network issue
  console.log('\nTest 4: Network Connection Refused');
  const http = require('http');
  const error = new Error('connect ECONNREFUSED 127.0.0.1:99999');
  error.code = 'ECONNREFUSED';
  const result = await healer.attemptHealing(error, { test: 'network_refused' });
  console.log('Healing result:', result);
  
  // Show error history
  console.log('\n📊 Error History Summary:');
  const errors = await healer.loadErrorHistory();
  console.log(`Total errors logged: ${errors.length}`);
  console.log(`Resolved errors: ${errors.filter(e => e.resolved).length}`);
  console.log(`Unresolved errors: ${errors.filter(e => !e.resolved).length}`);
}

testHealing().catch(console.error);