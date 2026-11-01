import {
  Workflow as WorkflowIcon,
  Bot,
  Search,
  Terminal,
  Image,
  Database,
  Play,
  Languages,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab } from '../types/index.ts';
import { translations, Language } from '../lib/translations.ts';
import { DateTimeWidget } from './DateTimeWidget.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onRunWorkflow?: () => void;
  isExecuting?: boolean;
  onOpenGuide?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onRunWorkflow,
  isExecuting = false,
  onOpenGuide,
}: HeaderProps) {
  const t = translations[lang];

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'canvas', label: t.tabCanvas, icon: WorkflowIcon },
    { id: 'agent', label: t.tabAgent, icon: Bot },
    { id: 'platform', label: t.tabPlatform, icon: Search },
    { id: 'dev_studio', label: t.tabDevStudio, icon: Terminal },
    { id: 'image_studio', label: t.tabImageStudio, icon: Image },
    { id: 'database', label: t.tabDatabase, icon: Database },
  ];

  return (
    <>
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20">
              <WorkflowIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-white">{t.appTitle}</span>
                <span className="text-[10px] font-mono text-cyan-400 font-medium hidden xs:inline">v2.5</span>
              </div>
              <div className="text-[11px] text-slate-400 hidden xl:block leading-none">
                {t.appSubtitle}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap min-h-[36px] ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Date Time Engine */}
            <DateTimeWidget lang={lang} />

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'my' : 'en')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors min-h-[36px] min-w-[44px] justify-center"
              title="Switch Language (မြန်မာ / English)"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono text-[11px] font-bold">{lang === 'en' ? 'MY' : 'EN'}</span>
            </button>

            {/* Quickstart Guide Button */}
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors min-h-[36px]"
                title="How to Use / Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden xs:inline">{lang === 'my' ? 'လမ်းညွှန်' : 'Guide'}</span>
              </button>
            )}

            {/* Quick Run button if in canvas */}
            {activeTab === 'canvas' && onRunWorkflow && (
              <button
                onClick={onRunWorkflow}
                disabled={isExecuting}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md shadow-sm shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer min-h-[36px]"
              >
                <Play className={`w-3.5 h-3.5 fill-current shrink-0 ${isExecuting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isExecuting ? t.running : t.runWorkflow}</span>
                <span className="sm:hidden">{isExecuting ? '...' : 'Run'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Android Bottom Navigation Bar (Visible on mobile/tablet < 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-1 py-1 safe-area-bottom">
        <div className="grid grid-cols-6 gap-0.5 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all min-h-[48px] touch-manipulation ${
                  isActive
                    ? 'text-cyan-400 bg-slate-800/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 shrink-0 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
                <span className="text-[9px] truncate max-w-full leading-tight font-medium">
                  {item.id === 'canvas'
                    ? (lang === 'my' ? 'Autoflow' : 'Flow')
                    : item.id === 'agent'
                    ? (lang === 'my' ? 'Agent' : 'Agent')
                    : item.id === 'platform'
                    ? (lang === 'my' ? 'Platform' : 'Platform')
                    : item.id === 'dev_studio'
                    ? (lang === 'my' ? 'Dev' : 'Dev')
                    : item.id === 'image_studio'
                    ? (lang === 'my' ? 'Visual' : 'Visual')
                    : (lang === 'my' ? 'Data' : 'Data')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
