'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PenLine, 
  Sparkles, 
  History, 
  ChevronRight, 
  X, 
  TrendingUp, 
  Trophy, 
  Sparkle, 
  Wallet, 
  Zap, 
  HelpCircle, 
  Users, 
  Heart,
  Loader2,
  Check,
  Cloud,
  Gamepad2,
  ArrowRight,
  BrainCircuit,
  Activity,
  Lightbulb,
  Info
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// --- DATA: 8 Domains ---
const DOMAINS: Record<string, { title: string, color: string, icon: React.ReactNode, buttonLabel: string, questions: string[], tip: string }> = {
  ADVANCEMENT: { 
    title: "Advancement",
    color: "#6366F1", 
    icon: <TrendingUp className="w-5 h-5" />,
    buttonLabel: "LET'S GO.",
    questions: ["What is one adaptable plan you can create for your biggest goal today?", "Where is your execution discipline currently slipping?", "Looking ahead 3 years, what foresight would your future self give you now?"],
    tip: "Progress is rarely a straight line; focus on the direction."
  },
  ACHIEVEMENT: { 
    title: "Achievement",
    color: "#D97706", 
    icon: <Trophy className="w-5 h-5" />,
    buttonLabel: "CLAIM THE WIN.",
    questions: ["What does 'winning' look like for you in this current season?", "Which of your current credentials are you most proud of?", "Are you playing the right 'game' in your career?"],
    tip: "Recognition is fuel, but contribution is the engine."
  },
  CREATION_CHOICE: { 
    title: "Creation/Choice",
    color: "#4338CA", 
    icon: <Sparkle className="w-5 h-5" />,
    buttonLabel: "BREAK BARRIERS.",
    questions: ["If you were to reinvent yourself tomorrow, what's the first change?", "What past limitation is currently keeping you from a new possibility?"],
    tip: "Choice is a muscle. The more you use it, the stronger your freedom becomes."
  },
  RESOURCE_GAINING: { 
    title: "Resource Gaining",
    color: "#B45309", 
    icon: <Wallet className="w-5 h-5" />,
    buttonLabel: "BUILD THE BASE.",
    questions: ["How stable is your current financial foundation (1-10)?", "What is one 'material' need that would unlock your productivity?"],
    tip: "Resources are tools for your mission, not the destination."
  },
  VITALITY: { 
    title: "Vitality",
    color: "#4F46E5", 
    icon: <Zap className="w-5 h-5" />,
    buttonLabel: "ACTIVATE POWER.",
    questions: ["What is your current energy level? Biggest drain?", "When was the last time you felt truly vibrant?"],
    tip: "Your body is the vehicle for all your dreams."
  },
  DREAMS_PASSIONS: { 
    title: "Dreams/Passions",
    color: "#F59E0B", 
    icon: <HelpCircle className="w-5 h-5" />,
    buttonLabel: "IGNITE FIRE.",
    questions: ["What activity makes you lose track of time entirely?", "What is one contribution you want to be remembered for?"],
    tip: "Passion needs regular stoking through meaningful action."
  },
  PEOPLE: { 
    title: "People",
    color: "#312E81", 
    icon: <Users className="w-5 h-5" />,
    buttonLabel: "GROW TOGETHER.",
    questions: ["Who in your network is currently challenging you to grow?", "What boundary do you need to set with a person in your life?"],
    tip: "You are the average of the five people you spend the most time with."
  },
  CONNECTION: { 
    title: "Connection",
    color: "#92400E", 
    icon: <Heart className="w-5 h-5" />,
    buttonLabel: "DEEPEN BOND.",
    questions: ["How can you develop more 'presence' today?", "Who do you need to have a deep, honest conversation with?"],
    tip: "Communication is about understanding; connection is about being felt."
  }
};

