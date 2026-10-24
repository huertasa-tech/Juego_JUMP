import React, { useEffect } from 'react';
import { GameStats } from '../types';
import { RotateCcw, ShoppingBag, Trophy, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../audio/soundEffects';

interface GameOverModalProps {
  stats: GameStats;
  onRetry: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onOpenShop,
  onOpenAchievements,
  onGoHome,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  useEffect(() => {
    if (isNewHighScore) {
      soundManager.playSpeedUp();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#38bdf8', '#f43f5e', '#a855f7', '#4ade80'],
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewHighScore, onRetry]);

  return (
    <div id="game-over-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="backdrop-blur-2xl bg-slate-900/80 border border-white/25 rounded-[36px] sm:rounded-[44px] max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] transform scale-100 transition-all text-white">
        {/* Floating High Score Banner */}
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border border-white/40 rounded-full py-1.5 px-5 text-xs font-game text-slate-900 shadow-lg inline-flex items-center gap-1.5 mb-2 animate-bounce-slow">
            <Sparkles className="w-4 h-4" /> NEW HIGH SCORE! 🏆
          </div>
        )}

        {/* Title */}
        <h2 className="font-game text-4xl sm:text-5xl text-white tracking-wider mb-1 drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)]">
          GAME OVER!
        </h2>

        {/* Funny Death Message */}
        <p className="text-white/80 font-medium text-xs sm:text-sm mb-5 italic backdrop-blur-md bg-white/10 rounded-2xl p-3 border border-white/15">
          "{stats.deathCause || 'That was quite a cartoon collision!'}"
        </p>

        {/* Stats Grid - Frosted Glass Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-lg">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 font-body">Final Score</div>
            <div className="font-game text-2xl sm:text-3xl text-white tabular-nums">{stats.score}</div>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-lg">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-300/80 font-body">High Score</div>
            <div className="font-game text-2xl sm:text-3xl text-amber-300 tabular-nums">{stats.highScore}</div>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-yellow-300/80 font-body">Stars Picked</div>
              <div className="font-game text-xl sm:text-2xl text-yellow-300">+{stats.starsCollectedThisRun}</div>
            </div>
            <div className="text-2xl">⭐</div>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-lg">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-sky-300/80 font-body">Distance</div>
            <div className="font-game text-xl sm:text-2xl text-sky-300">{Math.floor(stats.distance)} m</div>
          </div>
        </div>

        {/* Big Retry Button - Glowing Gold Glass CTA */}
        <button
          id="btn-retry-game"
          onClick={() => {
            soundManager.playClick();
            onRetry();
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') {
              soundManager.playClick();
              onRetry();
            }
          }}
          className="btn-glass-gold w-full py-4 rounded-2xl font-game text-2xl text-slate-900 flex items-center justify-center gap-3 cursor-pointer mb-3 uppercase tracking-wider active:scale-95"
        >
          <RotateCcw className="w-6 h-6 stroke-[3]" />
          RETRY?
        </button>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            id="btn-open-shop-gameover"
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="btn-glass-cyan py-3 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            SHOP
          </button>

          <button
            id="btn-open-achievements-gameover"
            onClick={() => {
              soundManager.playClick();
              onOpenAchievements();
            }}
            className="btn-glass-purple py-3 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            BADGES
          </button>

          <button
            id="btn-home-gameover"
            onClick={() => {
              soundManager.playClick();
              onGoHome();
            }}
            className="btn-glass-white py-3 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MENU
          </button>
        </div>

        <div className="mt-4 text-xs font-medium text-white/50 flex items-center justify-center gap-2">
          <span>Input:</span>
          <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white/80 text-[11px]">SPACE</kbd>
          <span>or</span>
          <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white/80 text-[11px]">TOUCH</kbd>
        </div>
      </div>
    </div>
  );
};
