#!/usr/bin/env node

/**
 * Test script for the Formula One MCP server
 * This script will:
 * 1. Import the server index.js file
 * 2. Test that it loads correctly
 */

console.log('Testing Formula One MCP Server...');
console.log('This script will import the main server file.');

// We don't actually need to do anything here as the server
// code automatically starts the MCP server when imported
import('./build/index.js')
  .then(() => {
    console.log('Server imported successfully.');
    console.log('The server is now running in the background.');
    console.log('You can now use the Formula One tools in Cline.');
    console.log('Press Ctrl+C to exit this test script.');
  })
  .catch((error) => {
    console.error('Failed to import server code:', error);
    process.exit(1);
  });

// Keep the script running
process.stdin.resume();
console.log('Waiting for server messages...');
