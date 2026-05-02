#!/usr/bin/env node

// Export the MCP server for external use
export { ResumeBuilderMCPServer } from './infrastructure/mcp/server.js';

// Default boot behavior for standalone execution
import { boot } from "./server/boot.js";

// Check if this is being run as MCP server
if (process.argv.includes('--mcp')) {
  // Start MCP server
  import('./infrastructure/mcp/server.js').then(({ ResumeBuilderMCPServer }) => {
    const server = new ResumeBuilderMCPServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    // Start the MCP server
    server.start().catch((error) => {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    });
  });
} else {
  // Default boot behavior
  boot().catch((error: unknown) => {
    console.error("Fatal error in boot():", error);
    process.exit(1);
  });
}