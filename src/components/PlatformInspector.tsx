import { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Code,
  Layers,
  Cpu,
  CheckCircle2,
  DollarSign,
  Copy,
  Check,
  Play,
  Loader2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { PlatformInspectionResult } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { Language, translations } from '../lib/translations.ts';

interface PlatformInspectorProps {
  lang: Language;
  onSendCodeToSandbox?: (code: string) => void;
}

export function PlatformInspector({ lang, onSendCodeToSandbox }: PlatformInspectorProps) {
  const t = translations[lang];

  const [query, setQuery] = useState('Firebase');
  const [result, setResult] = useState<PlatformInspectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const presets = [
    { label: 'Google Firebase', value: 'Firebase' },
    { label: 'Supabase (PostgreSQL)', value: 'Supabase' },
    { label: 'Cloudflare Workers', value: 'Cloudflare Workers' },
    { label: 'GitHub Actions', value: 'GitHub Actions' },
    { label: 'Google Gemini API', value: 'Gemini API' },
    { label: 'Stripe Payments', value: 'Stripe' },
  ];

  const handleInspect = async (targetQuery = query) => {
    if (!targetQuery.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await api.inspectPlatform(targetQuery.trim());
      setResult(data);
    } catch (e: any) {
      alert(`Platform inspection error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleInspect('Firebase');
  }, []);

  const handleCopyCode = () => {
    if (!result?.sampleCode) return;
    navigator.clipboard.writeText(result.sampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header & Description */}
        <div className="text-center max-w-2xl mx-auto px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2.5">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.inspectPlatformTitle}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white mb-2">
            {lang === 'my'
              ? 'Platform များနှင့် Website အလုပ်လုပ်ပုံကို တရားဝင်အချက်အလက်များဖြင့် စစ်ဆေးခြင်း'
              : 'Official Platform Architecture & Website Intelligence Inspector'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.inspectPlatformDesc}
          </p>
        </div>

        {/* Search Bar & Quick Presets (Mobile Responsive) */}
        <div className="p-3.5 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInspect();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={t.searchPlatformPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{isLoading ? 'Inspecting...' : t.inspectBtn}</span>
            </button>
          </form>

          {/* Quick Presets (Swipeable on Android) */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto whitespace-nowrap scrollbar-none py-1 sm:flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1 shrink-0">{t.quickPresets}:</span>
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setQuery(p.value);
                  handleInspect(p.value);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors shrink-0 min-h-[34px] flex items-center ${
                  result?.platformName.toLowerCase().includes(p.value.toLowerCase())
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-200">
              {lang === 'my' ? 'တရားဝင် အချက်အလက်များနှင့် Architecture ကို ဆန်းစစ်နေပါသည်...' : 'Inspecting official documentation and platform specs...'}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Parsing platform mechanics, SDKs, and free tier limitations
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">{result.platformName}</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {result.source.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{result.tagline}</p>
              </div>

              <div className="flex items-center gap-2">
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Official Site</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                {result.officialDocsUrl && (
                  <a
                    href={result.officialDocsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-950/60 rounded-lg border border-emerald-800/60 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Documentation</span>
                    <ExternalLink className="w-3 h-3 text-emerald-500" />
                  </a>
                )}
              </div>
            </div>

            {/* Core Columns: Purpose vs How It Works */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purpose (ဘာအတွက်သုံးလဲ) */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.purposeHeading}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{result.purpose}</p>
              </div>

              {/* How it works under the hood (လုပ်ဆောင်ပုံ) */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>{t.howItWorksHeading}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{result.howItWorks}</p>
              </div>
            </div>

            {/* Architecture Components & Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Architecture */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>{t.architectureHeading}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {result.architecture.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Features */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>{t.keyFeaturesHeading}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {result.keyFeatures.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Supported SDKs & Free Tier Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SDKs */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  <span>{t.sdkHeading}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.sdkSupport.map((sdk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[11px] font-mono text-slate-200 bg-slate-800 rounded border border-slate-700"
                    >
                      {sdk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Free Tier Info */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{t.freeTierHeading}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.freeTierInfo}</p>
              </div>
            </div>

            {/* Sample SDK Code */}
            {result.sampleCode && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span>{t.sampleCodeHeading}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onSendCodeToSandbox && (
                      <button
                        onClick={() => onSendCodeToSandbox(result.sampleCode)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-white bg-cyan-600 hover:bg-cyan-500 rounded font-medium transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run in Sandbox</span>
                      </button>
                    )}
                  </div>
                </div>

                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed">
                  {result.sampleCode}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
