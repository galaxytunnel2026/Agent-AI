import { useState } from 'react';
import {
  HelpCircle,
  X,
  Play,
  Bot,
  Workflow,
  Globe,
  Terminal,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Wrench,
  Layers,
} from 'lucide-react';
import { Language } from '../lib/translations.ts';
import { ActiveTab } from '../types/index.ts';

interface QuickGuideModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onTriggerDemo?: (demoType: 'platform' | 'agent_workflow' | 'sandbox' | 'image') => void;
}

export function QuickGuideModal({
  lang,
  isOpen,
  onClose,
  onSelectTab,
  onTriggerDemo,
}: QuickGuideModalProps) {
  const [activeSection, setActiveSection] = useState<'start' | 'concept' | 'tabs'>('start');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg text-white shadow-md">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {lang === 'my' ? 'AgentFlow AI စတင်အသုံးပြုနည်း လမ်းညွှန်' : 'AgentFlow AI Quickstart & Guide'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'my' ? 'ဘယ်လိုစသုံးရမလဲနှင့် AI ၏ ခြေလက် Tool အဖြစ် သုံးပုံ' : 'How to use and using AgentFlow as an AI tool'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveSection('start')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeSection === 'start' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400'
            }`}
          >
            🚀 {lang === 'my' ? '1-Click အမြန်စမ်းသပ်ချက်များ' : '1-Click Interactive Demos'}
          </button>
          <button
            onClick={() => setActiveSection('concept')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeSection === 'concept' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400'
            }`}
          >
            🦾 {lang === 'my' ? 'AI ကို ခြေလက်တပ်ပေးခြင်း' : 'Workflow-as-a-Tool'}
          </button>
          <button
            onClick={() => setActiveSection('tabs')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeSection === 'tabs' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            📑 {lang === 'my' ? 'အဓိက အပိုင်းများ' : 'Studio Feature Breakdown'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* SECTION 1: 1-Click Quick Demos */}
          {activeSection === 'start' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-slate-200">
                <span className="font-semibold text-cyan-300">💡 လွယ်လွယ်ကူကူ စတင်ရန်:</span>{' '}
                {lang === 'my'
                  ? 'အောက်ပါ 1-Click Demo ခလုတ်များကို နှိပ်လိုက်ရုံဖြင့် စနစ်တစ်ခုလုံး အလုပ်လုပ်ပုံကို ချက်ချင်း မြင်တွေ့နိုင်ပါသည်။'
                  : 'Click any 1-Click demo below to see each feature run automatically.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Demo 1: Platform Inspector */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                      <Globe className="w-4 h-4" />
                      <span>{lang === 'my' ? 'Platform အလုပ်လုပ်ပုံ စစ်ဆေးမည်' : 'Inspect Platform Docs'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Firebase, Supabase စသည်တို့ ဘာအတွက်သုံးလဲ၊ အတွင်းပိုင်း ဘယ်လိုအလုပ်လုပ်လဲ တရားဝင် စစ်ဆေးပြမည်။
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTab('platform');
                    }}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{lang === 'my' ? 'Platform သွားစစ်မည်' : 'Open Platform Inspector'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Demo 2: AI Agent with Workflow Tool */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                      <Bot className="w-4 h-4" />
                      <span>{lang === 'my' ? 'AI Agent စတူဒီယို' : 'Autonomous AI Agent'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      AI က Search, Terminal, Sandbox နှင့် Workflow Tool များကို အသုံးပြု၍ ပန်းတိုင်ပြီးမြောက်အောင် လုပ်ဆောင်မည်။
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTab('agent');
                    }}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{lang === 'my' ? 'AI Agent စမ်းမည်' : 'Launch AI Agent'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Demo 3: Dev Studio Terminal & Sandbox */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                      <Terminal className="w-4 h-4" />
                      <span>{lang === 'my' ? 'Developer Terminal & Sandbox' : 'Terminal CLI & Code VM'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Terminal command များ ရိုက်ထည့်နိုင်ခြင်း၊ JavaScript ကုဒ်များ Run ခြင်းနှင့် ဖိုင်စနစ်သုံးနိုင်ခြင်း။
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTab('dev_studio');
                    }}
                    className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{lang === 'my' ? 'Terminal/Sandbox သို့သွားမည်' : 'Open Dev Studio'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Demo 4: Workflow Canvas */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                      <Workflow className="w-4 h-4" />
                      <span>{lang === 'my' ? 'Autoflow Workflow မောင်းနှင်မည်' : 'Run Pipeline Flow'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      အဆင့် (၄) ဆင့်ပါသော Pipeline ကို "Run Autoflow" ခလုတ်နှိပ်၍ အစအဆုံး အလိုအလျောက် မောင်းနှင်ကြည့်ပါ။
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTab('canvas');
                    }}
                    className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{lang === 'my' ? 'Workflow Canvas သွားမည်' : 'Open Workflow Canvas'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: AI ၏ ခြေလက်နှင့် Workflow-as-a-Tool */}
          {activeSection === 'concept' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-300 text-sm">
                  <Wrench className="w-4 h-4" />
                  <span>{lang === 'my' ? 'AI ကို ခြေလက်တပ်ပေးခြင်း နှင့် Workflow-as-a-Tool ဆိုတာဘာလဲ?' : 'Workflow-as-a-Tool Architecture'}</span>
                </div>
                <p className="text-slate-200">
                  {lang === 'my'
                    ? 'AI Model တစ်ခုတည်း (ဥပမာ ChatGPT, Gemini) သည် စာသားပြန်ပြောရုံသာ တတ်သည်။ သူ့မှာ လက်တွေ့ ကမ္ဘာနှင့် ချိတ်ဆက်ဆောင်ရွက်နိုင်သော "ခြေလက်များ" (Arms & Legs) မရှိပါ။'
                    : 'A raw LLM can only output text. Tools give the AI physical limbs to interact with the world.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-200">
                  {lang === 'my' ? 'AgentFlow AI က AI အား တပ်ဆင်ပေးထားသော ခြေလက်များ:' : 'Equipped Limbs & Tools:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-semibold">👀 မျက်စိ:</span> Live Web Search (အင်တာနက်ရှာဖွေခြင်း)
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-semibold">🔍 စုံစမ်းရေးမှူး:</span> Platform Docs & URL Inspector
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-semibold">🦾 လက်တွေ့သမား:</span> Code Sandbox & Virtual Terminal
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-teal-400 font-semibold">⏰ နာရီ:</span> Real Date & Time Engine
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'my' ? 'AgentFlow ကိုယ်တိုင်ကို AI ၏ Tool အဖြစ် သုံးနိုင်ခြင်း:' : 'Using AgentFlow as an AI Tool:'}</span>
                </div>
                <p className="text-slate-300">
                  {lang === 'my'
                    ? 'ဟုတ်ကဲ့၊ အပြည့်အဝ ရပါသည်! AI Agent Studio ထဲတွင် "run_agentflow_workflow" ဟူသော Tool ကို ထည့်သွင်းပေးထားပါသည်။ AI က တစ်ချက်ခေါ်လိုက်ရုံဖြင့် အဆင့်ဆင့် သွားရမည့် Workflow ကြီးတစ်ခုလုံး (ဥပမာ- Platform စစ်ဆေး $\rightarrow$ Code စမ်း $\rightarrow$ ပုံဆွဲ $\rightarrow$ DB သိမ်း) ကို အလိုအလျောက် ခိုင်းစေပြီး ရလဒ်ကို ပြန်ယူနိုင်ပါသည်။'
                    : 'Yes! The AI can invoke an entire pre-built AgentFlow pipeline via the "run_agentflow_workflow" tool.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: Tab Breakdown */}
          {activeSection === 'tabs' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Workflow className="w-4 h-4" />
                  <span>1. Autoflow Canvas:</span>
                </div>
                <p className="text-slate-400">
                  Node များကို ဆွဲယူချိတ်ဆက်ပြီး အလုပ်အသွားအလာများကို တစ်ဆင့်ချင်း မောင်းနှင်သည့် နေရာ။ ဖုန်းများတွင် "အဆင့်များ (Steps)" ခလုတ်ဖြင့် ဒေါင်လိုက် လွယ်ကူစွာ ကြည့်ရှုနိုင်သည်။
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  <span>2. AI Agent Studio:</span>
                </div>
                <p className="text-slate-400">
                  ကိုယ်တိုင် တွေးခေါ်နိုင်သော AI Agent အား ပန်းတိုင်တစ်ခု ပေးပြီး Tools များကို ကိုယ်တိုင် ရွေးချယ်အသုံးပြုခိုင်းနိုင်သည့် စတူဒီယို။
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>3. Platform Inspector:</span>
                </div>
                <p className="text-slate-400">
                  Firebase, Supabase စသည့် မည်သည့် ပလက်ဖောင်း၏ ရည်ရွယ်ချက်၊ အလုပ်လုပ်ပုံနှင့် SDK နမူနာကုဒ်များကို တရားဝင် စစ်ဆေးသည့် နေရာ။
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>4. Developer Terminal & Sandbox:</span>
                </div>
                <p className="text-slate-400">
                  CLI command များ ရိုက်ထည့်ရန်၊ JavaScript ကုဒ်များကို Node VM တွင် စမ်းသပ်ရန်နှင့် ဖိုင်များ သိမ်းဆည်းရန် နေရာ။
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>5. Visual Studio & Database:</span>
                </div>
                <p className="text-slate-400">
                  SVG ဗိသုကာပုံကြမ်းများ ထုတ်လုပ်ရန်နှင့် Firebase Firestore Blueprint ရယူရန် နေရာ။
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            {lang === 'my' ? 'နားလည်ပါပြီ / ပိတ်မည်' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
