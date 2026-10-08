import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Trophy,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export interface Question {
  id: string | number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizModuleProps {
  title: string;
  questions: Question[];
  onComplete: (
    score: number,
    total: number,
    answers?: (number | null)[]
  ) => void;
  onExit: () => void;
  showReviewAfterComplete?: boolean;
  onContinueAfterComplete?: () => void;
  reviewAnswers?: (number | null)[];
  continueLabel?: string;
}

export const QuizModule = ({
  title,
  questions,
  onComplete,
  onExit,
  showReviewAfterComplete = false,
  onContinueAfterComplete,
  reviewAnswers,
  continueLabel = 'Continue'
}: QuizModuleProps) => {
  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [selectedOption, setSelectedOption] =
    useState<number | null>(null);

  const [answers, setAnswers] =
    useState<(number | null)[]>(
      () =>
        reviewAnswers ?? Array(questions.length).fill(null)
    );

  const [isFinished, setIsFinished] =
    useState(Boolean(reviewAnswers));

  const [finalScore, setFinalScore] =
    useState(() =>
      reviewAnswers
        ? reviewAnswers.reduce<number>(
            (total, answer, index) =>
              answer !== null &&
              answer === questions[index]?.correctAnswer
                ? total + 1
                : total,
            0
          )
        : 0
    );

  const [showReview, setShowReview] =
    useState(Boolean(reviewAnswers));

  if (questions.length === 0) {
    return (
      <div className="min-h-full bg-black text-green-500 flex items-center justify-center p-8">
        <div className="border border-green-900 p-8 text-center max-w-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            NO ASSESSMENT DATA
          </h2>

          <p className="text-green-700 mb-6">
            There are currently no questions available for this assessment.
          </p>

          <button
            onClick={onExit}
            className="border border-green-500 px-6 py-2 text-green-500 hover:bg-green-500 hover:text-black"
          >
            RETURN
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion =
    questions[currentIndex];

  const handleNext = () => {
    if (selectedOption === null) {
      return;
    }

    const updatedAnswers =
      [...answers];

    updatedAnswers[currentIndex] =
      selectedOption;

    if (
      currentIndex <
      questions.length - 1
    ) {
      setAnswers(
        updatedAnswers
      );

      setCurrentIndex(
        previous =>
          previous + 1
      );

      setSelectedOption(
        updatedAnswers[
          currentIndex + 1
        ] ?? null
      );

      return;
    }

    const calculatedScore =
      updatedAnswers.reduce<number>(
        (
          totalScore,
          answer,
          index
        ) => {
          if (
            answer !== null &&
            answer ===
              questions[index]
                .correctAnswer
          ) {
            return totalScore + 1;
          }

          return totalScore;
        },
        0
      );

    const safeScore =
      Math.min(
        calculatedScore,
        questions.length
      );

    setAnswers(
      updatedAnswers
    );

    setFinalScore(
      safeScore
    );

    setIsFinished(
      true
    );

    onComplete(
      safeScore,
      questions.length,
      updatedAnswers
    );
  };

  const handlePrevious = () => {
    if (
      currentIndex <= 0
    ) {
      return;
    }

    const previousIndex =
      currentIndex - 1;

    setCurrentIndex(
      previousIndex
    );

    setSelectedOption(
      answers[
        previousIndex
      ] ?? null
    );
  };

  const handleContinue =
    () => {
      if (
        onContinueAfterComplete
      ) {
        onContinueAfterComplete();
      } else {
        onExit();
      }
    };

  if (
    isFinished &&
    showReview
  ) {
    return (
      <div className="min-h-full bg-black text-green-500 p-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <div>
              <p className="text-green-900 text-xs uppercase">
                Assessment Review
              </p>

              <h1 className="text-3xl font-black text-white">
                {title}
              </h1>
            </div>

            <button
              onClick={
                handleContinue
              }
              className="border border-green-500 px-5 py-2 text-green-500 hover:bg-green-500 hover:text-black flex items-center gap-2"
            >
              {continueLabel}
              <ArrowRight
                size={16}
              />
            </button>

          </div>

          <div className="border border-green-900 bg-green-950/10 p-6 mb-8">

            <div className="flex items-center gap-3 mb-2">

              <BookOpen
                size={20}
              />

              <span className="text-green-700 uppercase text-xs font-bold">
                Final Score
              </span>

            </div>

            <p className="text-4xl font-black text-white">
              {finalScore}/
              {questions.length}
            </p>

          </div>

          <div className="space-y-6">

            {questions.map(
              (
                question,
                index
              ) => {
                const userAnswer =
                  answers[index];

                const isCorrect =
                  userAnswer !== null &&
                  userAnswer ===
                    question.correctAnswer;

                return (
                  <div
                    key={
                      question.id
                    }
                    className="border border-green-900 p-6 bg-black"
                  >

                    <div className="flex items-start gap-3 mb-5">

                      {isCorrect ? (
                        <CheckCircle
                          size={20}
                          className="text-green-500 mt-1 shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={20}
                          className="text-red-500 mt-1 shrink-0"
                        />
                      )}

                      <div>

                        <p className="text-green-900 text-xs mb-1">
                          QUESTION{' '}
                          {index + 1}
                        </p>

                        <h3 className="text-white font-bold">
                          {
                            question.question
                          }
                        </h3>

                      </div>

                    </div>

                    <div className="space-y-2">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const isUserAnswer =
                            userAnswer ===
                            optionIndex;

                          const isCorrectAnswer =
                            question.correctAnswer ===
                            optionIndex;

                          let className =
                            'border border-green-950 p-3 text-sm';

                          if (
                            isCorrectAnswer
                          ) {
                            className =
                              'border border-green-500 bg-green-500/10 p-3 text-sm text-green-400';
                          } else if (
                            isUserAnswer
                          ) {
                            className =
                              'border border-red-500 bg-red-500/10 p-3 text-sm text-red-400';
                          }

                          return (
                            <div
                              key={
                                optionIndex
                              }
                              className={
                                className
                              }
                            >
                              {option}

                              {isCorrectAnswer && (
                                <span className="ml-3 text-xs">
                                  CORRECT ANSWER
                                </span>
                              )}

                              {isUserAnswer &&
                                !isCorrectAnswer && (
                                  <span className="ml-3 text-xs">
                                    YOUR ANSWER
                                  </span>
                                )}
                            </div>
                          );
                        }
                      )}

                    </div>

                    {question.explanation && (
                      <div className="mt-5 border-l-2 border-green-500 pl-4">

                        <p className="text-xs text-green-700 uppercase mb-1">
                          Explanation
                        </p>

                        <p className="text-sm text-green-400">
                          {
                            question.explanation
                          }
                        </p>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage =
      questions.length > 0
        ? Math.round(
            (finalScore /
              questions.length) *
              100
          )
        : 0;

    const passed =
      percentage >= 70;

    return (
      <div className="min-h-full bg-black text-green-500 flex items-center justify-center p-8">

        <div className="w-full max-w-2xl border border-green-900 bg-black p-10 text-center">

          <Trophy
            size={48}
            className="mx-auto mb-5 text-green-500"
          />

          <p className="text-green-900 text-xs uppercase mb-2">
            Assessment Complete
          </p>

          <h1 className="text-3xl font-black text-white mb-8">
            {title}
          </h1>

          <div className="border border-green-900 p-8 mb-6">

            <p className="text-green-900 text-xs uppercase mb-2">
              Your Score
            </p>

            <p className="text-6xl font-black text-white">
              {finalScore}
              <span className="text-green-900">
                /
                {questions.length}
              </span>
            </p>

            <p className="text-green-500 mt-3">
              {percentage}%
            </p>

          </div>

          <div className="mb-8">

            {passed ? (
              <p className="text-green-400 font-bold">
                ASSESSMENT PASSED
              </p>
            ) : (
              <p className="text-red-500 font-bold">
                ASSESSMENT BELOW PASSING SCORE
              </p>
            )}

          </div>

          <div className="flex justify-center gap-3 flex-wrap">

            {showReviewAfterComplete && (
              <button
                onClick={() =>
                  setShowReview(
                    true
                  )
                }
                className="border border-green-500 px-6 py-3 text-green-500 hover:bg-green-500 hover:text-black flex items-center gap-2"
              >
                <BookOpen
                  size={16}
                />
                Review Answers
              </button>
            )}

            <button
              onClick={
                handleContinue
              }
              className="bg-green-500 text-black px-6 py-3 font-bold hover:bg-green-400 flex items-center gap-2"
            >
              Continue
              <ArrowRight
                size={16}
              />
            </button>

          </div>

        </div>

      </div>
    );
  }

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;

  return (
    <div className="min-h-full bg-black text-green-500 p-8">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <div>
            <p className="text-green-900 text-xs uppercase">
              Assessment
            </p>

            <h1 className="text-2xl font-black text-white">
              {title}
            </h1>
          </div>

          <p className="text-green-700 text-sm">
            {currentIndex + 1}
            /
            {questions.length}
          </p>

        </div>

        <div className="h-1 bg-green-950 mb-8">

          <div
            className="h-full bg-green-500 transition-all"
            style={{
              width: `${progress}%`
            }}
          />

        </div>

        <div className="border border-green-900 p-8 bg-black">

          <p className="text-green-900 text-xs uppercase mb-3">
            Question{' '}
            {currentIndex + 1}
          </p>

          <h2 className="text-xl font-bold text-white mb-8">
            {
              currentQuestion.question
            }
          </h2>

          <div className="space-y-3">

            {currentQuestion.options.map(
              (
                option,
                index
              ) => {

                const isSelected =
                  selectedOption ===
                  index;

                return (
                  <button
                    key={
                      index
                    }
                    onClick={() =>
                      setSelectedOption(
                        index
                      )
                    }
                    className={`w-full text-left border p-4 transition ${
                      isSelected
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-green-950 text-green-700 hover:border-green-700 hover:text-green-400'
                    }`}
                  >

                    <span className="inline-flex items-center justify-center w-7 h-7 border border-green-900 mr-3 text-xs">
                      {String.fromCharCode(
                        65 + index
                      )}
                    </span>

                    {option}

                  </button>
                );
              }
            )}

          </div>

          <div className="flex justify-between mt-8">

            <button
              onClick={
                currentIndex ===
                0
                  ? onExit
                  : handlePrevious
              }
              className="border border-green-900 px-5 py-2 text-green-700 hover:text-green-400 hover:border-green-700"
            >
              {currentIndex ===
              0
                ? 'Exit'
                : 'Previous'}
            </button>

            <button
              onClick={
                handleNext
              }
              disabled={
                selectedOption ===
                null
              }
              className={`px-6 py-2 font-bold flex items-center gap-2 ${
                selectedOption ===
                null
                  ? 'bg-green-950 text-green-900 cursor-not-allowed'
                  : 'bg-green-500 text-black hover:bg-green-400'
              }`}
            >
              {currentIndex ===
              questions.length - 1
                ? 'Submit'
                : 'Next'}

              <ArrowRight
                size={16}
              />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};