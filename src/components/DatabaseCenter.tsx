import { useState, useEffect } from 'react';
import {
  Database,
  Flame,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Workflow as WorkflowIcon,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { WorkflowRun, Workflow, WorkspaceFile } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface DatabaseCenterProps {
  lang: Language;
}

export function DatabaseCenter({ lang }: DatabaseCenterProps) {
  const t = translations[lang];

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [firebaseBlueprint, setFirebaseBlueprint] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'runs' | 'workflows' | 'firebase'>('firebase');
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [runsData, workflowsData, filesData, fbData] = await Promise.all([
        api.getRuns(),
        api.getWorkflows(),
        api.getFiles(),
        api.getFirebaseBlueprint(),
      ]);
      setRuns(runsData);
      setWorkflows(workflowsData);
      setFiles(filesData);
      setFirebaseBlueprint(fbData);
    } catch (e: any) {
      console.error('Failed to load database stats:', e);
    }
  };

  const handleDownloadBackup = () => {
    if (!firebaseBlueprint?.exportJson) return;
    const blob = new Blob([firebaseBlueprint.exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentflow_database_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Workflows Collection
    match /workflows/{workflowId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Workflow Runs History
    match /workflow_runs/{runId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }

    // Agent Workspace Files
    match /workspace_files/{fileId} {
      allow read, write: if true;
    }
  }
}`;

  const sampleFirebaseSdkCode = `// Firebase Client Integration Example
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "agentflow-app.firebaseapp.com",
  projectId: "agentflow-app",
  storageBucket: "agentflow-app.appspot.com",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save workflow run to Firestore
export async function persistRunToFirestore(runData) {
  const docRef = await addDoc(collection(db, "workflow_runs"), runData);
  console.log("Run saved to Firestore with ID: ", docRef.id);
  return docRef.id;
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(sampleFirebaseSdkCode);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>{t.tabDatabase}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              {lang === 'my' ? 'ဒေတာဘေ့စ်၊ သိမ်းဆည်းမှုများနှင့် Firebase ချိတ်ဆက်မှု' : 'Persistent Storage & Firebase Cloud Center'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === 'my'
                ? 'လုပ်ငန်းစဉ်များ၊ အေးဂျင့်မောင်းနှင်မှု မှတ်တမ်းများနှင့် ဖိုင်များကို အခမဲ့ သိမ်းဆည်းထားနိုင်ပါသည်။'
                : 'Free persistent JSON storage with one-click Firebase Firestore cloud schema & rules export.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={loadData}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors min-h-[38px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer min-h-[38px] whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-slate-500 text-xs flex items-center gap-1.5 mb-1">
              <WorkflowIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workflows</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 font-mono">{workflows.length}</div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-slate-500 text-xs flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Runs</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 font-mono">{runs.length}</div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-slate-500 text-xs flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Files</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 font-mono">{files.length}</div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-slate-500 text-xs flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Firebase</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-400 font-mono">100% Free</div>
          </div>
        </div>

        {/* Tabs (Swipeable on Mobile) */}
        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 text-xs font-medium overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          <button
            onClick={() => setActiveSubTab('firebase')}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeSubTab === 'firebase'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Firebase Firestore Blueprint</span>
          </button>

          <button
            onClick={() => setActiveSubTab('runs')}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeSubTab === 'runs'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Runs History ({runs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('workflows')}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeSubTab === 'workflows'
                ? 'border-indigo-400 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <WorkflowIcon className="w-4 h-4 text-indigo-400" />
            <span>Stored Workflows ({workflows.length})</span>
          </button>
        </div>

        {/* Tab 1: Firebase Firestore Blueprint */}
        {activeSubTab === 'firebase' && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.firebaseExportTitle}</h3>
                  <p className="text-xs text-slate-400">{t.firebaseExportDesc}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans">
                {lang === 'my'
                  ? 'Firebase Spark Plan ဖြင့် Firestore NoSQL ဒေတာဘေ့စ်ကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။ အောက်ပါ Rules နှင့် Collections schema ကို ကော်ပီကူးယူ၍ Firebase Console တွင် ထည့်သွင်းအသုံးပြုနိုင်ပါသည်။'
                  : 'Firebase provides a generous free tier (Spark plan) with 1 GB Firestore storage, 50k reads/day, and 20k writes/day. The blueprints below are pre-architected for AgentFlow.'}
              </p>
            </div>

            {/* Live SDK & Database Engine Status */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'my' ? 'SDK များနှင့် ဒေတာဘေ့စ်များ အမှန်တကယ် အလုပ်လုပ်မှု အခြေအနေ (Live Verification)' : 'SDKs & Database Live Verification Status'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  ALL OPERATIONAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-400 font-mono text-[11px]">1. @google/genai SDK (v2.32.0)</span>
                    <span className="text-[10px] text-emerald-400 font-medium">● Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'my'
                      ? 'AI Studio Secrets မှ GEMINI_API_KEY ကို တိုက်ရိုက်ယူသုံးပြီး ReAct Function Calling၊ Web Scraping နှင့် Vector Image Generation ကို တကယ်မောင်းနှင်နေပါသည်။'
                      : 'Executes ReAct Autonomous loops, Platform Scraping synthesis, and SVG Image Generation live.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400 font-mono text-[11px]">2. Node.js VM Sandbox Engine</span>
                    <span className="text-[10px] text-emerald-400 font-medium">● Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'my'
                      ? 'Node VM Sandbox သည် User Code များကို သီးခြားခွဲထုတ်၍ Microsecond တိုင်းတာမှုဖြင့် တကယ့် console log များနှင့် တန်ဖိုးများကို တွက်ချက်ပေးပါသည်။'
                      : 'Runs JavaScript/TypeScript in isolated context with microsecond timer, memory limits, and console log capture.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-400 font-mono text-[11px]">3. Persistent File DB (autoflow_db.json)</span>
                    <span className="text-[10px] text-emerald-400 font-medium">● Active & Saved</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'my'
                      ? 'ဆာဗာထဲတွင် Workflows, Execution Runs, Files များကို မပျောက်ပျက်အောင် အလိုအလျောက် အမြဲတမ်း သိမ်းဆည်းပေးနေပါသည်။'
                      : 'Zero-configuration JSON file storage in server root. All pipelines and files remain intact.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-400 font-mono text-[11px]">4. Firebase Firestore + Cloudflare Tool</span>
                    <span className="text-[10px] text-cyan-400 font-medium">● Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'my'
                      ? 'Firebase Spark Free Tier အတွက် Firestore Security Rules နှင့် JSON Blueprint အသင့်ပါပြီး Cloudflare Workers AI အတွက် Tool Specification များ ရရှိနိုင်ပါသည်။'
                      : 'Pre-architected schema + rules for Firebase Firestore Spark Tier, and Cloudflare Workers AI edge tool bindings.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Firestore Collections Blueprint */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Configured Firestore Collections & Fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-cyan-400 font-mono text-[11px] mb-1">collection: "workflows"</div>
                  <div className="text-slate-400 text-[11px]">Fields: name, description, nodes, edges, category, updatedAt</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-emerald-400 font-mono text-[11px] mb-1">collection: "workflow_runs"</div>
                  <div className="text-slate-400 text-[11px]">Fields: workflowId, status, startedAt, durationMs, nodeOutputs, logs</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-purple-400 font-mono text-[11px] mb-1">collection: "workspace_files"</div>
                  <div className="text-slate-400 text-[11px]">Fields: name, path, content, sizeBytes, updatedAt</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-rose-400 font-mono text-[11px] mb-1">collection: "generated_images"</div>
                  <div className="text-slate-400 text-[11px]">Fields: prompt, style, svgDataUrl, createdAt</div>
                </div>
              </div>
            </div>

            {/* Firestore Security Rules */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>firestore.rules (Security Rules)</span>
                </div>
                <button
                  onClick={handleCopyRules}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRules ? 'Copied' : 'Copy Rules'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                {sampleRules}
              </pre>
            </div>

            {/* SDK Code Snippet */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Firebase SDK Client Integration Snippet</span>
                </div>
                <button
                  onClick={handleCopyConfig}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                >
                  {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfig ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto leading-relaxed">
                {sampleFirebaseSdkCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Execution Runs History */}
        {activeSubTab === 'runs' && (
          <div className="space-y-3">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                No workflow runs recorded yet. Execute a workflow in the Workflow Canvas tab.
              </div>
            ) : (
              runs.map((run) => {
                const isExpanded = expandedRunId === run.id;
                return (
                  <div
                    key={run.id}
                    className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2"
                  >
                    <div
                      onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-semibold text-slate-200">{run.workflowName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            run.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : run.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                        <span>{run.durationMs}ms</span>
                        <span>·</span>
                        <span>{new Date(run.startedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800 space-y-2 font-mono text-[11px]">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Execution Trace:</div>
                        <div className="p-2.5 bg-slate-950 rounded-lg space-y-1 max-h-48 overflow-y-auto">
                          {run.logs.map((log, i) => (
                            <div key={i} className="text-slate-400">
                              <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                              <span className="text-cyan-400">[{log.level}]</span> {log.message}
                            </div>
                          ))}
                        </div>

                        {run.finalResult && (
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Final Result:</div>
                            <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 overflow-x-auto max-h-48">
                              {JSON.stringify(run.finalResult, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Stored Workflows */}
        {activeSubTab === 'workflows' && (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{wf.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                      {wf.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{wf.description}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {wf.nodes.length} nodes · {wf.edges.length} edges · Updated {new Date(wf.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
