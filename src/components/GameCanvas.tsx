import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { GAME_CONSTANTS } from '../game/constants';
import { Play, ArrowUp } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface GameCanvasProps {
  engine: GameEngine;
  onGameOver: () => void;
  isPaused: boolean;
  onResume: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onGameOver,
  isPaused,
  onResume,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle jump triggering with haptics
  const handleJump = () => {
    if (engine.triggerJump()) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // ignore
        }
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Game Loop & Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    let isRunning = true;

    const renderLoop = (now: number) => {
      if (!isRunning) return;

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      try {
        if (!isPaused && !engine.isGameOver) {
          engine.update(dt);
          if (engine.isGameOver) {
            onGameOver();
          }
        }

        // Draw frame
        const renderer = rendererRef.current;
        if (renderer) {
          renderer.clear(engine.screenShake.x, engine.screenShake.y);

          // 1. Background
          renderer.drawParallaxBackground(engine.scrollX, engine.theme, engine.gameTime);

          // 2. Collectibles
          engine.collectibles.forEach(item => {
            renderer.drawCollectible(item, engine.gameTime);
          });

          // 3. Obstacles
          engine.obstacles.forEach(obs => {
            renderer.drawObstacle(obs, engine.gameTime);
          });

          // 4. Player
          renderer.drawPlayer(engine.player, engine.gameTime, engine.currentSpeed, engine.isGameOver);

          // 5. Particles
          renderer.drawParticles(engine.particles);

          // 6. Floating texts
          renderer.drawFloatingTexts(engine.floatingTexts);

          renderer.restore();
        }
      } catch (err) {
        console.error('Render loop error caught:', err);
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [engine, isPaused, onGameOver]);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="relative w-full h-full flex items-center justify-center bg-slate-900 overflow-hidden cursor-pointer"
      onPointerDown={(e) => {
        // Prevent interfering if clicked on HUD button
        if ((e.target as HTMLElement).closest('button')) return;
        handleJump();
      }}
    >
      <canvas
        ref={canvasRef}
        id="game-canvas"
        width={GAME_CONSTANTS.CANVAS_WIDTH}
        height={GAME_CONSTANTS.CANVAS_HEIGHT}
        className="w-full h-full object-contain max-w-[1280px] max-h-[720px] shadow-2xl rounded-none sm:rounded-3xl border-0 sm:border-4 border-slate-900"
      />

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="backdrop-blur-2xl bg-slate-900/85 border border-white/25 rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 text-center max-w-xs w-full shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-white animate-in zoom-in-95">
            <h3 className="font-game text-3xl text-white mb-1.5 tracking-wide">GAME PAUSED</h3>
            <p className="text-xs text-white/60 font-body mb-5">Take a quick breather!</p>
            <button
              id="btn-resume-game"
              onClick={() => {
                soundManager.playClick();
                onResume();
              }}
              className="btn-glass-emerald w-full py-3.5 rounded-2xl font-game text-xl text-white flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-white" /> RESUME
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING JUMP BUTTON (Frosted Glass touch button) */}
      <div className="sm:hidden absolute bottom-5 right-5 z-30 pointer-events-auto">
        <button
          id="btn-mobile-jump"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleJump();
          }}
          className="w-20 h-20 rounded-full backdrop-blur-xl bg-white/25 hover:bg-white/35 border-2 border-white/60 text-white flex flex-col items-center justify-center active:scale-95 shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition"
          aria-label="Jump Button"
        >
          <ArrowUp className="w-8 h-8 text-white stroke-[3.5]" />
          <span className="font-game text-[10px] text-white -mt-1 font-bold tracking-widest">JUMP</span>
        </button>
      </div>
    </div>
  );
};