// --- Firebase Init ---
// Global environment variables provided by environment or Vercel
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sanitized appId for stable paths
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'truself-suite';
const appId = rawAppId.replace(/\//g, '_');

export default function App() {
  const [activeTab, setActiveTab] = useState<'spin' | 'diary'>('spin');
  const [user, setUser] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showGachaResult, setShowGachaResult] = useState(false);
  const [gachaResult, setGachaResult] = useState<any>(null);
  const [leverAngle, setLeverAngle] = useState(0);
  const [balls, setBalls] = useState<any[]>([]);
  const [diaryEntry, setDiaryEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diaryAnalysis, setDiaryAnalysis] = useState<any>(null);
  const [diaryHistory, setDiaryHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [journalingPrompt, setJournalingPrompt] = useState<string | null>(null);

  // Authentication Flow (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // History Sync Flow (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;
    const entriesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'entries');
    const unsubscribe = onSnapshot(entriesCol, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDiaryHistory(data.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user, appId]);

  // UI Setup
  useEffect(() => {
    setBalls(Array.from({ length: 18 }).map((_, i) => ({
      id: i, x: 15 + Math.random() * 70, y: 35 + Math.random() * 35,
      color: Object.values(DOMAINS)[Math.floor(Math.random() * 8)].color,
      rotation: Math.random() * 360,
    })));
  }, []);

  const spinGacha = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLeverAngle(p => p + 720);
    const domainKeys = Object.keys(DOMAINS);
    const randomKey = domainKeys[Math.floor(Math.random() * domainKeys.length)];
    const domain = DOMAINS[randomKey];
    const question = domain.questions[Math.floor(Math.random() * domain.questions.length)];
    setTimeout(() => {
      setGachaResult({ ...domain, question });
      setShowGachaResult(true);
      setIsSpinning(false);
    }, 1800);
  }, [isSpinning]);

  const handleJournalFromGacha = () => {
    if (!gachaResult) return;
    setJournalingPrompt(gachaResult.question);
    setDiaryAnalysis(null);
    setDiaryEntry('');
    setShowGachaResult(false);
    setActiveTab('diary');
  };

  const analyzeWithGemini = async () => {
    if (!diaryEntry.trim() || !user) return;
    setIsAnalyzing(true);
    
    const apiKey = ""; 
    const systemPrompt = `
      You are the "TruSelf Master Behavioral Coach". You specialize in identifying deep cognitive patterns, emotional undertones, and "life-scripts".
      ${journalingPrompt ? `The user is specifically answering this spark question: "${journalingPrompt}"` : ''}
      
      Your goal is to provide a "diagnosis" of the user's current psychological state based on their entry. 
      Respond ONLY in valid JSON with these EXACT keys:
      {
        "summary": "Deep synthesis of hidden meaning (2 sentences).",
        "topDomain": "Main Domain Name",
        "emotionalUndertone": "Description of underlying feelings.",
        "patternDiagnosis": "Identify a specific pattern name and how it's showing up.",
        "worthConsidering": "Strategic growth advice.",
        "coachingQuestion": "A sharp question that challenges their current script."
      }
    `;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: diaryEntry }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const result = await response.json();
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error("AI response error");
      
      const aiData = JSON.parse(textResponse);
      const newEntry = { ...aiData, timestamp: Date.now(), date: new Date().toLocaleDateString(), text: diaryEntry, fromPrompt: journalingPrompt };
      
      const entriesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'entries');
      await addDoc(entriesCol, newEntry);
      
      setDiaryAnalysis(newEntry);
      setDiaryEntry('');
      setJournalingPrompt(null);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const getDomainInfo = (name: string) => {
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
          <button onClick={() => setActiveTab('spin')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all text-[10px] font-black uppercase ${activeTab === 'spin' ? 'bg-amber-500 text-[#1E1B4B]' : 'hover:bg-white/5'}`}><Gamepad2 className="w-3.5 h-3.5" />The Spark</button>
          <button onClick={() => setActiveTab('diary')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all text-[10px] font-black uppercase ${activeTab === 'diary' ? 'bg-amber-500 text-[#1E1B4B]' : 'hover:bg-white/5'}`}><PenLine className="w-3.5 h-3.5" />The Sieve</button>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center py-12 px-6 max-w-5xl mx-auto w-full">
        {activeTab === 'spin' ? (
          <div className="animate-in fade-in duration-700 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-8">Spin for a coaching spark</h2>
            <div className="w-full max-w-[340px] aspect-[3/4.4]">
              <div className="w-full h-full bg-white rounded-[50px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] border-[12px] border-[#1E1B4B] overflow-hidden flex flex-col relative">
                <div className="relative h-[58%] bg-[#F8FAFC] border-b-[12px] border-[#1E1B4B] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/10 z-10"></div>
                  <div className="absolute left-4 right-4 top-4 bottom-4 rounded-[40px] bg-slate-200/30 shadow-inner overflow-hidden">
                    {balls.map(b => (
                      <div key={b.id} className={`absolute w-12 h-12 rounded-full shadow-2xl transition-all duration-700 ${isSpinning ? 'animate-bounce' : ''}`} style={{ left: `${b.x}%`, top: `${b.y}%`, backgroundColor: b.color, transform: `rotate(${b.rotation}deg)` }}>
                        <div className="w-10 h-10 rounded-full border border-white/20"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-[#1E1B4B] p-4 flex flex-col items-center justify-between">
                  <div className="relative pt-8 cursor-pointer active:scale-95 transition-transform" onClick={spinGacha}>
                    <div className="w-24 h-24 bg-indigo-950 rounded-full shadow-2xl flex items-center justify-center border-4 border-indigo-900 transition-transform duration-[1800ms] ease-out" style={{ transform: `rotate(${leverAngle}deg)` }}>
                      <div className="w-16 h-4 bg-amber-500 rounded-full absolute shadow-inner"></div>
                      <div className="w-10 h-10 bg-white rounded-full border-4 border-amber-500 flex items-center justify-center z-20"><div className="w-3 h-3 bg-[#1E1B4B] rounded-full animate-pulse"></div></div>
                    </div>
                  </div>
                  <div className="w-32 h-10 bg-black rounded-t-[20px] border-t-8 border-x-8 border-slate-950 flex items-center justify-center">
                    {isSpinning && <div className="w-8 h-8 bg-white rounded-full animate-bounce shadow-lg"></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 w-full flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><PenLine className="w-6 h-6 text-[#1E1B4B]" /></div>
                  <h2 className="text-2xl font-bold">The Sieve</h2>
                </div>
                <button onClick={() => setHistoryOpen(!historyOpen)} className="text-[10px] font-black uppercase text-indigo-300 hover:text-amber-500 transition-colors flex items-center gap-2"><History className="w-3 h-3" />{historyOpen ? 'Write' : 'History'}</button>
              </div>

              {!historyOpen ? (
                <div className="space-y-6">
                  {/* Natural Sieve Instructions */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 flex gap-4 items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-indigo-300 tracking-widest mb-1 leading-none">Your Sieve Protocol</h4>
                      <p className="text-[13px] text-indigo-100/70 font-medium leading-relaxed">
                        To help the Master Coach Brain uncover the life-patterns beneath the surface, we encourage you to share your thoughts in detail. Describe what happened, how you felt, and what you were thinking. The richer your story, the more clearly the patterns hidden in your life-scripts will emerge.
                      </p>
                    </div>
                  </div>

                  {journalingPrompt && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Spark Question Selected:</span>
                         <button onClick={() => setJournalingPrompt(null)}><X className="w-3 h-3 text-amber-500" /></button>
                      </div>
                      <p className="text-amber-200 font-bold italic leading-snug">"{journalingPrompt}"</p>
                    </div>
                  )}
                  <textarea value={diaryEntry} onChange={e => setDiaryEntry(e.target.value)} placeholder={journalingPrompt ? "Reflect deeply on the spark above..." : "What's on your mind? Tell us the story..."} className="w-full h-80 bg-indigo-950/30 border border-white/10 rounded-3xl p-8 text-lg focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" />
                  <button onClick={analyzeWithGemini} disabled={isAnalyzing || !diaryEntry.trim() || !user} className="w-full py-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-[#1E1B4B] font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-lg">
                    {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Reveal Patterns</>}
                  </button>
                </div>
              ) : (
                <div className="h-[600px] overflow-y-auto space-y-4 pr-2">
                  {diaryHistory.map(item => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: getDomainInfo(item.topDomain)?.color || '#6366F1' }}>{getDomainInfo(item.topDomain)?.icon || <Sparkle className="w-4 h-4" />}</div>
                        <span className="text-[10px] font-black text-amber-500 uppercase">{String(item.date)}</span>
                        <span className="text-[10px] text-indigo-300 uppercase font-black">{String(item.topDomain || "General")}</span>
                      </div>
                      <p className="text-indigo-100/80 italic line-clamp-3 mb-2 font-medium">"{String(item.text || "")}"</p>
                      <div className="text-[10px] text-amber-400 font-bold italic mt-2">Pattern: {String(item.patternDiagnosis || "Analysis pending")?.substring(0, 50)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-[440px]">
              {diaryAnalysis && !historyOpen ? (
                <div className="bg-white rounded-[40px] shadow-2xl text-[#1E1B4B] animate-in slide-in-from-right-6 duration-500 overflow-hidden">
                  <div className="h-2 w-full" style={{ backgroundColor: getDomainInfo(diaryAnalysis.topDomain)?.color || '#6366F1' }}></div>
                  
                  <div className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl text-white shadow-xl" style={{ backgroundColor: getDomainInfo(diaryAnalysis.topDomain)?.color || '#6366F1' }}>{getDomainInfo(diaryAnalysis.topDomain)?.icon || <Sparkle />}</div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Deep Pattern Analysis</p>
                        <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{String(diaryAnalysis.topDomain || "General")}</h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <div className="flex items-center gap-2 mb-2">
                           <Activity className="w-3.5 h-3.5 text-indigo-500" />
                           <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Synthesis</h4>
                        </div>
                        <p className="text-md font-bold leading-snug">{String(diaryAnalysis.summary || "")}</p>
                      </section>

                      <section className="bg-indigo-50/50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                           <Heart className="w-3.5 h-3.5 text-rose-500" />
                           <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Emotional Undertone</h4>
                        </div>
                        <p className="text-sm font-medium text-indigo-900">{String(diaryAnalysis.emotionalUndertone || "")}</p>
                      </section>

                      <section className="border-l-4 border-indigo-200 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                           <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                           <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Pattern Diagnosis</h4>
                        </div>
                        <p className="text-sm font-bold text-indigo-950 mb-1">{String(diaryAnalysis.patternDiagnosis || "")}</p>
                      </section>

                      <section className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                        <div className="flex items-center gap-2 mb-2">
                           <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                           <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Worth Considering</h4>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{String(diaryAnalysis.worthConsidering || "")}</p>
                      </section>
                    </div>

                    <div className="bg-amber-500 border-2 border-amber-600 rounded-[30px] p-6 shadow-lg">
                       <div className="flex items-center gap-2 mb-2">
                         <HelpCircle className="w-4 h-4 text-[#1E1B4B]" />
                         <span className="text-[10px] font-black uppercase text-[#1E1B4B] tracking-widest opacity-60">Master Question</span>
                       </div>
                       <p className="text-xl font-black leading-tight italic text-[#1E1B4B]">"{String(diaryAnalysis.coachingQuestion || "")}"</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-12 opacity-30">
                  <Cloud className="w-12 h-12 mb-6" />
                  <p className="text-lg font-bold tracking-tight">Pattern analysis will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showGachaResult && gachaResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative bg-white w-full max-w-md rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="h-6 w-full" style={{ backgroundColor: gachaResult.color }}></div>
            <div className="p-10 text-[#1E1B4B]">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-5 rounded-2xl text-white shadow-xl" style={{ backgroundColor: gachaResult.color }}>{gachaResult.icon}</div>
                <div><h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{gachaResult.title}</h2><p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2">Daily Spark</p></div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[40px] border-2 border-dashed border-slate-200 mb-8"><p className="text-xl font-bold leading-snug italic">"{gachaResult.question}"</p></div>
              <div className="flex flex-col gap-3">
                <button onClick={handleJournalFromGacha} className="w-full py-5 bg-amber-500 text-[#1E1B4B] font-black rounded-[30px] shadow-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all">Answer in Diary <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => setShowGachaResult(false)} className="w-full py-4 bg-[#1E1B4B] text-white font-bold rounded-[30px] uppercase text-[10px] tracking-widest opacity-80">Keep Spinning</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 py-12 text-center flex flex-col items-center gap-6 opacity-40">
        <div className="flex gap-3">{Object.values(DOMAINS).map((d: any, i) => (<div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>))}</div>
        <p className="text-[10px] font-black tracking-[0.4em] uppercase">Live Your Mark & ECI © 2026</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } } .animate-bounce { animation: bounce 0.5s infinite cubic-bezier(0.45, 0, 0.55, 1); }`}} />
    </div>
  );
}