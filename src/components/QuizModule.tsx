import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, BookOpen } from 'lucide-react';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizModuleProps {
  title: string;
  questions: Question[];
  onComplete: (score: number, total: number) => void;
  onExit: () => void;
}

export const QuizModule = ({ title, questions, onComplete, onExit }: QuizModuleProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    setShowExplanation(true);
    
    if (selectedOption === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      onComplete(score + (selectedOption === currentQ.correctAnswer ? 1 : 0), questions.length);
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-6 py-10">
        <Trophy size={64} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-black text-white uppercase">{title} Complete</h2>
        <div className="border border-green-500 p-8 bg-black/80 w-96 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <p className="text-green-400 text-sm uppercase mb-2">Final Score</p>
          <p className="text-5xl font-black text-white glow">{score} / {questions.length}</p>
          <p className="text-green-600 mt-2 text-sm">Accuracy: {percentage}%</p>
        </div>
        <button onClick={onExit} className="border border-green-500 px-8 py-3 text-sm font-bold uppercase hover:bg-green-500 hover:text-black transition-all">
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full py-10 px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-green-900 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">{title}</h2>
        <div className="text-sm text-green-400">
          Question <span className="text-white font-bold">{currentIndex + 1}</span> / {questions.length}
        </div>
        <button onClick={onExit} className="text-xs text-red-500 hover:text-red-400 uppercase">Abort Test</button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-green-900 mb-8">
        <div 
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
            <BookOpen size={24} className="text-green-500 mt-1 shrink-0" />
            <p className="text-2xl text-white font-medium leading-relaxed">{currentQ.question}</p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((option, idx) => {
            let borderColor = 'border-green-900 hover:border-green-500';
            let bgColor = 'bg-black/40';
            let textColor = 'text-green-300';

            if (isSubmitted) {
              if (idx === currentQ.correctAnswer) {
                borderColor = 'border-green-500 bg-green-900/30';
                bgColor = 'bg-green-900/30';
                textColor = 'text-green-400';
              } else if (idx === selectedOption) {
                borderColor = 'border-red-500 bg-red-900/30';
                bgColor = 'bg-red-900/30';
                textColor = 'text-red-400';
              } else {
                borderColor = 'border-green-900/50 opacity-50';
              }
            } else if (selectedOption === idx) {
              borderColor = 'border-green-500 bg-green-900/20';
              bgColor = 'bg-green-900/20';
              textColor = 'text-green-400';
            }

            return (
              <button
                key={idx}
                onClick={() => !isSubmitted && setSelectedOption(idx)}
                disabled={isSubmitted}
                className={`w-full text-left p-4 border ${borderColor} ${bgColor} transition-all flex justify-between items-center group`}
              >
                <span className={`${textColor} group-hover:text-white font-mono`}>{option}</span>
                {isSubmitted && idx === currentQ.correctAnswer && <CheckCircle size={20} className="text-green-500" />}
                {isSubmitted && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle size={20} className="text-red-500" />}
              </button>
            );
          })}
        </div>

        {/* Explanation (shown after submit) */}
        {showExplanation && currentQ.explanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border border-blue-700 bg-blue-950/30 p-4"
          >
            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Explanation</h4>
            <p className="text-blue-300 text-sm">{currentQ.explanation}</p>
          </motion.div>
        )}

        {/* Result Feedback */}
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-6 p-4 border ${
              selectedOption === currentQ.correctAnswer 
                ? 'border-green-500 bg-green-950/30' 
                : 'border-red-500 bg-red-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedOption === currentQ.correctAnswer ? (
                <>
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-green-400 font-bold">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" size={20} />
                  <span className="text-red-400 font-bold">Incorrect</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="border border-green-500 px-8 py-3 text-sm font-bold uppercase hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="border border-green-500 px-8 py-3 text-sm font-bold uppercase hover:bg-green-500 hover:text-black transition-all"
          >
            {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizModule;