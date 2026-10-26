export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  unlockHint: string;
  icon: 'file' | 'message' | 'shield' | 'sparkles' | 'award' | 'target';
  active: boolean;
}

// Rewards describe observable investigation habits; they do not alter assessment scores.
export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'evidence-first', name: 'Evidence First', description: 'Record evidence before taking a response action.', unlockHint: 'Preserve an observation before responding.', icon: 'file', active: true },
  { id: 'measured-words', name: 'Measured Words', description: 'Record a supported finding with calibrated confidence.', unlockHint: 'Use assess with evidence and measured confidence.', icon: 'message', active: true },
  { id: 'trust-verify', name: 'Trust but Verify', description: 'Check the system after every response action.', unlockHint: 'Verify each change with a status or inspection command.', icon: 'shield', active: true },
  { id: 'independent', name: 'Independent', description: 'Complete a case without opening hints.', unlockHint: 'Complete any mission without hints.', icon: 'sparkles', active: true },
  { id: 'clearance-granted', name: 'Clearance Granted', description: 'Pass a certification tier after completing its missions.', unlockHint: 'Complete the tier missions and pass the post-test.', icon: 'award', active: true },
  { id: 'full-circle', name: 'Full Circle', description: 'Complete both assessments and every mission in a tier.', unlockHint: 'Finish the pre-test, all tier missions, and the post-test.', icon: 'target', active: true },
  { id: 'decoy-spotted', name: 'Decoy Spotted', description: 'Identify a planted benign decoy.', unlockHint: 'Reserved for a future mission with decoy evidence.', icon: 'target', active: false }
];
