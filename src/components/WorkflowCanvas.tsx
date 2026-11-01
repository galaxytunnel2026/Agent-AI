import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Bot,
  Search,
  Globe,
  Terminal,
  Image,
  Clock,
  GitBranch,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Code,
  FileText,
  Sliders,
  ChevronDown,
  LayoutGrid,
  ListOrdered,
  ArrowDown,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowRun } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { Language, translations } from '../lib/translations.ts';

interface WorkflowCanvasProps {
  lang: Language;
  onExecutionComplete?: (run: WorkflowRun) => void;
}

const NODE_TYPE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; border: string; bg: string }
> = {
  trigger: { label: 'Trigger / Goal', icon: Play, color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-950/20' },
  agent: { label: 'Autonomous ReAct Agent', icon: Bot, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-950/20' },
  search: { label: 'Live Web Search', icon: Search, color: 'text-sky-400', border: 'border-sky-500/50', bg: 'bg-sky-950/20' },
  platform_inspector: { label: 'Platform & Docs Inspector', icon: Globe, color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/20' },
  code_sandbox: { label: 'Developer Code Sandbox', icon: Terminal, color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/20' },
  image_gen: { label: 'AI Visual / Diagram Gen', icon: Image, color: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-950/20' },
  date_time: { label: 'Real Date & Time Engine', icon: Clock, color: 'text-teal-400', border: 'border-teal-500/50', bg: 'bg-teal-950/20' },
  condition: { label: 'Condition & Branch', icon: GitBranch, color: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/20' },
  db_sink: { label: 'Save to Workspace / DB', icon: Database, color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-950/20' },
};

export function WorkflowCanvas({ lang, onExecutionComplete }: WorkflowCanvasProps) {
  const t = translations[lang];

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRun, setCurrentRun] = useState<WorkflowRun | null>(null);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Mobile View Mode: 'list' (step-by-step pipeline) or 'canvas' (2D visual coordinate plane)
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [showAddModal, setShowAddModal] = useState(false);

  // Dragging nodes state (mouse + touch)
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Detect mobile screen on initial mount and set viewMode to list if mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setViewMode('list');
    }
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const list = await api.getWorkflows();
      setWorkflows(list);
      if (list.length > 0 && !activeWorkflow) {
        setActiveWorkflow(list[0]);
      }
    } catch (e: any) {
      console.error('Failed to load workflows:', e);
    }
  };

  const handleSelectWorkflow = (wf: Workflow) => {
    setActiveWorkflow(wf);
    setSelectedNodeId(null);
    setCurrentRun(null);
    setActiveExecutingNodeId(null);
  };

  const handleCreateNewWorkflow = () => {
    const newWf: Workflow = {
      id: 'wf_' + Date.now(),
      name: 'Custom AI Autoflow',
      description: 'Custom multi-step autonomous agent workflow',
      category: 'Custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node_1',
          type: 'trigger',
          label: 'Trigger Input',
          config: { query: 'Analyze Firebase vs Supabase architecture' },
          position: { x: 80, y: 160 },
        },
        {
          id: 'node_2',
          type: 'platform_inspector',
          label: 'Inspect Platform',
          config: { urlOrPlatform: 'Firebase' },
          position: { x: 380, y: 160 },
        },
        {
          id: 'node_3',
          type: 'code_sandbox',
          label: 'Developer Sandbox',
          config: {
            code: '// Extract platform summary\nconst data = inputs.node_2;\nreturn { name: data.platformName, purpose: data.purpose };',
          },
          position: { x: 680, y: 160 },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'node_1', target: 'node_2' },
        { id: 'e2-3', source: 'node_2', target: 'node_3' },
      ],
    };
    setActiveWorkflow(newWf);
    setSelectedNodeId('node_1');
  };

  const handleSaveWorkflow = async () => {
    if (!activeWorkflow) return;
    try {
      const saved = await api.saveWorkflow(activeWorkflow);
      setActiveWorkflow(saved);
      loadWorkflows();
      setStatusMessage(lang === 'my' ? 'သိမ်းဆည်းပြီးပါပြီ!' : 'Workflow saved!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    }
  };

  // Node Dragging logic (Mouse & Touch)
  const handleMouseDownNode = (clientX: number, clientY: number, nodeId: string) => {
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = activeWorkflow?.nodes.find((n) => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: clientX - node.position.x,
        y: clientY - node.position.y,
      });
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggingNodeId || !activeWorkflow) return;
    const newX = Math.max(20, Math.min(1800, clientX - dragOffset.x));
    const newY = Math.max(20, Math.min(1200, clientY - dragOffset.y));

    setActiveWorkflow({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.map((node) =>
        node.id === draggingNodeId ? { ...node, position: { x: newX, y: newY } } : node
      ),
    });
  };

  // Add Node
  const handleAddNode = (type: WorkflowNode['type']) => {
    if (!activeWorkflow) return;
    const newId = 'node_' + (activeWorkflow.nodes.length + 1) + '_' + Math.random().toString(36).substring(2, 5);
    const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 300 : 100;
    const newY = lastNode ? lastNode.position.y : 150;

    const defaultConfigs: Record<WorkflowNode['type'], any> = {
      trigger: { goal: 'Execute automated task' },
      agent: { goal: 'Process data and synthesize findings', tools: ['all'] },
      search: { query: 'Latest developer news and platform releases' },
      platform_inspector: { urlOrPlatform: 'Cloudflare Workers' },
      code_sandbox: { code: '// Process input\nreturn { processed: true, at: new Date().toISOString() };' },
      image_gen: { prompt: 'High performance cloud architecture topology diagram' },
      date_time: { timezone: 'Asia/Yangon' },
      condition: { expression: 'true' },
      db_sink: { fileName: 'output_' + Date.now() + '.json' },
    };

    const newNode: WorkflowNode = {
      id: newId,
      type,
      label: NODE_TYPE_META[type]?.label || type,
      config: defaultConfigs[type] || {},
      position: { x: newX, y: newY },
    };

    // Auto-connect to last node if exists
    const newEdges = [...activeWorkflow.edges];
    if (lastNode) {
      newEdges.push({
        id: `e_${lastNode.id}_${newId}`,
        source: lastNode.id,
        target: newId,
      });
    }

    setActiveWorkflow({
      ...activeWorkflow,
      nodes: [...activeWorkflow.nodes, newNode],
      edges: newEdges,
    });
    setSelectedNodeId(newId);
    setShowAddModal(false);
  };

  // Delete Selected Node
  const handleDeleteNode = (nodeId: string) => {
    if (!activeWorkflow) return;
    setActiveWorkflow({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.filter((n) => n.id !== nodeId),
      edges: activeWorkflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Run Workflow
  const handleRunWorkflow = async () => {
    if (!activeWorkflow || isExecuting) return;
    setIsExecuting(true);
    setCurrentRun(null);
    setStatusMessage(lang === 'my' ? 'စတင်မောင်းနှင်နေသည်...' : 'Starting execution...');

    // Simulate node execution highlight step-by-step
    for (const node of activeWorkflow.nodes) {
      setActiveExecutingNodeId(node.id);
      await new Promise((res) => setTimeout(res, 400));
    }

    try {
      const run = await api.executeWorkflow(activeWorkflow, {
        triggeredBy: 'AgentFlow UI Studio',
        timestamp: new Date().toISOString(),
      });
      setCurrentRun(run);
      setActiveExecutingNodeId(null);
      setIsExecuting(false);
      setStatusMessage(lang === 'my' ? 'အောင်မြင်စွာ ပြီးဆုံးပါပြီ!' : 'Workflow completed!');
      if (onExecutionComplete) onExecutionComplete(run);
    } catch (e: any) {
      setIsExecuting(false);
      setActiveExecutingNodeId(null);
      setStatusMessage(`Failed: ${e.message}`);
    }
  };

  const selectedNode = activeWorkflow?.nodes.find((n) => n.id === selectedNodeId);

  // SVG Bezier Curves for edges
  const renderEdgePath = (edge: WorkflowEdge) => {
    const sourceNode = activeWorkflow?.nodes.find((n) => n.id === edge.source);
    const targetNode = activeWorkflow?.nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    const x1 = sourceNode.position.x + 240;
    const y1 = sourceNode.position.y + 45;
    const x2 = targetNode.position.x;
    const y2 = targetNode.position.y + 45;

    const dx = Math.abs(x2 - x1) * 0.5;
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const isRunningEdge = activeExecutingNodeId === edge.source || activeExecutingNodeId === edge.target;

    return (
      <g key={edge.id}>
        <path
          d={d}
          fill="none"
          stroke={isRunningEdge ? '#38bdf8' : '#334155'}
          strokeWidth={isRunningEdge ? 3 : 2}
          strokeDasharray={isRunningEdge ? '6,6' : 'none'}
          className={isRunningEdge ? 'animate-pulse' : ''}
        />
        <circle cx={x1} cy={y1} r={4} fill="#0284c7" />
        <circle cx={x2} cy={y2} r={4} fill="#0284c7" />
      </g>
    );
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Toolbar (Responsive on Android) */}
      <div className="border-b border-slate-800 bg-slate-900/70 p-2 sm:px-4 sm:py-2.5 space-y-2">
        {/* Row 1: Workflow Selector & Management */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <select
              value={activeWorkflow?.id || ''}
              onChange={(e) => {
                const found = workflows.find((w) => w.id === e.target.value);
                if (found) handleSelectWorkflow(found);
              }}
              className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg py-1.5 pl-2.5 pr-8 focus:outline-none focus:border-cyan-500 truncate min-h-[38px]"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.nodes.length} steps)
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateNewWorkflow}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors min-h-[38px] shrink-0"
              title={t.newWorkflow}
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{t.newWorkflow}</span>
            </button>

            <button
              onClick={handleSaveWorkflow}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors min-h-[38px] shrink-0"
              title={t.saveWorkflow}
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t.saveWorkflow}</span>
            </button>
          </div>

          {/* Row 2 / Right Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle (Canvas vs Steps List for Android) */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                  viewMode === 'list'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Step List View (Optimized for Android Phones)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">{lang === 'my' ? 'အဆင့်များ' : 'Steps'}</span>
              </button>
              <button
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                  viewMode === 'canvas'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visual Canvas View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">{lang === 'my' ? 'Canvas' : 'Canvas'}</span>
              </button>
            </div>

            {/* Add Node Button / Modal Opener */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'my' ? 'အဆင့်ထည့်' : 'Add Step'}</span>
            </button>

            {/* Run Button */}
            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting || !activeWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md disabled:opacity-50 transition-all cursor-pointer min-h-[38px]"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isExecuting ? t.running : t.runWorkflow}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="text-[11px] font-medium text-cyan-400 animate-fade-in px-1">{statusMessage}</div>
        )}
      </div>

      {/* Main Content Area: Step List View OR Visual 2D Canvas */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* VIEW 1: Step List Pipeline View (Flawless on Android Phones) */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950">
            <div className="max-w-2xl mx-auto space-y-3 pb-8">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                  {lang === 'my' ? 'အလုပ်အသွားအလာ အဆင့်ဆင့်' : 'Sequential Pipeline Execution'}
                </span>
                <span className="font-mono text-[11px]">{activeWorkflow?.nodes.length || 0} Steps Configured</span>
              </div>

              {activeWorkflow?.nodes.map((node, index) => {
                const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META.trigger;
                const Icon = meta.icon;
                const isSelected = selectedNodeId === node.id;
                const isRunning = activeExecutingNodeId === node.id;
                const output = currentRun?.nodeOutputs[node.id];

                return (
                  <div key={node.id} className="space-y-2">
                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3.5 rounded-xl border bg-slate-900/90 shadow-lg cursor-pointer transition-all active:scale-[0.99] touch-manipulation ${
                        meta.border
                      } ${isSelected ? 'ring-2 ring-cyan-400 shadow-cyan-500/10' : ''} ${
                        isRunning ? 'ring-2 ring-amber-400 animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-lg ${meta.bg} border border-slate-800 shrink-0 mt-0.5`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-500">#{index + 1}</span>
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-100">{node.label}</h4>
                            </div>
                            <div className="text-[10px] uppercase font-mono text-cyan-400 mt-0.5">
                              {node.type.replace('_', ' ')}
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono mt-1 line-clamp-2">
                              {node.config?.urlOrPlatform ||
                                node.config?.goal ||
                                node.config?.query ||
                                node.config?.prompt ||
                                node.config?.fileName ||
                                (node.config?.code ? 'JavaScript Script' : 'Configured')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRunning && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                          {output && !isRunning && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < (activeWorkflow?.nodes.length || 0) - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Add Step Card */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-colors touch-manipulation min-h-[48px]"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>{lang === 'my' ? 'အလုပ်အသွားအလာ အဆင့်အသစ် ထည့်ရန်' : 'Add Next Workflow Step'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: 2D Visual Coordinate Canvas (Pan/Zoom on Desktop or Android) */}
        {viewMode === 'canvas' && (
          <div
            ref={canvasRef}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={() => setDraggingNodeId(null)}
            onTouchMove={(e) => {
              if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={() => setDraggingNodeId(null)}
            className="relative flex-1 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] select-none touch-pan-x touch-pan-y"
            style={{ minWidth: '100%', minHeight: '100%' }}
          >
            {/* SVG Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none w-[2000px] h-[1500px]">
              {activeWorkflow?.edges.map(renderEdgePath)}
            </svg>

            {/* Interactive Node Cards */}
            {activeWorkflow?.nodes.map((node) => {
              const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META.trigger;
              const Icon = meta.icon;
              const isSelected = selectedNodeId === node.id;
              const isRunning = activeExecutingNodeId === node.id;
              const output = currentRun?.nodeOutputs[node.id];

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDownNode(e.clientX, e.clientY, node.id);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches[0]) handleMouseDownNode(e.touches[0].clientX, e.touches[0].clientY, node.id);
                  }}
                  style={{
                    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                  }}
                  className={`absolute w-60 rounded-xl border bg-slate-900/95 shadow-xl backdrop-blur-sm cursor-grab active:cursor-grabbing transition-shadow ${
                    meta.border
                  } ${isSelected ? 'ring-2 ring-cyan-400 shadow-cyan-500/10' : ''} ${
                    isRunning ? 'ring-2 ring-amber-400 animate-pulse' : ''
                  }`}
                >
                  <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-800 ${meta.bg} rounded-t-xl`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">{node.label}</span>
                    </div>
                    {isRunning && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                    {output && !isRunning && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>

                  <div className="p-3 text-[11px] text-slate-400 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      {node.type.replace('_', ' ')}
                    </div>
                    <div className="text-slate-300 truncate font-mono text-[11px]">
                      {node.config?.urlOrPlatform ||
                        node.config?.goal ||
                        node.config?.query ||
                        node.config?.prompt ||
                        node.config?.fileName ||
                        (node.config?.code ? 'JS Script' : 'Configured')}
                    </div>
                  </div>

                  <div className="flex justify-between px-2 pb-1.5 text-[9px] text-slate-500 font-mono">
                    <span>IN</span>
                    <span>OUT</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Configuration Drawer: Slide-up modal on mobile, Right sidebar on desktop */}
        {selectedNode && (
          <>
            {/* Dark Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 sm:hidden z-40 backdrop-blur-sm"
              onClick={() => setSelectedNodeId(null)}
            />

            <div className="fixed inset-x-2 top-14 bottom-14 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-80 sm:relative z-50 bg-slate-900 border border-slate-800 sm:border-t-0 sm:border-b-0 sm:border-r-0 sm:border-l rounded-2xl sm:rounded-none flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">{t.nodeProperties}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded"
                    title="Delete Step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Node Label</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setActiveWorkflow({
                        ...activeWorkflow!,
                        nodes: activeWorkflow!.nodes.map((n) => (n.id === selectedNode.id ? { ...n, label: newLabel } : n)),
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px]"
                  />
                </div>

                {/* Dynamic properties based on node type */}
                {selectedNode.type === 'platform_inspector' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Target Platform or Website URL</label>
                    <input
                      type="text"
                      value={selectedNode.config?.urlOrPlatform || ''}
                      placeholder="e.g. Firebase, Supabase, Cloudflare Workers, or https://example.com"
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveWorkflow({
                          ...activeWorkflow!,
                          nodes: activeWorkflow!.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, urlOrPlatform: val } } : n
                          ),
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px]"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Extracts official purpose, how it works under the hood, architecture, SDKs, and free tier.
                    </p>
                  </div>
                )}

                {selectedNode.type === 'code_sandbox' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">JavaScript / Sandbox Code</label>
                    <textarea
                      rows={8}
                      value={selectedNode.config?.code || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveWorkflow({
                          ...activeWorkflow!,
                          nodes: activeWorkflow!.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, code: val } } : n
                          ),
                        });
                      }}
                      className="w-full mt-1 p-2 font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 focus:outline-none focus:border-cyan-500 leading-relaxed"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Access previous node data via <code className="text-cyan-400 font-mono">inputs.node_X</code>.
                    </p>
                  </div>
                )}

                {(selectedNode.type === 'agent' || selectedNode.type === 'trigger') && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Goal / Task Directive</label>
                    <textarea
                      rows={4}
                      value={selectedNode.config?.goal || selectedNode.config?.query || ''}
                      placeholder="Enter what the agent should investigate or produce..."
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveWorkflow({
                          ...activeWorkflow!,
                          nodes: activeWorkflow!.nodes.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, goal: val, query: val } }
                              : n
                          ),
                        });
                      }}
                      className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {selectedNode.type === 'image_gen' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Visual Prompt</label>
                    <input
                      type="text"
                      value={selectedNode.config?.prompt || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveWorkflow({
                          ...activeWorkflow!,
                          nodes: activeWorkflow!.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, prompt: val } } : n
                          ),
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px]"
                    />
                  </div>
                )}

                {selectedNode.type === 'db_sink' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Workspace Filename</label>
                    <input
                      type="text"
                      value={selectedNode.config?.fileName || 'result.json'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveWorkflow({
                          ...activeWorkflow!,
                          nodes: activeWorkflow!.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, config: { ...n.config, fileName: val } } : n
                          ),
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px]"
                    />
                  </div>
                )}

                {/* Output Inspector if completed */}
                {currentRun?.nodeOutputs[selectedNode.id] && (
                  <div className="pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Node Output Result</span>
                    </div>
                    <pre className="p-2.5 max-h-48 overflow-auto bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-300">
                      {JSON.stringify(currentRun.nodeOutputs[selectedNode.id], null, 2)}
                    </pre>
                  </div>
                )}

                {/* Done Button on mobile */}
                <div className="pt-2 sm:hidden">
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Step Selection Modal (Touch friendly on Android) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  {lang === 'my' ? 'အဆင့်အမျိုးအစား ရွေးချယ်ပါ' : 'Select Step Type to Add'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {(
                [
                  'agent',
                  'platform_inspector',
                  'code_sandbox',
                  'search',
                  'image_gen',
                  'date_time',
                  'db_sink',
                ] as WorkflowNode['type'][]
              ).map((type) => {
                const meta = NODE_TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] min-h-[48px]"
                  >
                    <div className={`p-2 rounded-lg ${meta.bg} shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{meta.label}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{type.replace('_', ' ')}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Execution Status Drawer */}
      {currentRun && (
        <div className="border-t border-slate-800 bg-slate-900/95 max-h-40 overflow-y-auto p-3 text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Run Log ({currentRun.status.toUpperCase()})</span>
              <span className="text-slate-500 font-mono text-[11px]">{currentRun.durationMs}ms</span>
            </div>
            <button
              onClick={() => setCurrentRun(null)}
              className="text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {currentRun.logs.slice(-5).map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-400">
                <span className="text-cyan-400 shrink-0">[{log.level}]</span>
                <span className="text-slate-300 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
