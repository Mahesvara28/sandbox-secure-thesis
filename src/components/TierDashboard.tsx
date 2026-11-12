import { useState } from 'react';
import {
  Award,
  Trophy,
  XCircle,
  ArrowLeft,
  BookOpen
} from 'lucide-react';

import type { Tier } from '../data/gameData';

import {
  QuizModule,
  type Question
} from './QuizModule';
import type { PlayerProgression } from '../data/progression';
import { StoryCampaignScreen } from './StoryCampaignScreen';
import type { CampaignProgress } from '../Firebase';
import type { ActivityResult } from './ActivityShell';

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
  progression: PlayerProgression;

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
  campaignProgress: CampaignProgress;
  assessmentProgress: Record<Tier, { preTestComplete: boolean; postTestComplete: boolean }>;
  unlockedTiers: Record<Tier, boolean>;
  skipStoryScenes: boolean;
  progressLoadFailed: boolean;
  onCompleteCampaignNode: (nodeId: string) => void;
  onCompleteStoryActivity: (nodeId: string, result: ActivityResult) => Promise<{ rewarded: boolean; xp: number; coins: number }>;
}

type Stage =
  | 'campaign'
  | 'pretest'
  | 'finaltest'
  | 'complete'
  | 'review';

const shuffledQuestions = (questions: Question[]): Question[] => {
  const copy = questions.map(question => ({ ...question, options: [...question.options] }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  for (const question of copy) {
    const answer = question.options[question.correctAnswer];
    const options = question.options;
    for (let optionIndex = options.length - 1; optionIndex > 0; optionIndex -= 1) {
      const optionSwapIndex = Math.floor(Math.random() * (optionIndex + 1));
      [options[optionIndex], options[optionSwapIndex]] = [options[optionSwapIndex], options[optionIndex]];
    }
    question.correctAnswer = options.indexOf(answer);
  }
  return copy.slice(0, 10);
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
  activeSession,
  campaignProgress,
  assessmentProgress,
  unlockedTiers,
  skipStoryScenes,
  progressLoadFailed,
  onCompleteCampaignNode,
  onCompleteStoryActivity
}: TierDashboardProps) => {

  const [assessmentQuestions, setAssessmentQuestions] = useState(() => ({
    pre: shuffledQuestions(preTestQuestions),
    post: shuffledQuestions(postTestQuestions)
  }));

  const activePreTestQuestions = assessmentQuestions.pre;
  const activePostTestQuestions = assessmentQuestions.post;

  const savedTierScore =
    userScores[tierName];
  const activeTestType = activeSession?.kind === 'test' && activeSession.status === 'in_progress' && activeSession.tier === tierName
    ? activeSession.testType === 'post' ? 'post' : 'pre'
    : null;

  const [
    stage,
    setStage
  ] = useState<Stage>(
    activeTestType === 'pre' ? 'pretest' : activeTestType === 'post' ? 'finaltest' : 'campaign'
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
    savedTierScore?.finalScore ?? null
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
  const [reviewReturnStage, setReviewReturnStage] = useState<'complete' | 'campaign'>('complete');

  const openAnswerKey = (assessment: 'pre' | 'post', returnStage: 'complete' | 'campaign') => {
    setReviewAssessment(assessment);
    setAnswerKeyOnly(true);
    setReviewReturnStage(returnStage);
    setStage('review');
  };

  const openPostAnswerReview = () => {
    setReviewAssessment('post');
    setAnswerKeyOnly(false);
    setReviewReturnStage('campaign');
    setStage('review');
  };

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

  if (stage === 'campaign') {
    return <StoryCampaignScreen
      tier={tierName}
      completedMissions={completedMissions}
      assessmentProgress={assessmentProgress}
      assessmentScores={{
        pre: { score: savedTierScore?.preTestScore ?? savedTierScore?.score ?? null, total: savedTierScore?.preTestTotal ?? savedTierScore?.total ?? activePreTestQuestions.length },
        post: { score: savedTierScore?.finalScore ?? null, total: savedTierScore?.finalTotal ?? activePostTestQuestions.length }
      }}
      unlockedTiers={unlockedTiers}
      campaignProgress={campaignProgress}
      skipStoryScenes={skipStoryScenes}
      progressLoadFailed={progressLoadFailed}
      onCompleteNode={onCompleteCampaignNode}
      onStartMission={onStartMission}
      onAssessment={(_tier, kind) => {
        // A completed pre-test is a one-time baseline and cannot be restarted.
        // In-progress pre-tests still resume through the saved assessment session above.
        if (kind === 'pre' && assessmentProgress[tierName].preTestComplete) return;

        // Pick a fresh 10-question set for every new attempt. If a test is
        // already in progress, QuizModule restores the saved question order.
        setAssessmentQuestions(current => ({
          ...current,
          [kind]: shuffledQuestions(kind === 'pre' ? preTestQuestions : postTestQuestions)
        }));
        setStage(kind === 'pre' ? 'pretest' : 'finaltest');
      }}
      onReviewAssessment={kind => {
        if (kind === 'post' && finalAnswers) openPostAnswerReview();
        else openAnswerKey(kind, 'campaign');
      }}
      onActivityComplete={onCompleteStoryActivity}
      onExit={onExit}
    />;
  }

  if (stage === 'pretest') {
    return (
      <QuizModule
        title={`${tierName} Pre-Assessment`}
        questions={
          activePreTestQuestions
        }
        questionBank={preTestQuestions}
        showReviewAfterComplete={
          true
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
        onContinueAfterComplete={() => setStage('campaign')}
        onExit={() =>
          setStage('campaign')
        }
      />
    );
  }

  if (stage === 'finaltest') {
    return (
      <QuizModule
        title={`${tierName} Post-Assessment`}
        questions={
          activePostTestQuestions
        }
        questionBank={postTestQuestions}
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
        onContinueAfterComplete={() => setStage('complete')}
        onExit={() => setStage('campaign')}
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
        continueLabel={reviewReturnStage === 'campaign' ? 'Back to Certification Journey' : 'Back to Results'}
        onComplete={() => {}}
        onContinueAfterComplete={() => setStage(reviewReturnStage)}
        onExit={() => setStage(reviewReturnStage)}
      />
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
                  onClick={openPostAnswerReview}
                  className="flex-1 border border-green-500 px-5 py-3 text-xs font-bold uppercase text-green-400 hover:bg-green-500 hover:text-black flex items-center justify-center gap-2"
                >
                  <BookOpen size={14} />
                  Review Answers
                </button>
              )}

              <button
                onClick={() =>
                  setStage(
                    'campaign'
                  )
                }
                className="flex-1 border border-green-500/30 px-5 py-3 text-xs font-bold uppercase text-green-400 hover:bg-green-500/10"
              >
                Certification Journey
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
