import { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Code2,
  FolderOpen,
  Play,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  FileText,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Send,
  Cloud,
  Globe,
  Layers,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { WorkspaceFile, TerminalExecutionResult } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface DevStudioProps {
  lang: Language;
  initialCode?: string;
}

export function DevStudio({ lang, initialCode }: DevStudioProps) {
  const t = translations[lang];

  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'sandbox' | 'files' | 'cloudflare'>('terminal');

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalExecutionResult[]>([
    {
      command: 'help',
      output: `AgentFlow Developer Terminal & CLI Sandbox v2.0
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
  clear                        Clear terminal output`,
      isError: false,
      exitCode: 0,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [commandIndex, setCommandIndex] = useState<number>(-1);
  const [pastCommands, setPastCommands] = useState<string[]>(['help']);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isTermRunning, setIsTermRunning] = useState(false);

  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState(
    initialCode ||
      `// High performance TypeScript / JavaScript Sandbox
const numbers = [24, 88, 12, 45, 99, 103, 7];
const sorted = [...numbers].sort((a, b) => a - b);

console.log("Original numbers:", numbers);
console.log("Sorted array:", sorted);

// Access workspace files
const files = workspace.listFiles();
console.log("Found workspace files:", files.map(f => f.name));

return {
  status: "success",
  sorted,
  totalItems: sorted.length,
  min: sorted[0],
  max: sorted[sorted.length - 1],
  executedAt: new Date().toISOString()
};`
  );
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [sandboxReturn, setSandboxReturn] = useState<any>(null);
  const [sandboxTime, setSandboxTime] = useState<number | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Files State
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isSavingFile, setIsSavingFile] = useState(false);

  // Cloudflare Tool Bridge State
  const [cloudflareData, setCloudflareData] = useState<{
    tools: any[];
    workerScript: string;
    baseUrl: string;
    description: string;
  } | null>(null);
  const [copiedCfWorker, setCopiedCfWorker] = useState(false);
  const [copiedCfTools, setCopiedCfTools] = useState(false);
  const [cfCustomHost, setCfCustomHost] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://your-agentflow.onrender.com'
  );
  const [cfSimulatorCode, setCfSimulatorCode] = useState('console.log("Edge call to AgentFlow Sandbox!"); return { primeCount: 42, edgeEngine: "Cloudflare Workers AI" };');
  const [cfSimulatorResult, setCfSimulatorResult] = useState<any>(null);
  const [isSimulatingCf, setIsSimulatingCf] = useState(false);

  const loadCloudflareData = async (host?: string) => {
    try {
      const data = await api.getCloudflareToolSchema(host || cfCustomHost);
      setCloudflareData(data);
    } catch (e: any) {
      console.error('Failed to load cloudflare data:', e);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'cloudflare' && !cloudflareData) {
      loadCloudflareData();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (initialCode) {
      setSandboxCode(initialCode);
      setActiveSubTab('sandbox');
    }
  }, [initialCode]);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const loadFiles = async () => {
    try {
      const list = await api.getFiles();
      setFiles(list);
      if (list.length > 0 && !selectedFile) {
        setSelectedFile(list[0]);
        setFileContent(list[0].content);
      }
    } catch (e: any) {
      console.error('Failed to load files:', e);
    }
  };

  // Run Terminal Command
  const handleTerminalSubmit = async (cmdToRun = terminalInput) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed || isTermRunning) return;

    if (trimmed.toLowerCase() === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    setIsTermRunning(true);
    setPastCommands((prev) => [...prev, trimmed]);
    setCommandIndex(-1);

    try {
      const res = await api.runTerminal(trimmed);
      setTerminalHistory((prev) => [...prev, res]);
    } catch (e: any) {
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          output: `Terminal execution failed: ${e.message}`,
          isError: true,
          exitCode: 1,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTermRunning(false);
      setTerminalInput('');
      loadFiles(); // reload in case file command changed workspace
    }
  };

  // Run Sandbox Code
  const handleRunSandbox = async () => {
    if (isSandboxRunning) return;
    setIsSandboxRunning(true);
    try {
      const res = await api.executeSandbox(sandboxCode);
      setSandboxLogs(res.logs);
      setSandboxReturn(res.returnValue);
      setSandboxTime(res.executionTimeMs);
    } catch (e: any) {
      setSandboxLogs([`Sandbox execution error: ${e.message}`]);
      setSandboxReturn(null);
    } finally {
      setIsSandboxRunning(false);
      loadFiles();
    }
  };

  // Save File
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    try {
      const updated = await api.saveFile(selectedFile.name, fileContent, selectedFile.path);
      setSelectedFile(updated);
      loadFiles();
    } catch (e: any) {
      alert(`Save file error: ${e.message}`);
    } finally {
      setIsSavingFile(false);
    }
  };

  // Create New File
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const created = await api.saveFile(newFileName.trim(), '// New file created in workspace\n');
      setNewFileName('');
      loadFiles();
      setSelectedFile(created);
      setFileContent(created.content);
    } catch (e: any) {
      alert(`Create file error: ${e.message}`);
    }
  };

  // Delete File
  const handleDeleteFile = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteFile(name);
      loadFiles();
      if (selectedFile?.name === name) {
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (e: any) {
      alert(`Delete error: ${e.message}`);
    }
  };

  const quickTerminalCommands = [
    'npm info @google/genai',
    'inspect Firebase',
    'inspect Supabase',
    'date',
    'ls',
    'cat welcome.md',
    'eval 2 + 2 * 10',
    'env',
  ];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Subtab Header Navigation (Touch-Friendly for Android) */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800 bg-slate-900/70 gap-2">
        <div className="flex items-center gap-1 flex-1 min-w-[240px]">
          <button
            onClick={() => setActiveSubTab('terminal')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[38px] ${
              activeSubTab === 'terminal'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>{t.terminalTitle.split(' ')[0]} CLI</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sandbox')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[38px] ${
              activeSubTab === 'sandbox'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Sandbox</span>
          </button>

          <button
            onClick={() => setActiveSubTab('files')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[38px] ${
              activeSubTab === 'files'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Files ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cloudflare')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[38px] ${
              activeSubTab === 'cloudflare'
                ? 'bg-orange-950/60 text-orange-400 border border-orange-700/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-orange-400" />
            <span>Cloudflare AI</span>
          </button>
        </div>

        {activeSubTab === 'sandbox' && (
          <button
            onClick={handleRunSandbox}
            disabled={isSandboxRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg shadow-md disabled:opacity-50 transition-all cursor-pointer min-h-[38px]"
          >
            {isSandboxRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSandboxRunning ? '...' : t.runCode}</span>
          </button>
        )}
      </div>

      {/* Subtab 1: Interactive Virtual Terminal */}
      {activeSubTab === 'terminal' && (
        <div className="flex-1 flex flex-col bg-slate-950 font-mono text-xs overflow-hidden">
          {/* Output log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-emerald-400 font-bold">agentflow:~/workspace$</span>
                  <span className="text-slate-200 font-semibold">{item.command}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {item.output && (
                  <pre
                    className={`p-2.5 rounded-lg border text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto ${
                      item.isError
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    {item.output}
                  </pre>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Quick command buttons */}
          <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-t border-slate-800/80 bg-slate-900/40">
            <span className="text-[10px] text-slate-500 mr-1 shrink-0">Quick:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
              {quickTerminalCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleTerminalSubmit(cmd)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md border border-slate-700/80 transition-colors shrink-0 min-h-[30px]"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Command Prompt Input */}
          <div className="p-2.5 sm:p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-1.5 sm:gap-2">
            <span className="text-emerald-400 font-bold text-xs select-none shrink-0 hidden sm:inline">agentflow:~/workspace$</span>
            <span className="text-emerald-400 font-bold text-xs select-none shrink-0 sm:hidden text-cyan-400 font-mono">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTerminalSubmit();
                } else if (e.key === 'ArrowUp') {
                  if (pastCommands.length > 0) {
                    const nextIdx = commandIndex === -1 ? pastCommands.length - 1 : Math.max(0, commandIndex - 1);
                    setCommandIndex(nextIdx);
                    setTerminalInput(pastCommands[nextIdx]);
                  }
                } else if (e.key === 'ArrowDown') {
                  if (commandIndex >= 0 && commandIndex < pastCommands.length - 1) {
                    const nextIdx = commandIndex + 1;
                    setCommandIndex(nextIdx);
                    setTerminalInput(pastCommands[nextIdx]);
                  } else {
                    setCommandIndex(-1);
                    setTerminalInput('');
                  }
                }
              }}
              placeholder="Type command (e.g. 'help', 'date', 'npm info @google/genai')..."
              className="flex-1 bg-transparent text-slate-100 text-xs sm:text-sm focus:outline-none placeholder-slate-600 min-h-[38px] py-1 px-1.5"
            />
            <button
              onClick={() => handleTerminalSubmit()}
              disabled={isTermRunning || !terminalInput.trim()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs disabled:opacity-50 transition-colors min-h-[38px] min-w-[42px] flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subtab 2: Code Sandbox IDE */}
      {activeSubTab === 'sandbox' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 min-h-[220px]">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">JavaScript / Node.js VM</span>
              <span className="font-mono text-[10px] hidden sm:inline">workspace.readFile, fetch, Date, Math</span>
            </div>
            <textarea
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 p-3 sm:p-4 font-mono text-xs sm:text-[13px] text-emerald-300 bg-transparent resize-none focus:outline-none leading-relaxed select-text min-h-[180px]"
            />
          </div>

          {/* Console / Output Area */}
          <div className="w-full lg:w-96 flex flex-col bg-slate-900/60 font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Console & Return Value</span>
              {sandboxTime !== null && (
                <span className="text-[10px] text-cyan-400 font-mono">{sandboxTime}ms</span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Return value */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Return Value:</div>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-amber-300 overflow-x-auto">
                  {sandboxReturn !== null && sandboxReturn !== undefined
                    ? JSON.stringify(sandboxReturn, null, 2)
                    : '(undefined / no return statement)'}
                </pre>
              </div>

              {/* Console Logs */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Standard Output (Logs):</div>
                {sandboxLogs.length > 0 ? (
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-[11px] text-slate-300">
                    {sandboxLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-600 italic">No console logs emitted</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Workspace Filesystem Explorer */}
      {activeSubTab === 'files' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* File Tree */}
          <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 p-3 flex flex-col">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>/workspace/</span>
              <span className="text-[10px] text-slate-500 font-mono">{files.length} files</span>
            </div>

            {/* Create new file form */}
            <div className="flex gap-1 mb-3">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="new_file.js"
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleCreateFile}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => {
                    setSelectedFile(file);
                    setFileContent(file.content);
                  }}
                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                    selectedFile?.path === file.path
                      ? 'bg-purple-950/40 text-purple-300 border border-purple-800/60 font-medium'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.name);
                    }}
                    className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* File Content Editor */}
          <div className="flex-1 flex flex-col bg-slate-950">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{selectedFile.path}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {selectedFile.sizeBytes} bytes · Updated {new Date(selectedFile.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={handleSaveFile}
                    disabled={isSavingFile}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    {isSavingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="flex-1 p-4 font-mono text-xs text-slate-200 bg-transparent resize-none focus:outline-none leading-relaxed select-text"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a file on the left or create a new file
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 4: Cloudflare Workers AI Tool Bridge */}
      {activeSubTab === 'cloudflare' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950">
          {/* Top Banner */}
          <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Cloudflare Workers AI + AgentFlow Edge Tool Bridge
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-900/60 text-orange-300 border border-orange-700/50">
                      Edge-Compatible
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cloudflare Workers edge runs without Node.js VM or CLI. AgentFlow acts as the external tools & execution engine for Cloudflare AI models (Llama 3.3, DeepSeek R1).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cloudflareData?.workerScript || '');
                    setCopiedCfWorker(true);
                    setTimeout(() => setCopiedCfWorker(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-sm transition-colors cursor-pointer min-h-[38px]"
                >
                  {copiedCfWorker ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCfWorker ? 'Copied Script!' : 'Copy worker.ts'}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(cloudflareData?.tools || [], null, 2));
                    setCopiedCfTools(true);
                    setTimeout(() => setCopiedCfTools(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                >
                  {copiedCfTools ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
                  <span>{copiedCfTools ? 'Copied Specs!' : 'Copy Tool Spec JSON'}</span>
                </button>
              </div>
            </div>

            {/* Target AgentFlow URL Config */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Your AgentFlow Backend URL:</span>
              <input
                type="text"
                value={cfCustomHost}
                onChange={(e) => setCfCustomHost(e.target.value)}
                placeholder="https://your-agentflow.onrender.com"
                className="flex-1 min-w-[240px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => loadCloudflareData(cfCustomHost)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Update Script
              </button>
            </div>
          </div>

          {/* 3 Step Deployment Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-950 border border-orange-500/40 flex items-center justify-center text-[10px]">1</span>
                <span>Deploy AgentFlow</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Deploy this app on <strong>Render.com</strong> (using Web Service + Node Docker). You will get a permanent public URL (e.g. <code className="text-orange-300">https://myapp.onrender.com</code>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[10px]">2</span>
                <span>Create Cloudflare Worker</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In Cloudflare Dashboard, create a new Worker with <strong>Workers AI binding</strong> (<code className="text-cyan-300">env.AI</code>). Paste the generated <code className="text-slate-200">worker.ts</code> code below.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-[10px]">3</span>
                <span>Automatic Tool Calling</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When users query your Cloudflare Worker, Llama 3.3 or DeepSeek R1 invokes AgentFlow REST tools to run code or inspect platform docs, returning real answers at the edge!
              </p>
            </div>
          </div>

          {/* Interactive Cloudflare Edge Tool Simulator */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Live Edge Tool Calling (Simulator)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Simulates: Cloudflare Worker → AgentFlow POST /api/tools/execute-sandbox</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 block font-medium">Tool Call: execute_code_sandbox (Test Code):</label>
                <textarea
                  value={cfSimulatorCode}
                  onChange={(e) => setCfSimulatorCode(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 font-mono text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-amber-500 leading-relaxed"
                />
                <button
                  onClick={async () => {
                    setIsSimulatingCf(true);
                    try {
                      const res = await api.executeSandbox(cfSimulatorCode);
                      setCfSimulatorResult(res);
                    } catch (e: any) {
                      setCfSimulatorResult({ error: e.message });
                    } finally {
                      setIsSimulatingCf(false);
                    }
                  }}
                  disabled={isSimulatingCf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer min-h-[36px]"
                >
                  {isSimulatingCf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isSimulatingCf ? 'Simulating edge call...' : 'Send Edge Tool Call'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 block font-medium">Simulated Cloudflare Worker Received Response:</label>
                <div className="h-[120px] overflow-y-auto p-2.5 font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-emerald-400">
                  {cfSimulatorResult ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(cfSimulatorResult, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-600">Click &quot;Send Edge Tool Call&quot; to test the exact response Cloudflare Worker receives...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cloudflare Worker Code & Tool Definitions Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Complete Worker Script */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-orange-300 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  worker.ts (Ready to Deploy)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">TypeScript / ES Module</span>
              </div>
              <pre className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-lg leading-relaxed select-text">
                {cloudflareData?.workerScript || 'Loading Cloudflare Worker script...'}
              </pre>
            </div>

            {/* Right: Cloudflare Tools Schema */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  tools.json (Cloudflare AI Tool Spec)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Function Calling Definitions</span>
              </div>
              <pre className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-lg leading-relaxed select-text">
                {cloudflareData?.tools
                  ? JSON.stringify(cloudflareData.tools, null, 2)
                  : 'Loading tool specifications...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
