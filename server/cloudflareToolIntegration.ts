export interface CloudflareToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const CLOUDFLARE_AI_TOOLS: CloudflareToolDefinition[] = [
  {
    name: 'execute_code_sandbox',
    description: 'Executes JavaScript or TypeScript code safely in an isolated Node.js VM sandbox with console.log capture, execution timer, and return values. Solves Cloudflare Workers limitation where Node vm is unavailable.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The JavaScript code snippet to execute. Can return values and use console.log.',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'inspect_platform_docs',
    description: 'Inspects official public platform documentation, architecture, purpose, and SDK quickstart for any tech platform (Firebase, Supabase, Cloudflare, Stripe, etc.) or any live URL.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'The platform name (e.g. "Firebase", "Supabase") or any website URL.',
        },
      },
      required: ['target'],
    },
  },
  {
    name: 'get_real_time_clock',
    description: 'Returns real-world date and time across timezones (Asia/Yangon UTC+6:30, UTC, etc.) with timestamps.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone identifier like "Asia/Yangon" or "UTC".',
        },
      },
      required: [],
    },
  },
  {
    name: 'run_agentflow_pipeline',
    description: 'Triggers a full multi-step AgentFlow automation pipeline (like Platform Scraper, Dev Benchmark, or Web Digest) and returns compiled outputs.',
    parameters: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID: "wf_platform_inspector", "wf_agent_research_code", or "wf_live_web_digest".',
        },
        input: {
          type: 'string',
          description: 'Target query or platform input to pass into the workflow.',
        },
      },
      required: ['workflowId'],
    },
  },
];

export function generateCloudflareWorkerCode(deployedHost = 'https://your-agentflow.onrender.com'): string {
  return `/**
 * Cloudflare Worker with Cloudflare Workers AI + AgentFlow AI Tools
 * Model: @cf/meta/llama-3.3-70b-instruct (or @cf/meta/llama-3.1-8b-instruct)
 * 
 * Cloudflare Workers at the edge calls AgentFlow (on Render) as external tools
 * to execute code in Node sandbox, inspect platform docs, and run workflows!
 */

export interface Env {
  AI: any; // Cloudflare Workers AI binding
  AGENTFLOW_HOST: string; // e.g. "${deployedHost}"
}

// 1. Tool definitions for Cloudflare Workers AI
const AGENTFLOW_TOOLS = ${JSON.stringify(CLOUDFLARE_AI_TOOLS, null, 2)};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const agentflowHost = env.AGENTFLOW_HOST || "${deployedHost}";

    // Handle user prompt (e.g. GET /?q=Inspect+Supabase+and+test+code)
    const userQuery = url.searchParams.get("q") || "Inspect Supabase architecture and run test code in sandbox";

    // Step 1: Call Cloudflare Workers AI model with AgentFlow tools
    const aiResponse: any = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are an AI assistant deployed on Cloudflare Workers edge. You have access to external developer tools hosted on AgentFlow AI."
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      tools: AGENTFLOW_TOOLS,
    });

    // Step 2: Check if Cloudflare AI invoked an AgentFlow tool
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      const toolCall = aiResponse.tool_calls[0];
      let toolResult: any = null;

      // Tool: Execute Code in Sandbox
      if (toolCall.name === "execute_code_sandbox") {
        const res = await fetch(\`\${agentflowHost}/api/tools/execute-sandbox\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: toolCall.arguments.code }),
        });
        toolResult = await res.json();
      }

      // Tool: Inspect Platform Docs
      else if (toolCall.name === "inspect_platform_docs") {
        const res = await fetch(\`\${agentflowHost}/api/tools/inspect-platform\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: toolCall.arguments.target }),
        });
        toolResult = await res.json();
      }

      // Tool: Run AgentFlow Pipeline
      else if (toolCall.name === "run_agentflow_pipeline") {
        const res = await fetch(\`\${agentflowHost}/api/agent/run\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: \`Run workflow \${toolCall.arguments.workflowId} with input \${toolCall.arguments.input}\`
          }),
        });
        toolResult = await res.json();
      }

      // Return combined response from Cloudflare AI + AgentFlow tool execution
      return new Response(JSON.stringify({
        status: "success",
        poweredBy: "Cloudflare Workers AI + AgentFlow AI Tool",
        model: "@cf/meta/llama-3.3-70b-instruct",
        toolInvoked: toolCall.name,
        toolArguments: toolCall.arguments,
        toolExecutionResult: toolResult
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default text response if no tool was called
    return new Response(JSON.stringify(aiResponse, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
};`;
}
