// Test file to demonstrate self-healing capabilities

const fs = require('fs');
const net = require('net');

// Test 1: Port conflict (EADDRINUSE)
function testPortConflict() {
  console.log('Testing port conflict...');
  const server = net.createServer();
  server.listen(3000);
  
  // Try to create another server on same port
  const server2 = net.createServer();
  server2.listen(3000); // This will throw EADDRINUSE
}

// Test 2: Missing file (ENOENT)
function testMissingFile() {
  console.log('Testing missing file...');
  const data = fs.readFileSync('./nonexistent-file.json'); // This will throw ENOENT
}

// Test 3: Memory leak simulation
function testMemoryLeak() {
  console.log('Testing memory leak...');
  const leakyArray = [];
  setInterval(() => {
    // Keep adding large objects without cleanup
    leakyArray.push(new Array(1000000).fill('LEAK'));
  }, 100);
}

// Test 4: Network failure (ECONNREFUSED)
function testNetworkFailure() {
  console.log('Testing network failure...');
  const http = require('http');
  http.get('http://localhost:99999', (res) => {
    console.log('Connected');
  }); // This will throw ECONNREFUSED
}

// Test 5: Missing module
function testMissingModule() {
  console.log('Testing missing module...');
  const missingModule = require('some-nonexistent-module'); // This will throw MODULE_NOT_FOUND
}

// Run test based on command line argument
const testType = process.argv[2];

switch (testType) {
  case 'port':
    testPortConflict();
    break;
  case 'file':
    testMissingFile();
    break;
  case 'memory':
    testMemoryLeak();
    break;
  case 'network':
    testNetworkFailure();
    break;
  case 'module':
    testMissingModule();
    break;
  default:
    console.log('Usage: node test-errors.js [port|file|memory|network|module]');
    console.log('Each test will trigger a specific error for self-healing to resolve');
}