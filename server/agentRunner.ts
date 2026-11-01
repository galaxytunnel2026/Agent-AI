import { FunctionDeclaration, Type } from '@google/genai';
import { getGeminiClient } from './geminiClient.js';
import { inspectPlatformOrUrl } from './platformInspector.js';
import { executeCodeInSandbox, executeTerminalCommand } from './sandboxExecutor.js';
import { generateAgentImage } from './imageGenerator.js';
import { db } from './database.js';

export interface AgentExecutionStep {
  stepIndex: number;
  type: 'thought' | 'tool_call' | 'tool_result' | 'final_answer';
  message: string;
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  timestamp: string;
}

export interface AgentRunResponse {
  finalAnswer: string;
  steps: AgentExecutionStep[];
  toolsUsed: string[];
  executionTimeMs: number;
  filesModified: string[];
  imagesGenerated: string[];
}

// 1. Tool Declaration: Web Search Grounding / Query
const searchDeclaration: FunctionDeclaration = {
  name: 'google_search',
  description: 'Search the live web for up-to-date facts, technology news, documentation, or public data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query to look up on the web.',
      },
    },
    required: ['query'],
  },
};

// 2. Tool Declaration: Platform & URL Inspector
const platformInspectorDeclaration: FunctionDeclaration = {
  name: 'inspect_platform_or_url',
  description: 'Inspects public official platform documentation or any live website. Returns purpose (what it is used for), how it works under the hood, architecture, SDKs, and free tier.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target: {
        type: Type.STRING,
        description: 'The name of the platform (e.g. Firebase, Supabase, Cloudflare Workers) or full URL to inspect.',
      },
    },
    required: ['target'],
  },
};

// 3. Tool Declaration: Real Date & Time
const dateTimeDeclaration: FunctionDeclaration = {
  name: 'get_real_date_time',
  description: 'Returns real current date and time in UTC, Myanmar (Asia/Yangon), or custom timezone with timestamps.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      timezone: {
        type: Type.STRING,
        description: 'Optional timezone like Asia/Yangon, UTC, America/New_York, or Asia/Tokyo.',
      },
    },
  },
};

// 4. Tool Declaration: Developer Code Sandbox
const codeSandboxDeclaration: FunctionDeclaration = {
  name: 'execute_code_sandbox',
  description: 'Executes JavaScript or TypeScript code in a safe developer sandbox with access to Math, Date, regex, and workspace filesystem.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: 'The JavaScript code to execute. Can return values and use console.log().',
      },
      reason: {
        type: Type.STRING,
        description: 'Short reason for running this code.',
      },
    },
    required: ['code'],
  },
};

// 5. Tool Declaration: Terminal Command Runner
const terminalDeclaration: FunctionDeclaration = {
  name: 'run_terminal_command',
  description: 'Executes a developer CLI terminal command such as npm info <pkg>, curl <url>, date, ls, cat <file>, echo <txt> > <file>, or env.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: 'The shell command to run (e.g. "npm info @google/genai", "cat welcome.md", "ls").',
      },
    },
    required: ['command'],
  },
};

// 6. Tool Declaration: File System
const fileSystemDeclaration: FunctionDeclaration = {
  name: 'file_system_action',
  description: 'Read, write, list, or delete files in the agent developer workspace /workspace/.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'Action: read, write, list, or delete',
      },
      filePath: {
        type: Type.STRING,
        description: 'File path, e.g. "output.json" or "/workspace/report.md"',
      },
      content: {
        type: Type.STRING,
        description: 'Content to write if action is write',
      },
    },
    required: ['action'],
  },
};

// 7. Tool Declaration: Image Generation
const imageGenDeclaration: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generates high quality visual graphics, system diagrams, or illustrations based on a descriptive prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'Detailed visual prompt describing the image, diagram, or UI mockup.',
      },
      style: {
        type: Type.STRING,
        description: 'Visual style, e.g. "clean technical blueprint", "modern vector UI", "isometric diagram".',
      },
    },
    required: ['prompt'],
  },
};

// 8. Tool Declaration: Workflow-as-a-Tool (AgentFlow Pipeline Runner)
const workflowAsToolDeclaration: FunctionDeclaration = {
  name: 'run_agentflow_workflow',
  description: 'Executes an entire pre-built AgentFlow pipeline workflow (like Platform Intelligence Scraper, Full-stack dev runner, or Web digest) as a tool and returns the structured pipeline results.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      workflowId: {
        type: Type.STRING,
        description: 'Workflow ID to trigger: "wf_platform_inspector", "wf_agent_research_code", or "wf_live_web_digest".',
      },
      input: {
        type: Type.STRING,
        description: 'Input goal, target platform, or query for the workflow pipeline.',
      },
    },
    required: ['workflowId'],
  },
};

