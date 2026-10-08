import { Trophy, Star, Shield, Target, Zap } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  tier: number;
  unlocked: boolean;
}

export const BadgeSystem = ({ userScores }: { userScores: Record<string, { score: number; total: number }> }) => {
  const badges: Badge[] = [
    { id: 'terminal', name: 'Terminal Awakened', icon: <Zap size={24} />, description: 'Run your first command', tier: 1, unlocked: true },
    { id: 'novice', name: 'Novice Operator', icon: <Star size={24} />, description: 'Complete Beginner Certification', tier: 1, unlocked: userScores['BEGINNER']?.score >= 7 },
    { id: 'operator', name: 'System Operator', icon: <Target size={24} />, description: 'Complete Intermediate Certification', tier: 2, unlocked: userScores['INTERMEDIATE']?.score >= 7 },
    { id: 'defender', name: 'Cyber Defender', icon: <Shield size={24} />, description: 'Complete Expert Certification', tier: 3, unlocked: userScores['EXPERT']?.score >= 7 },
    { id: 'elite', name: 'Elite Architect', icon: <Trophy size={24} />, description: 'Achieve 90%+ accuracy across all tiers', tier: 4, unlocked: false },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">Achievement Badges</h3>
      <div className="grid grid-cols-5 gap-4">
        {badges.map(badge => (
          <div key={badge.id} className={`border p-4 text-center ${badge.unlocked ? 'border-yellow-500 bg-yellow-950/20' : 'border-gray-700 bg-gray-950/20 opacity-50'}`}>
            <div className={`mb-2 ${badge.unlocked ? 'text-yellow-400' : 'text-gray-600'}`}>{badge.icon}</div>
            <p className="text-xs font-bold text-white mb-1">{badge.name}</p>
            <p className="text-[10px] text-green-600">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};