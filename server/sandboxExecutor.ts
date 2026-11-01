import vm from 'vm';
import { db } from './database.js';
import { inspectPlatformOrUrl } from './platformInspector.js';

export interface SandboxExecutionResult {
  success: boolean;
  returnValue: any;
  logs: string[];
  errors: string[];
  executionTimeMs: number;
}

export interface TerminalExecutionResult {
  command: string;
  output: string;
  isError: boolean;
  exitCode: number;
  timestamp: string;
}

export async function executeCodeInSandbox(
  code: string,
  contextData: Record<string, any> = {}
): Promise<SandboxExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  const errors: string[] = [];

  const safeConsole = {
    log: (...args: any[]) => {
      logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    },
    warn: (...args: any[]) => {
      logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    },
    error: (...args: any[]) => {
      errors.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    },
    info: (...args: any[]) => {
      logs.push('[INFO] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    },
  };

  const workspaceApi = {
    readFile: (nameOrPath: string) => {
      const file = db.getFile(nameOrPath);
      return file ? file.content : null;
    },
    writeFile: (name: string, content: string) => {
      return db.saveFile(name, content);
    },
    listFiles: () => {
      return db.getFiles().map((f) => ({ name: f.name, path: f.path, sizeBytes: f.sizeBytes }));
    },
  };

  const sandboxContext: Record<string, any> = {
    console: safeConsole,
    workspace: workspaceApi,
    inputs: contextData,
    fetch: globalThis.fetch,
    URL: globalThis.URL,
    Buffer: globalThis.Buffer,
    setTimeout: (fn: Function, ms: number) => setTimeout(fn, Math.min(ms, 1000)),
    clearTimeout: globalThis.clearTimeout,
    Date: globalThis.Date,
    Math: globalThis.Math,
    JSON: globalThis.JSON,
    RegExp: globalThis.RegExp,
    Array: globalThis.Array,
    Object: globalThis.Object,
    Number: globalThis.Number,
    String: globalThis.String,
    Boolean: globalThis.Boolean,
    Promise: globalThis.Promise,
  };

  const context = vm.createContext(sandboxContext);

  try {
    // Wrap code in an async IIFE if it contains return or top-level await
    const wrappedCode = `
      (async () => {
        ${code}
      })()
    `;

    const script = new vm.Script(wrappedCode);

    const executionPromise = script.runInContext(context, { timeout: 5000 });
    const result = await executionPromise;

    return {
      success: errors.length === 0,
      returnValue: result,
      logs,
      errors,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    errors.push(err.message || String(err));
    return {
      success: false,
      returnValue: null,
      logs,
      errors,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export async function executeTerminalCommand(
  rawCommand: string,
  extraEnv: Record<string, string> = {}
): Promise<TerminalExecutionResult> {
  const timestamp = new Date().toISOString();
  const trimmed = rawCommand.trim();

  if (!trimmed) {
    return {
      command: '',
      output: '',
      isError: false,
      exitCode: 0,
      timestamp,
    };
  }

  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const cmd = parts[0]?.toLowerCase() || '';
  const args = parts.slice(1).map((a) => a.replace(/^["']|["']$/g, ''));

  try {
    switch (cmd) {
      case 'help': {
        const output = `AgentFlow Developer Terminal & CLI Sandbox v2.0
Available commands:
  help                         Show this help menu
  node <code> | eval <code>     Execute JavaScript/TypeScript code in isolated sandbox
  curl <url>                   Fetch web page or REST API response
  inspect <platform|domain>    Inspect official platform docs, architecture & SDK
  npm info <package>           Fetch real package info from npm registry
  date [--tz <timezone>]       Display current real-time clock and timezone
  ls | dir                     List all files in agent workspace
  cat <filepath>               Display content of a workspace file
  echo <text> > <filepath>     Create or update a workspace file
  rm <filepath>                Delete a file from workspace
  env                          Show simulated developer environment variables
  agent <prompt>               Run an autonomous ReAct AI agent task
  clear                        Clear terminal output`;
        return { command: trimmed, output, isError: false, exitCode: 0, timestamp };
      }

      case 'date': {
        const now = new Date();
        const tzArg = args[0] === '--tz' ? args[1] : undefined;
        const options: Intl.DateTimeFormatOptions = {
          timeZone: tzArg || 'Asia/Yangon',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const yangonTime = formatter.format(now);
        const utcTime = now.toUTCString();
        const iso = now.toISOString();

        const output = `Local Time (${tzArg || 'Asia/Yangon UTC+6:30'}): ${yangonTime}\nUTC Time: ${utcTime}\nISO 8601: ${iso}\nTimestamp: ${now.getTime()}`;
        return { command: trimmed, output, isError: false, exitCode: 0, timestamp };
      }

      case 'ls':
      case 'dir': {
        const files = db.getFiles();
        if (files.length === 0) {
          return { command: trimmed, output: 'Workspace is empty (/workspace/)', isError: false, exitCode: 0, timestamp };
        }
        const lines = [
          'Mode        LastWriteTime         Length Name',
          '----        -------------         ------ ----',
          ...files.map((f) => `-rw-r--r--  ${new Date(f.updatedAt).toLocaleDateString()} ${new Date(f.updatedAt).toLocaleTimeString()}   ${String(f.sizeBytes).padStart(6, ' ')} ${f.name}`),
          `\nTotal ${files.length} file(s)`,
        ];
        return { command: trimmed, output: lines.join('\n'), isError: false, exitCode: 0, timestamp };
      }

      case 'cat': {
        if (!args[0]) {
          return { command: trimmed, output: 'Usage: cat <filename>', isError: true, exitCode: 1, timestamp };
        }
        const file = db.getFile(args[0]);
        if (!file) {
          return { command: trimmed, output: `cat: ${args[0]}: No such file in /workspace/`, isError: true, exitCode: 1, timestamp };
        }
        return { command: trimmed, output: file.content, isError: false, exitCode: 0, timestamp };
      }

      case 'echo': {
        // e.g. echo "Hello" > file.txt
        const redirectIdx = args.indexOf('>');
        if (redirectIdx > 0 && args[redirectIdx + 1]) {
          const content = args.slice(0, redirectIdx).join(' ');
          const filename = args[redirectIdx + 1];
          const saved = db.saveFile(filename, content);
          return { command: trimmed, output: `Saved ${saved.sizeBytes} bytes to ${saved.path}`, isError: false, exitCode: 0, timestamp };
        }
        return { command: trimmed, output: args.join(' '), isError: false, exitCode: 0, timestamp };
      }

      case 'rm': {
        if (!args[0]) {
          return { command: trimmed, output: 'Usage: rm <filename>', isError: true, exitCode: 1, timestamp };
        }
        const deleted = db.deleteFile(args[0]);
        if (!deleted) {
          return { command: trimmed, output: `rm: cannot remove '${args[0]}': No such file`, isError: true, exitCode: 1, timestamp };
        }
        return { command: trimmed, output: `Removed /workspace/${args[0]}`, isError: false, exitCode: 0, timestamp };
      }

      case 'node':
      case 'eval': {
        const code = args.join(' ');
        if (!code) {
          return { command: trimmed, output: 'Usage: eval <javascript_code>', isError: true, exitCode: 1, timestamp };
        }
        const sandboxRes = await executeCodeInSandbox(code);
        let out = '';
        if (sandboxRes.logs.length > 0) {
          out += sandboxRes.logs.join('\n') + '\n';
        }
        if (sandboxRes.returnValue !== undefined) {
          out += `--> Return: ${typeof sandboxRes.returnValue === 'object' ? JSON.stringify(sandboxRes.returnValue, null, 2) : sandboxRes.returnValue}\n`;
        }
        if (sandboxRes.errors.length > 0) {
          out += `Error: ${sandboxRes.errors.join('\n')}\n`;
        }
        out += `(Executed in ${sandboxRes.executionTimeMs}ms)`;
        return {
          command: trimmed,
          output: out,
          isError: !sandboxRes.success,
          exitCode: sandboxRes.success ? 0 : 1,
          timestamp,
        };
      }

      case 'curl': {
        const url = args[0];
        if (!url) {
          return { command: trimmed, output: 'Usage: curl <url>', isError: true, exitCode: 1, timestamp };
        }
        const target = url.startsWith('http') ? url : `https://${url}`;
        const res = await fetch(target, {
          headers: { 'User-Agent': 'AgentFlow-Dev-Terminal/1.0' },
        });
        const contentType = res.headers.get('content-type') || '';
        const body = await res.text();
        const display = contentType.includes('json') ? JSON.stringify(JSON.parse(body), null, 2) : body.substring(0, 2000);
        return {
          command: trimmed,
          output: `HTTP/1.1 ${res.status} ${res.statusText}\nContent-Type: ${contentType}\n\n${display}${body.length > 2000 ? '\n... [truncated]' : ''}`,
          isError: !res.ok,
          exitCode: res.ok ? 0 : 1,
          timestamp,
        };
      }

      case 'inspect': {
        const target = args.join(' ');
        if (!target) {
          return { command: trimmed, output: 'Usage: inspect <platform_name | url>', isError: true, exitCode: 1, timestamp };
        }
        const info = await inspectPlatformOrUrl(target);
        const output = `=====================================================
PLATFORM INSPECTION: ${info.platformName.toUpperCase()}
=====================================================
Official URL:     ${info.url}
Official Docs:    ${info.officialDocsUrl}
Tagline:          ${info.tagline}

PURPOSE (ဘာအတွက်သုံးလဲ):
${info.purpose}

HOW IT WORKS UNDER THE HOOD (ဘယ်လိုအလုပ်လုပ်လဲ):
${info.howItWorks}

CORE ARCHITECTURE:
${info.architecture.map((a) => '  - ' + a).join('\n')}

SUPPORTED RUNTIMES & SDKs:
${info.sdkSupport.join(', ')}

FREE TIER & PRICING:
${info.freeTierInfo}

SAMPLE CODE:
${info.sampleCode}
=====================================================`;
        return { command: trimmed, output, isError: false, exitCode: 0, timestamp };
      }

      case 'npm': {
        if (args[0] === 'info' && args[1]) {
          const pkg = args[1];
          try {
            const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
            if (!res.ok) {
              return { command: trimmed, output: `npm ERR! 404 Not Found: ${pkg}`, isError: true, exitCode: 1, timestamp };
            }
            const data: any = await res.json();
            const latestVer = data['dist-tags']?.latest || 'unknown';
            const latestData = data.versions?.[latestVer] || {};
            const output = `${data.name}@${latestVer} | ${latestData.license || 'Unknown License'} | deps: ${Object.keys(latestData.dependencies || {}).length} | versions: ${Object.keys(data.versions || {}).length}
${data.description || 'No description provided.'}
Homepage: ${data.homepage || 'None'}
Dependencies: ${Object.keys(latestData.dependencies || {}).slice(0, 10).join(', ')}`;
            return { command: trimmed, output, isError: false, exitCode: 0, timestamp };
          } catch (e: any) {
            return { command: trimmed, output: `npm ERR! Network error: ${e.message}`, isError: true, exitCode: 1, timestamp };
          }
        }
        return { command: trimmed, output: 'Supported: npm info <package-name>', isError: false, exitCode: 0, timestamp };
      }

      case 'env': {
        const envOutput = `SANDBOX_ENV=isolated_vm
NODE_ENV=development
PLATFORM=linux-x64
DEV_TERMINAL=agentflow_cli_v2
WORKSPACE=/workspace
TIMESTAMP=${Date.now()}
GEMINI_MODEL=gemini-3.8-flash`;
        return { command: trimmed, output: envOutput, isError: false, exitCode: 0, timestamp };
      }

      default: {
        return {
          command: trimmed,
          output: `Command not found: "${cmd}". Type "help" for a list of available developer commands.`,
          isError: true,
          exitCode: 127,
          timestamp,
        };
      }
    }
  } catch (err: any) {
    return {
      command: trimmed,
      output: `Internal execution error: ${err.message}`,
      isError: true,
      exitCode: 1,
      timestamp,
    };
  }
}
