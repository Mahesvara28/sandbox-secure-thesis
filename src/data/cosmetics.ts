export type CosmeticKind = 'frame' | 'palette' | 'title';

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  price: number;
  kind: CosmeticKind;
}

export const COSMETIC_CATALOG: Record<CosmeticKind, CosmeticItem[]> = {
  frame: [
    { id: 'frame-standard', name: 'Standard Frame', description: 'A clean frame for your operator avatar.', price: 0, kind: 'frame' },
    { id: 'frame-circuit', name: 'Circuit Trace', description: 'A fine cyan circuit glow for your operator portrait.', price: 60, kind: 'frame' },
    { id: 'frame-aurora', name: 'Aurora Shield', description: 'A shifting cyan-violet halo for your profile.', price: 100, kind: 'frame' },
    { id: 'frame-guardian', name: 'Green Sentinel', description: 'A bright green signal frame inspired by the response team.', price: 140, kind: 'frame' },
    { id: 'frame-harbor', name: 'Harbor Beacon', description: 'A steady teal beacon for the night shift.', price: 160, kind: 'frame' },
    { id: 'frame-afterglow', name: 'Afterglow', description: 'A warm amber edge for late-shift investigations.', price: 180, kind: 'frame' }
  ],
  palette: [
    { id: 'palette-classic', name: 'Classic Green', description: 'The familiar green terminal display.', price: 0, kind: 'palette' },
    { id: 'palette-ice', name: 'Arctic Signal', description: 'Cool blue output on a deep navy screen.', price: 60, kind: 'palette' },
    { id: 'palette-amber', name: 'Amber CRT', description: 'Warm amber output with a classic terminal feel.', price: 80, kind: 'palette' },
    { id: 'palette-violet', name: 'Violet Signal', description: 'Violet highlights with clear, readable output.', price: 100, kind: 'palette' },
    { id: 'palette-harborview', name: 'Harborview Night', description: 'A calm teal-on-slate terminal theme, gifted to new operators.', price: 120, kind: 'palette' },
    { id: 'palette-solar', name: 'Solar Flare', description: 'A bright coral-and-gold display for a bold signal.', price: 140, kind: 'palette' }
  ],
  title: [
    { id: 'title-operator', name: 'Operator', description: 'Your standard callsign.', price: 0, kind: 'title' },
    { id: 'title-terminal-demon', name: 'Terminal Demon', description: 'For operators who have mastered the command line.', price: 100, kind: 'title' },
    { id: 'title-cool-headed', name: 'Cool-Headed Operator', description: 'For calm decisions supported by evidence.', price: 100, kind: 'title' },
    { id: 'title-evidence-sleuth', name: 'Evidence Sleuth', description: 'For investigators who follow the records.', price: 120, kind: 'title' },
    { id: 'title-signal-reader', name: 'Signal Reader', description: 'For operators who spot patterns and check their meaning.', price: 140, kind: 'title' },
    { id: 'title-night-watch', name: 'Night Watch', description: 'For a steady guardian of Harborview after hours.', price: 160, kind: 'title' }
  ]
};

export interface PlayerCosmetics {
  coins: number;
  ownedFrameIds: string[];
  ownedPaletteIds: string[];
  ownedTitleIds: string[];
  equippedFrameId: string;
  equippedPaletteId: string;
  equippedTitleId: string;
  rewardedMissionIds: string[];
  rewardedCertificationTiers: string[];
  welcomeRewardClaimed: boolean;
}

export const DEFAULT_COSMETICS: PlayerCosmetics = {
  coins: 0,
  ownedFrameIds: ['frame-standard'],
  ownedPaletteIds: ['palette-classic'],
  ownedTitleIds: ['title-operator'],
  equippedFrameId: 'frame-standard',
  equippedPaletteId: 'palette-classic',
  equippedTitleId: 'title-operator',
  rewardedMissionIds: [],
  rewardedCertificationTiers: [],
  welcomeRewardClaimed: true
};

export const normalizeCosmetics = (value: unknown): PlayerCosmetics => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_COSMETICS };
  const candidate = value as Partial<PlayerCosmetics>;
  const validIds = (kind: CosmeticKind, ids: unknown, defaultId: string) => {
    const allowed = new Set(COSMETIC_CATALOG[kind].map(item => item.id));
    const saved = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && allowed.has(id)) : [];
    return [...new Set([defaultId, ...saved])];
  };
  const ownedFrameIds = validIds('frame', candidate.ownedFrameIds, 'frame-standard');
  const ownedPaletteIds = validIds('palette', candidate.ownedPaletteIds, 'palette-classic');
  const ownedTitleIds = validIds('title', candidate.ownedTitleIds, 'title-operator');
  const equipped = (id: unknown, owned: string[], fallback: string) => typeof id === 'string' && owned.includes(id) ? id : fallback;
  return {
    coins: Number.isFinite(candidate.coins) ? Math.max(0, Math.floor(Number(candidate.coins))) : 0,
    ownedFrameIds,
    ownedPaletteIds,
    ownedTitleIds,
    equippedFrameId: equipped(candidate.equippedFrameId, ownedFrameIds, 'frame-standard'),
    equippedPaletteId: equipped(candidate.equippedPaletteId, ownedPaletteIds, 'palette-classic'),
    equippedTitleId: equipped(candidate.equippedTitleId, ownedTitleIds, 'title-operator'),
    rewardedMissionIds: Array.isArray(candidate.rewardedMissionIds) ? [...new Set(candidate.rewardedMissionIds.filter((id): id is string => typeof id === 'string'))] : [],
    rewardedCertificationTiers: Array.isArray(candidate.rewardedCertificationTiers) ? [...new Set(candidate.rewardedCertificationTiers.filter((tier): tier is string => ['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(tier)))] : [],
    // Legacy profiles default to claimed so existing learners never see a retroactive gift.
    welcomeRewardClaimed: candidate.welcomeRewardClaimed !== false
  };
};

export const MISSION_CLEAR_COIN_REWARD = 50;
export const CERTIFICATION_CLEAR_COIN_REWARD = 100;
export const getCosmeticReward = () => MISSION_CLEAR_COIN_REWARD;
