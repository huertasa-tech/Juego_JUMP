import React from 'react';
import { GameStats, Player } from '../types';
import { Volume2, VolumeX, Music, Pause, Play, Sparkles, Zap, Shield, Feather, Magnet } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface HUDProps {
  stats: GameStats;
  player: Player;
  isPaused: boolean;
  onTogglePause: () => void;
  soundOn: boolean;
  musicOn: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  zoneName: string;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  player,
  isPaused,
  onTogglePause,
  soundOn,
  musicOn,
  onToggleSound,
  onToggleMusic,
  zoneName,
}) => {
  const speedPercentage = Math.min(100, Math.round(((stats.currentSpeed - 5.5) / (13.0 - 5.5)) * 100));

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none p-3 sm:p-6 flex flex-col justify-between select-none">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Score & Badges */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            {/* Score Card - Frosted Glass Capsule */}
            <div className="backdrop-blur-md bg-white/20 border border-white/40 rounded-3xl p-3 sm:p-4 px-5 sm:px-7 shadow-2xl flex items-center gap-3.5">
              <div className="bg-amber-400/90 backdrop-blur-sm border border-white/50 rounded-2xl p-2 shadow-sm">
                <Zap className="w-5 h-5 text-slate-900 fill-slate-900" />
              </div>
              <div>
                <p className="text-white/70 text-[10px] sm:text-[11px] uppercase font-black tracking-widest leading-none mb-1 font-body">Score</p>
                <p className="text-white text-2xl sm:text-4xl font-black tabular-nums drop-shadow-md leading-none font-game">
                  {stats.score.toString().padStart(4, '0')}
                </p>
              </div>
            </div>

            {/* High Score Badge */}
            <div className="hidden sm:flex backdrop-blur-md bg-white/10 border border-white/25 rounded-3xl p-3 px-5 shadow-xl items-center gap-3">
              <div className="text-xl">👑</div>
              <div>
                <p className="text-white/60 text-[10px] uppercase font-black tracking-widest leading-none mb-1 font-body">High Score</p>
                <p className="text-white/90 text-2xl font-black tabular-nums leading-none font-game">
                  {stats.highScore.toString().padStart(4, '0')}
                </p>
              </div>
            </div>

            {/* Stars Collected */}
            <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-3xl p-3 px-4 sm:px-5 shadow-xl flex items-center gap-2.5">
              <div className="text-2xl animate-bounce-slow">⭐</div>
              <div className="font-game text-xl sm:text-2xl text-amber-300 drop-shadow-xs leading-none">
                {stats.totalStars}
              </div>
            </div>
          </div>

          {/* Active Power-Ups Pill Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {player.hasShield && (
              <div className="backdrop-blur-md bg-sky-500/60 text-white border border-white/40 rounded-full px-3 py-1 text-xs font-bold font-game flex items-center gap-1.5 shadow-lg animate-pulse">
                <Shield className="w-3.5 h-3.5" /> SHIELD ({Math.ceil(player.powerUpTimers.SHIELD)}s)
              </div>
            )}
            {player.powerUpTimers.DOUBLE_JUMP > 0 && (
              <div className="backdrop-blur-md bg-amber-500/60 text-white border border-white/40 rounded-full px-3 py-1 text-xs font-bold font-game flex items-center gap-1.5 shadow-lg">
                <Feather className="w-3.5 h-3.5" /> TRIPLE JUMP ({Math.ceil(player.powerUpTimers.DOUBLE_JUMP)}s)
              </div>
            )}
            {player.hasMagnet && (
              <div className="backdrop-blur-md bg-rose-500/60 text-white border border-white/40 rounded-full px-3 py-1 text-xs font-bold font-game flex items-center gap-1.5 shadow-lg">
                <Magnet className="w-3.5 h-3.5" /> MAGNET ({Math.ceil(player.powerUpTimers.MAGNET)}s)
              </div>
            )}
            {player.isGiant && (
              <div className="backdrop-blur-md bg-purple-500/60 text-white border border-white/40 rounded-full px-3 py-1 text-xs font-bold font-game flex items-center gap-1.5 shadow-lg animate-bounce">
                <Sparkles className="w-3.5 h-3.5" /> MEGA STOMP ({Math.ceil(player.powerUpTimers.GIANT_BALL)}s)
              </div>
            )}
            {stats.combo > 1 && (
              <div className="backdrop-blur-md bg-orange-500/70 text-white border border-white/40 rounded-full px-3 py-1 text-xs font-bold font-game shadow-lg">
                🔥 {stats.combo}x COMBO!
              </div>
            )}
          </div>
        </div>

        {/* Right: Zone Pill & Sound/Pause Glass Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="hidden md:flex items-center gap-2 backdrop-blur-md bg-white/15 border border-white/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            <span>🗺️</span>
            <span className="tracking-wide uppercase font-game text-xs">{zoneName}</span>
          </div>

          {/* Sound Toggle */}
          <button
            id="btn-sound-toggle"
            onClick={() => {
              soundManager.playClick();
              onToggleSound();
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/30 shadow-lg active:scale-95 flex items-center justify-center text-white transition cursor-pointer"
            title="Toggle Sound Effects"
            aria-label="Toggle Sound Effects"
          >
            {soundOn ? <Volume2 className="w-5 h-5 text-emerald-300" /> : <VolumeX className="w-5 h-5 text-rose-300" />}
          </button>

          {/* Music Toggle */}
          <button
            id="btn-music-toggle"
            onClick={() => {
              soundManager.playClick();
              onToggleMusic();
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/30 shadow-lg active:scale-95 flex items-center justify-center text-white transition cursor-pointer"
            title="Toggle BGM Music"
            aria-label="Toggle BGM Music"
          >
            <Music className={`w-5 h-5 ${musicOn ? 'text-purple-300' : 'text-white/40'}`} />
          </button>

          {/* Pause Toggle */}
          <button
            id="btn-pause-toggle"
            onClick={() => {
              soundManager.playClick();
              onTogglePause();
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/30 shadow-lg active:scale-95 flex items-center justify-center text-white transition cursor-pointer"
            title={isPaused ? "Resume Game" : "Pause Game"}
            aria-label="Pause or Resume"
          >
            {isPaused ? <Play className="w-5 h-5 fill-white text-white" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* BOTTOM BAR: SPEED GAUGE & DISTANCE */}
      <div className="flex items-end justify-between gap-3">
        {/* Speedometer Gauge - Frosted Pill */}
        <div className="backdrop-blur-lg bg-white/15 border border-white/30 rounded-full py-2.5 px-4 sm:px-6 shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#ff4757] rounded-full shadow-[0_0_12px_#ff4757]" />
          <span className="text-white font-black text-sm sm:text-base italic font-game">
            SPEED <span className="text-[#f1c40f] ml-1 sm:ml-2">{stats.currentSpeed.toFixed(1)}x</span>
          </span>
          <div className="w-16 sm:w-28 h-2.5 bg-white/20 rounded-full overflow-hidden border border-white/30 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.max(10, speedPercentage)}%` }}
            />
          </div>
        </div>

        {/* Distance Tracker */}
        <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-white font-game text-xs sm:text-sm shadow-lg flex items-center gap-1.5">
          <span>📍</span> {Math.floor(stats.distance)} m
        </div>
      </div>
    </div>
  );
};
