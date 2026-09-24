import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, CheckCircle, Terminal, GraduationCap, Trophy } from 'lucide-react';
import { QuizModule, type Question } from './QuizModule';

interface Level {
  id: string;
  title: string;
  description: string;
}

interface TierDashboardProps {
  tierName: string;
  levels: Level[];
  preTestQuestions: Question[];
  postTestQuestions: Question[];
  onExit: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const TierDashboard = ({ 
  tierName, 
  levels, 
  preTestQuestions, 
  postTestQuestions, 
  onExit,
  onComplete 
}: TierDashboardProps) => {
  const [view, setView] = useState<'map' | 'pre-test' | 'level' | 'post-test'>('map');
  const [activeLevelIndex, setActiveLevelIndex] = useState<number | null>(null);
  const [preTestPassed, setPreTestPassed] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [postTestScore, setPostTestScore] = useState<number | null>(null);

  const handlePreTestComplete = (score: number, total: number) => {
    if (score >= preTestQuestions.length * 0.7) setPreTestPassed(true);
    if (onComplete) onComplete(score, total);
    setView('map');
  };

  const handleLevelComplete = () => {
    if (activeLevelIndex !== null) {
      setCompletedLevels(prev => [...new Set([...prev, activeLevelIndex])]);
    }
    setActiveLevelIndex(null);
    setView('map');
  };

  const handlePostTestComplete = (score: number, total: number) => {
    setPostTestScore(score);
    if (onComplete) onComplete(score, total);
    setView('map');
  };

  if (view === 'pre-test') {
    return <QuizModule title={`${tierName} Pre-Assessment`} questions={preTestQuestions} onComplete={handlePreTestComplete} onExit={() => setView('map')} />;
  }

  if (view === 'post-test') {
    return <QuizModule title={`${tierName} Final Assessment`} questions={postTestQuestions} onComplete={handlePostTestComplete} onExit={() => setView('map')} />;
  }

  if (view === 'level' && activeLevelIndex !== null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
        <Terminal size={64} className="text-green-500" />
        <h2 className="text-3xl font-black text-white uppercase">Level {activeLevelIndex + 1}: {levels[activeLevelIndex].title}</h2>
        <p className="text-green-400 max-w-xl">{levels[activeLevelIndex].description}</p>
        
        <div className="border border-green-900 p-8 bg-black/80 w-full max-w-2xl shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <p className="text-sm text-green-600 mb-4">[TERMINAL INTERFACE WOULD LOAD HERE]</p>
          <p className="text-white mb-6">Complete the objectives to unlock the next level.</p>
          <button 
            onClick={handleLevelComplete}
            className="border border-green-500 px-8 py-3 text-sm font-bold uppercase hover:bg-green-500 hover:text-black transition-all"
          >
            Simulate Mission Complete
          </button>
        </div>
        <button onClick={() => setView('map')} className="text-xs text-red-500 hover:text-red-400 uppercase mt-4">Abort Mission</button>
      </div>
    );
  }

  const allLevelsComplete = completedLevels.length === levels.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col max-w-5xl mx-auto w-full py-6">
      <div className="flex justify-between items-center mb-8 border-b border-green-900 pb-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">{tierName} TIER</h2>
          <p className="text-xs text-green-600 mt-1">Complete all modules to earn certification</p>
        </div>
        <button onClick={onExit} className="text-xs text-red-500 hover:text-red-400 uppercase border border-red-900 px-4 py-2">Exit Tier</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <div className={`flex items-center gap-6 p-4 border ${preTestPassed ? 'border-green-500 bg-green-900/10' : 'border-green-900 bg-black/40'} transition-all`}>
          <div className={`p-3 rounded-full ${preTestPassed ? 'bg-green-500 text-black' : 'bg-black border border-green-700 text-green-500'}`}>
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Pre-Assessment</h3>
            <p className="text-xs text-green-600">Test your baseline knowledge before starting.</p>
          </div>
          <button 
            onClick={() => setView('pre-test')}
            disabled={preTestPassed}
            className="border border-green-500 px-6 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preTestPassed ? 'Completed' : 'Start Test'}
          </button>
        </div>

        {levels.map((level, idx) => {
          const isUnlocked = preTestPassed && (idx === 0 || completedLevels.includes(idx - 1));
          const isCompleted = completedLevels.includes(idx);

          return (
            <div key={level.id} className={`flex items-center gap-6 p-4 border ${isCompleted ? 'border-green-500 bg-green-900/10' : isUnlocked ? 'border-green-700 bg-black/60' : 'border-green-900/30 bg-black/20 opacity-50'} transition-all ml-8 relative`}>
              {idx > 0 && <div className="absolute -top-4 left-10 w-0.5 h-4 bg-green-900"></div>}
              
              <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-500 text-black' : isUnlocked ? 'bg-black border border-green-500 text-green-500' : 'bg-black border border-green-900 text-green-900'}`}>
                {isCompleted ? <CheckCircle size={24} /> : isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Level {idx + 1}: {level.title}</h3>
                <p className="text-xs text-green-600">{level.description}</p>
              </div>
              <button 
                onClick={() => isUnlocked && (setActiveLevelIndex(idx), setView('level'))}
                disabled={!isUnlocked}
                className="border border-green-500 px-6 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isCompleted ? 'Review' : isUnlocked ? 'Deploy' : 'Locked'}
              </button>
            </div>
          );
        })}

        <div className={`flex items-center gap-6 p-4 border ${postTestScore !== null ? 'border-green-500 bg-green-900/10' : allLevelsComplete ? 'border-green-700 bg-black/60' : 'border-green-900/30 bg-black/20 opacity-50'} transition-all ml-16 relative`}>
           <div className="absolute -top-4 left-10 w-0.5 h-4 bg-green-900"></div>

          <div className={`p-3 rounded-full ${postTestScore !== null ? 'bg-green-500 text-black' : allLevelsComplete ? 'bg-black border border-green-500 text-green-500' : 'bg-black border border-green-900 text-green-900'}`}>
            <Trophy size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Final Certification</h3>
            <p className="text-xs text-green-600">Prove your mastery to complete the tier.</p>
          </div>
          <button 
            onClick={() => setView('post-test')}
            disabled={!allLevelsComplete || postTestScore !== null}
            className="border border-green-500 px-6 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {postTestScore !== null ? `Passed (${postTestScore}/${postTestQuestions.length})` : allLevelsComplete ? 'Start Final' : 'Locked'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TierDashboard;