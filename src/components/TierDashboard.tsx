import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Play,
  Shield,
  Trophy,
  XCircle,
  ArrowLeft,
  BookOpen
} from 'lucide-react';

import type {
  Tier,
  Mission
} from '../data/gameData';

import {
  MISSIONS,
  BRIDGE_MISSIONS
} from '../data/gameData';

import {
  QuizModule,
  type Question
} from './QuizModule';
import { CommandFieldGuide } from './CommandFieldGuide';

interface TierDashboardProps {
  tierName: Tier;

  preTestQuestions: Question[];

  postTestQuestions: Question[];

  onExit: () => void;

  onComplete: (
    score: number,
    total: number,
    isPreTest?: boolean,
    metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
  ) => void | Promise<void>;
  onSessionReady?: (session: Record<string, unknown>) => void;

  onStartMission: (
    missionId: string
  ) => void;

  completedMissions: string[];

  userScores: Record<
    string,
    {
      score: number;
      total: number;
      preTestScore?: number;
      preTestTotal?: number;
      finalScore?: number;
      finalTotal?: number;
    }
  >;
  activeSession?: Record<string, unknown> | null;
}

type Stage =
  | 'intro'
  | 'pretest'
  | 'missions'
  | 'finaltest'
  | 'complete'
  | 'review-select'
  | 'review';

