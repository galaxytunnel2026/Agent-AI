import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, Workflow } from './server/database.js';
import { runAgentTask } from './server/agentRunner.js';
import { executeWorkflow } from './server/workflowEngine.js';
import { inspectPlatformOrUrl } from './server/platformInspector.js';
import { executeCodeInSandbox, executeTerminalCommand } from './server/sandboxExecutor.js';
import { generateAgentImage } from './server/imageGenerator.js';
import { CLOUDFLARE_AI_TOOLS, generateCloudflareWorkerCode } from './server/cloudflareToolIntegration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '15mb' }));

  // --- API Routes ---

  // Health & System Info
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'AgentFlow AI Studio',
      timestamp: new Date().toISOString(),
      apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Real Date & Time API
  app.get('/api/tools/date-time', (req: Request, res: Response) => {
    const tz = (req.query.tz as string) || 'Asia/Yangon';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    res.json({
      timezone: tz,
      formattedTime: formatter.format(now),
      utcIso: now.toISOString(),
      utcString: now.toUTCString(),
      timestamp: now.getTime(),
      serverUptimeSec: process.uptime(),
    });
  });

  // Platform & Website Inspector (Official specs, how it works, purpose)
  app.post('/api/tools/inspect-platform', async (req: Request, res: Response) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ error: 'Missing target platform name or website URL' });
      }
      const result = await inspectPlatformOrUrl(target);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Platform inspection failed' });
    }
  });

  // Developer Code Sandbox Execution
  app.post('/api/tools/execute-sandbox', async (req: Request, res: Response) => {
    try {
      const { code, inputs } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'No code provided to execute' });
      }
      const result = await executeCodeInSandbox(code, inputs || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Sandbox execution failed' });
    }
  });

  // Virtual CLI Terminal Command Runner
  app.post('/api/tools/run-terminal', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      if (typeof command !== 'string') {
        return res.status(400).json({ error: 'Command string required' });
      }
      const result = await executeTerminalCommand(command);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Terminal execution error' });
    }
  });

  // Image Generation API
  app.post('/api/tools/generate-image', async (req: Request, res: Response) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Image prompt required' });
      }
      const result = await generateAgentImage(prompt, style || 'clean modern tech diagram');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Image generation failed' });
    }
  });

  // Autonomous ReAct Agent Execution
  app.post('/api/agent/run', async (req: Request, res: Response) => {
    try {
      const { task, systemPrompt, enabledTools, maxTurns } = req.body;
      if (!task) {
        return res.status(400).json({ error: 'Task description required' });
      }
      const result = await runAgentTask({
        task,
        systemPrompt,
        enabledTools,
        maxTurns,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Agent execution failed' });
    }
  });

  // Workflow CRUD & Execution
  app.get('/api/workflows', (req: Request, res: Response) => {
    res.json(db.getWorkflows());
  });

  app.get('/api/workflows/:id', (req: Request, res: Response) => {
    const wf = db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  });

  app.post('/api/workflows', (req: Request, res: Response) => {
    const { name, description, nodes, edges, category, id } = req.body;
    if (!name) return res.status(400).json({ error: 'Workflow name required' });
    const saved = db.saveWorkflow({ id, name, description, nodes, edges, category });
    res.json(saved);
  });

  app.delete('/api/workflows/:id', (req: Request, res: Response) => {
    const deleted = db.deleteWorkflow(req.params.id);
    res.json({ success: deleted });
  });

  app.post('/api/workflows/execute', async (req: Request, res: Response) => {
    try {
      const { workflow, triggerInput } = req.body;
      if (!workflow || !workflow.nodes) {
        return res.status(400).json({ error: 'Valid workflow structure required' });
      }
      const run = await executeWorkflow(workflow as Workflow, triggerInput || {});
      res.json(run);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Workflow execution failed' });
    }
  });

  // Runs
  app.get('/api/runs', (req: Request, res: Response) => {
    res.json(db.getRuns());
  });

  app.get('/api/runs/:id', (req: Request, res: Response) => {
    const run = db.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  });

  // Files in Workspace
  app.get('/api/db/files', (req: Request, res: Response) => {
    res.json(db.getFiles());
  });

  app.get('/api/db/files/:name', (req: Request, res: Response) => {
    const file = db.getFile(req.params.name);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  });

  app.post('/api/db/files', (req: Request, res: Response) => {
    const { name, content, path: filePath } = req.body;
    if (!name || content === undefined) {
      return res.status(400).json({ error: 'File name and content required' });
    }
    const saved = db.saveFile(name, content, filePath);
    res.json(saved);
  });

  app.delete('/api/db/files/:name', (req: Request, res: Response) => {
    const deleted = db.deleteFile(req.params.name);
    res.json({ success: deleted });
  });

  // Images Gallery
  app.get('/api/db/images', (req: Request, res: Response) => {
    res.json(db.getGeneratedImages());
  });

  // Firebase Blueprint & DB export
  app.get('/api/db/firebase-blueprint', (req: Request, res: Response) => {
    res.json(db.getFirebaseBlueprint());
  });

  // Cloudflare Workers AI Tool Schema & Integration Code
  app.get('/api/cloudflare/tool-schema', (req: Request, res: Response) => {
    const rawHost = (req.query.host as string) || (req.protocol + '://' + req.get('host'));
    res.json({
      tools: CLOUDFLARE_AI_TOOLS,
      workerScript: generateCloudflareWorkerCode(rawHost),
      baseUrl: rawHost,
      description: 'Cloudflare Workers AI tool bindings for AgentFlow AI edge execution',
    });
  });

  // --- Vite Dev Server Middleware or Static Production Serving ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentFlow Studio server active on port ${PORT}`);
  });
}

startServer();
