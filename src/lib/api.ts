import {
  AgentRunResponse,
  GeneratedImageRecord,
  PlatformInspectionResult,
  TerminalExecutionResult,
  Workflow,
  WorkflowRun,
  WorkspaceFile,
} from '../types/index.ts';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errorJson = await res.json();
      errMessage = errorJson.error || errMessage;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // System Health
  getHealth: () => request<{ status: string; apiKeyConfigured: boolean }>('/api/health'),

  // Real Date Time
  getDateTime: (tz = 'Asia/Yangon') =>
    request<{ timezone: string; formattedTime: string; utcIso: string; utcString: string; timestamp: number }>(
      `/api/tools/date-time?tz=${encodeURIComponent(tz)}`
    ),

  // Platform & Website Inspector
  inspectPlatform: (target: string) =>
    request<PlatformInspectionResult>('/api/tools/inspect-platform', {
      method: 'POST',
      body: JSON.stringify({ target }),
    }),

  // Developer Code Sandbox
  executeSandbox: (code: string, inputs?: Record<string, any>) =>
    request<{ success: boolean; returnValue: any; logs: string[]; errors: string[]; executionTimeMs: number }>(
      '/api/tools/execute-sandbox',
      {
        method: 'POST',
        body: JSON.stringify({ code, inputs }),
      }
    ),

  // Virtual CLI Terminal
  runTerminal: (command: string) =>
    request<TerminalExecutionResult>('/api/tools/run-terminal', {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),

  // Image Generation
  generateImage: (prompt: string, style?: string) =>
    request<GeneratedImageRecord>('/api/tools/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, style }),
    }),

  // Autonomous ReAct Agent Loop
  runAgent: (task: string, options?: { systemPrompt?: string; enabledTools?: string[]; maxTurns?: number }) =>
    request<AgentRunResponse>('/api/agent/run', {
      method: 'POST',
      body: JSON.stringify({ task, ...options }),
    }),

  // Workflows
  getWorkflows: () => request<Workflow[]>('/api/workflows'),
  getWorkflow: (id: string) => request<Workflow>(`/api/workflows/${id}`),
  saveWorkflow: (workflow: Partial<Workflow> & { name: string }) =>
    request<Workflow>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    }),
  deleteWorkflow: (id: string) =>
    request<{ success: boolean }>(`/api/workflows/${id}`, {
      method: 'DELETE',
    }),
  executeWorkflow: (workflow: Workflow, triggerInput?: Record<string, any>) =>
    request<WorkflowRun>('/api/workflows/execute', {
      method: 'POST',
      body: JSON.stringify({ workflow, triggerInput }),
    }),

  // Runs
  getRuns: () => request<WorkflowRun[]>('/api/runs'),
  getRun: (id: string) => request<WorkflowRun>(`/api/runs/${id}`),

  // Files
  getFiles: () => request<WorkspaceFile[]>('/api/db/files'),
  getFile: (name: string) => request<WorkspaceFile>(`/api/db/files/${encodeURIComponent(name)}`),
  saveFile: (name: string, content: string, path?: string) =>
    request<WorkspaceFile>('/api/db/files', {
      method: 'POST',
      body: JSON.stringify({ name, content, path }),
    }),
  deleteFile: (name: string) =>
    request<{ success: boolean }>(`/api/db/files/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  // Images Gallery
  getImages: () => request<GeneratedImageRecord[]>('/api/db/images'),

  // Firebase Blueprint
  getFirebaseBlueprint: () => request<any>('/api/db/firebase-blueprint'),

  // Cloudflare Workers AI Tools & Script
  getCloudflareToolSchema: (host?: string) =>
    request<{ tools: any[]; workerScript: string; baseUrl: string; description: string }>(
      `/api/cloudflare/tool-schema${host ? `?host=${encodeURIComponent(host)}` : ''}`
    ),
};
