export type ActiveTab = 'canvas' | 'agent' | 'platform' | 'dev_studio' | 'image_studio' | 'database';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'search' | 'platform_inspector' | 'code_sandbox' | 'image_gen' | 'date_time' | 'condition' | 'db_sink';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
  createdAt: string;
  category: string;
}

export interface WorkflowRunLog {
  timestamp: string;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
}

export interface WorkflowRun {
  id: string;
  workflowId?: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  triggerInput?: any;
  nodeOutputs: Record<string, any>;
  logs: WorkflowRunLog[];
  finalResult?: any;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  updatedAt: string;
  sizeBytes: number;
}

export interface PlatformInspectionResult {
  platformName: string;
  url: string;
  tagline: string;
  purpose: string;
  howItWorks: string;
  architecture: string[];
  keyFeatures: string[];
  sdkSupport: string[];
  freeTierInfo: string;
  officialDocsUrl: string;
  sampleCode: string;
  inspectedAt: string;
  source: 'live_web' | 'official_spec_cache';
}

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

export interface GeneratedImageRecord {
  id: string;
  prompt: string;
  style: string;
  imageUrl?: string;
  svgDataUrl?: string;
  createdAt: string;
  dimensions: string;
}

export interface TerminalExecutionResult {
  command: string;
  output: string;
  isError: boolean;
  exitCode: number;
  timestamp: string;
}
