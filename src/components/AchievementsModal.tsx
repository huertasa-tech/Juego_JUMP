import React from 'react';
import { Achievement } from '../types';
import { X, Trophy, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  onClose,
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div id="achievements-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="backdrop-blur-2xl bg-slate-900/85 border border-white/25 rounded-[32px] sm:rounded-[40px] max-w-md w-full p-5 sm:p-7 relative max-h-[85vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 fill-amber-400" />
            <h2 className="font-game text-2xl sm:text-3xl text-white tracking-wide">ACHIEVEMENTS</h2>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-game text-xs sm:text-sm bg-white/15 text-amber-300 border border-white/25 px-3 py-1 rounded-full backdrop-blur-sm">
              {unlockedCount} / {achievements.length}
            </span>
            <button
              id="btn-close-achievements"
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-2xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of achievements */}
        <div className="overflow-y-auto py-3 space-y-3 pr-1">
          {achievements.map(ach => {
            const pct = Math.min(100, Math.round((ach.progress / ach.target) * 100));

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all backdrop-blur-md ${
                  ach.unlocked
                    ? 'bg-emerald-500/20 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                    : 'bg-white/10 hover:bg-white/15 border-white/15'
                }`}
              >
                <div className="text-3xl p-1.5 bg-white/15 border border-white/25 rounded-2xl shadow-sm flex-shrink-0 backdrop-blur-sm">
                  {ach.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-game text-base text-white truncate">{ach.title}</h3>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-0.5 font-body">
                      +{ach.rewardStars} ⭐
                    </div>
                  </div>

                  <p className="text-xs text-white/60 font-body mb-1.5">{ach.description}</p>

                  {/* Progress bar */}
                  {!ach.unlocked ? (
                    <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden border border-white/20">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
