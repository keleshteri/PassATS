# PassATS - MCP Server Template

A comprehensive Model Context Protocol (MCP) server template designed for building ATS (Applicant Tracking System) optimization tools. This project serves as a solid foundation for creating MCP servers with tools, resources, and prompts.

## 🚀 Features

- **Auto-registration System**: Automatically discovers and registers tools, resources, and prompts
- **Dual Transport Support**: Both stdio and HTTP transports with SSE support
- **TypeScript**: Full TypeScript support with strict type checking
- **Modular Architecture**: Clean separation of concerns with auto-loading modules
- **Development Tools**: Built-in development server and MCP inspector integration
- **Cross-platform**: Works on Windows, macOS, and Linux

## 📦 Available Modules

### Tools
- **echo**: Simple echo tool for testing MCP functionality

### Resources
- **system-info**: Provides system information (platform, architecture, memory, etc.)
- **timestamp**: Generates current timestamp in various formats

### Prompts
- **code-analyzer**: Analyzes code for security, performance, style issues, and bugs
- **generate-readme**: Generates professional README files for projects

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/keleshteri/PassATS.git
cd PassATS
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## 🚀 Usage

### Running the MCP Server

#### STDIO Mode (for MCP clients)
```bash
npm run serve:stdio
```

#### HTTP Mode (for web clients)
```bash
npm run serve:http
```

The HTTP server will be available at `http://localhost:3000/mcp`

### Development

#### Interactive Development Server
```bash
npm run dev
```

This starts an interactive development server where you can paste JSON-RPC messages to test the MCP server.

#### MCP Inspector
```bash
npm run inspect
```

Opens the MCP Inspector in your browser for visual testing and debugging.

## 🔧 Configuration

### MCP Configuration Files

#### For Cursor IDE
The `.cursor/mcp.json` file is configured for Cursor IDE integration:

```json
{
  "servers": {
    "pass-ats-stdio": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "STARTER_TRANSPORT": "stdio"
      }
    },
    "pass-ats-http": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "x-mcp-session": "cursor-session"
      }
    }
  }
}
```

#### For Other MCP Clients
The main `mcp.json` file provides standard MCP server configurations:

```json
{
  "servers": {
    "pass-ats-stdio": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "STARTER_TRANSPORT": "stdio"
      }
    },
    "pass-ats-http": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "x-mcp-session": "default-session"
      }
    }
  }
}
```

## 🏗️ Project Structure

```
src/
├── index.ts                 # Main entry point
├── server/
│   └── boot.ts             # Server bootstrapping and transport setup
├── registry/
│   ├── auto-loader.ts      # Automatic module discovery and registration
│   ├── helpers.ts          # Utility functions for module management
│   ├── module-processor.ts # Module processing logic
│   └── types.ts            # Type definitions
├── tools/                  # Tool modules
│   └── echo.ts
├── resources/              # Resource modules
│   ├── system-info.ts
│   └── timestamp.ts
└── prompts/                # Prompt modules
    ├── code-analyzer.ts
    └── generate-readme.ts
```

## 🧩 Creating New Modules

### Adding a New Tool

1. Create a new file in `src/tools/` (e.g., `my-tool.ts`)
2. Follow the pattern from existing tools:

```typescript
import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const myToolModule: RegisterableModule = {
  type: "tool",
  name: "my-tool",
  description: "Description of what this tool does",
  register(server: McpServer) {
    server.tool(
      "my-tool",
      "Description of what this tool does",
      {
        // Define your input schema using Zod
        input: z.string().describe("Input parameter description"),
      },
      (args) => {
        // Implement your tool logic here
        return {
          content: [
            {
              type: "text",
              text: `Result: ${args.input}`,
            },
          ],
        };
      }
    );
  }
};

export default myToolModule;
```

### Adding a New Resource

1. Create a new file in `src/resources/` (e.g., `my-resource.ts`)
2. Follow the pattern from existing resources:

```typescript
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const myResourceModule: RegisterableModule = {
  type: "resource",
  name: "my-resource",
  description: "Description of this resource",
  register(server: McpServer) {
    server.resource(
      "my-resource",
      "my://resource-uri",
      {
        name: "My Resource",
        description: "Description of this resource",
      },
      () => {
        return {
          contents: [
            {
              uri: "my://resource-uri",
              mimeType: "application/json",
              text: JSON.stringify({ data: "your resource data" }, null, 2),
            },
          ],
        };
      }
    );
  }
};

export default myResourceModule;
```

### Adding a New Prompt

1. Create a new file in `src/prompts/` (e.g., `my-prompt.ts`)
2. Follow the pattern from existing prompts:

```typescript
import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const myPromptModule: RegisterableModule = {
  type: "prompt",
  name: "my-prompt",
  description: "Description of this prompt",
  register(server: McpServer) {
    server.registerPrompt(
      "my-prompt",
      {
        title: "My Prompt",
        description: "Description of this prompt",
        argsSchema: {
          input: z.string().describe("Input parameter"),
        },
      },
      ({ input }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate something based on: ${input}`,
            },
          },
        ],
      })
    );
  }
};

export default myPromptModule;
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Start development server with interactive testing
- `npm run serve:stdio` - Run MCP server in stdio mode
- `npm run serve:http` - Run MCP server in HTTP mode
- `npm run inspect` - Open MCP Inspector for testing
- `npm run inspect:http` - Open MCP Inspector for HTTP mode testing
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking

## 🔧 Development Tools

### Code Generation

The project includes Hygen templates for generating new modules:

```bash
npm run gen:tool      # Generate a new tool
npm run gen:prompt    # Generate a new prompt
npm run gen:resource  # Generate a new resource
```

### Code Quality

- **ESLint**: Configured with strict rules for code quality
- **TypeScript**: Strict type checking enabled
- **Knip**: Unused code detection and cleanup

## 🌐 Environment Variables

- `STARTER_TRANSPORT`: Transport mode (`stdio` or `http`)
- `PORT`: HTTP server port (default: 3000)
- `CORS_ORIGIN`: CORS origin for HTTP mode (default: "*")

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please use the GitHub issue tracker.

---

**Note**: This project is designed as a template for building MCP servers. Customize the tools, resources, and prompts according to your specific ATS optimization needs.
