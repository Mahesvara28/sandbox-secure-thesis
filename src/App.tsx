import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, signInWithGoogle, logOut, saveUserScore, db, registerWithEmail, loginWithEmail } from './Firebase';
import { LayoutDashboard, GraduationCap, Target, ClipboardCheck, LogOut } from 'lucide-react';
import { BootScreen, AuthScreen, DashboardScreen, AcademyScreen, MissionsScreen, TerminalScreen, ProfileScreen } from './components/Screens';
import { NetworkMapModal, HintModal, BriefingModal, CheatSheetModal, DidYouKnowModal, EvalModal } from './components/Modals';
import type { Tier, Mission } from './data/gameData';

type Screen = 'dashboard' | 'academy' | 'missions' | 'terminal' | 'profile';
type BootStage = 'booting' | 'login' | 'authenticated';
type AuthMode = 'login' | 'register';

function App() {
  // --- STATE ---
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [bootStage, setBootStage] = useState<BootStage>('booting');
  const [bootText, setBootText] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userScores, setUserScores] = useState<Record<string, { score: number; total: number }>>({});
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [questStep, setQuestStep] = useState(0);
  const [msg, setMsg] = useState("");
  const [sysNonce, setSysNonce] = useState(0);
  const [isThreatActive, setIsThreatActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Modal States
  const [showBriefing, setShowBriefing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCheat, setShowCheat] = useState(false);
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [hintText, setHintText] = useState("");
  const [currentFact, setCurrentFact] = useState("");
  const [pendingMission, setPendingMission] = useState<Mission | null>(null);

  const sendSysMsg = (text: string) => { setMsg(text); setSysNonce(n => n + 1); };

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserScores(snap.data().scores || {});
      } else {
        setUserScores({});
      }
      setIsLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    const bootLines = [
      "BIOS DATE 01/15/2026 VER 2.4.1",
      "CPU: SANDBOX_VIRTUAL_PROCESSOR_9000",
      "DETECTING PRIMARY MASTER ... SANDBOX_OS_DRIVE",
      "CHECKING NVRAM ... OK",
      "LOADING KERNEL ...",
      "INITIALIZING SECURITY PROTOCOLS ...",
      "LOADING NETWORK DRIVERS ...",
      "MOUNTING FILESYSTEMS ...",
      "STARTING SYSTEM SERVICES ...",
      "LOADING FIREWALL RULES ...",
      "ESTABLISHING SECURE CONNECTION ...",
      "",
      "SANDBOX_OS v2.4.1 [SECURE MODE]",
      "================================",
      "WARNING: AUTHORIZED ACCESS ONLY",
      "UNAUTHORIZED ACCESS IS PROHIBITED",
      "ALL ACTIVITIES ARE MONITORED",
      ""
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setBootText(prev => [...prev, bootLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootStage('login'), 800);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // --- TIMER ---
  useEffect(() => {
    if (!isThreatActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsThreatActive(false);
          sendSysMsg("[MISSION FAILED]: Time expired! The data has been exfiltrated.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isThreatActive, timeLeft]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    // Default credentials for testing
    if (regEmail === 'admin@sandbox.secure' && regPassword === 'admin123') {
      setUser({ uid: 'default-admin-001', email: 'admin@sandbox.secure', displayName: 'System Administrator' } as FirebaseUser);
      setBootStage('authenticated');
      return;
    }
    
    if (!regEmail || !regPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    try {
      await loginWithEmail(regEmail, regPassword);
      setBootStage('authenticated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Check your credentials.";
      setAuthError(errorMessage);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (!regUsername || !regEmail || !regPassword) {
      setAuthError("All fields are required.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    try {
      await registerWithEmail(regEmail, regPassword, regUsername);
      setBootStage('authenticated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setAuthError(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    try {
      await signInWithGoogle();
      setBootStage('authenticated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Google login failed.";
      setAuthError(errorMessage);
    }
  };

  const handleLogout = async () => {
    await logOut();
    setBootStage('login');
    setScreen('dashboard');
    setRegEmail("");
    setRegPassword("");
    setRegUsername("");
  };

  // --- MISSION HANDLERS ---
  const startMission = (m: Mission) => {
    setPendingMission(m);
    setShowBriefing(true);
  };

  const confirmStartMission = () => {
    if (!pendingMission) return;
    setActiveMission(pendingMission);
    setQuestStep(0);
    setIsThreatActive(pendingMission.timerLimit > 0);
    setTimeLeft(pendingMission.timerLimit);
    setScreen('terminal');
    setShowBriefing(false);
    sendSysMsg(pendingMission.intro);
  };

  const handleCommand = (cmd: string) => {
    if (!activeMission) return;
    const input = cmd.trim().toLowerCase();
    
    if (questStep >= activeMission.steps.length) {
      sendSysMsg("[SYSTEM]: Mission complete. Return to dashboard.");
      return;
    }

    const currentStep = activeMission.steps[questStep];

    if (input.startsWith(currentStep.cmd)) {
      if (currentStep.cmd === "block" && !input.includes(activeMission.target)) {
        sendSysMsg("[ERROR]: Wrong target IP. Check the network map or logs.");
        return;
      }
      
      const isLastStep = questStep === activeMission.steps.length - 1;
      if (isLastStep) {
        setIsThreatActive(false);
        sendSysMsg("[SUCCESS]: Mission objectives complete. Threat neutralized.");
        // Trigger Did You Know fact
        if (activeMission.didYouKnow && activeMission.didYouKnow[questStep]) {
          setCurrentFact(activeMission.didYouKnow[questStep]);
          setShowDidYouKnow(true);
        }
      } else {
        setQuestStep(prev => prev + 1);
        sendSysMsg(`[OK]: ${input.toUpperCase()} accepted. Proceed to next objective.`);
        // Trigger Did You Know fact
        if (activeMission.didYouKnow && activeMission.didYouKnow[questStep]) {
          setCurrentFact(activeMission.didYouKnow[questStep]);
          setShowDidYouKnow(true);
        }
      }
    } else {
      sendSysMsg(`[INVALID]: Command rejected. Current Objective: ${currentStep.desc}`);
    }
  };

  // --- QUIZ HANDLER ---
  const handleQuizComplete = async (tier: Tier, quizScore: number, total: number) => {
    if (user) {
      await saveUserScore(user.uid, tier, quizScore, total);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserScores(userSnap.data().scores || {});
      }
    }
    setActiveTier(null);
  };

  // --- RENDER ---
  if (isLoadingAuth || bootStage === 'booting') {
    return <BootScreen bootText={bootText} />;
  }

  if (bootStage === 'login' || !user) {
    return (
      <AuthScreen 
        authMode={authMode} setAuthMode={setAuthMode}
        regUsername={regUsername} setRegUsername={setRegUsername}
        regEmail={regEmail} setRegEmail={setRegEmail}
        regPassword={regPassword} setRegPassword={setRegPassword}
        authError={authError}
        handleLogin={handleLogin} handleRegister={handleRegister} handleGoogleLogin={handleGoogleLogin}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-[#4ade80] font-mono overflow-hidden flex flex-col relative">
      {/* Navbar */}
      <nav className="h-14 border-b border-green-900 flex items-center justify-between px-6 bg-black/90 z-40 shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black italic text-white glow">SANDBOX<span className="text-green-500">_SECURE</span></h1>
          <div className="flex gap-4 text-xs font-bold uppercase">
            <button onClick={() => setScreen('dashboard')} className={`px-3 py-1 border ${screen === 'dashboard' ? 'border-green-500 text-green-500' : 'border-transparent text-green-900 hover:text-green-500'}`}>
              <LayoutDashboard size={14} className="inline mr-2"/> Dashboard
            </button>
            <button onClick={() => setScreen('academy')} className={`px-3 py-1 border ${screen === 'academy' ? 'border-green-500 text-green-500' : 'border-transparent text-green-900 hover:text-green-500'}`}>
              <GraduationCap size={14} className="inline mr-2"/> Academy
            </button>
            <button onClick={() => setScreen('missions')} className={`px-3 py-1 border ${screen === 'missions' ? 'border-green-500 text-green-500' : 'border-transparent text-green-900 hover:text-green-500'}`}>
              <Target size={14} className="inline mr-2"/> Missions
            </button>
            <button onClick={() => setScreen('profile')} className={`px-3 py-1 border ${screen === 'profile' ? 'border-green-500 text-green-500' : 'border-transparent text-green-900 hover:text-green-500'}`}>
              <ClipboardCheck size={14} className="inline mr-2"/> Profile
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <p className="text-green-900 text-[10px]">OPERATOR</p>
            <p className="text-white truncate max-w-[150px]">{user?.displayName || 'Unknown'}</p>
          </div>
          <button onClick={handleLogout} className="border border-red-900 text-red-500 px-3 py-1 hover:bg-red-900/20 flex items-center gap-1">
            <LogOut size={12} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {screen === 'dashboard' && <DashboardScreen user={user} />}
        {screen === 'academy' && <AcademyScreen activeTier={activeTier} setActiveTier={setActiveTier} userScores={userScores} handleQuizComplete={handleQuizComplete} />}
        {screen === 'missions' && <MissionsScreen startMission={startMission} />}
        {screen === 'terminal' && activeMission && (
          <TerminalScreen 
            activeMission={activeMission} handleCommand={handleCommand}
            isThreatActive={isThreatActive} timeLeft={timeLeft} questStep={questStep}
            msg={msg} sysNonce={sysNonce}
            setShowHint={setShowHint} setShowMap={setShowMap} setShowCheat={setShowCheat} setHintText={setHintText}
          />
        )}
        {screen === 'profile' && <ProfileScreen user={user} userScores={userScores} setShowEval={setShowEval} />}
      </main>

      {/* All Modals */}
      <BriefingModal show={showBriefing} mission={pendingMission} onStart={confirmStartMission} onAbort={() => setShowBriefing(false)} />
      <HintModal show={showHint} onClose={() => setShowHint(false)} text={hintText} />
      <NetworkMapModal show={showMap} onClose={() => setShowMap(false)} activeMission={activeMission} />
      <CheatSheetModal show={showCheat} onClose={() => setShowCheat(false)} />
      <DidYouKnowModal show={showDidYouKnow} fact={currentFact} onClose={() => setShowDidYouKnow(false)} />
      <EvalModal show={showEval} onClose={() => setShowEval(false)} />
    </div>
  );
}

export default App;