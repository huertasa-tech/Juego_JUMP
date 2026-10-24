import React from 'react';
import { X, Gamepad2, Smartphone, Sparkles, Shield, Feather, Magnet } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div id="how-to-play-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="backdrop-blur-2xl bg-slate-900/85 border border-white/25 rounded-[32px] sm:rounded-[40px] max-w-lg w-full p-5 sm:p-7 relative max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-sky-400" />
            <h2 className="font-game text-2xl sm:text-3xl text-white tracking-wide">HOW TO PLAY</h2>
          </div>
          <button
            id="btn-close-howtoplay"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-2xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Section */}
        <div className="space-y-4">
          <div>
            <h3 className="font-game text-base sm:text-lg text-white mb-2 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" /> Desktop Controls
            </h3>
            <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 space-y-2.5 text-xs sm:text-sm text-white/90">
              <div className="flex items-center justify-between">
                <span>Jump / Double Jump:</span>
                <div className="flex gap-1.5">
                  <kbd className="px-2 py-1 bg-white/15 border border-white/30 rounded-lg font-bold shadow-xs">Space</kbd>
                  <kbd className="px-2 py-1 bg-white/15 border border-white/30 rounded-lg font-bold shadow-xs">↑</kbd>
                  <kbd className="px-2 py-1 bg-white/15 border border-white/30 rounded-lg font-bold shadow-xs">W</kbd>
                  <kbd className="px-2 py-1 bg-white/15 border border-white/30 rounded-lg font-bold shadow-xs">Click</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Pause Game:</span>
                <kbd className="px-2 py-1 bg-white/15 border border-white/30 rounded-lg font-bold shadow-xs">P</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-game text-base sm:text-lg text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-400" /> Mobile & Touch
            </h3>
            <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3.5 text-xs sm:text-sm text-white/90">
              <p className="mb-1">
                <strong>Tap anywhere on the screen</strong> or use the floating Jump button to hop over obstacles!
              </p>
              <p className="text-xs text-white/60">
                Tap once for a standard jump, tap again in mid-air to perform an acrobatic <strong>Double Jump</strong>!
              </p>
            </div>
          </div>

          {/* Power-Ups Guide */}
          <div>
            <h3 className="font-game text-base sm:text-lg text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Power-Up Bubbles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
                <Shield className="w-6 h-6 text-sky-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sky-300 font-game">Bubble Shield</div>
                  <div className="text-white/60">Survives one accidental crash!</div>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
                <Feather className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-amber-300 font-game">Triple Jump</div>
                  <div className="text-white/60">Enables high-flying 3x bounces!</div>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
                <Magnet className="w-6 h-6 text-rose-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-rose-300 font-game">Star Magnet</div>
                  <div className="text-white/60">Pulls all nearby gold stars!</div>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">⭐</span>
                <div>
                  <div className="font-bold text-purple-300 font-game">Mega Stomp</div>
                  <div className="text-white/60">Crushes obstacles for bonus points!</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          id="btn-got-it-howtoplay"
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="btn-glass-gold w-full py-3.5 rounded-2xl font-game text-xl text-slate-900 mt-5 cursor-pointer uppercase tracking-wider"
        >
          GOT IT! LET'S BOUNCE!
        </button>
      </div>
    </div>
  );
};