const ALL_TOOL_DECLARATIONS = [
  searchDeclaration,
  platformInspectorDeclaration,
  dateTimeDeclaration,
  codeSandboxDeclaration,
  terminalDeclaration,
  fileSystemDeclaration,
  imageGenDeclaration,
  workflowAsToolDeclaration,
];

export async function runAgentTask(params: {
  task: string;
  systemPrompt?: string;
  enabledTools?: string[];
  maxTurns?: number;
}): Promise<AgentRunResponse> {
  const startTime = Date.now();
  const steps: AgentExecutionStep[] = [];
  const toolsUsedSet = new Set<string>();
  const filesModified: string[] = [];
  const imagesGenerated: string[] = [];
  const maxTurns = params.maxTurns || 5;

  const ai = getGeminiClient();

  // Filter tools if enabledTools provided
  let activeToolDeclarations = ALL_TOOL_DECLARATIONS;
  if (params.enabledTools && params.enabledTools.length > 0) {
    activeToolDeclarations = ALL_TOOL_DECLARATIONS.filter((t) =>
      params.enabledTools!.includes(t.name || '') || params.enabledTools!.includes('all')
    );
  }

  // Real date & time injection
  const realDateNow = new Date();
  const yangonTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Yangon',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(realDateNow);

  const baseSystemInstruction = `${params.systemPrompt || 'You are AgentFlow, an autonomous Senior AI Engineer & Autoflow Agent.'}
Current real-world time context:
- Server Date/Time (UTC): ${realDateNow.toUTCString()}
- Local Myanmar Time (Asia/Yangon, UTC+6:30): ${yangonTime}
- Unix Timestamp: ${realDateNow.getTime()}

Core Instructions:
1. You have autonomous developer abilities: Web Search, Platform/Docs Inspector, Code Sandbox, Virtual CLI Terminal, File System, Image Generation, and Real Date/Time.
2. For questions asking about what a platform is for or how it works (e.g. Firebase, Supabase, Cloudflare, or any URL), use 'inspect_platform_or_url'.
3. For calculations, code testing, or data manipulation, use 'execute_code_sandbox' or 'run_terminal_command'.
4. For current dates or schedules, use real-time date knowledge.
5. Provide clear, professional, thorough answers. Respond in the user's language (Burmese or English).`;

  // Initialize conversation
  const contents: any[] = [
    {
      role: 'user',
      parts: [{ text: params.task }],
    },
  ];

  steps.push({
    stepIndex: steps.length + 1,
    type: 'thought',
    message: `Initialized autonomous task: "${params.task.slice(0, 100)}${params.task.length > 100 ? '...' : ''}" with ${activeToolDeclarations.length} tools enabled.`,
    timestamp: new Date().toISOString(),
  });

  let turn = 0;
  let finalAnswer = '';

  while (turn < maxTurns) {
    turn++;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: baseSystemInstruction,
          tools: [{ functionDeclarations: activeToolDeclarations }],
        },
      });

      const candidate = response.candidates?.[0];
      const content = candidate?.content;

      if (!content) {
        finalAnswer = response.text || 'Task completed.';
        break;
      }

      // Check for function calls
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        // Model chose to call tools
        contents.push(content);

        for (const call of functionCalls) {
          const toolCallName = call.name || 'unknown_tool';
          toolsUsedSet.add(toolCallName);
          steps.push({
            stepIndex: steps.length + 1,
            type: 'tool_call',
            message: `Invoking tool: ${toolCallName}`,
            toolName: toolCallName,
            toolArgs: call.args,
            timestamp: new Date().toISOString(),
          });

          // Execute tool logic
          let toolResult: any = null;
          try {
            switch (call.name) {
              case 'google_search': {
                const query = String(call.args?.query || '');
                // Live search synthesis
                const searchRes = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: `Perform a search lookup for query: "${query}". Provide the latest, factual information with key points.`,
                });
                toolResult = {
                  query,
                  results: searchRes.text || 'No relevant results found.',
                  searchedAt: new Date().toISOString(),
                };
                break;
              }

              case 'inspect_platform_or_url': {
                const target = String(call.args?.target || '');
                const info = await inspectPlatformOrUrl(target);
                toolResult = info;
                break;
              }

              case 'get_real_date_time': {
                const tz = String(call.args?.timezone || 'Asia/Yangon');
                const now = new Date();
                const formatted = new Intl.DateTimeFormat('en-US', {
                  timeZone: tz,
                  dateStyle: 'full',
                  timeStyle: 'medium',
                }).format(now);
                toolResult = {
                  timezone: tz,
                  formatted,
                  utcString: now.toUTCString(),
                  iso: now.toISOString(),
                  timestamp: now.getTime(),
                };
                break;
              }

              case 'execute_code_sandbox': {
                const code = String(call.args?.code || '');
                const sandRes = await executeCodeInSandbox(code);
                toolResult = sandRes;
                break;
              }

              case 'run_terminal_command': {
                const cmd = String(call.args?.command || '');
                const termRes = await executeTerminalCommand(cmd);
                toolResult = termRes;
                break;
              }

              case 'file_system_action': {
                const action = String(call.args?.action || 'list');
                const filePath = String(call.args?.filePath || '');
                const contentStr = String(call.args?.content || '');

                if (action === 'read') {
                  const f = db.getFile(filePath);
                  toolResult = f ? { found: true, content: f.content, path: f.path } : { found: false, error: 'File not found' };
                } else if (action === 'write') {
                  const saved = db.saveFile(filePath, contentStr);
                  filesModified.push(saved.path);
                  toolResult = { success: true, path: saved.path, sizeBytes: saved.sizeBytes };
                } else if (action === 'list') {
                  toolResult = { files: db.getFiles().map((f) => ({ name: f.name, path: f.path, sizeBytes: f.sizeBytes })) };
                } else if (action === 'delete') {
                  const del = db.deleteFile(filePath);
                  toolResult = { success: del };
                }
                break;
              }

              case 'generate_image': {
                const prompt = String(call.args?.prompt || '');
                const style = String(call.args?.style || 'modern technical illustration');
                const img = await generateAgentImage(prompt, style);
                imagesGenerated.push(img.imageUrl || img.svgDataUrl || '');
                toolResult = {
                  success: true,
                  id: img.id,
                  prompt: img.prompt,
                  url: img.imageUrl,
                  hasSvg: Boolean(img.svgDataUrl),
                };
                break;
              }

              case 'run_agentflow_workflow': {
                const wfId = String(call.args?.workflowId || 'wf_platform_inspector');
                const inputArg = String(call.args?.input || 'Firebase');
                const wf = db.getWorkflow(wfId) || db.getWorkflows()[0];
                if (wf) {
                  const { executeWorkflow } = await import('./workflowEngine.js');
                  const runResult = await executeWorkflow(wf, {
                    targetPlatform: inputArg,
                    query: inputArg,
                    goal: inputArg,
                  });
                  toolResult = {
                    workflowName: wf.name,
                    status: runResult.status,
                    durationMs: runResult.durationMs,
                    pipelineOutputs: runResult.nodeOutputs,
                    finalResult: runResult.finalResult,
                  };
                } else {
                  toolResult = { error: `Workflow not found: ${wfId}` };
                }
                break;
              }

              default:
                toolResult = { error: `Unknown tool: ${call.name}` };
            }
          } catch (toolErr: any) {
            toolResult = { error: toolErr.message || String(toolErr) };
          }

          steps.push({
            stepIndex: steps.length + 1,
            type: 'tool_result',
            message: `Tool ${call.name} executed`,
            toolName: call.name,
            toolResult,
            timestamp: new Date().toISOString(),
          });

          // Send functionResponse back to model
          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  id: call.id,
                  name: call.name,
                  response: { result: toolResult },
                },
              },
            ],
          });
        }
      } else {
        // Model provided final answer
        finalAnswer = response.text || '';
        steps.push({
          stepIndex: steps.length + 1,
          type: 'final_answer',
          message: 'Agent completed reasoning and provided final response.',
          timestamp: new Date().toISOString(),
        });
        break;
      }
    } catch (loopErr: any) {
      console.error('Agent execution loop error:', loopErr);
      finalAnswer = `Agent encountered error: ${loopErr.message}`;
      steps.push({
        stepIndex: steps.length + 1,
        type: 'thought',
        message: `Execution halted with error: ${loopErr.message}`,
        timestamp: new Date().toISOString(),
      });
      break;
    }
  }

  return {
    finalAnswer: finalAnswer || 'Task completed successfully.',
    steps,
    toolsUsed: Array.from(toolsUsedSet),
    executionTimeMs: Date.now() - startTime,
    filesModified,
    imagesGenerated,
  };
}
