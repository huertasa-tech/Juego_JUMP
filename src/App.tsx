/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameState, Skin } from './types';
import { soundManager } from './audio/soundEffects';
import { Play, ShoppingBag, Trophy, HelpCircle, Volume2, VolumeX, Music, Sparkles } from 'lucide-react';
import { SKINS } from './game/constants';

export default function App() {
  const engine = useMemo(() => new GameEngine(), []);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [stats, setStats] = useState(engine.stats);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [musicOn, setMusicOn] = useState<boolean>(true);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jumping_ball_unlocked_skins');
      return saved ? JSON.parse(saved) : ['classic_orange'];
    } catch {
      return ['classic_orange'];
    }
  });

  // Keep React state in sync with engine stats for HUD rendering
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...engine.stats });
    }, 100);
    return () => clearInterval(interval);
  }, [engine]);

  // Audio configuration sync
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setSoundEnabled(next);
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    soundManager.setMusicEnabled(next);
  };

  // Game Lifecycle
  const startGame = useCallback(() => {
    try {
      soundManager.playClick();
    } catch {
      // ignore
    }
    engine.resetGame();
    setIsPaused(false);
    setGameState('PLAYING');
    setStats({ ...engine.stats });
    if (musicOn) {
      try {
        soundManager.startBgm();
      } catch {
        // ignore
      }
    }
  }, [engine, musicOn]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    setStats({ ...engine.stats });
  }, [engine]);

  const handleRetry = useCallback(() => {
    try {
      soundManager.playClick();
    } catch {
      // ignore
    }
    engine.resetGame();
    setIsPaused(false);
    setGameState('PLAYING');
    setStats({ ...engine.stats });
    if (musicOn) {
      try {
        soundManager.startBgm();
      } catch {
        // ignore
      }
    }
  }, [engine, musicOn]);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      engine.isPaused = next;
      return next;
    });
  }, [engine]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    engine.isPaused = false;
  }, [engine]);

  const handleGoHome = useCallback(() => {
    setGameState('MENU');
    setIsPaused(false);
    engine.resetGame();
    setStats({ ...engine.stats });
  }, [engine]);

  // Global keyboard shortcuts for start, retry, and pause
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Start game from main menu
      if (gameState === 'MENU') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          if (!showShop && !showAchievements && !showHowToPlay) {
            e.preventDefault();
            startGame();
          }
        }
      } else if (gameState === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
          if (!showShop && !showAchievements && !showHowToPlay) {
            e.preventDefault();
            handleRetry();
          }
        }
      } else if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, showShop, showAchievements, showHowToPlay, startGame, handleRetry, handleTogglePause]);

  // Skin Purchases & Equipping
  const handleSelectSkin = (skinId: string) => {
    engine.player.skinId = skinId;
    engine.saveGameData();
    setStats({ ...engine.stats });
  };

  const handleBuySkin = (skin: Skin) => {
    if (engine.stats.totalStars >= skin.price) {
      engine.stats.totalStars -= skin.price;
      const nextUnlocked = [...unlockedSkinIds, skin.id];
      setUnlockedSkinIds(nextUnlocked);
      try {
        localStorage.setItem('jumping_ball_unlocked_skins', JSON.stringify(nextUnlocked));
      } catch (e) {
        console.warn(e);
      }
      handleSelectSkin(skin.id);
      soundManager.playPowerUp();
    }
  };

  const activeSkin = SKINS.find(s => s.id === engine.player.skinId) || SKINS[0];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-body select-none">
      {/* 1. PLAYING / ACTIVE CANVAS VIEW */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <GameCanvas
            engine={engine}
            onGameOver={handleGameOver}
            isPaused={isPaused}
            onResume={handleResume}
          />

          {/* Floating Live HUD */}
          <HUD
            stats={stats}
            player={engine.player}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            soundOn={soundOn}
            musicOn={musicOn}
            onToggleSound={toggleSound}
            onToggleMusic={toggleMusic}
            zoneName={engine.theme.name}
          />

          {/* Game Over Dialog */}
          {gameState === 'GAMEOVER' && (
            <GameOverModal
              stats={stats}
              onRetry={handleRetry}
              onOpenShop={() => setShowShop(true)}
              onOpenAchievements={() => setShowAchievements(true)}
              onGoHome={handleGoHome}
            />
          )}
        </div>
      )}

      {/* 2. MAIN MENU / TITLE SCREEN */}
      {gameState === 'MENU' && (
        <div
          id="main-menu"
          className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#4facfe] via-[#00f2fe] to-[#a8edea] overflow-hidden"
        >
          {/* Luminous Frosted Ambient Blurs */}
          <div className="absolute top-16 left-[10%] w-64 h-24 bg-white/40 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />
          <div className="absolute top-28 left-[40%] w-80 h-32 bg-white/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-12 right-[15%] w-72 h-28 bg-white/50 rounded-full blur-xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-20 left-[25%] w-96 h-40 bg-[#7a59af]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Frosted Mountain/Hill Silhouettes in background */}
          <div className="absolute bottom-0 w-full h-48 pointer-events-none flex items-end justify-between opacity-40">
            <div className="w-[500px] h-[180px] bg-white/30 rounded-t-[100px] blur-sm ml-[-80px]" />
            <div className="w-[600px] h-[220px] bg-white/20 rounded-t-[140px] blur-md mr-[-100px]" />
          </div>

          <div className="backdrop-blur-2xl bg-white/20 border border-white/40 rounded-[36px] sm:rounded-[48px] max-w-md w-full p-6 sm:p-8 text-center relative z-10 my-auto shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            {/* Top Stat Pills */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="backdrop-blur-md bg-white/30 border border-white/50 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
                <span>👑</span> <span className="text-[11px] uppercase tracking-wider text-slate-600">High:</span> <span className="font-game text-sm text-slate-900">{stats.highScore}</span>
              </div>
              <div className="backdrop-blur-md bg-white/40 border border-white/50 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
                <span>⭐</span> <span className="font-game text-sm text-amber-950">{stats.totalStars}</span>
              </div>
            </div>

            {/* Game Logo & Hero Title */}
            <div className="relative mb-5">
              <div className="inline-block relative">
                <div className="text-white/80 text-[10px] uppercase font-black tracking-[0.3em] mb-1">
                  Frosted Arcade Edition
                </div>
                <h1 className="font-game text-4xl sm:text-5xl text-white tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                  JUMPING BALL
                </h1>
                <div className="font-game text-2xl sm:text-3xl text-amber-300 tracking-wider drop-shadow-md -mt-1">
                  RUNNER
                </div>
              </div>

              {/* Cartoon Character Hero Graphic with Frosted Glass Ring */}
              <div className="mt-4 flex justify-center">
                <div className="p-2.5 rounded-full backdrop-blur-md bg-white/30 border border-white/50 shadow-[0_10px_25px_rgba(0,0,0,0.15)]">
                  <div
                    className="w-22 h-22 rounded-full border-3 border-white/70 flex items-center justify-center relative shadow-[0_12px_24px_rgba(0,0,0,0.2)] animate-bounce-slow cursor-pointer hover:scale-105 transition"
                    style={{
                      backgroundColor: activeSkin.primaryColor,
                      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${activeSkin.primaryColor} 45%, ${activeSkin.secondaryColor} 100%)`,
                    }}
                    onClick={() => {
                      soundManager.playJump();
                    }}
                    title="Click me to bounce!"
                  >
                    {/* Eyes */}
                    <div className="flex gap-2">
                      <div className="w-3.5 h-5 bg-white rounded-full border border-slate-700 flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      </div>
                      <div className="w-3.5 h-5 bg-white rounded-full border border-slate-700 flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>

                    {/* Rosy Smile */}
                    <div className="absolute bottom-3.5 flex items-center justify-center">
                      <div className="w-5 h-2.5 border-b-2 border-slate-800 rounded-full" />
                    </div>

                    {/* Accessories */}
                    {activeSkin.accessory === 'SUNGLASSES' && (
                      <span className="absolute -top-1 text-xl drop-shadow">🕶️</span>
                    )}
                    {activeSkin.accessory === 'CROWN' && (
                      <span className="absolute -top-5 text-2xl drop-shadow">👑</span>
                    )}
                    {activeSkin.accessory === 'HEADBAND' && (
                      <span className="absolute -top-2 text-xl drop-shadow">🥷</span>
                    )}
                    {activeSkin.accessory === 'CAT_EARS' && (
                      <span className="absolute -top-3 text-2xl drop-shadow">🐱</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button - Frosted Golden CTA */}
            <button
              id="btn-play-game"
              onClick={startGame}
              onPointerDown={(e) => {
                // Ensure snappy mobile touch activation
                if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
                  startGame();
                }
              }}
              className="btn-glass-gold w-full py-4 rounded-2xl font-game text-3xl text-slate-900 flex items-center justify-center gap-3 cursor-pointer mb-3 uppercase tracking-wider active:scale-95 select-none"
            >
              <Play className="w-7 h-7 fill-slate-900" />
              PLAY NOW!
            </button>

            {/* Sub Buttons in Frosted Glass Cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                id="btn-open-shop-menu"
                onClick={() => {
                  soundManager.playClick();
                  setShowShop(true);
                }}
                className="backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/50 text-slate-900 py-2.5 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-slate-800" />
                SKINS
              </button>

              <button
                id="btn-open-achievements-menu"
                onClick={() => {
                  soundManager.playClick();
                  setShowAchievements(true);
                }}
                className="backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/50 text-slate-900 py-2.5 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-slate-800" />
                BADGES
              </button>

              <button
                id="btn-open-howtoplay-menu"
                onClick={() => {
                  soundManager.playClick();
                  setShowHowToPlay(true);
                }}
                className="backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/50 text-slate-900 py-2.5 rounded-2xl font-game text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-800" />
                RULES
              </button>
            </div>

            {/* Bottom Audio Toggles */}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/30">
              <button
                id="btn-menu-sound-toggle"
                onClick={toggleSound}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800/90 hover:text-slate-950 cursor-pointer transition"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-rose-600" />}
                Sound {soundOn ? 'ON' : 'OFF'}
              </button>

              <div className="w-1 h-3 bg-white/50 rounded-full" />

              <button
                id="btn-menu-music-toggle"
                onClick={toggleMusic}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800/90 hover:text-slate-950 cursor-pointer transition"
              >
                <Music className={`w-4 h-4 ${musicOn ? 'text-purple-700' : 'text-slate-500'}`} />
                Music {musicOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showShop && (
        <ShopModal
          totalStars={stats.totalStars}
          activeSkinId={engine.player.skinId}
          unlockedSkinIds={unlockedSkinIds}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onClose={() => setShowShop(false)}
        />
      )}

      {showAchievements && (
        <AchievementsModal
          achievements={engine.achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </main>
  );
}
