import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@vercel/sandbox";

async function getStdout(result: Awaited<ReturnType<Sandbox["runCommand"]>>): Promise<string> {
  try {
    return await result.stdout();
  } catch {
    return "";
  }
}

async function getStderr(result: Awaited<ReturnType<Sandbox["runCommand"]>>): Promise<string> {
  try {
    return await result.stderr();
  } catch {
    return "";
  }
}

function buildExecuteCodeTool(sandbox: Sandbox) {
  return tool({
    description:
      "Write and run code in the sandbox. Use console.log (JS) or print (Python) to output values.",
    inputSchema: z.object({
      code: z.string().describe("The code to execute"),
      language: z.enum(["javascript", "python"]).describe("Language to run"),
      packages: z
        .array(z.string())
        .optional()
        .describe("Packages to install before running")
    }),
    execute: async ({ code, language, packages }) => {
      if (packages && packages.length > 0) {
        const installer = language === "python" ? "pip" : "npm";
        const args =
          language === "python"
            ? ["install", ...packages]
            : ["install", "--no-save", ...packages];
        const installResult = await sandbox.runCommand({
          cmd: installer,
          args
        });
        if (installResult.exitCode !== 0) {
          return {
            stdout: "",
            stderr: await getStderr(installResult),
            exitCode: installResult.exitCode,
            phase: "install"
          };
        }
      }

      const cmd = language === "python" ? "python3" : "node";
      const result = await sandbox.runCommand({ cmd, args: ["-e", code] });

      return {
        stdout: await getStdout(result),
        stderr: await getStderr(result),
        exitCode: result.exitCode,
        phase: "run"
      };
    }
  });
}

function buildRunCommandTool(sandbox: Sandbox) {
  return tool({
    description:
      "Run a shell command in the sandbox. Use for curl, ls, git, npm, pip, etc.",
    inputSchema: z.object({
      command: z.string().describe("The command to run"),
      args: z
        .array(z.string())
        .optional()
        .describe("Command arguments")
    }),
    execute: async ({ command, args }) => {
      const result = await sandbox.runCommand({
        cmd: command,
        args: args ?? []
      });

      return {
        stdout: await getStdout(result),
        stderr: await getStderr(result),
        exitCode: result.exitCode
      };
    }
  });
}

function buildWriteFileTool(sandbox: Sandbox) {
  return tool({
    description: "Write content to a file in the sandbox filesystem.",
    inputSchema: z.object({
      path: z.string().describe("File path in the sandbox"),
      content: z.string().describe("File content to write")
    }),
    execute: async ({ path, content }) => {
      const escaped = content.replace(/'/g, "'\\''");
      const result = await sandbox.runCommand({
        cmd: "bash",
        args: ["-c", `mkdir -p "$(dirname '${path}')" && printf '%s' '${escaped}' > '${path}'`]
      });

      return {
        success: result.exitCode === 0,
        path,
        exitCode: result.exitCode,
        stderr: await getStderr(result)
      };
    }
  });
}

function buildReadFileTool(sandbox: Sandbox) {
  return tool({
    description: "Read the contents of a file in the sandbox.",
    inputSchema: z.object({
      path: z.string().describe("File path to read")
    }),
    execute: async ({ path }) => {
      const result = await sandbox.runCommand({
        cmd: "cat",
        args: [path]
      });

      return {
        content: await getStdout(result),
        exitCode: result.exitCode,
        stderr: await getStderr(result)
      };
    }
  });
}

export function buildSandboxTools(sandbox: Sandbox) {
  return {
    executeCode: buildExecuteCodeTool(sandbox),
    runCommand: buildRunCommandTool(sandbox),
    writeFile: buildWriteFileTool(sandbox),
    readFile: buildReadFileTool(sandbox)
  };
}
