import fs from 'fs';
import path from 'path';

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
  logs: Array<{
    timestamp: string;
    nodeId?: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
    data?: any;
  }>;
  finalResult?: any;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  updatedAt: string;
  sizeBytes: number;
}

export interface GeneratedImageRecord {
  id: string;
  prompt: string;
  style: string;
  svgDataUrl?: string;
  imageUrl?: string;
  createdAt: string;
  dimensions: string;
}

interface DatabaseSchema {
  workflows: Workflow[];
  runs: WorkflowRun[];
  workspaceFiles: WorkspaceFile[];
  generatedImages: GeneratedImageRecord[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'autoflow_db.json');

// Initial preloaded default workflows/templates
const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_platform_inspector',
    name: 'Platform Intelligence & Architecture Scraper',
    description: 'Inspects any tech platform or official website, extracts purpose, SDK, architecture & writes report to developer sandbox.',
    category: 'Platform & Docs',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node_1',
        type: 'trigger',
        label: 'Start: Platform Input',
        config: { targetPlatform: 'Firebase', inspectMode: 'architecture' },
        position: { x: 80, y: 150 },
      },
      {
        id: 'node_2',
        type: 'platform_inspector',
        label: 'Official Platform Docs Inspector',
        config: { urlOrPlatform: '{{trigger.targetPlatform}}', deepInspection: true },
        position: { x: 380, y: 150 },
      },
      {
        id: 'node_3',
        type: 'code_sandbox',
        label: 'Developer Sandbox / Spec Generator',
        config: {
          language: 'javascript',
          code: '// Formats platform intelligence into structured markdown spec\nconst platformData = inputs.node_2;\nconst report = `# ${platformData.platformName} Technical Analysis\\n\\n**Purpose:** ${platformData.purpose}\\n\\n## Architecture\\n${platformData.architecture}\\n\\n## Official Docs\\n${platformData.officialDocsUrl}`;\nreturn { report, byteSize: report.length, generatedAt: new Date().toISOString() };',
        },
        position: { x: 700, y: 150 },
      },
      {
        id: 'node_4',
        type: 'db_sink',
        label: 'Save Report to Workspace File',
        config: { fileName: 'platform_spec.md' },
        position: { x: 1020, y: 150 },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node_1', target: 'node_2' },
      { id: 'e2-3', source: 'node_2', target: 'node_3' },
      { id: 'e3-4', source: 'node_3', target: 'node_4' },
    ],
  },
  {
    id: 'wf_agent_research_code',
    name: 'Full-Stack Agent: Search, Code & Test Sandbox',
    description: 'Autonomous ReAct Agent searches for latest libraries, runs benchmark code in sandbox, and generates visual summary.',
    category: 'Dev & AI Agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node_1',
        type: 'trigger',
        label: 'Trigger: Developer Goal',
        config: { goal: 'Compare modern high-performance TypeScript array sorting algorithms and visualize speed' },
        position: { x: 80, y: 180 },
      },
      {
        id: 'node_2',
        type: 'date_time',
        label: 'Real Date & Time Context',
        config: { timezone: 'UTC' },
        position: { x: 340, y: 80 },
      },
      {
        id: 'node_3',
        type: 'agent',
        label: 'Autonomous ReAct Agent',
        config: {
          tools: ['google_search', 'execute_code_sandbox', 'terminal_command', 'file_system'],
          systemPrompt: 'You are an elite Senior Staff Software Engineer and AI automation agent. Test your ideas in sandbox before reporting.',
        },
        position: { x: 640, y: 150 },
      },
      {
        id: 'node_4',
        type: 'image_gen',
        label: 'Generate Architecture Diagram',
        config: { style: 'minimalist modern technical blueprint', prompt: 'Modern high throughput data flow architecture diagram' },
        position: { x: 960, y: 150 },
      },
    ],
    edges: [
      { id: 'e1-3', source: 'node_1', target: 'node_3' },
      { id: 'e2-3', source: 'node_2', target: 'node_3' },
      { id: 'e3-4', source: 'node_3', target: 'node_4' },
    ],
  },
  {
    id: 'wf_live_web_digest',
    name: 'Real-Time Web Intelligence & Date Briefing',
    description: 'Queries live search for breaking technology releases, parses dates accurately, and stores summaries.',
    category: 'Intelligence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node_1',
        type: 'trigger',
        label: 'Schedule / Manual Run',
        config: { query: 'Latest major AI Agent frameworks and developer tools released this week' },
        position: { x: 80, y: 150 },
      },
      {
        id: 'node_2',
        type: 'search',
        label: 'Web Search Engine',
        config: { searchDepth: 'deep' },
        position: { x: 360, y: 150 },
      },
      {
        id: 'node_3',
        type: 'agent',
        label: 'Synthesis Agent',
        config: { tools: ['inspect_platform_or_url', 'file_system'] },
        position: { x: 660, y: 150 },
      },
      {
        id: 'node_4',
        type: 'db_sink',
        label: 'Database Store',
        config: { collection: 'weekly_briefs' },
        position: { x: 960, y: 150 },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node_1', target: 'node_2' },
      { id: 'e2-3', source: 'node_2', target: 'node_3' },
      { id: 'e3-4', source: 'node_3', target: 'node_4' },
    ],
  },
];

