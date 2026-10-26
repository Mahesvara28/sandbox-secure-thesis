export interface MissionProgressStat {
  completions: number;
  bestGrade?: string;
  hintsUsed?: number;
  lastCompletedAt?: string;
}

export interface PlayerProgression {
  xp: number;
  rank: string;
  badges: string[];
  tierRewards: string[];
  streak: { current: number; longest: number; lastActiveDate: string };
  missionStats: Record<string, MissionProgressStat>;
}

export const DEFAULT_PROGRESSION: PlayerProgression = {
  xp: 0,
  rank: 'Recruit',
  badges: [],
  tierRewards: [],
  streak: { current: 0, longest: 0, lastActiveDate: '' },
  missionStats: {}
};

export const RANKS = [
  { name: 'Recruit', threshold: 0 },
  { name: 'Analyst', threshold: 150 },
  { name: 'Responder', threshold: 400 },
  { name: 'Hunter', threshold: 800 },
  { name: 'Lead', threshold: 1400 }
] as const;

export const normalizeProgression = (value: unknown): PlayerProgression => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROGRESSION, badges: [], tierRewards: [], streak: { ...DEFAULT_PROGRESSION.streak }, missionStats: {} };
  const candidate = value as Partial<PlayerProgression>;
  const streak = candidate.streak && typeof candidate.streak === 'object' ? candidate.streak : DEFAULT_PROGRESSION.streak;
  const xp = Number.isFinite(candidate.xp) ? Math.max(0, Number(candidate.xp)) : 0;
  const rank = [...RANKS].reverse().find(item => xp >= item.threshold)?.name ?? 'Recruit';
  return {
    xp,
    rank,
    badges: Array.isArray(candidate.badges) ? candidate.badges.filter((badge): badge is string => typeof badge === 'string') : [],
    tierRewards: Array.isArray(candidate.tierRewards) ? candidate.tierRewards.filter((tier): tier is string => typeof tier === 'string') : [],
    streak: {
      current: Number.isFinite(streak.current) ? Math.max(0, Number(streak.current)) : 0,
      longest: Number.isFinite(streak.longest) ? Math.max(0, Number(streak.longest)) : 0,
      lastActiveDate: typeof streak.lastActiveDate === 'string' ? streak.lastActiveDate : ''
    },
    missionStats: candidate.missionStats && typeof candidate.missionStats === 'object' ? candidate.missionStats : {}
  };
};

export const applyCertificationRewards = (progression: PlayerProgression, tiers: Array<{ id: string; missionIds: string[]; completedMissionIds: string[]; preTestTaken: boolean; postTestTaken: boolean; passed: boolean }>) => {
  const next = normalizeProgression(progression);
  const badges = new Set(next.badges);
  const rewards = new Set(next.tierRewards);
  let xp = next.xp;
  for (const tier of tiers) {
    const allMissionsDone = tier.missionIds.length > 0 && tier.missionIds.every(id => tier.completedMissionIds.includes(id));
    if (!allMissionsDone) continue;
    if (tier.passed) badges.add('clearance-granted');
    if (tier.preTestTaken && tier.postTestTaken) badges.add('full-circle');
    if (tier.passed && !rewards.has(tier.id)) {
      rewards.add(tier.id);
      xp += 100;
    }
  }
  next.badges = [...badges];
  next.tierRewards = [...rewards];
  next.xp = xp;
  next.rank = [...RANKS].reverse().find(item => xp >= item.threshold)?.name ?? 'Recruit';
  return next;
};

export const rankProgress = (xp: number) => {
  const current = [...RANKS].reverse().find(item => xp >= item.threshold) ?? RANKS[0];
  const next = RANKS.find(item => item.threshold > current.threshold);
  return { current, next, percent: next ? Math.min(100, Math.round(((xp - current.threshold) / (next.threshold - current.threshold)) * 100)) : 100 };
};

export const getMissionXp = (tier: string) => tier === 'EXPERT' ? 120 : tier === 'INTERMEDIATE' ? 80 : 50;

// Learning gain is a descriptive dashboard value, never part of pass/fail scoring.
export const getTierLearningGain = (pre?: { score?: number; total?: number }, post?: { score?: number; total?: number }) => {
  if (!pre?.total || !post?.total) return null;
  return Math.round((post.score ?? 0) / post.total * 100) - Math.round((pre.score ?? 0) / pre.total * 100);
};
