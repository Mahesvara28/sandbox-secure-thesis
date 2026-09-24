import { Map, HelpCircle, X, ClipboardCheck, BookOpen } from 'lucide-react';
import type { Mission } from '../data/gameData';
import { CHEAT_SHEET, ISO_QUESTIONS } from '../data/gameData';

// --- 1. Network Map Modal ---
export const NetworkMapModal = ({ show, onClose, activeMission }: { show: boolean; onClose: () => void; activeMission: Mission | null }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="border-2 border-green-500 bg-black p-6 max-w-2xl w-full mx-4 shadow-[0_0_50px_rgba(34,197,94,0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Map size={20} /> NETWORK TOPOLOGY</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-400 text-sm font-bold"><X size={20}/></button>
        </div>
        <div className="space-y-4">
          <div className="border border-green-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">Gateway (10.0.0.1)</span>
            </div>
            <p className="text-xs text-green-600">Status: ONLINE | Traffic: Normal</p>
          </div>
          <div className="border border-yellow-700 p-4 ml-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-white">Web Server (10.0.0.12)</span>
            </div>
            <p className="text-xs text-yellow-600">Port 80: OPEN | Port 443: OPEN</p>
          </div>
          {activeMission?.target && activeMission.target !== "none" && (
            <div className="border border-red-700 p-4 ml-16 bg-red-950/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold">THREAT DETECTED: {activeMission.target}</span>
              </div>
              <p className="text-xs text-red-600">Status: MALICIOUS - BLOCK REQUIRED IMMEDIATELY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 2. Hint Modal ---
export const HintModal = ({ show, onClose, text }: { show: boolean; onClose: () => void; text: string }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="border-2 border-yellow-500 bg-black p-6 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-yellow-900 pb-2">
          <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2"><HelpCircle size={20} /> MISSION HINT</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-400 text-sm font-bold"><X size={20}/></button>
        </div>
        <div className="text-green-400 font-mono text-sm leading-relaxed min-h-[60px] flex items-center">
          {text}
        </div>
        <button onClick={onClose} className="mt-6 w-full border border-yellow-600 text-yellow-500 py-2 hover:bg-yellow-900/20 text-sm font-bold uppercase transition-colors">
          Understood
        </button>
      </div>
    </div>
  );
};

// --- 3. Mission Briefing Modal (EDUCATIONAL) ---
export const BriefingModal = ({ show, mission, onStart, onAbort }: { show: boolean; mission: Mission | null; onStart: () => void; onAbort: () => void }) => {
  if (!show || !mission) return null;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="border-2 border-green-500 bg-black max-w-2xl w-full shadow-[0_0_50px_rgba(34,197,94,0.3)]">
        <div className="border-b border-green-900 p-6 bg-green-950/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-500 uppercase tracking-wider">Mission Briefing</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase">{mission.title}</h2>
          <p className="text-xs text-green-600 mt-1">{mission.tier} TIER</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-green-700 uppercase mb-2">Scenario</h3>
            <p className="text-green-400 text-sm italic border-l-2 border-green-700 pl-3">"{mission.scenario}"</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-green-700 uppercase mb-2">What You'll Learn</h3>
            <p className="text-white text-sm">{mission.briefing.concept}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-green-700 uppercase mb-2">Commands You'll Use</h3>
            <div className="space-y-2">
              {mission.briefing.commands.map((cmd, i) => (
                <div key={i} className="bg-green-950/30 border border-green-900 p-2 font-mono text-xs">
                  <span className="text-green-400">{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-yellow-700 bg-yellow-950/20 p-3">
            <h3 className="text-xs font-bold text-yellow-600 uppercase mb-1">Objective</h3>
            <p className="text-yellow-400 text-sm">{mission.briefing.objective}</p>
          </div>
        </div>

        <div className="border-t border-green-900 p-4 flex gap-3">
          <button
            onClick={onAbort}
            className="flex-1 border border-red-900 text-red-500 py-3 text-xs font-bold uppercase hover:bg-red-900/20 transition-colors"
          >
            Abort Mission
          </button>
          <button
            onClick={onStart}
            className="flex-1 border-2 border-green-500 bg-green-500 text-black py-3 text-xs font-black uppercase hover:bg-green-400 transition-colors"
          >
            Begin Mission →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Cheat Sheet Modal (EDUCATIONAL) ---
export const CheatSheetModal = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="border-2 border-purple-500 bg-black max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(168,85,247,0.3)]" onClick={e => e.stopPropagation()}>
        <div className="border-b border-purple-900 p-4 flex justify-between items-center sticky top-0 bg-black z-10">
          <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2"><BookOpen size={20} /> Linux Command Cheat Sheet</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-400"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6">
          {CHEAT_SHEET.map((section, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold text-purple-500 uppercase mb-3 border-b border-purple-900 pb-2">
                {section.category}
              </h4>
              <div className="space-y-2">
                {section.commands.map((item, j) => (
                  <div key={j} className="flex justify-between items-center bg-purple-950/20 border border-purple-900/50 p-3 hover:border-purple-500 transition-colors">
                    <code className="text-purple-300 font-mono text-sm">{item.cmd}</code>
                    <span className="text-green-400 text-xs">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 5. Did You Know Modal (EDUCATIONAL) ---
export const DidYouKnowModal = ({ show, fact, onClose }: { show: boolean; fact: string; onClose: () => void }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="border-2 border-yellow-500 bg-black max-w-md w-full shadow-[0_0_30px_rgba(234,179,8,0.3)]" onClick={e => e.stopPropagation()}>
        <div className="border-b border-yellow-900 p-4">
          <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
             Did You Know?
          </h3>
        </div>
        <div className="p-6">
          <p className="text-green-400 text-sm leading-relaxed">{fact}</p>
        </div>
        <div className="border-t border-yellow-900 p-4">
          <button
            onClick={onClose}
            className="w-full border border-yellow-600 text-yellow-500 py-2 text-xs font-bold uppercase hover:bg-yellow-900/20 transition-colors"
          >
            Continue Mission →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 6. ISO 9126 Evaluation Modal ---
export const EvalModal = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="border-2 border-purple-500 bg-black p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(168,85,247,0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-purple-900 pb-2 sticky top-0 bg-black z-10">
          <div>
            <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2"><ClipboardCheck size={20} /> ISO/IEC 9126 EVALUATION</h3>
            <p className="text-[10px] text-purple-700 mt-1">For Thesis Panel & IT Professionals</p>
          </div>
          <button onClick={onClose} className="text-red-500 hover:text-red-400 text-sm font-bold"><X size={20}/></button>
        </div>
        
        <div className="space-y-6">
          <div className="text-xs text-green-600 mb-4 border border-green-900 p-3 bg-green-950/20">
            <strong>Instructions:</strong> Rate each feature on a scale of 1-5. The comments below each question map the game feature directly to the ISO standard for your thesis documentation.
          </div>

          {ISO_QUESTIONS.map((item, idx) => (
            <div key={idx} className="border border-purple-900/50 p-4 bg-purple-950/10">
              <p className="text-[10px] font-bold text-purple-500 uppercase mb-2">{item.category}</p>
              <p className="text-white text-sm mb-3">{idx + 1}. {item.q}</p>
              
              <div className="flex gap-4 mb-3 text-xs">
                {[1, 2, 3, 4, 5].map(num => (
                  <label key={num} className="flex items-center gap-1 cursor-pointer hover:text-purple-400">
                    <input type="radio" name={`q-${idx}`} className="accent-purple-500" />
                    {num}
                  </label>
                ))}
              </div>
              
              <p className="text-[10px] text-green-700 italic border-t border-green-900/30 pt-2 mt-2">
                <strong>Thesis Note:</strong> {item.comment}
              </p>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-8 w-full border border-purple-600 text-purple-500 py-3 hover:bg-purple-900/20 text-sm font-bold uppercase transition-colors">
          Close Evaluation Form
        </button>
      </div>
    </div>
  );
};