import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, finishAssessmentSession, getBrowserSessionId, saveAssessmentSessionProgress, startOrResumeAssessmentSession } from '../Firebase';
import { ASSESSMENT_TIME_LIMIT_SECONDS } from '../data/assessmentTiming';
import { motion, useReducedMotion } from 'framer-motion';
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

export interface QuizModuleProps {
  title: string;
  questions: Question[];
  onComplete: (
    score: number,
    total: number,
    answers?: (number | null)[],
    metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
  ) => void;
  onExit: () => void;
  showReviewAfterComplete?: boolean;
  onContinueAfterComplete?: () => void;
  onSessionReady?: (session: Record<string, unknown>) => void;
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
  onSessionReady,
  reviewAnswers,
  continueLabel = 'Continue'
}: QuizModuleProps) => {
  const reduceMotion = useReducedMotion();
  const progressScope = auth.currentUser?.uid ?? 'guest';
  const [clientId] = useState(getBrowserSessionId);
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(ASSESSMENT_TIME_LIMIT_SECONDS);
  const [ready, setReady] = useState(Boolean(reviewAnswers));
  const [sessionError, setSessionError] = useState('');
  const [warning, setWarning] = useState('');
  const submittedRef = useRef(false);
  const revisionRef = useRef(0);
  const warningRef = useRef(0);
  const progressStorageKey = `sandbox-secure-assessment-checkpoint-${progressScope}-${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const readAssessmentCheckpoint = () => {
    if (reviewAnswers) return null;
    try {
      return JSON.parse(localStorage.getItem(progressStorageKey) ?? 'null') as { currentQuestionId?: string; answers?: Record<string, string | null> } | null;
    } catch {
      return null;
    }
  };
  const savedCheckpoint = readAssessmentCheckpoint();
  const answerKeyOnly = Boolean(
    reviewAnswers &&
    reviewAnswers.length === activeQuestions.length &&
    reviewAnswers.every(answer => answer === null)
  );
  const [currentIndex, setCurrentIndex] =
    useState(() => Math.max(0, activeQuestions.findIndex(question => String(question.id) === savedCheckpoint?.currentQuestionId)));

  const [selectedOption, setSelectedOption] =
    useState<number | null>(null);

  const [answers, setAnswers] =
    useState<(number | null)[]>(
      () => reviewAnswers ?? activeQuestions.map(question => {
        const savedAnswer = savedCheckpoint?.answers?.[String(question.id)];
        return savedAnswer ? question.options.indexOf(savedAnswer) : null;
      })
    );

  const [isFinished, setIsFinished] =
    useState(Boolean(reviewAnswers));

  const [finalScore, setFinalScore] =
    useState(() =>
      reviewAnswers
        ? reviewAnswers.reduce<number>(
            (total, answer, index) =>
              answer !== null &&
              answer === activeQuestions[index]?.correctAnswer
                ? total + 1
                : total,
            0
          )
        : 0
    );

  const [showReview, setShowReview] =
    useState(Boolean(reviewAnswers));

  useEffect(() => {
    if (reviewAnswers || !auth.currentUser || !questions.length) return;
    let cancelled = false;
    const [tier = 'BEGINNER', phase = 'Pre-Assessment'] = title.split(/\s+(?=Pre-Assessment|Post-Assessment)/);
    const testType = phase.startsWith('Post') ? 'post' : 'pre';
    const key = `${tier}:${testType}`;
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    void startOrResumeAssessmentSession(auth.currentUser.uid, id, clientId, key, tier, testType, questions.map(question => String(question.id)))
      .then(({ session, serverOffsetMs: measuredOffset }) => {
        if (cancelled) return;
        const byId = new Map(questions.map(question => [String(question.id), question]));
        const restoredOrder = session.questionOrder.map(questionId => byId.get(questionId)).filter((question): question is Question => Boolean(question));
        if (restoredOrder.length === questions.length) setActiveQuestions(restoredOrder);
        const restoredAnswers = session.answers ?? {};
        const restoredQuestions = restoredOrder.length ? restoredOrder : questions;
        setAnswers(restoredQuestions.map(question => {
          const answer = restoredAnswers[String(question.id)];
          const index = typeof answer === 'string' ? question.options.indexOf(answer) : -1;
          return index >= 0 ? index : null;
        }));
        setCurrentIndex(Math.max(0, Math.min(session.currentIndex ?? 0, questions.length - 1)));
        revisionRef.current = Number(session.revision ?? 0);
        const restoredCurrent = restoredQuestions[session.currentIndex ?? 0];
        const restoredCurrentAnswer = restoredCurrent ? restoredAnswers[String(restoredCurrent.id)] : null;
        const currentOptionIndex = typeof restoredCurrentAnswer === 'string' && restoredCurrent ? restoredCurrent.options.indexOf(restoredCurrentAnswer) : -1;
        setSelectedOption(currentOptionIndex >= 0 ? currentOptionIndex : null);
        const start = session.startedAt.toMillis();
        setStartedAtMs(start);
        setServerOffsetMs(measuredOffset);
        setSessionId(session.sessionId);
        setRemainingSeconds(Math.max(0, Math.ceil(ASSESSMENT_TIME_LIMIT_SECONDS - (Date.now() + measuredOffset - start) / 1000)));
        onSessionReady?.({ ...session, clockOffsetMs: measuredOffset });
        setReady(true);
      })
      .catch(error => { if (!cancelled) setSessionError(error instanceof Error ? error.message : 'Could not load the saved test session.'); });
    return () => { cancelled = true; };
  }, [title, questions, reviewAnswers, clientId, onSessionReady]);

  useEffect(() => {
    if (!ready || !sessionId || startedAtMs === null || isFinished) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil(ASSESSMENT_TIME_LIMIT_SECONDS - (Date.now() + serverOffsetMs - startedAtMs) / 1000));
      setRemainingSeconds(left);
      if (left <= 120 && warningRef.current < 120) { warningRef.current = 120; setWarning('Two minutes remain.'); }
      if (left <= 30 && warningRef.current < 30) { warningRef.current = 30; setWarning('Thirty seconds remain.'); }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [ready, sessionId, startedAtMs, serverOffsetMs, isFinished]);

  useEffect(() => {
    if (!ready || !sessionId || isFinished) return;
    const answersById = Object.fromEntries(activeQuestions.map((question, index) => [String(question.id), answers[index] === null ? null : question.options[answers[index] as number]]));
    const revision = ++revisionRef.current;
    void saveAssessmentSessionProgress(progressScope, sessionId, clientId, revision, answersById, currentIndex).catch(error => console.error('Could not save assessment progress:', error));
  }, [ready, sessionId, progressScope, clientId, answers, currentIndex, activeQuestions, isFinished]);

  const submitAssessment = useCallback(async (submittedAnswers: (number | null)[], timedOut: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const score = submittedAnswers.reduce<number>((sum, answer, index) => sum + (answer !== null && answer === activeQuestions[index]?.correctAnswer ? 1 : 0), 0);
    setAnswers(submittedAnswers);
    const startedAt = startedAtMs === null ? undefined : new Date(startedAtMs).toISOString();
    let maySubmit = true;
    if (sessionId) {
      try { maySubmit = await finishAssessmentSession(progressScope, sessionId, clientId, timedOut); }
      catch (error) { console.error('Could not finalize assessment session:', error); setSessionError('Your answers are saved, but the test could not be submitted. Please retry when your connection is available.'); submittedRef.current = false; return; }
    }
    if (maySubmit) {
      setFinalScore(score);
      setIsFinished(true);
      onComplete(score, activeQuestions.length, submittedAnswers, { startedAt, timedOut, answeredCount: submittedAnswers.filter(answer => answer !== null).length });
    } else {
      setSessionError('This test was already submitted in another tab.');
    }
  }, [activeQuestions, startedAtMs, sessionId, progressScope, clientId, onComplete]);

  useEffect(() => {
    if (ready && remainingSeconds === 0 && !isFinished) {
      const timeout = window.setTimeout(() => {
        const finalAnswers = [...answers];
        if (selectedOption !== null) finalAnswers[currentIndex] = selectedOption;
        void submitAssessment(finalAnswers, true);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [ready, remainingSeconds, isFinished, answers, selectedOption, currentIndex, submitAssessment]);

  useEffect(() => {
    if (reviewAnswers || !ready) return;
    if (isFinished) {
      try { localStorage.removeItem(progressStorageKey); } catch { /* Storage is optional. */ }
      return;
    }
    if (!answers.some(answer => answer !== null)) {
      if (currentIndex === 0) localStorage.removeItem(progressStorageKey);
      return;
    }
    try {
      const savedAnswers = Object.fromEntries(activeQuestions.map((question, index) => [
        String(question.id),
        answers[index] === null ? null : question.options[answers[index] as number]
      ]));
      localStorage.setItem(progressStorageKey, JSON.stringify({
        currentQuestionId: String(activeQuestions[currentIndex]?.id ?? ''),
        answers: savedAnswers
      }));
    } catch {
      // Assessments remain usable when browser storage is disabled.
    }
  }, [answers, currentIndex, isFinished, activeQuestions, reviewAnswers, progressStorageKey, ready]);

    if (activeQuestions.length === 0) {
    return (
      <div className="assessment-quiz min-h-full bg-black text-green-500 flex items-center justify-center p-8">
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

  if (!ready) {
    return <div className="assessment-quiz min-h-full flex items-center justify-center p-8" role="status" aria-live="polite">
      <div className="max-w-lg border border-amber-700 bg-slate-950 p-6 text-center text-slate-100">
        <h2 className="text-lg font-bold">Preparing your assessment</h2>
        <p className="mt-2 text-sm text-slate-300">{sessionError || 'Loading your saved answers and secure start time…'}</p>
        {sessionError && <button type="button" onClick={onExit} className="mt-4 rounded border border-slate-500 px-4 py-2 font-semibold">Return</button>}
      </div>
    </div>;
  }

  const currentQuestion =
    activeQuestions[currentIndex];

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
      activeQuestions.length - 1
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

    setAnswers(updatedAnswers);
    void submitAssessment(updatedAnswers, false);
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
      <div className="assessment-quiz min-h-full bg-black text-green-500 p-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <div>
              <p className="text-green-900 text-xs uppercase">
                {answerKeyOnly ? 'Answer Key' : 'Assessment Review'}
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
              {answerKeyOnly ? 'Correct answers' : 'Final Score'}
              </span>

            </div>

            <p className="text-4xl font-black text-white">
              {answerKeyOnly ? `${activeQuestions.length} questions` : <>{finalScore}/{activeQuestions.length}</>}
            </p>

          </div>

          <div className="space-y-6">

            {activeQuestions.map(
              (
                question,
                index
              ) => {
                const userAnswer =
                  answers[index];

                const isCorrect =
                  !answerKeyOnly &&
                  userAnswer !== null &&
                  userAnswer ===
                    question.correctAnswer;

                return (
                  <div
                    key={
                      question.id
                    }
                    className="assessment-quiz-card border border-green-900 p-6 bg-black"
                  >

                    <div className="flex items-start gap-3 mb-5">

                      {answerKeyOnly ? (
                        <BookOpen size={20} className="mt-1 shrink-0 text-cyan-400" />
                      ) : isCorrect ? (
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

                          if (isCorrectAnswer) {
                            className =
                              'border border-green-500 bg-green-500/10 p-3 text-sm text-green-400';
                          } else if (answerKeyOnly || isUserAnswer) {
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

                              {!isCorrectAnswer && (answerKeyOnly || isUserAnswer) && (
                                  <span className="ml-3 text-xs">
                                    {answerKeyOnly ? 'INCORRECT OPTION' : 'YOUR ANSWER · INCORRECT'}
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
      activeQuestions.length > 0
        ? Math.round(
            (finalScore /
              activeQuestions.length) *
              100
          )
        : 0;

    const passed =
      percentage >= 70;

    return (
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }} className="assessment-quiz min-h-full bg-black text-green-500 flex items-center justify-center p-8">

        <div className="assessment-quiz-card w-full max-w-2xl border border-green-900 bg-black p-10 text-center">

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
                {activeQuestions.length}
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
                onClick={() => setShowReview(true)}
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
              {continueLabel}
              <ArrowRight
                size={16}
              />
            </button>

          </div>

        </div>

      </motion.div>
    );
  }

  const progress =
    ((currentIndex + 1) /
      activeQuestions.length) *
    100;

  return (
    <div className="assessment-quiz min-h-full bg-black text-green-500 p-8">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6 gap-4">

          <div>
            <p className="text-green-900 text-xs uppercase">
              Assessment
            </p>

            <h1 className="text-2xl font-black text-white">
              {title}
            </h1>
          </div>

          <div className="text-right">
            <p className="font-mono text-lg font-bold text-amber-200" aria-label={`Time remaining: ${Math.floor(remainingSeconds / 60)} minutes ${remainingSeconds % 60} seconds`}>
              {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')} remaining
            </p>
            <p className="text-slate-300 text-sm">Question {currentIndex + 1}/{activeQuestions.length}</p>
          </div>

        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">{warning}</p>
        {warning && <p className="mb-4 border-l-4 border-amber-400 bg-amber-950/40 px-4 py-2 text-sm font-semibold text-amber-100">{warning}</p>}

        <div className="h-1 bg-green-950 mb-8">

          <div
            className="h-full bg-green-500 transition-all"
            style={{
              width: `${progress}%`
            }}
          />

        </div>

        <motion.div key={String(currentQuestion.id)} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="assessment-quiz-card border border-green-900 p-8 bg-black">

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
              activeQuestions.length - 1
                ? 'Submit'
                : 'Next'}

              <ArrowRight
                size={16}
              />
            </button>

          </div>

        </motion.div>

      </div>

    </div>
  );
};
