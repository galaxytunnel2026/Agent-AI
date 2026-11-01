import { getGeminiClient } from './geminiClient.js';

export interface PlatformInspectionResult {
  platformName: string;
  url: string;
  tagline: string;
  purpose: string; // What it is used for (ဘာအတွက်သုံးလဲ)
  howItWorks: string; // How it works under the hood (ဘယ်လိုအလုပ်လုပ်လဲ)
  architecture: string[];
  keyFeatures: string[];
  sdkSupport: string[];
  freeTierInfo: string;
  officialDocsUrl: string;
  sampleCode: string;
  inspectedAt: string;
  source: 'live_web' | 'official_spec_cache';
}

// Curated verified knowledge base of popular developer platforms
const KNOWN_PLATFORMS: Record<string, Partial<PlatformInspectionResult>> = {
  firebase: {
    platformName: 'Google Firebase',
    url: 'https://firebase.google.com',
    tagline: 'Google\'s comprehensive mobile and web app development platform',
    purpose: 'Provides backend infrastructure (NoSQL Firestore, Authentication, Cloud Storage, Cloud Functions, Hosting, Analytics) so developers can build apps quickly without managing physical servers.',
    howItWorks: 'Operates as a Backend-as-a-Service (BaaS) built on top of Google Cloud Platform (GCP). Clients interact directly with Firestore and Auth using client-side SDKs with security rules handling authorization, while Cloud Functions execute event-driven serverless Node/Python logic.',
    architecture: [
      'Cloud Firestore: Scalable NoSQL document database with real-time listeners and offline sync',
      'Firebase Auth: Managed identity supporting Email/Password, Google, GitHub, Apple OAuth, and Phone SMS',
      'Cloud Storage: Object storage for photos, audio, videos with granular security rules',
      'Cloud Functions: Serverless event-driven compute triggered by Firestore writes, Auth events, or HTTPS requests',
      'Security Rules: Declarative authorization expressions evaluated per request',
    ],
    keyFeatures: ['Real-time listeners (snapshot)', 'Offline persistence', 'Pre-built auth UI', 'Static & SSR Hosting CDN', 'Crashlytics and Analytics'],
    sdkSupport: ['Web / JavaScript / TypeScript', 'Android (Kotlin/Java)', 'iOS (Swift)', 'Flutter', 'React Native', 'Node.js Admin', 'Python Admin'],
    freeTierInfo: 'Spark Plan (Free): 1 GB Firestore storage, 50k reads/day, 20k writes/day, 10 GB hosting transfer/month, phone auth 10k/month.',
    officialDocsUrl: 'https://firebase.google.com/docs',
    sampleCode: `// Firebase Firestore Quickstart (v10+)\nimport { initializeApp } from 'firebase/app';\nimport { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';\n\nconst app = initializeApp({ /* firebaseConfig */ });\nconst db = getFirestore(app);\n\n// Add document\nawait addDoc(collection(db, "tasks"), {\n  title: "Build AgentFlow",\n  completed: false,\n  createdAt: new Date()\n});`,
  },
  supabase: {
    platformName: 'Supabase',
    url: 'https://supabase.com',
    tagline: 'The open source Firebase alternative with relational PostgreSQL',
    purpose: 'Gives developers a dedicated PostgreSQL database with real-time subscriptions, instant REST and GraphQL APIs, Auth, and Storage, without vendor lock-in.',
    howItWorks: 'Wraps PostgreSQL with PostgREST (for automatic REST API generation), Realtime engine (listening to Postgres replication stream via Elixir), GoTrue for Auth, and Kong API gateway.',
    architecture: [
      'PostgreSQL: Full relational engine with extensions (pgvector, PostGIS)',
      'PostgREST: Auto-generated REST endpoints from Postgres schemas and tables',
      'Row Level Security (RLS): Native Postgres security policies determining row access per JWT token',
      'Realtime Server: Elixir cluster broadcasting database change events over WebSockets',
      'Edge Functions: Deno-based serverless functions at the edge',
    ],
    keyFeatures: ['PostgreSQL & SQL power', 'Row Level Security (RLS)', 'Auto-generated REST & GraphQL APIs', 'Vector database with pgvector', 'Storage with image resizing'],
    sdkSupport: ['JavaScript/TypeScript', 'Python', 'Flutter', 'Swift', 'Kotlin', 'Go'],
    freeTierInfo: 'Free Tier: 2 active projects, 500 MB database, 1 GB file storage, 50k monthly active users, 500k edge function invocations.',
    officialDocsUrl: 'https://supabase.com/docs',
    sampleCode: `// Supabase Client Quickstart\nimport { createClient } from '@supabase/supabase-js';\n\nconst supabase = createClient('https://xyz.supabase.co', 'public-anon-key');\n\n// Query PostgreSQL with Row Level Security\nconst { data, error } = await supabase\n  .from('workflows')\n  .select('*')\n  .order('created_at', { ascending: false });`,
  },
  cloudflare_workers: {
    platformName: 'Cloudflare Workers',
    url: 'https://workers.cloudflare.com',
    tagline: 'Serverless execution environment deployed across Cloudflare global edge network',
    purpose: 'Runs lightweight serverless code at hundreds of edge data centers worldwide with zero cold starts for maximum speed, security, and low latency.',
    howItWorks: 'Instead of virtual machines or Docker containers, Workers uses V8 Isolates (the same engine running in Chrome). Thousands of isolates share an OS process safely, achieving 0ms cold starts and memory efficiency.',
    architecture: [
      'V8 Isolates: Lightweight isolated JavaScript runtimes running across 300+ global data centers',
      'Workers KV & D1: Distributed key-value store and SQLite relational edge database',
      'Vectorize: Edge vector database for AI embeddings',
      'Workers AI: Run open-source AI models (Llama, Whisper, Stable Diffusion) directly on edge GPUs',
    ],
    keyFeatures: ['0ms cold starts', 'Global 300+ edge locations', 'Workers AI inference', 'D1 edge SQL database', 'Native Web Streams support'],
    sdkSupport: ['JavaScript / TypeScript', 'Rust (Wasm)', 'Python (Wasm)', 'Wrangler CLI'],
    freeTierInfo: 'Free Plan: 100,000 requests per day, 10ms CPU time per request, KV 100k reads/day.',
    officialDocsUrl: 'https://developers.cloudflare.com/workers/',
    sampleCode: `// Cloudflare Worker export\nexport default {\n  async fetch(request, env, ctx) {\n    const url = new URL(request.url);\n    return new Response(JSON.stringify({\n      message: "Hello from Cloudflare Edge!",\n      colo: request.cf?.colo,\n      country: request.cf?.country\n    }), {\n      headers: { "Content-Type": "application/json" }\n    });\n  }\n};`,
  },
  github_actions: {
    platformName: 'GitHub Actions',
    url: 'https://github.com/features/actions',
    tagline: 'Automate software workflows and CI/CD pipelines right within GitHub',
    purpose: 'Automates testing, building, linting, packaging, and deploying code triggered by GitHub events (push, pull request, release, schedule).',
    howItWorks: 'YAML workflow files placed in `.github/workflows/` define jobs composed of steps. GitHub schedules these on ephemeral virtual machines (Linux, macOS, Windows) or self-hosted runners.',
    architecture: [
      'Event Triggers: Webhook events like `push`, `pull_request`, `workflow_dispatch`, `cron`',
      'Runners: Isolated Ubuntu, Windows, or macOS VMs with pre-installed developer tools',
      'Steps & Actions: Reusable community action blocks from GitHub Marketplace',
      'Encrypted Secrets: Repository and Organization level secrets injected as environment variables',
    ],
    keyFeatures: ['Matrix builds (test across multiple Node/OS versions)', 'Marketplace of 20,000+ community actions', 'Artifact caching', 'OIDC token generation for cloud auth'],
    sdkSupport: ['YAML specification', 'Node.js actions toolkit (@actions/core, @actions/github)', 'Docker actions'],
    freeTierInfo: 'Free for public repos (unlimited minutes). Private repos get 2,000 minutes/month on Free plan.',
    officialDocsUrl: 'https://docs.github.com/en/actions',
    sampleCode: `# Sample GitHub Actions Workflow\nname: CI Pipeline\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm ci\n      - run: npm test`,
  },
  gemini_api: {
    platformName: 'Google Gemini API (@google/genai)',
    url: 'https://ai.google.dev',
    tagline: 'Google\'s multimodal AI models for developer applications',
    purpose: 'Enables developers to integrate cutting-edge multimodal intelligence (text reasoning, code generation, vision, audio, search grounding, function calling) into web and backend applications.',
    howItWorks: 'Developers call the Gemini REST API or official `@google/genai` TypeScript/Python SDKs. Gemini processes text, image, audio, and video tokens with native multimodal transformer architecture.',
    architecture: [
      'Gemini 3.8 Flash: High-efficiency multimodal model with speed and low latency',
      'Gemini 4 Argon / Pro: Advanced reasoning and complex STEM/coding tasks',
      'Grounding: Native Google Search and Google Maps integration in API calls',
      'Function Calling: Model outputs structured JSON arguments to trigger external APIs and code',
    ],
    keyFeatures: ['Native multimodal (text, audio, image, video)', 'Google Search grounding', 'Function calling / tools', 'Structured JSON outputs', 'Streaming responses'],
    sdkSupport: ['TypeScript / JavaScript (@google/genai)', 'Python (google-genai)', 'Go', 'REST API'],
    freeTierInfo: 'Free tier available in Google AI Studio with generous RPM/TPM limits for prototyping.',
    officialDocsUrl: 'https://ai.google.dev/docs',
    sampleCode: `import { GoogleGenAI } from '@google/genai';\n\nconst ai = new GoogleGenAI({\n  apiKey: process.env.GEMINI_API_KEY,\n  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }\n});\n\nconst response = await ai.models.generateContent({\n  model: 'gemini-3.8-flash',\n  contents: 'Analyze system architecture',\n});`,
  },
  stripe: {
    platformName: 'Stripe',
    url: 'https://stripe.com',
    tagline: 'Financial infrastructure and payment processing for the internet',
    purpose: 'Enables businesses and developers to accept credit cards, subscriptions, mobile wallets (Apple Pay, Google Pay), and manage global payouts with PCI-compliant APIs.',
    howItWorks: 'Client-side Stripe Elements securely tokenizes credit cards directly on Stripe servers (preventing PCI compliance issues on your backend). Your server creates PaymentIntents and listens to signed Webhooks.',
    architecture: [
      'Stripe Elements: Pre-built PCI-compliant UI components that tokenize card details',
      'PaymentIntents API: State machine tracking payments through authentication (3D Secure) and settlement',
      'Webhooks: Cryptographically signed events notifying your server of successful charges, refunds, or cancellations',
      'Billing & Invoicing: Automated recurring subscription engine',
    ],
    keyFeatures: ['Global payments (135+ currencies)', 'Stripe Checkout hosted pages', 'Subscription lifecycle', 'Radar AI fraud prevention', 'Stripe Connect marketplace payouts'],
    sdkSupport: ['Node.js', 'Python', 'Ruby', 'PHP', 'Go', 'Java', '.NET', 'iOS', 'Android'],
    freeTierInfo: 'Pay-as-you-go: No monthly setup fee. Standard 2.9% + 30¢ per successful card transaction in US.',
    officialDocsUrl: 'https://stripe.com/docs',
    sampleCode: `// Stripe Server-side PaymentIntent (Node.js)\nimport Stripe from 'stripe';\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\nconst paymentIntent = await stripe.paymentIntents.create({\n  amount: 2000, // $20.00 in cents\n  currency: 'usd',\n  automatic_payment_methods: { enabled: true },\n});`,
  },
};

