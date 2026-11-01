import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  Loader2,
  Code2,
  RefreshCw,
  Palette,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { GeneratedImageRecord } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface ImageStudioProps {
  lang: Language;
}

export function ImageStudio({ lang }: ImageStudioProps) {
  const t = translations[lang];

  const [prompt, setPrompt] = useState(
    'Cloud serverless autonomous AI agent microservices architecture diagram with data streams and vector database'
  );
  const [style, setStyle] = useState('minimalist modern technical blueprint');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageRecord | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageRecord[]>([]);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const stylePresets = [
    'minimalist modern technical blueprint',
    'isometric cloud architecture diagram',
    'modern dark-mode web application UI mockup',
    'vector network topology flowchart',
    'cyberpunk developer terminal visual art',
  ];

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const list = await api.getImages();
      setGallery(list);
      if (list.length > 0 && !currentImage) {
        setCurrentImage(list[0]);
      }
    } catch (e: any) {
      console.error('Failed to load gallery:', e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await api.generateImage(prompt, style);
      setCurrentImage(res);
      setGallery((prev) => [res, ...prev]);
    } catch (e: any) {
      alert(`Generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage?.svgDataUrl) return;
    const a = document.createElement('a');
    a.href = currentImage.svgDataUrl;
    a.download = `agentflow_visual_${currentImage.id}.svg`;
    a.click();
  };

  const handleCopySvg = () => {
    if (!currentImage?.svgDataUrl) return;
    const svgCode = decodeURIComponent(currentImage.svgDataUrl.replace('data:image/svg+xml;utf8,', ''));
    navigator.clipboard.writeText(svgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium mb-2.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t.tabImageStudio}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white mb-2">
            {lang === 'my' ? 'AI နည်းပညာသုံး ရုပ်ပုံနှင့် ဗိသုကာပုံကြမ်း ထုတ်လုပ်ရေး စတူဒီယို' : 'AI Visual & Architecture Diagram Generator'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {lang === 'my'
              ? 'AgentFlow အတွက် System Architecture, Vector Graphic နှင့် Technical Diagrams များကို တစ်ချက်နှိပ်ရုံဖြင့် ထုတ်လုပ်နိုင်ပါသည်။'
              : 'Generate scalable vector architecture diagrams, UI concepts, and visual assets with instant SVG export.'}
          </p>
        </div>

        {/* Input & Style Controls */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {lang === 'my' ? 'ရုပ်ပုံ ဖော်ပြချက် (Visual Prompt):' : 'Visual Concept Prompt:'}
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the technical diagram, UI layout, or illustration you need..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Style Presets (Swipeable on Android) */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-1.5">Visual Style:</div>
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-1 sm:flex-wrap">
              {stylePresets.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors shrink-0 min-h-[34px] flex items-center ${
                    style === s
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-medium'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 rounded-xl shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? 'Rendering Vector Visual...' : 'Generate AI Visual'}</span>
            </button>
          </div>
        </div>

        {/* Display Canvas */}
        {currentImage && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/60">
              <div className="truncate max-w-md">
                <div className="text-xs font-semibold text-slate-200 truncate">{currentImage.prompt}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {currentImage.style} · {currentImage.dimensions}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors min-h-[36px]"
                >
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showCode ? 'View Graphic' : 'Inspect SVG'}</span>
                </button>

                <button
                  onClick={handleCopySvg}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors min-h-[36px]"
                >
                  {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSvg ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Canvas or SVG source */}
            <div className="p-6 flex items-center justify-center bg-slate-950/80 min-h-[380px]">
              {showCode ? (
                <pre className="w-full max-h-96 overflow-auto p-4 bg-slate-900 rounded-xl font-mono text-[11px] text-emerald-300 leading-relaxed">
                  {decodeURIComponent(currentImage.svgDataUrl?.replace('data:image/svg+xml;utf8,', '') || '')}
                </pre>
              ) : currentImage.svgDataUrl ? (
                <div className="w-full max-w-3xl aspect-[4/3] rounded-xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950">
                  <img
                    src={currentImage.svgDataUrl}
                    alt={currentImage.prompt}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : currentImage.imageUrl ? (
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.prompt}
                  className="w-full max-w-2xl rounded-xl object-contain"
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 1 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-slate-300">Generated Assets Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCurrentImage(item);
                    setShowCode(false);
                  }}
                  className={`p-2 rounded-xl border bg-slate-900/60 cursor-pointer transition-all hover:scale-[1.02] ${
                    currentImage?.id === item.id ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                  }`}
                >
                  <div className="aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden mb-1.5 flex items-center justify-center">
                    {item.svgDataUrl ? (
                      <img src={item.svgDataUrl} alt={item.prompt} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-300 truncate">{item.prompt}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{new Date(item.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
