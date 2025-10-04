import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const moduleTypeSchema = z.enum(["tool", "resource", "prompt"]);

export const registerableModuleSchema = z.object({
  type: moduleTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  register: z.function()
});

export type RegisterableModule = {
  type: "tool" | "resource" | "prompt";
  name: string;
  description?: string;
  register: (server: McpServer) => void | Promise<void>;
};

export function isRegisterableModule(module: unknown): module is RegisterableModule {
  const result = registerableModuleSchema.safeParse(module);
  return result.success;
}