import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  GraduationCap,
  Target,
  BookOpen,
  Map,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Shield,
  Keyboard
} from 'lucide-react';
import { useState } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const guideSteps = [
  {
    title: 'WELCOME, OPERATOR',
    subtitle: 'Welcome to Sandbox Secure',
    description:
      'You are entering a simulated cybersecurity training environment. Your objective is to learn, investigate incidents, and complete security operations.',
    icon: Shield,
    color: 'green',
    visual: 'WELCOME'
  },
  {
    title: 'ACADEMY',
    subtitle: 'Learn before you deploy',
    description:
      'The Academy is where you build your cybersecurity knowledge. Start with a pre-test, study the lessons, complete guided tutorials, and take the final test.',
    icon: GraduationCap,
    color: 'blue',
    visual: 'ACADEMY'
  },
  {
    title: 'MISSIONS',
    subtitle: 'Investigate security incidents',
    description:
      'Missions put your knowledge into practice. You will investigate suspicious activity, analyze evidence, and make decisions using the simulated terminal.',
    icon: Target,
    color: 'red',
    visual: 'MISSIONS'
  },
  {
    title: 'THE TERMINAL',
    subtitle: 'Your primary investigation tool',
    description:
      'Type commands into the terminal to explore the simulated system. Commands such as pwd, ls, cd, cat, grep, ps, and netstat help you investigate the environment.',
    icon: Terminal,
    color: 'green',
    visual: 'TERMINAL'
  },
  {
    title: 'MISSION OBJECTIVES',
    subtitle: 'Follow the investigation steps',
    description:
      'Every mission has objectives shown at the top of the terminal screen. Complete them in order to progress through the investigation.',
    icon: CheckCircle2,
    color: 'yellow',
    visual: 'OBJECTIVES'
  },
  {
    title: 'NEED HELP?',
    subtitle: 'Your tools are always available',
    description:
      'Use Hint when you are stuck, Map when you need to inspect the network, and Cheat Sheet when you need a quick command reference.',
    icon: HelpCircle,
    color: 'purple',
    visual: 'TOOLS'
  },
  {
    title: 'YOU ARE READY',
    subtitle: 'Begin your cybersecurity training',
    description:
      'Start with the Beginner Academy tier. Learn the fundamentals first, then progress toward more advanced investigations.',
    icon: Keyboard,
    color: 'green',
    visual: 'READY'
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

                {step === 1 && (
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
                        Tutorials
                      </div>

                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">03</span>
                        Missions
                      </div>

                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-blue-400">04</span>
                        Final Test
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-8 border border-green-900 bg-green-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Terminal size={16} className="text-green-400" />
                      <span className="text-xs font-bold text-green-400 uppercase">
                        Example Commands
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {['pwd', 'ls', 'cd', 'cat', 'grep', 'ps aux'].map(command => (
                        <div
                          key={command}
                          className="border border-green-900/70 bg-black px-3 py-2 text-xs text-green-300"
                        >
                          {command}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="mt-8 border border-yellow-900 bg-yellow-950/10 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-yellow-400" />

                      <div>
                        <p className="text-xs text-yellow-400 font-bold uppercase">
                          Follow the evidence
                        </p>

                        <p className="text-[11px] text-gray-500 mt-1">
                          Do not rush. Read the mission objective before entering commands.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div className="border border-yellow-900 bg-yellow-950/10 p-3 text-center">
                      <HelpCircle size={20} className="mx-auto text-yellow-500 mb-2" />
                      <p className="text-[10px] text-yellow-400 uppercase">
                        Hint
                      </p>
                    </div>

                    <div className="border border-blue-900 bg-blue-950/10 p-3 text-center">
                      <Map size={20} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-[10px] text-blue-400 uppercase">
                        Map
                      </p>
                    </div>

                    <div className="border border-purple-900 bg-purple-950/10 p-3 text-center">
                      <BookOpen size={20} className="mx-auto text-purple-500 mb-2" />
                      <p className="text-[10px] text-purple-400 uppercase">
                        Cheat Sheet
                      </p>
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="mt-8 border border-green-700 bg-green-950/20 p-4">
                    <div className="flex items-center gap-3">
                      <Target size={20} className="text-green-400" />

                      <div>
                        <p className="text-xs text-green-400 font-bold uppercase">
                          Recommended Starting Point
                        </p>

                        <p className="text-[11px] text-gray-400 mt-1">
                          Academy → Beginner → Start Training
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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