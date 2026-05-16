'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PenLine, Sparkles, History, X, TrendingUp, Trophy, Sparkle, 
  Wallet, Zap, HelpCircle, Users, Heart, Loader2, Cloud, 
  Gamepad2, ArrowRight, BrainCircuit, Activity, Lightbulb, Info
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';

// --- Global Environment Handling ---
// Safe access using globalThis with type casting to bypass strict TypeScript checks on Vercel
const getFirebaseConfig = () => {
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  if (typeof g.__firebase_config !== 'undefined' && g.__firebase_config) {
    try {
      return JSON.parse(g.__firebase_config);
    } catch (e) {
      console.error("Failed to parse local environment firebase config:", e);
    }
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
};

const firebaseConfig = getFirebaseConfig();
const appId = typeof (globalThis as any).__app_id !== 'undefined' && (globalThis as any).__app_id 
  ? (globalThis as any).__app_id 
  : 'truself-suite';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATASET: 52+ Original Coaching Questions ---
const DOMAINS: Record<string, { title: string, color: string, icon: React.ReactNode, questions: string[] }> = {
  ADVANCEMENT: { 
    title: "Advancement", color: "#6366F1", icon: <TrendingUp className="w-5 h-5" />, 
    questions: [
      "Where is your execution discipline currently slipping?",
      "What is one adaptable plan you can create for your biggest goal today?",
      "Looking ahead 3 years, what foresight would your future self give you now?",
      "What is the 'next level' of your craft that you are currently avoiding?",
      "Which habit is currently the bottleneck for your professional growth?",
      "If you had to double your output with half the time, what would you cut?",
      "What is the most uncomfortable conversation you need to have to move forward?"
    ] 
  },
  ACHIEVEMENT: { 
    title: "Achievement", color: "#D97706", icon: <Trophy className="w-5 h-5" />, 
    questions: [
      "What does 'winning' look like for you in this current season?",
      "Which of your current credentials are you most proud of?",
      "Are you playing the right 'game' in your career?",
      "What was a 'loss' this month that actually taught you how to win?",
      "Who are you currently competing with, and is that competition healthy?",
      "What legacy is your current work building?",
      "If you achieved your 10-year goal in 6 months, who would you have to become?"
    ] 
  },
  CREATION_CHOICE: { 
    title: "Creation/Choice", color: "#4338CA", icon: <Sparkle className="w-5 h-5" />, 
    questions: [
      "If you were to reinvent yourself tomorrow, what's the first change?",
      "What past limitation is currently keeping you from a new possibility?",
      "What are you currently 'choosing' by default rather than by design?",
      "Where in your life are you acting like a spectator instead of a creator?",
      "If you had zero fear of judgment, what would you create today?",
      "What 'rule' are you following that doesn't actually exist?",
      "What is the most creative solution to your biggest current problem?"
    ] 
  },
  RESOURCE_GAINING: { 
    title: "Resource Gaining", color: "#B45309", icon: <Wallet className="w-5 h-5" />, 
    questions: [
      "How stable is your current financial foundation (1-10)?",
      "What is one 'material' need that would unlock your productivity?",
      "What is your relationship with 'abundance' vs 'scarcity' right now?",
      "Where are you leaking resources (time, money, energy)?",
      "What new skill would be the most valuable resource for your future?",
      "Are you managing your tools, or are your tools managing you?",
      "What is the best investment you could make in yourself this week?"
    ] 
  },
  VITALITY: { 
    title: "Vitality", color: "#4F46E5", icon: <Zap className="w-5 h-5" />, 
    questions: [
      "What is your current energy level? Biggest drain?",
      "When was the last time you felt truly vibrant?",
      "What does your body need from you that you are currently ignoring?",
      "How does your physical environment affect your mental clarity?",
      "What is one ritual that consistently restores your power?",
      "If your health was a project, would it be 'on track' or 'failing'?",
      "What is the the one thing you can stop doing to instantly feel better?"
    ] 
  },
  DREAMS_PASSIONS: { 
    title: "Dreams/Passions", color: "#F59E0B", icon: <HelpCircle className="w-5 h-5" />, 
    questions: [
      "What activity makes you lose track of time entirely?",
      "What is one contribution you want to be remembered for?",
      "What dream did you set aside because it felt 'unrealistic'?",
      "If money were no object, how would you spend your Tuesday morning?",
      "What currently makes your heart race with excitement?",
      "Whose life are you currently envious of, and what does that tell you?",
      "What is the most 'daring' thing you've ever thought about doing?"
    ] 
  },
  PEOPLE: { 
    title: "People", color: "#312E81", icon: <Users className="w-5 h-5" />, 
    questions: [
      "Who in your network is currently challenging you to grow?",
      "What boundary do you need to set with a person in your life?",
      "Who are you currently holding a grudge against, and what is it costing you?",
      "Who is the most 'generous' person you know? How can you emulate them?",
      "What is one thing you've been meaning to say to someone but haven't?",
      "Are you surrounding yourself with people who pull you up or push you down?",
      "What would your closest friend say is your greatest blind spot?"
    ] 
  },
  CONNECTION: { 
    title: "Connection", color: "#92400E", icon: <Heart className="w-5 h-5" />, 
    questions: [
      "How can you develop more 'presence' today?",
      "Who do you need to have a deep, honest conversation with?",
      "When do you feel most 'seen' and understood by others?",
      "What is the difference between your 'public' self and your 'private' self?",
      "How do you currently block intimacy or deep connection?",
      "What would happen if you were 10% more vulnerable today?",
      "Where in your life are you lonely, even when people are around?"
    ] 
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('spin');
  const [user, setUser] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showGachaResult, setShowGachaResult] = useState<boolean>(false);
  const [gachaResult, setGachaResult] = useState<any>(null);
  const [leverAngle, setLeverAngle] = useState<number>(0);
  const [balls, setBalls] = useState<any[]>([]);
  const [diaryEntry, setDiaryEntry] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diaryAnalysis, setDiaryAnalysis] = useState<any>(null);
  const [diaryHistory, setDiaryHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [journalingPrompt, setJournalingPrompt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Auth Setup ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
        if (typeof g.__initial_auth_token !== 'undefined' && g.__initial_auth_token) {
          await signInWithCustomToken(auth, g.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error", err);
        setErrorMessage("Failed to authenticate session.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (!user) return;
    const entriesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'entries');
    const unsubscribe = onSnapshot(entriesCol, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDiaryHistory(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (error) => {
      console.error("Firestore Listen Error", error);
    });
    return () => unsubscribe();
  }, [user]);

  // --- Initialize Gacha Balls ---
  useEffect(() => {
    setBalls(Array.from({ length: 24 }).map((_, i) => ({
      id: i, 
      x: 10 + Math.random() * 65, 
      y: 40 + Math.random() * 30,
      color: Object.values(DOMAINS)[Math.floor(Math.random() * 8)].color,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.4
    })));
  }, []);

  const spinGacha = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLeverAngle(p => p + 720);
    const domainKeys = Object.keys(DOMAINS);
    const domain = DOMAINS[domainKeys[Math.floor(Math.random() * domainKeys.length)]];
    const question = domain.questions[Math.floor(Math.random() * domain.questions.length)];
    
    setTimeout(() => {
      setGachaResult({ ...domain, question });
      setShowGachaResult(true);
      setIsSpinning(false);
    }, 1800);
  }, [isSpinning]);

  // --- Dual-Mode Fetch: Local Route Proxy with Direct AI Studio Fallback ---
  const analyzeWithGemini = async () => {
    if (!diaryEntry.trim() || !user) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let aiData;

      // 1. Try local server-side endpoint first (for production Vercel environments)
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diaryEntry })
        });

        if (res.ok) {
          aiData = await res.json();
          if (aiData.error) throw new Error(aiData.error);
        } else if (res.status === 404 || res.status === 405) {
          // If 404/405, we are likely in the Canvas Preview or a mock deployment environment.
          // Force a direct API fallback!
          throw new Error("API_FALLBACK_REQUIRED");
        } else {
          const errText = await res.text();
          throw new Error(errText || "Backend server encountered an issue.");
        }
      } catch (localErr: any) {
        // If local proxy fetch fails or isn't hosted, run a Direct call with exponential backoff on client side
        if (localErr.message === "API_FALLBACK_REQUIRED" || localErr.message.includes("Failed to fetch") || localErr.message.includes("Failed to parse URL")) {
          
          const apiKey = ""; // Canvas secures and auto-injects this at runtime
          const systemPrompt = `You are the "TruSelf Master Behavioral Coach". Respond ONLY in valid JSON: {"summary": "deep synthesis (2 sentences)", "topDomain": "TruSelf Domain", "emotionalUndertone": "emotions masked", "patternDiagnosis": "Identify life pattern", "worthConsidering": "Strategic advice", "coachingQuestion": "sharp question"}`;

          const fetchDirectWithRetry = async (retries = 5, delay = 1000): Promise<any> => {
            try {
              // Standard client-side fallback endpoint
              const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
                  generationConfig: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "OBJECT",
                      properties: {
                        summary: { type: "STRING" },
                        topDomain: { type: "STRING" },
                        emotionalUndertone: { type: "STRING" },
                        patternDiagnosis: { type: "STRING" },
                        worthConsidering: { type: "STRING" },
                        coachingQuestion: { type: "STRING" }
                      },
                      required: ["summary", "topDomain", "emotionalUndertone", "patternDiagnosis", "worthConsidering", "coachingQuestion"]
                    }
                  } 
                })
              });

              if (!directRes.ok) {
                if (directRes.status === 429 && retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return fetchDirectWithRetry(retries - 1, delay * 2);
                }
                throw new Error("Direct API connection declined.");
              }

              const result = await directRes.json();
              const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!textResponse) throw new Error("Connection failed");
              return JSON.parse(textResponse);
            } catch (e) {
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchDirectWithRetry(retries - 1, delay * 2);
              }
              throw e;
            }
          };

          aiData = await fetchDirectWithRetry();
        } else {
          throw localErr;
        }
      }

      // Save valid outcome to user history
      const newEntry = { 
        ...aiData, 
        timestamp: Date.now(), 
        date: new Date().toLocaleDateString(), 
        text: diaryEntry 
      };
      
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'entries'), newEntry);
      setDiaryAnalysis(newEntry);
      setDiaryEntry('');
      setJournalingPrompt(null);
    } catch (e: any) { 
      console.error(e);
      setErrorMessage(e.message || "The Sieve encountered an issue. Please try again in a moment.");
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const getDomainInfo = (name: string | null) => {
    if (!name) return null;
    const key = name.toUpperCase().replace(/[\s/]/g, '_');
    return DOMAINS[key] || null;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans" style={{ fontFamily: "'Jost', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;700;900&display=swap" rel="stylesheet" />
      
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-[150px]"></div>
      </div>

      <nav className="relative z-50 flex items-center justify-between px-6 py-6 border-b border-white/5 backdrop-blur-md bg-[#0F172A]/40 sticky top-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-amber-500 uppercase leading-none">TruSelf Suite</h1>
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-indigo-300 opacity-60 mt-1">Live Your Mark</span>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
          <button onClick={() => setActiveTab('spin')} className={`px-6 py-2 rounded-full transition-all text-[10px] font-black uppercase ${activeTab === 'spin' ? 'bg-amber-500 text-[#1E1B4B]' : 'hover:bg-white/5'}`}>The Spark</button>
          <button onClick={() => setActiveTab('diary')} className={`px-6 py-2 rounded-full transition-all text-[10px] font-black uppercase ${activeTab === 'diary' ? 'bg-amber-500 text-[#1E1B4B]' : 'hover:bg-white/5'}`}>The Sieve</button>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center py-12 px-6 max-w-5xl mx-auto w-full">
        {activeTab === 'spin' ? (
          <div className="flex flex-col items-center w-full max-w-md animate-in fade-in duration-700">
            <h2 className="text-2xl font-bold mb-8 text-center">Spin for a coaching spark</h2>
            <div className="w-full max-w-[340px] aspect-[3/4.4]">
              <div className="w-full h-full bg-white rounded-[50px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] border-[12px] border-[#1E1B4B] overflow-hidden flex flex-col relative">
                <div className="relative h-[58%] bg-[#F8FAFC] border-b-[12px] border-[#1E1B4B] overflow-hidden">
                  <div className="absolute left-4 right-4 top-4 bottom-4 rounded-[40px] bg-slate-200/30 shadow-inner overflow-hidden">
                    {balls.map((b: any) => (
                      <div 
                        key={b.id} 
                        className={`absolute ${isSpinning ? 'animate-gacha-bounce' : ''}`} 
                        style={{ 
                          left: `${b.x}%`, 
                          top: `${b.y}%`, 
                          animationDelay: `${b.delay}s`,
                          animationDuration: `${0.6 + (b.id % 5) * 0.1}s` // Randomized speed distribution
                        }} 
                      >
                        <div 
                          className="w-8 h-8 rounded-full shadow-md border border-white/25 transition-transform duration-500" 
                          style={{ 
                            backgroundColor: b.color, 
                            transform: `rotate(${b.rotation}deg)` 
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-[#1E1B4B] p-4 flex flex-col items-center justify-center">
                  <div 
                    className="w-24 h-24 bg-indigo-950 rounded-full shadow-2xl flex items-center justify-center border-4 border-indigo-900 cursor-pointer active:scale-95 transition-transform" 
                    style={{ transform: `rotate(${leverAngle}deg)`, transition: 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} 
                    onClick={spinGacha}
                  >
                    <div className="w-16 h-4 bg-amber-500 rounded-full absolute shadow-inner"></div>
                    <div className="w-10 h-10 bg-white rounded-full border-4 border-amber-500 flex items-center justify-center z-20">
                      <div className="w-3 h-3 bg-[#1E1B4B] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center opacity-40 text-[10px] uppercase font-bold tracking-[0.2em]">
              The Master Coach waits in the machine.
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row gap-12 items-start animate-in fade-in duration-700">
            <div className="flex-1 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><PenLine className="w-6 h-6 text-[#1E1B4B]" /></div>
                  <h2 className="text-2xl font-bold">The Sieve</h2>
                </div>
                <button onClick={() => setHistoryOpen(!historyOpen)} className="text-[10px] font-black uppercase text-indigo-300 hover:text-amber-500 transition-colors flex items-center gap-2">
                  <History className="w-3 h-3" />
                  {historyOpen ? 'Write' : 'History'}
                </button>
              </div>

              {!historyOpen ? (
                <div className="space-y-6">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 flex gap-4 items-start shadow-sm">
                    <Info className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-indigo-300 tracking-widest mb-1 leading-none">Your Sieve Protocol</h4>
                      <p className="text-[13px] text-indigo-100/70 font-medium leading-relaxed">
                        To help the Master Coach reveal your deeper life-scripts, share your thoughts in detail. Describe specific moments, feelings, and what you were thinking.
                      </p>
                    </div>
                  </div>
                  
                  {errorMessage && (
                    <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-sm font-medium">
                      {errorMessage}
                    </div>
                  )}

                  {journalingPrompt && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                      <p className="text-amber-200 font-bold italic">"{journalingPrompt}"</p>
                    </div>
                  )}

                  <textarea 
                    value={diaryEntry} 
                    onChange={e => setDiaryEntry(e.target.value)} 
                    placeholder="What's on your mind? Tell us the story..." 
                    className="w-full h-80 bg-indigo-950/30 border border-white/10 rounded-3xl p-8 text-lg focus:ring-2 focus:ring-amber-500/50 transition-all outline-none resize-none text-indigo-100" 
                  />
                  
                  <button 
                    onClick={analyzeWithGemini} 
                    disabled={isAnalyzing || !diaryEntry.trim()} 
                    className="w-full py-6 bg-amber-500 text-[#1E1B4B] font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Reveal Patterns</>}
                  </button>
                </div>
              ) : (
                <div className="h-[600px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {diaryHistory.map((item: any) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 group transition-all hover:bg-white/[0.08]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: getDomainInfo(item.topDomain)?.color || '#6366F1' }}>
                          {getDomainInfo(item.topDomain)?.icon || <Sparkle className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase">{item.date}</span>
                        <span className="text-[10px] text-indigo-300 uppercase font-black">{item.topDomain || "General"}</span>
                      </div>
                      <p className="text-indigo-100/80 italic line-clamp-3 mb-2 font-medium leading-relaxed">"{item.text || ""}"</p>
                    </div>
                  ))}
                  {diaryHistory.length === 0 && (
                    <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest">No history yet</div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full lg:w-[440px]">
              {diaryAnalysis && !historyOpen ? (
                <div className="bg-white rounded-[40px] shadow-2xl text-[#1E1B4B] overflow-hidden animate-in slide-in-from-right-6 duration-500">
                  <div className="h-2 w-full" style={{ backgroundColor: getDomainInfo(diaryAnalysis.topDomain)?.color || '#6366F1' }}></div>
                  <div className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="p-4 rounded-2xl text-white shadow-xl" style={{ backgroundColor: getDomainInfo(diaryAnalysis.topDomain)?.color || '#6366F1' }}>
                         {getDomainInfo(diaryAnalysis.topDomain)?.icon || <Sparkle />}
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase text-indigo-400 leading-none mb-1">Pattern Sieve</p>
                         <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{diaryAnalysis.topDomain}</h3>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div><h4 className="text-[10px] font-black uppercase text-indigo-300 mb-2 tracking-widest">Synthesis</h4><p className="text-md font-bold leading-snug">{diaryAnalysis.summary}</p></div>
                       <div className="bg-indigo-50 p-4 rounded-2xl"><h4 className="text-[10px] font-black uppercase text-indigo-300 mb-2 tracking-widest">Emotional Undertone</h4><p className="text-sm font-medium text-indigo-900">{diaryAnalysis.emotionalUndertone}</p></div>
                       <div className="border-l-4 border-indigo-200 pl-4"><h4 className="text-[10px] font-black uppercase text-indigo-300 mb-2 tracking-widest">Pattern Diagnosis</h4><p className="text-sm font-bold text-indigo-950">{diaryAnalysis.patternDiagnosis}</p></div>
                       <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100"><h4 className="text-[10px] font-black uppercase text-amber-600 mb-2 tracking-widest">Worth Considering</h4><p className="text-sm font-medium text-slate-700">{diaryAnalysis.worthConsidering}</p></div>
                       <div className="bg-amber-500 border-2 border-amber-600 rounded-[30px] p-6 shadow-lg transition-transform hover:scale-[1.02]">
                          <div className="flex items-center gap-2 mb-2"><HelpCircle className="w-4 h-4 text-[#1E1B4B]" /><span className="text-[10px] font-black uppercase text-[#1E1B4B] tracking-widest opacity-60">Master Question</span></div>
                          <p className="text-xl font-black leading-tight italic text-[#1E1B4B]">"{diaryAnalysis.coachingQuestion}"</p>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] border-2 border-dashed border-white/10 rounded-[40px] flex items-center justify-center opacity-20 text-center p-12">
                  Pattern analysis will appear here.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showGachaResult && gachaResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowGachaResult(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="h-6 w-full" style={{ backgroundColor: gachaResult.color }}></div>
            <div className="p-10 text-[#1E1B4B]">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-5 rounded-2xl text-white shadow-xl" style={{ backgroundColor: gachaResult.color }}>{gachaResult.icon}</div>
                <div><h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{gachaResult.title}</h2><p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2">Daily Spark</p></div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[40px] border-2 border-dashed border-slate-200 mb-8"><p className="text-xl font-bold leading-snug italic">"{gachaResult.question}"</p></div>
              <button 
                onClick={() => { setJournalingPrompt(gachaResult.question); setShowGachaResult(false); setActiveTab('diary'); }} 
                className="w-full py-5 bg-amber-500 text-[#1E1B4B] font-black rounded-3xl uppercase shadow-xl tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-95"
              >
                Answer in Diary <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setShowGachaResult(false)} className="w-full mt-4 text-[10px] font-black uppercase opacity-40 hover:opacity-70 transition-opacity">Keep Spinning</button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="py-12 opacity-30 text-center text-[10px] font-black uppercase tracking-widest">Live Your Mark & ECI © 2026</footer>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gacha-bounce { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-16px); } 
        } 
        .animate-gacha-bounce { animation: gacha-bounce infinite ease-in-out; } 
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      ` }} />
    </div>
  );
}