const DEFAULT_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    name: 'welcome.md',
    path: '/workspace/welcome.md',
    content: `# Welcome to AgentFlow Studio Workspace\n\nThis is your agent's virtual developer environment.\n\n- The AI Agent can read and write files here using tools.\n- You can open files, edit code, and run scripts in the Terminal Sandbox.\n- Supports JavaScript/TypeScript execution, platform inspection, and real-time search.\n`,
    updatedAt: new Date().toISOString(),
    sizeBytes: 320,
  },
  {
    name: 'sample_script.js',
    path: '/workspace/sample_script.js',
    content: `// Sample Sandbox Script\nconst numbers = [12, 45, 68, 23, 91, 5, 87];\nconst squaredEvens = numbers.filter(n => n % 2 === 0).map(n => n * n);\nconsole.log("Original numbers:", numbers);\nconsole.log("Squared evens:", squaredEvens);\n\nreturn {\n  count: numbers.length,\n  evenCount: squaredEvens.length,\n  sum: squaredEvens.reduce((a, b) => a + b, 0),\n  timestamp: new Date().toISOString()\n};`,
    updatedAt: new Date().toISOString(),
    sizeBytes: 380,
  },
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          workflows: parsed.workflows?.length ? parsed.workflows : DEFAULT_WORKFLOWS,
          runs: parsed.runs || [],
          workspaceFiles: parsed.workspaceFiles?.length ? parsed.workspaceFiles : DEFAULT_WORKSPACE_FILES,
          generatedImages: parsed.generatedImages || [],
        };
      }
    } catch (e) {
      console.error('Error loading database file, initializing defaults:', e);
    }

    const initial: DatabaseSchema = {
      workflows: DEFAULT_WORKFLOWS,
      runs: [],
      workspaceFiles: DEFAULT_WORKSPACE_FILES,
      generatedImages: [],
    };
    this.save(initial);
    return initial;
  }

  private save(data?: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  // Workflows
  getWorkflows(): Workflow[] {
    return this.data.workflows;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.data.workflows.find((w) => w.id === id);
  }

  saveWorkflow(workflow: Partial<Workflow> & { name: string }): Workflow {
    const now = new Date().toISOString();
    if (workflow.id) {
      const idx = this.data.workflows.findIndex((w) => w.id === workflow.id);
      if (idx >= 0) {
        const updated: Workflow = {
          ...this.data.workflows[idx],
          ...workflow,
          updatedAt: now,
        };
        this.data.workflows[idx] = updated;
        this.save();
        return updated;
      }
    }
    const newWf: Workflow = {
      id: workflow.id || 'wf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: workflow.name,
      description: workflow.description || '',
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      category: workflow.category || 'Custom',
      createdAt: now,
      updatedAt: now,
    };
    this.data.workflows.unshift(newWf);
    this.save();
    return newWf;
  }

  deleteWorkflow(id: string): boolean {
    const initLen = this.data.workflows.length;
    this.data.workflows = this.data.workflows.filter((w) => w.id !== id);
    if (this.data.workflows.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Runs
  getRuns(limit = 30): WorkflowRun[] {
    return this.data.runs.slice(0, limit);
  }

  getRun(id: string): WorkflowRun | undefined {
    return this.data.runs.find((r) => r.id === id);
  }

  saveRun(run: WorkflowRun): WorkflowRun {
    const idx = this.data.runs.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      this.data.runs[idx] = run;
    } else {
      this.data.runs.unshift(run);
      if (this.data.runs.length > 100) {
        this.data.runs.pop();
      }
    }
    this.save();
    return run;
  }

  // Files
  getFiles(): WorkspaceFile[] {
    return this.data.workspaceFiles;
  }

  getFile(pathName: string): WorkspaceFile | undefined {
    return this.data.workspaceFiles.find((f) => f.path === pathName || f.name === pathName);
  }

  saveFile(name: string, content: string, customPath?: string): WorkspaceFile {
    const filePath = customPath || (name.startsWith('/') ? name : `/workspace/${name}`);
    const fileName = path.basename(filePath);
    const now = new Date().toISOString();
    const idx = this.data.workspaceFiles.findIndex((f) => f.path === filePath);

    const record: WorkspaceFile = {
      name: fileName,
      path: filePath,
      content,
      updatedAt: now,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    };

    if (idx >= 0) {
      this.data.workspaceFiles[idx] = record;
    } else {
      this.data.workspaceFiles.push(record);
    }
    this.save();
    return record;
  }

  deleteFile(pathName: string): boolean {
    const initLen = this.data.workspaceFiles.length;
    this.data.workspaceFiles = this.data.workspaceFiles.filter((f) => f.path !== pathName && f.name !== pathName);
    if (this.data.workspaceFiles.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Images
  saveGeneratedImage(img: GeneratedImageRecord) {
    this.data.generatedImages.unshift(img);
    if (this.data.generatedImages.length > 50) {
      this.data.generatedImages.pop();
    }
    this.save();
    return img;
  }

  getGeneratedImages(): GeneratedImageRecord[] {
    return this.data.generatedImages;
  }

  // Firebase Blueprint Generator
  getFirebaseBlueprint() {
    return {
      schemaVersion: '1.0.0',
      description: 'Firebase Firestore blueprint for AgentFlow AI autonomous workflows and runs',
      collections: {
        workflows: {
          rules: 'allow read, write: if request.auth != null;',
          fields: ['name', 'description', 'nodes', 'edges', 'createdAt', 'updatedAt'],
        },
        workflow_runs: {
          rules: 'allow read, write: if request.auth != null;',
          fields: ['workflowId', 'status', 'startedAt', 'finishedAt', 'nodeOutputs', 'logs', 'finalResult'],
        },
        workspace_files: {
          rules: 'allow read, write: if request.auth != null;',
          fields: ['name', 'path', 'content', 'updatedAt', 'sizeBytes'],
        },
        generated_images: {
          rules: 'allow read, write: if request.auth != null;',
          fields: ['prompt', 'style', 'svgDataUrl', 'createdAt'],
        },
      },
      exportJson: JSON.stringify(this.data, null, 2),
    };
  }
}

export const db = new DatabaseManager();
