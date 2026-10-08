import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Play,
  Shield,
  Trophy,
  XCircle
} from 'lucide-react';

import type {
  Tier,
  Mission
} from '../data/gameData';

import {
  MISSIONS
} from '../data/gameData';

import {
  QuizModule,
  type Question
} from './QuizModule';

interface TierDashboardProps {
  tierName: Tier;

  preTestQuestions: Question[];

  postTestQuestions: Question[];

  onExit: () => void;

  onComplete: (
    score: number,
    total: number,
    isPreTest?: boolean
  ) => void;

  onStartMission: (
    missionId: string
  ) => void;

  completedMissions: string[];

  userScores: Record<
    string,
    {
      score: number;
      total: number;
    }
  >;
}

type Stage =
  | 'intro'
  | 'pretest'
  | 'missions'
  | 'finaltest'
  | 'complete';

export const TierDashboard = ({
  tierName,
  preTestQuestions,
  postTestQuestions,
  onExit,
  onComplete,
  onStartMission,
  completedMissions,
  userScores
}: TierDashboardProps) => {

  const tierMissions: Mission[] =
    MISSIONS.filter(
      mission =>
        mission.tier === tierName
    );

  const savedTierScore =
    userScores[tierName];

  const [
    stage,
    setStage
  ] = useState<Stage>(
    savedTierScore
      ? 'missions'
      : 'intro'
  );

  const [
    preTestScore,
    setPreTestScore
  ] = useState<number | null>(
    savedTierScore
      ? savedTierScore.score
      : null
  );

  const [
    finalScore,
    setFinalScore
  ] = useState<number | null>(
    null
  );

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

  const finalPercentage =
    finalScore !== null &&
    postTestQuestions.length > 0
      ? Math.round(
          (finalScore /
            postTestQuestions.length) *
            100
        )
      : 0;

  if (stage === 'intro') {
    return (
      <div className="h-full overflow-y-auto p-6">

        <div className="max-w-5xl mx-auto">

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
                      preTestQuestions.length
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
          preTestQuestions
        }
        showReviewAfterComplete={
          false
        }
        onComplete={(
          score,
          total
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
            true
          );

          setStage(
            'missions'
          );
        }}
        onExit={() =>
          setStage('intro')
        }
      />
    );
  }

  if (stage === 'missions') {
    return (
      <div className="h-full overflow-y-auto p-6">

        <div className="max-w-5xl mx-auto">

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

              </div>

              <div className="border border-green-500/20 p-4 text-center">

                <p className="text-[10px] text-green-700">
                  PRE-ASSESSMENT
                </p>

                <p className="text-2xl font-black text-green-300">
                  {preTestScore ?? 0}/
                  {preTestQuestions.length}
                </p>

              </div>

            </div>

          </div>

          <div className="space-y-4">

            {tierMissions.map(
              (
                mission,
                index
              ) => {

                const completed =
                  completedMissions.includes(
                    mission.id
                  );

                const previousComplete =
                  index === 0 ||
                  completedMissions.includes(
                    tierMissions[
                      index - 1
                    ]?.id
                  );

                const unlocked =
                  completed ||
                  previousComplete;

                return (
                  <div
                    key={mission.id}
                    className={`border p-5 ${
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

                          <p className="text-sm text-green-600 mt-1">
                            {mission.intro}
                          </p>

                        </div>

                      </div>

                      <button
                        disabled={
                          !unlocked
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
          postTestQuestions
        }
        showReviewAfterComplete={
          true
        }
        onComplete={(
          score,
          total
        ) => {

          const safeScore =
            Math.min(
              score,
              total
            );

          setFinalScore(safeScore);

          // Save the score only when the 70% pass mark is reached
          if (total > 0 && (safeScore / total) * 100 >= 70) {
            onComplete(safeScore, total);
          }
        }}
        onContinueAfterComplete={() =>
          setStage('complete')
        }
        onExit={() =>
          setStage('missions')
        }
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
                  /{postTestQuestions.length}
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
                    {preTestQuestions.length}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-green-700">
                    POST-ASSESSMENT
                  </p>

                  <p className="text-2xl font-black text-green-300">
                    {finalScore ?? 0}/
                    {postTestQuestions.length}
                  </p>

                </div>

              </div>

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

              {passed && (
                <button
                  onClick={onExit}
                  className="flex-1 bg-green-500 text-black px-5 py-3 text-xs font-black uppercase hover:bg-green-400"
                >
                  Return to Academy
                </button>
              )}

            </div>

          </div>

        </div>

      </div>
    );
  }

  return null;
};