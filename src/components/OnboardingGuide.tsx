import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  GraduationCap,
  Target,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  LayoutDashboard,
  UserRound
} from 'lucide-react';
import { useState } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const guideSteps = [
  {
    title: 'WELCOME, OPERATOR',
    subtitle: 'Your interface tour',
    description:
      'You are entering a simulated cybersecurity training environment. Your objective is to learn, investigate incidents, and complete security operations.',
    icon: LayoutDashboard,
    color: 'green',
    visual: 'WELCOME'
  },
  {
    title: 'DASHBOARD',
    subtitle: 'Your home screen',
    description: 'Use the Dashboard to see your pre-test and post-test scores, open the Academy, or find standalone practice missions. You can reopen this tour with How to Play.',
    icon: LayoutDashboard,
    color: 'blue',
    visual: 'DASHBOARD'
  },
  {
    title: 'ACADEMY',
    subtitle: 'Certification path',
    description:
      'Choose a certification tier. Its path is pre-test, Academy missions in order, then post-test. Your progress is saved so you can return to your training.',
    icon: GraduationCap,
    color: 'blue',
    visual: 'ACADEMY'
  },
  {
    title: 'MISSIONS',
    subtitle: 'Investigate security incidents',
    description:
      'The Missions tab contains optional standalone practice. These scenarios are separate from Academy certification missions and do not replace them.',
    icon: Target,
    color: 'red',
    visual: 'MISSIONS'
  },
  {
    title: 'PROFILE & SUPPORT',
    subtitle: 'Scores and help',
    description: 'Profile shows your assessment results. Use How to Play on the Dashboard to revisit this interface tour. Your first Academy mission also introduces the tools used during investigations.',
    icon: UserRound,
    color: 'purple',
    visual: 'PROFILE'
  }
];

const OnboardingGuide = ({ onComplete }: OnboardingGuideProps) => {
  const [step, setStep] = useState(0);

  const current = guideSteps[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === guideSteps.length - 1;

  const nextStep = () => {
    if (isLast) {
      onComplete();
      return;
    }

    setStep(prev => prev + 1);
  };

  const previousStep = () => {
    if (!isFirst) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-green-500 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-green-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl border border-green-700 bg-black shadow-[0_0_60px_rgba(34,197,94,0.15)] overflow-hidden"
      >
        <div className="border-b border-green-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border border-green-500 p-2">
              <Terminal size={20} className="text-green-400" />
            </div>

            <div>
              <p className="text-[10px] text-green-700 uppercase tracking-[0.3em]">
                Sandbox Secure
              </p>
              <p className="text-sm text-green-400 font-bold uppercase tracking-wider">
                Operator Orientation
              </p>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="text-green-700 hover:text-red-400 transition-colors"
            title="Skip orientation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-[0.9fr_1.1fr] min-h-[460px]">
          <div className="border-b md:border-b-0 md:border-r border-green-900 p-6 flex flex-col justify-center bg-green-950/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-green-500/10 blur-2xl" />

                  <div className="relative w-28 h-28 border-2 border-green-500 flex items-center justify-center">
                    <Icon size={52} className="text-green-400" />
                  </div>
                </div>

                <p className="text-[10px] text-green-700 uppercase tracking-[0.3em] mb-2">
                  MODULE {String(step + 1).padStart(2, '0')}
                </p>

                <h2 className="text-2xl font-black text-white tracking-wider">
                  {current.visual}
                </h2>

                <div className="mt-6 flex gap-1">
                  {guideSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 transition-all duration-300 ${
                        index === step
                          ? 'w-8 bg-green-400'
                          : index < step
                          ? 'w-4 bg-green-700'
                          : 'w-4 bg-green-950'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={18} className="text-green-500" />

                  <span className="text-xs text-green-600 uppercase tracking-widest">
                    {current.subtitle}
                  </span>
                </div>

                <h1 className="text-3xl font-black text-white mb-5 tracking-tight">
                  {current.title}
                </h1>

                <p className="text-sm text-gray-400 leading-7 max-w-xl">
                  {current.description}
                </p>

                {step === 2 && (
                  <div className="mt-8 border border-blue-900 bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase">
                        Recommended Path
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">01</span>
                        Pre-Test
                      </div>

                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">02</span>
                        Certification Missions
                      </div>

                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">03</span>
                        Post-Test
                      </div>

                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">04</span>
                        Extra practice is in the Missions tab
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && <div className="mt-8 border border-red-900 bg-red-950/10 p-4"><div className="flex items-center gap-3"><Target size={18} className="text-red-400" /><p className="text-xs text-gray-300">Standalone practice scenarios. Certification progress stays in the Academy.</p></div></div>}
                {step === 4 && <div className="mt-8 border border-purple-900 bg-purple-950/10 p-4"><div className="flex items-center gap-3"><BookOpen size={18} className="text-purple-400" /><HelpCircle size={18} className="text-purple-400" /><p className="text-xs text-gray-300">This tour covers navigation. A separate guide will appear when you enter your first certification mission.</p></div></div>}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={previousStep}
                  disabled={isFirst}
                  className="flex items-center gap-2 px-4 py-2 border border-green-900 text-green-700 text-xs font-bold uppercase hover:border-green-500 hover:text-green-400 disabled:opacity-20 disabled:hover:border-green-900 disabled:hover:text-green-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  onClick={onComplete}
                  className="text-[10px] text-gray-600 hover:text-gray-300 uppercase transition-colors"
                >
                  Skip Orientation
                </button>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-5 py-2 border border-green-500 bg-green-500/10 text-green-400 text-xs font-bold uppercase hover:bg-green-500 hover:text-black transition-all"
                >
                  {isLast ? 'Start Training' : 'Next'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-green-900 px-4 py-2 flex items-center justify-between">
          <span className="text-[9px] text-green-800 uppercase tracking-wider">
            Operator Orientation Protocol
          </span>

          <span className="text-[9px] text-green-800">
            {step + 1} / {guideSteps.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
export { OnboardingGuide };
export default OnboardingGuide;
