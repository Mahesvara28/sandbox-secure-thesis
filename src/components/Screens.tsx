import { motion } from 'framer-motion';
import { GraduationCap, Target, ClipboardCheck, Terminal, HelpCircle, Map, BookOpen, User, Mail, Lock } from 'lucide-react';
import { TierDashboard } from './TierDashboard';
import TerminalModule from './TerminalModule';
import type { Tier, Mission } from '../data/gameData';
import { TIERS, MISSIONS } from '../data/gameData';
import type { User as FirebaseUser } from 'firebase/auth';

// --- 1. Boot Screen ---
export const BootScreen = ({ bootText }: { bootText: string[] }) => (
  <div className="h-screen w-screen bg-black p-8 overflow-hidden flex flex-col justify-end font-mono text-sm">
    <div className="max-w-4xl mx-auto w-full">
      {bootText.map((line, i) => {
        if (!line) return null;
        return (
          <div key={i} className={`mb-1 ${line.includes('WARNING') || line.includes('PROHIBITED') ? 'text-red-500 font-bold animate-pulse' : line.includes('OK') ? 'text-green-400' : 'text-green-600'}`}>
            {line}
          </div>
        );
      })}
      <div className="w-3 h-5 bg-green-500 inline-block mt-2 animate-pulse" />
    </div>
  </div>
);

// --- 2. Auth Screen (Login + Register + Google) ---
interface AuthScreenProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  regUsername: string;
  setRegUsername: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  authError: string;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
}

export const AuthScreen = ({ authMode, setAuthMode, regUsername, setRegUsername, regEmail, setRegEmail, regPassword, setRegPassword, authError, handleLogin, handleRegister, handleGoogleLogin }: AuthScreenProps) => (
  <div className="h-screen w-screen bg-black flex items-center justify-center p-4 font-mono">
    <div className="border-2 border-green-500 bg-black w-full max-w-md shadow-[0_0_40px_rgba(34,197,94,0.3)]">
      <div className="border-b border-green-900 p-6 text-center">
        <Terminal size={40} className="text-green-500 mx-auto mb-2" />
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Sandbox Secure</h2>
        <p className="text-[10px] text-green-600 mt-1 uppercase tracking-wider">Restricted Access - Authorized Personnel Only</p>
      </div>

      <div className="flex border-b border-green-900">
        <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-700 hover:text-green-500'}`}>Login</button>
        <button onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${authMode === 'register' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-700 hover:text-green-500'}`}>Create Account</button>
      </div>

      <div className="p-6">
        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] text-green-700 uppercase mb-1 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
                <input type="email" className="w-full bg-black border border-green-900 pl-9 pr-3 py-2.5 text-green-400 text-sm font-mono focus:outline-none focus:border-green-500" placeholder="operator@sandbox.secure" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-green-700 uppercase mb-1 tracking-wider">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
                <input type="password" className="w-full bg-black border border-green-900 pl-9 pr-3 py-2.5 text-green-400 text-sm font-mono focus:outline-none focus:border-green-500" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>
            </div>
            {authError && <p className="text-xs text-red-500 border border-red-900 p-2 bg-red-950/20">{authError}</p>}
            <button type="submit" className="w-full border-2 border-green-500 py-2.5 text-sm font-black text-green-400 uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all">Access System</button>
            <p className="text-[10px] text-green-700 text-center mt-4 border border-green-900 p-2 bg-green-950/20">Default: <span className="text-white">admin@sandbox.secure</span> / <span className="text-white">admin123</span></p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] text-green-700 uppercase mb-1 tracking-wider">Operator Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
                <input type="text" className="w-full bg-black border border-green-900 pl-9 pr-3 py-2.5 text-green-400 text-sm font-mono focus:outline-none focus:border-green-500 uppercase" placeholder="ENTER_USERNAME" value={regUsername} onChange={e => setRegUsername(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-green-700 uppercase mb-1 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
                <input type="email" className="w-full bg-black border border-green-900 pl-9 pr-3 py-2.5 text-green-400 text-sm font-mono focus:outline-none focus:border-green-500" placeholder="operator@sandbox.secure" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-green-700 uppercase mb-1 tracking-wider">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
                <input type="password" className="w-full bg-black border border-green-900 pl-9 pr-3 py-2.5 text-green-400 text-sm font-mono focus:outline-none focus:border-green-500" placeholder="•••••••• (min 6 chars)" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>
            </div>
            {authError && <p className="text-xs text-red-500 border border-red-900 p-2 bg-red-950/20">{authError}</p>}
            <button type="submit" className="w-full border-2 border-green-500 py-2.5 text-sm font-black text-green-400 uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all">Create Account</button>
          </form>
        )}

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-green-900"></div>
          <span className="px-3 text-[10px] text-green-700 uppercase">Or Continue With</span>
          <div className="flex-1 h-px bg-green-900"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-black border-2 border-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-500 hover:border-green-500 hover:text-white transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
      </div>

      <div className="border-t border-green-900 p-3 text-center">
        <p className="text-[8px] text-green-800">{authMode === 'login' ? "Don't have an account? Switch to Create Account tab above." : "Already registered? Switch to Login tab above."}</p>
      </div>
    </div>
  </div>
);

