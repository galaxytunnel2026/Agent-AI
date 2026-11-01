import { useState } from 'react';
import {
  Bot,
  Play,
  Loader2,
  CheckCircle2,
  Wrench,
  Search,
  Globe,
  Clock,
  Terminal,
  FileCode,
  Image,
  FolderOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { AgentRunResponse, AgentExecutionStep } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { Language, translations } from '../lib/translations.ts';

interface AgentPlaygroundProps {
  lang: Language;
}

export function AgentPlayground({ lang }: AgentPlaygroundProps) {
  const t = translations[lang];

  const [taskPrompt, setTaskPrompt] = useState(
    'Inspect Google Firebase and Cloudflare Workers platforms: explain what they are for, how they work under the hood, run a calculation in the sandbox, check the real date & time, and generate a technical architecture report.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentRunResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Tool enablement checkboxes
  const [toolsState, setToolsState] = useState<Record<string, boolean>>({
    google_search: true,
    inspect_platform_or_url: true,
    get_real_date_time: true,
    execute_code_sandbox: true,
    run_terminal_command: true,
    file_system_action: true,
    generate_image: true,
    run_agentflow_workflow: true,
  });

  const toolMetaList = [
    { id: 'google_search', label: t.toolSearch, icon: Search, color: 'text-sky-400' },
    { id: 'inspect_platform_or_url', label: t.toolPlatform, icon: Globe, color: 'text-emerald-400' },
    { id: 'get_real_date_time', label: t.toolDateTime, icon: Clock, color: 'text-teal-400' },
    { id: 'execute_code_sandbox', label: t.toolSandbox, icon: Terminal, color: 'text-amber-400' },
    { id: 'run_terminal_command', label: t.toolTerminal, icon: FileCode, color: 'text-blue-400' },
    { id: 'file_system_action', label: t.toolFileSystem, icon: FolderOpen, color: 'text-purple-400' },
    { id: 'generate_image', label: t.toolImageGen, icon: Image, color: 'text-rose-400' },
    {
      id: 'run_agentflow_workflow',
      label: lang === 'my' ? 'AgentFlow Pipeline မောင်းနှင်ခြင်း (Workflow Tool)' : 'Run AgentFlow Pipeline (Workflow-as-a-Tool)',
      icon: Sparkles,
      color: 'text-indigo-400',
    },
  ];

  const suggestedTasks = [
    {
      title: 'Workflow-as-a-Tool (AI က Pipeline ကို ခိုင်းမည်)',
      prompt:
        'Use the "run_agentflow_workflow" tool to execute the "wf_platform_inspector" pipeline for "Supabase", analyze the structured outputs, and give me the summary.',
    },
    {
      title: 'Platform Architecture & Sandbox Test',
      prompt:
        'Inspect Supabase official architecture: what is it used for, how does Postgres RLS work under the hood, and run benchmark code in sandbox.',
    },
    {
      title: 'Real-time Date, Search & Spec Generator',
      prompt:
        'Check current real date & time in Myanmar and UTC, search for latest developer AI tools, and write a markdown summary to /workspace/ai_trends.md.',
    },
  ];

  const [mobileTab, setMobileTab] = useState<'prompt' | 'trace'>('prompt');

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLaunchAgent = async () => {
    if (!taskPrompt.trim() || isRunning) return;
    setIsRunning(true);
    setAgentResponse(null);
    setMobileTab('trace'); // Automatically switch to trace on mobile when launched

    const activeTools = Object.keys(toolsState).filter((k) => toolsState[k]);

    try {
      const res = await api.runAgent(taskPrompt, {
        enabledTools: activeTools,
        maxTurns: 6,
      });
      setAgentResponse(res);
      // Auto-expand steps
      const newExp: Record<number, boolean> = {};
      res.steps.forEach((s) => {
        newExp[s.stepIndex] = true;
      });
      setExpandedSteps(newExp);
    } catch (e: any) {
      alert(`Agent execution failed: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutcome = () => {
    if (!agentResponse?.finalAnswer) return;
    navigator.clipboard.writeText(agentResponse.finalAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      {/* Mobile Top Segmented Bar (< 1024px) */}
      <div className="lg:hidden flex items-center p-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="grid grid-cols-2 gap-1 w-full max-w-sm mx-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMobileTab('prompt')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              mobileTab === 'prompt'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'my' ? 'ညွှန်ကြားချက်နှင့် Tools' : 'Directives & Tools'}
          </button>
          <button
            onClick={() => setMobileTab('trace')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all min-h-[38px] flex items-center justify-center gap-1.5 ${
              mobileTab === 'trace'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{lang === 'my' ? 'စဉ်းစားပုံနှင့် ရလဒ်' : 'Reasoning & Result'}</span>
            {agentResponse && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Left Control Panel: Task input & Tool Toggles */}
      <div
        className={`w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/70 p-3 sm:p-4 flex flex-col overflow-y-auto ${
          mobileTab === 'trace' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">{t.tabAgent}</h2>
            <p className="text-[11px] text-slate-400">Autonomous ReAct Loop with Dev Toolbelt</p>
          </div>
        </div>

        {/* Task Input */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-300 block mb-1.5">{t.agentGoalPrompt}</label>
          <textarea
            rows={4}
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="Instruct the autonomous agent..."
            className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
          />

          {/* Quick Suggestions */}
          <div className="mt-2 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Suggested Tasks:</div>
            {suggestedTasks.map((st, i) => (
              <button
                key={i}
                onClick={() => setTaskPrompt(st.prompt)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors truncate min-h-[34px] flex items-center"
              >
                👉 {st.title}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbelt Checkboxes (Grid on mobile for easy thumb tapping) */}
        <div className="mb-5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">{t.availableTools}</span>
            <span className="text-[10px] font-mono text-cyan-400">
              {Object.values(toolsState).filter(Boolean).length} / {toolMetaList.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
            {toolMetaList.map((tool) => {
              const Icon = tool.icon;
              const isChecked = toolsState[tool.id];
              return (
                <label
                  key={tool.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isChecked ? tool.color : 'text-slate-600'}`} />
                    <span className="text-[11px]">{tool.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setToolsState({ ...toolsState, [tool.id]: e.target.checked })}
                    className="accent-cyan-500 rounded"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleLaunchAgent}
          disabled={isRunning || !taskPrompt.trim()}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-90 rounded-lg shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Agent Thinking & Executing Tools...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t.agentRunButton}</span>
            </>
          )}
        </button>
      </div>

      {/* Right Area: Execution Trace & Final Outcome */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 lg:p-6 bg-slate-950 ${
          mobileTab === 'prompt' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {!agentResponse && !isRunning && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">{t.tabAgent} Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Equipped with real Web Search, Platform Inspector, Code Sandbox, Terminal CLI, Real Date & Time, and Image Generator. Click &ldquo;{t.agentRunButton}&rdquo; to begin.
            </p>
          </div>
        )}

        {isRunning && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <div className="text-sm font-medium text-slate-200">ReAct Autonomous Agent Active</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Reasoning &rarr; Selecting Tools &rarr; Executing in Sandbox &rarr; Synthesizing
            </div>
          </div>
        )}

        {agentResponse && (
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {/* Header Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Autonomous Mission Completed</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span>Duration: {agentResponse.executionTimeMs}ms</span>
                <span>·</span>
                <span>Tools Used: {agentResponse.toolsUsed.join(', ') || 'None'}</span>
                <span>·</span>
                <span>Steps: {agentResponse.steps.length}</span>
              </div>
            </div>

            {/* Final Synthesis Outcome Card */}
            <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/70 border border-cyan-500/30 rounded-xl shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-cyan-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.finalOutcome}</span>
                </div>
                <button
                  onClick={handleCopyOutcome}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {agentResponse.finalAnswer}
              </div>

              {/* Artifacts preview */}
              {agentResponse.filesModified.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">{t.modifiedFiles}:</div>
                  <div className="flex flex-wrap gap-2">
                    {agentResponse.filesModified.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-800 text-cyan-400 font-mono text-[11px] rounded border border-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ReAct Execution Steps Trace */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold text-slate-200">{t.executionTrace}</h4>
              </div>

              <div className="space-y-2">
                {agentResponse.steps.map((step) => {
                  const isExpanded = Boolean(expandedSteps[step.stepIndex]);
                  return (
                    <div
                      key={step.stepIndex}
                      className="border border-slate-800 bg-slate-900/60 rounded-lg overflow-hidden text-xs"
                    >
                      <button
                        onClick={() => toggleStep(step.stepIndex)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-mono text-[10px] text-slate-500">#{step.stepIndex}</span>
                          <span
                            className={`font-semibold uppercase text-[10px] ${
                              step.type === 'tool_call'
                                ? 'text-cyan-400'
                                : step.type === 'tool_result'
                                ? 'text-emerald-400'
                                : step.type === 'final_answer'
                                ? 'text-purple-400'
                                : 'text-slate-300'
                            }`}
                          >
                            [{step.type.replace('_', ' ')}]
                          </span>
                          <span className="text-slate-300 font-medium truncate max-w-md">{step.message}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-slate-800/60 bg-slate-950/60 space-y-2 font-mono text-[11px]">
                          {step.toolArgs && (
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Parameters:</div>
                              <pre className="p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-amber-300">
                                {JSON.stringify(step.toolArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {step.toolResult && (
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Execution Result:</div>
                              <pre className="p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-emerald-300 max-h-48">
                                {typeof step.toolResult === 'object'
                                  ? JSON.stringify(step.toolResult, null, 2)
                                  : String(step.toolResult)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
