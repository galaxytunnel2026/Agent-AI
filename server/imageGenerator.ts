import { getGeminiClient } from './geminiClient.js';
import { db, GeneratedImageRecord } from './database.js';

export async function generateAgentImage(prompt: string, style = 'modern tech illustration'): Promise<GeneratedImageRecord> {
  const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const ai = getGeminiClient();

  // Primary: Photorealistic or Artistic URL via Pollinations
  const encodedPrompt = encodeURIComponent(`${prompt}, ${style}, high resolution, 8k, professional graphic design`);
  const liveImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

  // Secondary: Generate a bespoke high-precision vector SVG diagram / visual asset using Gemini
  let svgContent = '';
  try {
    const svgPrompt = `You are an expert SVG Vector Graphic Designer and Technical Illustrator.
Generate a complete, beautiful, modern, standalone SVG image for this request: "${prompt}".
Style: ${style}.
Guidelines:
1. Output ONLY valid, standalone SVG code starting with <svg> and ending with </svg>.
2. Use viewBox="0 0 800 600", width="100%", height="100%".
3. Include modern gradients (<linearGradient>), drop shadows (<filter>), sleek rounded rectangles, elegant developer/tech iconography, clean typography (<text> with sans-serif font).
4. Do NOT output any markdown backticks, no explanations. Just raw <svg>...</svg>.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: svgPrompt,
    });

    const raw = response.text || '';
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      svgContent = svgMatch[0];
    }
  } catch (e: any) {
    console.warn('SVG generation fallback:', e.message);
  }

  if (!svgContent) {
    // Elegant fallback SVG
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgGrad)" rx="16"/>
      <circle cx="400" cy="240" r="80" fill="#3b82f6" fill-opacity="0.2" stroke="#60a5fa" stroke-width="2"/>
      <text x="400" y="245" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="700" text-anchor="middle">AgentFlow Visual</text>
      <text x="400" y="340" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" text-anchor="middle">${prompt.slice(0, 50)}</text>
    </svg>`;
  }

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

  const record: GeneratedImageRecord = {
    id,
    prompt,
    style,
    imageUrl: liveImageUrl,
    svgDataUrl,
    createdAt: new Date().toISOString(),
    dimensions: '1024x1024',
  };

  db.saveGeneratedImage(record);
  return record;
}