const shuffledQuestions = (questions: Question[]): Question[] => {
  const copy = questions.map(question => ({ ...question, options: [...question.options] }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    const answer = copy[index].options[copy[index].correctAnswer];
    const options = copy[index].options;
    for (let optionIndex = options.length - 1; optionIndex > 0; optionIndex -= 1) {
      const optionSwapIndex = Math.floor(Math.random() * (optionIndex + 1));
      [options[optionIndex], options[optionSwapIndex]] = [options[optionSwapIndex], options[optionIndex]];
    }
    copy[index].correctAnswer = options.indexOf(answer);
  }
  return copy;
};

export const TierDashboard = ({
  tierName,
  preTestQuestions,
  postTestQuestions,
  onExit,
  onComplete,
  onSessionReady,
  onStartMission,
  completedMissions,
  userScores,
  activeSession
}: TierDashboardProps) => {

  const [assessmentQuestions] = useState(() => ({
    pre: tierName === 'BEGINNER' ? shuffledQuestions(preTestQuestions) : preTestQuestions,
    post: tierName === 'BEGINNER' ? shuffledQuestions(postTestQuestions) : postTestQuestions
  }));

  const activePreTestQuestions = assessmentQuestions.pre;
  const activePostTestQuestions = assessmentQuestions.post;

  const [showCommandGuide, setShowCommandGuide] = useState(false);

  const tierMissions: Mission[] = [
    ...(tierName === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []),
    ...MISSIONS.filter(
      mission =>
        mission.tier === tierName
    )
  ];

  const savedTierScore =
    userScores[tierName];
  const activeTestType = activeSession?.kind === 'test' && activeSession.status === 'in_progress' && activeSession.tier === tierName
    ? activeSession.testType === 'post' ? 'post' : 'pre'
    : null;

  const [
    stage,
    setStage
  ] = useState<Stage>(
    activeTestType === 'pre' ? 'pretest' : activeTestType === 'post' ? 'finaltest' : savedTierScore ? 'missions' : 'intro'
  );

  const [
    preTestScore,
    setPreTestScore
  ] = useState<number | null>(
    savedTierScore
      ? (savedTierScore.preTestScore ?? savedTierScore.score)
      : null
  );

  const [
    finalScore,
    setFinalScore
  ] = useState<number | null>(
    null
  );

  // Answers from the post-assessment, kept so they can be reviewed again
  const [
    finalAnswers,
    setFinalAnswers
  ] = useState<(number | null)[] | null>(
    null
  );

  const [reviewAssessment, setReviewAssessment] = useState<'pre' | 'post'>('post');
  const [answerKeyOnly, setAnswerKeyOnly] = useState(false);
  const [reviewReturnStage, setReviewReturnStage] = useState<'missions' | 'complete' | 'review-select'>('complete');

  const openAnswerKey = (assessment: 'pre' | 'post', returnStage: 'missions' | 'complete' | 'review-select') => {
    setReviewAssessment(assessment);
    setAnswerKeyOnly(true);
    setReviewReturnStage(returnStage);
    setStage('review');
  };

  const openPostAnswerReview = () => {
    setReviewAssessment('post');
    setAnswerKeyOnly(false);
    setReviewReturnStage('review-select');
    setStage('review');
  };

  const completedCount =
    tierMissions.filter(
      mission =>
        completedMissions.includes(
          mission.id
        )
    ).length;

  const allMissionsComplete =
    tierMissions.length > 0 &&
    completedCount ===
      tierMissions.length;

  // Unlock the first unfinished mission in sequence. Using only the immediately
  // preceding card can make progression confusing when saved progress contains
  // gaps (for example, after bridge lessons have been added to a tier).
  const firstIncompleteMissionIndex = tierMissions.findIndex(
    mission => !completedMissions.includes(mission.id)
  );

  const nextMission = tierMissions.find(mission => !completedMissions.includes(mission.id));

  const finalPercentage =
    finalScore !== null &&
    activePostTestQuestions.length > 0
      ? Math.round(
          (finalScore /
            activePostTestQuestions.length) *
            100
        )
      : 0;

  const prePercentage = preTestScore !== null && activePreTestQuestions.length > 0
    ? Math.round((preTestScore / activePreTestQuestions.length) * 100)
    : 0;
  const scoreChange = finalPercentage - prePercentage;

  if (stage === 'intro') {
    return (
      <div className="h-full overflow-y-auto p-6">

        <div className="mx-auto w-full max-w-[1320px]">

          <button
            onClick={onExit}
            className="text-xs text-green-600 hover:text-green-300 mb-6"
          >
            ← RETURN TO ACADEMY
          </button>

          <div className="border border-green-500/30 bg-black/60 p-8">

            <div className="flex items-center gap-4 mb-6">

              <div className="w-14 h-14 border border-green-500 flex items-center justify-center">

                <Shield
                  size={28}
                  className="text-green-400"
                />

              </div>

              <div>

                <p className="text-xs text-green-700 tracking-widest">
                  CERTIFICATION TIER
                </p>

                <h1 className="text-3xl font-black text-green-300">
                  {tierName}
                </h1>

              </div>

            </div>

            <div className="border border-green-500/20 bg-green-500/5 p-5">

              <h2 className="text-green-300 font-bold">
                PRE-ASSESSMENT
              </h2>

              <p className="text-sm text-green-600 leading-6 mt-2">
                This assessment measures your existing knowledge before
                you begin the training missions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

                <div className="border border-green-500/20 p-3">

                  <p className="text-[10px] text-green-700">
                    QUESTIONS
                  </p>

                  <p className="text-xl font-black text-green-300">
                    {
                      activePreTestQuestions.length
                    }
                  </p>

                </div>

                <div className="border border-green-500/20 p-3">

                  <p className="text-[10px] text-green-700">
                    PASSING SCORE
                  </p>

                  <p className="text-xl font-black text-green-300">
                    70%
                  </p>

                </div>

                <div className="border border-green-500/20 p-3">

                  <p className="text-[10px] text-green-700">
                    FEEDBACK
                  </p>

                  <p className="text-xl font-black text-green-300">
                    HIDDEN
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-3">

              <button
                onClick={onExit}
                className="border border-green-500/20 px-6 py-3 text-xs font-bold uppercase text-green-600 hover:border-green-500/50"
              >
                Cancel
              </button>

              <button
                onClick={() => setShowCommandGuide(true)}
                className="border border-cyan-700/60 px-6 py-3 text-xs font-bold uppercase text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/20"
              >
                <BookOpen size={14} className="mr-2 inline" />
                Command Field Guide
              </button>

              <button
                onClick={() =>
                  setStage(
                    'pretest'
                  )
                }
                className="flex-1 bg-green-500 text-black px-6 py-3 text-xs font-black uppercase hover:bg-green-400 flex items-center justify-center gap-2"
              >
                <Play size={15} />
                Start Pre-Assessment
              </button>

            </div>

            {showCommandGuide && <CommandFieldGuide tier={tierName} onClose={() => setShowCommandGuide(false)} />}

          </div>

        </div>

      </div>
    );
  }

  if (stage === 'pretest') {
    return (
      <QuizModule
        title={`${tierName} Pre-Assessment`}
        questions={
          activePreTestQuestions
        }
        showReviewAfterComplete={
          false
        }
        onComplete={(
          score: number,
          total: number,
          _answers?: (number | null)[],
          metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
        ) => {

          const safeScore =
            Math.min(
              score,
              total
            );

          setPreTestScore(
            safeScore
          );

          onComplete(
            safeScore,
            total,
            true,
            metadata
          );
        }}
        onSessionReady={onSessionReady}
        continueLabel="Continue to missions"
        onContinueAfterComplete={() => setStage('missions')}
        onExit={() =>
          setStage('intro')
        }
      />
    );
  }

  if (stage === 'missions') {
    return (
      <div className="h-full overflow-y-auto p-6">

        <div className="mx-auto w-full max-w-[1320px]">

          <button
            onClick={onExit}
            className="text-xs text-green-600 hover:text-green-300 mb-6"
          >
            ← BACK TO TIERS
          </button>

          <div className="border border-green-500/30 bg-black/60 p-6 mb-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="text-xs text-green-700 tracking-widest">
                  TRAINING PHASE
                </p>

                <h1 className="text-3xl font-black text-green-300 mt-1">
                  {tierName} MISSIONS
                </h1>

                <p className="text-sm text-green-600 mt-2">
                  Learn and practice the skills required for your final
                  assessment.
                </p>
                <p className="mt-3 border-l-2 border-cyan-700 pl-3 text-xs leading-5 text-cyan-200">
                  {nextMission
                    ? <>Next step: <strong>{nextMission.title}</strong>. Read its briefing before starting; each mission introduces the skills needed for the next one.</>
                    : 'You have completed every mission in this tier. You can continue to the final assessment.'}
                </p>

              </div>

              <div className="flex flex-col gap-2">
              <div className="border border-green-500/20 p-4 text-center">

                <p className="text-[10px] text-green-700">
                  PRE-ASSESSMENT
                </p>

                <p className="text-2xl font-black text-green-300">
                  {preTestScore ?? 0}/
                  {activePreTestQuestions.length}
                </p>

              </div>
              <button onClick={() => setShowCommandGuide(true)} className="border border-cyan-700/60 px-4 py-3 text-xs font-bold uppercase text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/20">
                <BookOpen size={14} className="mr-2 inline" /> Command Field Guide
              </button>
              {savedTierScore && (
                <div className="grid grid-cols-2 gap-2">
                  {savedTierScore.preTestScore !== undefined && <button onClick={() => openAnswerKey('pre', 'missions')} className="border border-green-800 px-3 py-2 text-[10px] font-bold uppercase text-green-400 hover:border-green-400">Pre-Test Answers</button>}
                  {savedTierScore.finalScore !== undefined && (
                    <button onClick={() => openAnswerKey('post', 'missions')} className="border border-green-800 px-3 py-2 text-[10px] font-bold uppercase text-green-400 hover:border-green-400">Post-Test Answers</button>
                  )}
                </div>
              )}
              </div>

            </div>

            {tierName === 'BEGINNER' && <div className={`mt-4 border-l-2 p-3 text-xs leading-5 ${prePercentage >= 80 ? 'border-cyan-500 bg-cyan-950/20 text-cyan-100' : 'border-green-900 bg-green-950/10 text-green-600'}`}>
              <p className="font-bold uppercase tracking-widest">{prePercentage >= 80 ? 'Placement suggestion' : 'Practice is optional'}</p>
              <p className="mt-1">{prePercentage >= 80
                ? 'Your pre-assessment suggests you already know many foundations. You can continue directly with this certification path; standalone practice missions in the Missions tab are optional. Intermediate bridge lessons remain part of that tier.'
                : 'The standalone practice missions in the Missions tab are optional and separate from certification. Use them for extra practice or continue with the Academy missions.'}</p>
            </div>}

          </div>

          {showCommandGuide && <CommandFieldGuide tier={tierName} onClose={() => setShowCommandGuide(false)} />}

          <div className="relative space-y-4 before:absolute before:bottom-5 before:left-[21px] before:top-5 before:w-px before:bg-green-800/60">

            {tierMissions.map(
              (
                mission,
                index
              ) => {

                const completed =
                  completedMissions.includes(
                    mission.id
                  );

                const unlocked =
                  completed ||
                  index === firstIncompleteMissionIndex;

                return (
                  <div
                    key={mission.id}
                    className={`roadmap-node-card relative border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(34,197,94,0.08)] ${
                      completed
                        ? 'border-green-500/40 bg-green-500/5'
                        : unlocked
                        ? 'border-green-500/20 bg-black/60'
                        : 'border-green-500/10 bg-black/40 opacity-60'
                    }`}
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                      <div className="flex items-start gap-4">

                        <div className="w-11 h-11 shrink-0 border border-green-500/30 flex items-center justify-center">

                          {completed ? (
                            <CheckCircle2
                              size={21}
                              className="text-green-400"
                            />
                          ) : unlocked ? (
                            <span className="text-green-400 font-bold">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                '0'
                              )}
                            </span>
                          ) : (
                            <Lock
                              size={18}
                              className="text-green-700"
                            />
                          )}

                        </div>

                        <div>

                          <p className="text-[10px] text-green-700">
                            MISSION{' '}
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              '0'
                            )}
                          </p>

                          <h2 className="text-lg font-bold text-green-300">
                            {mission.title}
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-cyan-800 px-2 py-1 text-cyan-300">{mission.category ?? 'case'} · {mission.difficulty}</span>
                            <span className="rounded-full border border-green-900 px-2 py-1 text-green-500">~{Math.max(3, Math.ceil(mission.steps.length * 1.5))} min</span>
                            {completed && <span className="rounded-sm border border-green-500/50 bg-green-500/10 px-2 py-1 font-bold tracking-wider text-green-300">RESOLVED</span>}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-green-700">
                            {mission.learningGoal ?? mission.intro}
                          </p>

                        </div>

                      </div>

                      <button
                        disabled={
                          !unlocked
                        }
                        title={
                          !unlocked
                            ? `Complete ${tierMissions[index - 1]?.title ?? 'the previous mission'} first.`
                            : undefined
                        }
                        onClick={() =>
                          onStartMission(
                            mission.id
                          )
                        }
                        className={`px-5 py-3 text-xs font-black uppercase border ${
                          unlocked
                            ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black'
                            : 'border-green-500/10 text-green-700 cursor-not-allowed'
                        }`}
                      >
                        {completed
                          ? 'Replay Mission'
                          : unlocked
                          ? 'Start Mission'
                          : 'Locked'}
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

          <div className="mt-6 border border-green-500/20 bg-black/60 p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="text-xs text-green-700">
                  MISSION PROGRESS
                </p>

                <p className="text-2xl font-black text-green-300 mt-1">
                  {completedCount}/
                  {tierMissions.length}
                </p>

              </div>

              <button
                disabled={
                  !allMissionsComplete
                }
                onClick={() =>
                  setStage(
                    'finaltest'
                  )
                }
                className={`px-6 py-3 text-xs font-black uppercase ${
                  allMissionsComplete
                    ? 'bg-green-500 text-black hover:bg-green-400'
                    : 'border border-green-500/10 text-green-700 cursor-not-allowed'
                }`}
              >
                {allMissionsComplete
                  ? 'Take Final Assessment'
                  : 'Complete All Missions First'}
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  if (stage === 'finaltest') {
    return (
      <QuizModule
        title={`${tierName} Post-Assessment`}
        questions={
          activePostTestQuestions
        }
        continueLabel="Choose Review"
        onComplete={(
          score: number,
          total: number,
          answers?: (number | null)[],
          metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
        ) => {

          const safeScore =
            Math.min(
              score,
              total
            );

          if (answers) {
            setFinalAnswers(answers);
          }

          setFinalScore(safeScore);

          // Keep every attempt so learners can compare assessment progress.
          onComplete(safeScore, total, false, metadata);
        }}
        onSessionReady={onSessionReady}
        onContinueAfterComplete={() => setStage('review-select')}
        onExit={() =>
          setStage('missions')
        }
      />
    );
  }

  if (stage === 'review') {
    const reviewQuestions = reviewAssessment === 'pre' ? activePreTestQuestions : activePostTestQuestions;
    return (
      <QuizModule
        title={`${tierName} ${reviewAssessment === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'}`}
        questions={reviewQuestions}
        reviewAnswers={answerKeyOnly ? Array<(number | null)>(reviewQuestions.length).fill(null) : reviewAssessment === 'post' ? finalAnswers ?? undefined : undefined}
        continueLabel={reviewReturnStage === 'missions' ? 'Back to Missions' : 'Back to Review Options'}
        onComplete={() => {}}
        onContinueAfterComplete={() => setStage(reviewReturnStage)}
        onExit={() => setStage(reviewReturnStage)}
      />
    );
  }

  if (stage === 'review-select') {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-3xl border border-green-500/30 bg-black/70 p-6 sm:p-8">
          <button onClick={() => setStage('complete')} className="mb-6 text-xs text-green-600 hover:text-green-300">← BACK TO RESULTS</button>
          <p className="text-xs tracking-widest text-green-700">ASSESSMENT REVIEW</p>
          <h1 className="mt-2 text-3xl font-black text-green-300">Choose an answer review</h1>
          <p className="mt-3 text-sm leading-6 text-green-600">Review your post-assessment choices or open the correct-answer guide for either assessment.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finalAnswers && (
              <button onClick={openPostAnswerReview} className="border border-cyan-700/60 p-4 text-left hover:border-cyan-400">
                <span className="block text-sm font-bold text-cyan-300">Review my post-test answers</span>
                <span className="mt-1 block text-xs text-green-700">See your selections, correct answers, and explanations.</span>
              </button>
            )}
            <button onClick={() => openAnswerKey('post', 'review-select')} className="min-h-32 border border-green-800 bg-green-950/20 p-5 text-left transition-colors hover:border-green-400 hover:bg-green-950/40">
              <span className="block text-sm font-bold text-green-300">Post-test answer key</span>
              <span className="mt-1 block text-xs text-green-700">View every correct answer and its explanation.</span>
            </button>
            <button onClick={() => openAnswerKey('pre', 'review-select')} className="min-h-32 border border-green-800 bg-green-950/20 p-5 text-left transition-colors hover:border-green-400 hover:bg-green-950/40">
              <span className="block text-sm font-bold text-green-300">Pre-test answer key</span>
              <span className="mt-1 block text-xs text-green-700">Review the foundation questions and correct answers.</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'complete') {
    const passed =
      finalPercentage >= 70;

    return (
      <div className="h-full overflow-y-auto p-6">

        <div className="max-w-4xl mx-auto">

          <div
            className={`border p-8 text-center ${
              passed
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-red-500/40 bg-red-500/5'
            }`}
          >

            {passed ? (
              <Trophy
                size={64}
                className="text-green-400 mx-auto mb-5"
              />
            ) : (
              <XCircle
                size={64}
                className="text-red-400 mx-auto mb-5"
              />
            )}

            <p className="text-xs text-green-700 tracking-[0.3em]">
              POST-ASSESSMENT COMPLETE
            </p>

            <h1
              className={`text-4xl font-black uppercase mt-2 ${
                passed
                  ? 'text-green-300'
                  : 'text-red-300'
              }`}
            >
              {passed
                ? 'Certification Unlocked'
                : 'Assessment Not Passed'}
            </h1>

            <div className="mt-8">

              <p className="text-xs text-green-700">
                FINAL SCORE
              </p>

              <p className="text-6xl font-black text-green-300">
                {finalScore ?? 0}
                <span className="text-2xl text-green-700">
                  /{activePostTestQuestions.length}
                </span>
              </p>

              <p className="text-2xl text-green-500 mt-2">
                {finalPercentage}%
              </p>

            </div>

            <div className="mt-6 border border-green-500/20 p-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <p className="text-xs text-green-700">
                    PRE-ASSESSMENT
                  </p>

                  <p className="text-2xl font-black text-green-300">
                    {preTestScore ?? 0}/
                    {activePreTestQuestions.length}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-green-700">
                    POST-ASSESSMENT
                  </p>

                  <p className="text-2xl font-black text-green-300">
                    {finalScore ?? 0}/
                    {activePostTestQuestions.length}
                  </p>

                </div>

              </div>

              <p className={`mt-4 border-t border-green-900/60 pt-3 text-sm ${scoreChange >= 0 ? 'text-green-300' : 'text-yellow-300'}`}>
                {scoreChange > 0 ? `Assessment score increased by ${scoreChange} percentage points.` : scoreChange < 0 ? `Assessment score was ${Math.abs(scoreChange)} percentage points lower this time.` : 'Both assessment scores were at the same percentage.'}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-green-700">The pre-test and post-test use different questions, so this is a broad progress signal rather than a topic-by-topic comparison.</p>

            </div>

            {passed ? (
              <div className="mt-6 border border-green-500/30 bg-green-500/5 p-5">

                <Award
                  size={32}
                  className="text-green-400 mx-auto mb-2"
                />

                <h2 className="text-green-300 font-black uppercase">
                  Certification Complete
                </h2>

                <p className="text-xs text-green-600 mt-2">
                  You have successfully completed the {tierName} training
                  tier.
                </p>

              </div>
            ) : (
              <div className="mt-6 border border-red-500/30 bg-red-500/5 p-5">

                <p className="text-red-300 font-black">
                  70% IS REQUIRED TO PASS
                </p>

                <p className="text-xs text-red-400/70 mt-2">
                  Complete the training missions and attempt the post-
                  assessment again.
                </p>

              </div>
            )}

            <div className="mt-6 flex flex-col md:flex-row gap-3">

              {passed && finalAnswers && (
                <button
                  onClick={() =>
                    setStage(
                      'review'
                    )
                  }
                  className="flex-1 border border-green-500 px-5 py-3 text-xs font-bold uppercase text-green-400 hover:bg-green-500 hover:text-black flex items-center justify-center gap-2"
                >
                  <BookOpen size={14} />
                  Review Answers
                </button>
              )}

              <button
                onClick={() =>
                  setStage(
                    'missions'
                  )
                }
                className="flex-1 border border-green-500/30 px-5 py-3 text-xs font-bold uppercase text-green-400 hover:bg-green-500/10"
              >
                Review Missions
              </button>

              <button
                onClick={onExit}
                className={`flex-1 px-5 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 ${
                  passed
                    ? 'bg-green-500 text-black hover:bg-green-400'
                    : 'border border-green-500/30 text-green-400 hover:bg-green-500/10'
                }`}
              >
                <ArrowLeft size={14} />
                Back to Tiers
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  return null;
};
