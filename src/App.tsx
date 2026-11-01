/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ActiveTab } from './types/index.ts';
import { Language } from './lib/translations.ts';
import { Header } from './components/Header.tsx';
import { WorkflowCanvas } from './components/WorkflowCanvas.tsx';
import { AgentPlayground } from './components/AgentPlayground.tsx';
import { PlatformInspector } from './components/PlatformInspector.tsx';
import { DevStudio } from './components/DevStudio.tsx';
import { ImageStudio } from './components/ImageStudio.tsx';
import { DatabaseCenter } from './components/DatabaseCenter.tsx';
import { QuickGuideModal } from './components/QuickGuideModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('canvas');
  const [lang, setLang] = useState<Language>('my'); // Default to Myanmar as requested by user
  const [sandboxPresetCode, setSandboxPresetCode] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleSendCodeToSandbox = (code: string) => {
    setSandboxPresetCode(code);
    setActiveTab('dev_studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Main Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Quickstart Guide Modal */}
      <QuickGuideModal
        lang={lang}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsGuideOpen(false);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14 lg:pb-0">
        {activeTab === 'canvas' && (
          <WorkflowCanvas lang={lang} />
        )}

        {activeTab === 'agent' && (
          <AgentPlayground lang={lang} />
        )}

        {activeTab === 'platform' && (
          <PlatformInspector
            lang={lang}
            onSendCodeToSandbox={handleSendCodeToSandbox}
          />
        )}

        {activeTab === 'dev_studio' && (
          <DevStudio
            lang={lang}
            initialCode={sandboxPresetCode}
          />
        )}

        {activeTab === 'image_studio' && (
          <ImageStudio lang={lang} />
        )}

        {activeTab === 'database' && (
          <DatabaseCenter lang={lang} />
        )}
      </main>
    </div>
  );
}