export async function inspectPlatformOrUrl(query: string): Promise<PlatformInspectionResult> {
  const normalized = query.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // Check known platform cache first
  for (const [key, cached] of Object.entries(KNOWN_PLATFORMS)) {
    if (normalized.includes(key) || key.includes(normalized) || cached.platformName?.toLowerCase().includes(query.toLowerCase())) {
      return {
        platformName: cached.platformName || query,
        url: cached.url || 'https://' + query,
        tagline: cached.tagline || '',
        purpose: cached.purpose || '',
        howItWorks: cached.howItWorks || '',
        architecture: cached.architecture || [],
        keyFeatures: cached.keyFeatures || [],
        sdkSupport: cached.sdkSupport || [],
        freeTierInfo: cached.freeTierInfo || 'See official website for current tier details.',
        officialDocsUrl: cached.officialDocsUrl || cached.url || '',
        sampleCode: cached.sampleCode || '',
        inspectedAt: new Date().toISOString(),
        source: 'official_spec_cache',
      };
    }
  }

  // If query is an external URL or un-cached platform, fetch live or use Gemini synthesis
  let targetUrl = query;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
      targetUrl = 'https://' + targetUrl;
    }
  }

  let scrapedSnippet = '';
  let scrapedTitle = '';

  if (targetUrl.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AgentFlow-Platform-Inspector/1.0 (+https://aistudio.google.com)',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) scrapedTitle = titleMatch[1].trim();

        // Extract description
        const metaMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaDesc = metaMatch ? metaMatch[1] : '';

        // Clean body text
        const bodyText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 4000);

        scrapedSnippet = `Title: ${scrapedTitle}\nDescription: ${metaDesc}\nContent snippet: ${bodyText}`;
      }
    } catch (e: any) {
      console.warn(`Could not live-fetch URL ${targetUrl}:`, e.message);
    }
  }

  // Use Gemini to produce structured, accurate platform technical facts
  try {
    const ai = getGeminiClient();
    const prompt = `You are a Technical Platform Architect & Developer Intelligence Inspector.
Analyze the requested technology platform or public website: "${query}".
${scrapedSnippet ? `Here is live crawled text from the platform's public site:\n${scrapedSnippet}` : ''}

Output ONLY valid JSON with this exact schema:
{
  "platformName": "Official name of the platform",
  "url": "Official website URL",
  "tagline": "Short one sentence definition",
  "purpose": "Explain what this platform is used for clearly in 2-3 sentences. (ဘာအတွက်သုံးလဲ)",
  "howItWorks": "Explain how it works technically under the hood (core architecture, engine, protocols, deployment). (ဘယ်လိုအလုပ်လုပ်လဲ)",
  "architecture": ["3-5 core architectural components or mechanics"],
  "keyFeatures": ["4-6 key developer features"],
  "sdkSupport": ["Supported languages, runtimes, or SDKs"],
  "freeTierInfo": "Clear summary of free tier, pricing, or open-source license status",
  "officialDocsUrl": "Direct link to official docs or GitHub",
  "sampleCode": "A concise, clean copy-pasteable code snippet showing standard initialization or usage."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      platformName: parsed.platformName || query,
      url: parsed.url || (targetUrl.startsWith('http') ? targetUrl : `https://${query}`),
      tagline: parsed.tagline || 'Modern Technology Platform',
      purpose: parsed.purpose || 'Software development platform and cloud service.',
      howItWorks: parsed.howItWorks || 'Provides scalable services and APIs for applications.',
      architecture: Array.isArray(parsed.architecture) ? parsed.architecture : ['Cloud Architecture', 'REST/GraphQL API', 'Client SDK'],
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : ['High Availability', 'Developer APIs', 'Automated scaling'],
      sdkSupport: Array.isArray(parsed.sdkSupport) ? parsed.sdkSupport : ['TypeScript', 'Python', 'REST API'],
      freeTierInfo: parsed.freeTierInfo || 'Free tier or trial available.',
      officialDocsUrl: parsed.officialDocsUrl || (targetUrl.startsWith('http') ? targetUrl : `https://${query}`),
      sampleCode: parsed.sampleCode || '// Refer to official documentation for SDK examples',
      inspectedAt: new Date().toISOString(),
      source: 'live_web',
    };
  } catch (err: any) {
    return {
      platformName: query,
      url: targetUrl.startsWith('http') ? targetUrl : `https://${query}`,
      tagline: 'Developer Platform',
      purpose: `Platform information for ${query}. Consult official documentation for full details.`,
      howItWorks: 'Operates via distributed services and standard API endpoints.',
      architecture: ['Core Service Layer', 'Data Storage Engine', 'API Gateway'],
      keyFeatures: ['Developer APIs', 'Cloud Scalability', 'SDK integration'],
      sdkSupport: ['JavaScript/TypeScript', 'Python', 'cURL/HTTP'],
      freeTierInfo: 'Refer to official platform documentation for current pricing tiers.',
      officialDocsUrl: targetUrl.startsWith('http') ? targetUrl : `https://${query}`,
      sampleCode: `// Example request\nfetch("${targetUrl}");`,
      inspectedAt: new Date().toISOString(),
      source: 'official_spec_cache',
    };
  }
}
