import { db, Workflow, WorkflowNode, WorkflowRun } from './database.js';
import { runAgentTask } from './agentRunner.js';
import { inspectPlatformOrUrl } from './platformInspector.js';
import { executeCodeInSandbox } from './sandboxExecutor.js';
import { generateAgentImage } from './imageGenerator.js';
import { getGeminiClient } from './geminiClient.js';

export async function executeWorkflow(workflow: Workflow, initialTriggerData: Record<string, any> = {}): Promise<WorkflowRun> {
  const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const startTime = Date.now();

  const runRecord: WorkflowRun = {
    id: runId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: 'running',
    startedAt: new Date().toISOString(),
    triggerInput: initialTriggerData,
    nodeOutputs: {},
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Starting workflow "${workflow.name}" (${workflow.nodes.length} nodes, ${workflow.edges.length} edges)`,
      },
    ],
  };

  db.saveRun(runRecord);

  // Helper to resolve template variables like {{trigger.query}} or {{node_1.returnValue}}
  const resolveTemplate = (text: string, currentOutputs: Record<string, any>): string => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, pathExpr) => {
      const parts = pathExpr.split('.');
      let current: any = { trigger: initialTriggerData, ...currentOutputs };
      for (const p of parts) {
        if (current === undefined || current === null) return '';
        current = current[p];
      }
      return typeof current === 'object' ? JSON.stringify(current) : String(current ?? '');
    });
  };

  // Topological sorting of nodes based on edges
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const node of workflow.nodes) {
    inDegree[node.id] = 0;
    adj[node.id] = [];
  }

  for (const edge of workflow.edges) {
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    }
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
    }
  }

  // Queue of nodes ready to execute (in-degree 0)
  const queue: string[] = workflow.nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const executionOrder: string[] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    executionOrder.push(curr);
    for (const neighbor of adj[curr] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If there are unvisited nodes (cycles or disconnected), append them
  for (const node of workflow.nodes) {
    if (!executionOrder.includes(node.id)) {
      executionOrder.push(node.id);
    }
  }

  // Execute nodes in sequence
  let finalResult: any = null;

  try {
    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      runRecord.logs.push({
        timestamp: new Date().toISOString(),
        nodeId: node.id,
        level: 'info',
        message: `Executing node [${node.label}] (${node.type})`,
      });

      // Gather input data from predecessor nodes
      const incomingEdges = workflow.edges.filter((e) => e.target === node.id);
      const incomingOutputs: Record<string, any> = {};
      for (const edge of incomingEdges) {
        incomingOutputs[edge.source] = runRecord.nodeOutputs[edge.source];
      }

      let output: any = null;

      switch (node.type) {
        case 'trigger': {
          output = {
            ...node.config,
            ...initialTriggerData,
            triggeredAt: new Date().toISOString(),
          };
          break;
        }

        case 'date_time': {
          const tz = node.config?.timezone || 'Asia/Yangon';
          const now = new Date();
          output = {
            timezone: tz,
            formatted: new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              dateStyle: 'full',
              timeStyle: 'medium',
            }).format(now),
            iso: now.toISOString(),
            timestamp: now.getTime(),
          };
          break;
        }

        case 'platform_inspector': {
          const targetRaw = node.config?.urlOrPlatform || node.config?.target || 'Firebase';
          const resolvedTarget = resolveTemplate(targetRaw, runRecord.nodeOutputs);
          output = await inspectPlatformOrUrl(resolvedTarget);
          break;
        }

        case 'search': {
          const queryRaw = node.config?.query || initialTriggerData.query || 'Latest tech updates';
          const resolvedQuery = resolveTemplate(queryRaw, runRecord.nodeOutputs);
          const ai = getGeminiClient();
          const searchRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Conduct a thorough web knowledge query on: "${resolvedQuery}". Provide key takeaways, dates, official platform insights.`,
          });
          output = {
            query: resolvedQuery,
            summary: searchRes.text,
            searchedAt: new Date().toISOString(),
          };
          break;
        }

        case 'code_sandbox': {
          const code = node.config?.code || 'return { status: "ok" };';
          output = await executeCodeInSandbox(code, {
            ...incomingOutputs,
            trigger: initialTriggerData,
          });
          break;
        }

        case 'image_gen': {
          const promptRaw = node.config?.prompt || 'Modern futuristic AI agent automation network diagram';
          const resolvedPrompt = resolveTemplate(promptRaw, runRecord.nodeOutputs);
          const style = node.config?.style || 'clean technical illustration';
          output = await generateAgentImage(resolvedPrompt, style);
          break;
        }

        case 'agent': {
          const taskRaw = node.config?.goal || node.config?.task || initialTriggerData.goal || 'Synthesize findings and create report';
          const resolvedTask = resolveTemplate(taskRaw, runRecord.nodeOutputs);
          const agentRes = await runAgentTask({
            task: `${resolvedTask}\nContext from workflow:\n${JSON.stringify(incomingOutputs, null, 2)}`,
            systemPrompt: node.config?.systemPrompt,
            enabledTools: node.config?.tools || ['all'],
            maxTurns: node.config?.maxTurns || 5,
          });
          output = agentRes;
          break;
        }

        case 'db_sink': {
          const fileName = resolveTemplate(node.config?.fileName || 'workflow_output.json', runRecord.nodeOutputs);
          const contentToSave = typeof incomingOutputs === 'object' ? JSON.stringify(incomingOutputs, null, 2) : String(incomingOutputs);
          const savedFile = db.saveFile(fileName, contentToSave);
          output = { savedFile, path: savedFile.path, sizeBytes: savedFile.sizeBytes };
          break;
        }

        case 'condition': {
          const conditionExpr = node.config?.expression || 'true';
          const evaluated = Boolean(eval(resolveTemplate(conditionExpr, runRecord.nodeOutputs)));
          output = { passed: evaluated };
          break;
        }

        default:
          output = { message: `Completed node ${node.id}` };
      }

      runRecord.nodeOutputs[node.id] = output;
      finalResult = output;

      runRecord.logs.push({
        timestamp: new Date().toISOString(),
        nodeId: node.id,
        level: 'success',
        message: `Node [${node.label}] finished successfully`,
        data: typeof output === 'object' ? Object.keys(output) : undefined,
      });

      // Update in db
      db.saveRun(runRecord);
    }

    runRecord.status = 'completed';
    runRecord.finishedAt = new Date().toISOString();
    runRecord.durationMs = Date.now() - startTime;
    runRecord.finalResult = finalResult;
    db.saveRun(runRecord);

    return runRecord;
  } catch (err: any) {
    runRecord.status = 'failed';
    runRecord.finishedAt = new Date().toISOString();
    runRecord.durationMs = Date.now() - startTime;
    runRecord.logs.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Workflow failed: ${err.message}`,
    });
    db.saveRun(runRecord);
    return runRecord;
  }
}