// --- 3. Dashboard Screen ---
export const DashboardScreen = ({ user }: { user: FirebaseUser | null }) => (
  <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-7xl mx-auto grid grid-cols-12 gap-6 p-6">
    <div className="col-span-8 border border-green-900/50 p-6 bg-black/60">
      <h2 className="text-2xl font-bold text-white mb-4">Operator Briefing</h2>
      <p className="text-green-400 mb-6">Welcome back, {user?.displayName || 'Admin'}. Select a module from the navigation bar to begin your training.</p>
    </div>
  </motion.div>
);

// --- 4. Academy Screen ---
interface AcademyScreenProps {
  activeTier: Tier | null;
  setActiveTier: (t: Tier | null) => void;
  userScores: Record<string, { score: number; total: number }>;
  handleQuizComplete: (tier: Tier, score: number, total: number) => void;
}

export const AcademyScreen = ({ activeTier, setActiveTier, userScores, handleQuizComplete }: AcademyScreenProps) => {
  if (!activeTier) {
    return (
      <motion.div key="academy" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3"><GraduationCap className="text-green-500"/> ACADEMY TIERS</h2>
        <div className="grid grid-cols-3 gap-6">
          {TIERS.map(tier => {
            const tierScore = userScores[tier.id];
            return (
              <div key={tier.id} className="border border-green-900 bg-black/60 p-6 hover:border-green-500 transition-colors cursor-pointer group relative" onClick={() => setActiveTier(tier.id)}>
                {tierScore && (
                  <div className="absolute top-2 right-2 text-[10px] bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-700">
                    Score: {tierScore.score}/{tierScore.total}
                  </div>
                )}
                <span className="text-[10px] font-bold text-green-700 border border-green-900 px-2 py-1 rounded">{tier.id}</span>
                <h3 className="text-xl font-bold text-white mt-4 mb-2 group-hover:text-green-400">{tier.id} CERTIFICATION</h3>
                <p className="text-xs text-green-600 mb-4">5 Levels + Pre/Post Assessment</p>
                <button className="text-xs font-bold text-green-500 uppercase border-b border-green-900 group-hover:border-green-500">Enter Tier →</button>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div key="tier-view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
      <TierDashboard 
        tierName={activeTier}
        levels={TIERS.find(t => t.id === activeTier)?.levels || []}
        preTestQuestions={TIERS.find(t => t.id === activeTier)?.preTest || []}
        postTestQuestions={TIERS.find(t => t.id === activeTier)?.postTest || []}
        onExit={() => setActiveTier(null)}
        onComplete={(quizScore: number, total: number) => handleQuizComplete(activeTier, quizScore, total)}
      />
    </motion.div>
  );
};

// --- 5. Missions Screen ---
export const MissionsScreen = ({ startMission }: { startMission: (m: Mission) => void }) => (
  <motion.div key="missions" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-7xl mx-auto p-6">
    <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3"><Target className="text-red-500"/> ACTIVE MISSIONS</h2>
    <div className="grid grid-cols-2 gap-6">
      {MISSIONS.map(mission => (
        <div key={mission.id} className="border border-green-900/50 bg-black/60 p-6 hover:border-green-500 transition-colors">
          <h4 className="text-xl font-bold text-white mb-4">{mission.title}</h4>
          <p className="text-xs text-green-400 italic mb-6">"{mission.scenario}"</p>
          <button onClick={() => startMission(mission)} className="w-full border border-green-500 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black">Deploy to Mission</button>
        </div>
      ))}
    </div>
  </motion.div>
);

// --- 6. Terminal Screen (The Game) ---
interface TerminalScreenProps {
  activeMission: Mission;
  handleCommand: (cmd: string) => void;
  isThreatActive: boolean;
  timeLeft: number;
  questStep: number;
  msg: string;
  sysNonce: number;
  setShowHint: (v: boolean) => void;
  setShowMap: (v: boolean) => void;
  setShowCheat: (v: boolean) => void;
  setHintText: (t: string) => void;
}

export const TerminalScreen = ({ activeMission, handleCommand, isThreatActive, timeLeft, questStep, msg, sysNonce, setShowHint, setShowMap, setShowCheat, setHintText }: TerminalScreenProps) => (
  <motion.div key="terminal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col gap-4 p-6">
    <div className="border border-green-900 p-4 bg-black/60 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-bold text-green-700">MISSION: {activeMission.title.toUpperCase()}</span>
          {isThreatActive && <span className="text-xs font-bold text-red-500 animate-pulse border border-red-900 px-2 py-0.5 rounded">TIME: {timeLeft}s</span>}
        </div>
        // Inside TerminalScreen in Screens.tsx
<div className="space-y-1 text-[10px] max-h-[150px] overflow-y-auto pr-2">
  {activeMission.steps.map((step, i) => (
    <div key={i} className={`flex gap-2 ${questStep > i ? 'text-green-500 opacity-40' : questStep === i ? 'text-white' : 'text-green-900'}`}>
      <span>{questStep > i ? '✓' : i+1}</span>
      <span>{step.desc}</span>
    </div>
  ))}
</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setHintText(activeMission.steps[questStep]?.hint || "No hint available."); setShowHint(true); }} className="text-xs border border-yellow-600 text-yellow-500 px-3 py-2 hover:bg-yellow-900/20 transition-colors flex items-center gap-1">
          <HelpCircle size={14} /> Hint
        </button>
        <button onClick={() => setShowMap(true)} className="text-xs border border-blue-600 text-blue-500 px-3 py-2 hover:bg-blue-900/20 transition-colors flex items-center gap-1">
          <Map size={14} /> Map
        </button>
        <button onClick={() => setShowCheat(true)} className="text-xs border border-purple-600 text-purple-500 px-3 py-2 hover:bg-purple-900/20 transition-colors flex items-center gap-1">
          <BookOpen size={14} /> Cheat Sheet
        </button>
      </div>
    </div>
    <div className="flex-1 border border-green-900 bg-black/80 p-2">
      <TerminalModule onCommand={handleCommand} systemMessage={msg} nonce={sysNonce} />
    </div>
  </motion.div>
);

// --- 7. Profile Screen ---
export const ProfileScreen = ({ user, userScores, setShowEval }: { user: FirebaseUser | null; userScores: Record<string, { score: number; total: number }>; setShowEval: (v: boolean) => void }) => (
  <motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-4xl mx-auto text-center mt-10 p-6">
    <h2 className="text-3xl font-black text-white mb-8">OPERATOR PROFILE & SYSTEM EVALUATION</h2>
    <div className="grid grid-cols-2 gap-6">
      <div className="border border-green-900/50 p-6 bg-black/60 text-left">
        <p className="text-green-900 text-[10px] uppercase mb-2">Registered Email</p>
        <p className="text-xl text-white font-bold mb-6">{user?.email}</p>
        <p className="text-green-900 text-[10px] uppercase mb-2">Module Scores</p>
        <div className="space-y-2">
          {Object.keys(userScores).length > 0 ? (
            Object.entries(userScores).map(([tier, data]) => (
              <div key={tier} className="flex justify-between items-center border-b border-green-900/30 pb-2">
                <span className="text-white text-sm">{tier}</span>
                <span className="text-green-400 font-bold">{data.score} / {data.total}</span>
              </div>
            ))
          ) : (
            <p className="text-green-700 text-sm italic">No quizzes completed yet.</p>
          )}
        </div>
      </div>
      <div className="border border-green-900/50 p-6 bg-black/60 flex flex-col items-center justify-center">
        <ClipboardCheck size={48} className="text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Thesis Evaluation</h3>
        <p className="text-xs text-green-600 mb-6">ISO/IEC 9126 Quality Standard Instrument</p>
        <button onClick={() => setShowEval(true)} className="border border-green-500 px-6 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black transition-colors">
          Launch Evaluator Survey
        </button>
      </div>
    </div>
  </motion.div>
);