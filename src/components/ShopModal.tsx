import React from 'react';
import { Skin } from '../types';
import { SKINS } from '../game/constants';
import { X, Check, Lock } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface ShopModalProps {
  totalStars: number;
  activeSkinId: string;
  unlockedSkinIds: string[];
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skin: Skin) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalStars,
  activeSkinId,
  unlockedSkinIds,
  onSelectSkin,
  onBuySkin,
  onClose,
}) => {
  return (
    <div id="shop-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="backdrop-blur-2xl bg-slate-900/85 border border-white/25 rounded-[32px] sm:rounded-[40px] max-w-lg w-full p-5 sm:p-7 relative max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-2">
            <h2 className="font-game text-2xl sm:text-3xl text-white tracking-wide">BALL WARDROBE</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Star Counter */}
            <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-full px-3.5 py-1 font-game text-sm flex items-center gap-1.5 shadow-sm">
              <span>⭐</span> <span className="text-amber-300">{totalStars}</span>
            </div>

            {/* Close Button */}
            <button
              id="btn-close-shop"
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

        {/* Skins Grid */}
        <div className="overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pr-1">
          {SKINS.map(skin => {
            const isUnlocked = unlockedSkinIds.includes(skin.id) || skin.price === 0;
            const isEquipped = activeSkinId === skin.id;
            const canAfford = totalStars >= skin.price;

            return (
              <div
                key={skin.id}
                className={`rounded-2xl p-3.5 flex flex-col justify-between transition-all backdrop-blur-md ${
                  isEquipped
                    ? 'bg-amber-400/20 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                    : 'bg-white/10 hover:bg-white/15 border border-white/15 shadow-sm'
                }`}
              >
                {/* Visual Preview of Ball */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1 rounded-full backdrop-blur-sm bg-white/15 border border-white/30 flex-shrink-0">
                    <div
                      className="w-13 h-13 rounded-full border-2 border-white/80 flex items-center justify-center relative shadow-md"
                      style={{
                        backgroundColor: skin.primaryColor,
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${skin.primaryColor} 45%, ${skin.secondaryColor} 100%)`,
                      }}
                    >
                      {/* Visual eye cartoon markers */}
                      <div className="flex gap-1">
                        <div className="w-2.5 h-3 bg-white rounded-full border border-slate-700 flex items-center justify-center shadow-xs">
                          <div className="w-1 h-1 bg-slate-900 rounded-full" />
                        </div>
                        <div className="w-2.5 h-3 bg-white rounded-full border border-slate-700 flex items-center justify-center shadow-xs">
                          <div className="w-1 h-1 bg-slate-900 rounded-full" />
                        </div>
                      </div>

                      {/* Accessories Indicator */}
                      {skin.accessory === 'SUNGLASSES' && (
                        <span className="absolute -top-1 text-xs drop-shadow">🕶️</span>
                      )}
                      {skin.accessory === 'CROWN' && (
                        <span className="absolute -top-3 text-sm drop-shadow">👑</span>
                      )}
                      {skin.accessory === 'HEADBAND' && (
                        <span className="absolute -top-1.5 text-xs drop-shadow">🥷</span>
                      )}
                      {skin.accessory === 'CAT_EARS' && (
                        <span className="absolute -top-2 text-sm drop-shadow">🐱</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-game text-base text-white truncate flex items-center gap-1.5">
                      {skin.name}
                      {isEquipped && <span className="text-xs text-amber-300 font-bold font-body">(Equipped)</span>}
                    </div>
                    <div className="text-xs text-white/60 font-body line-clamp-2 leading-tight">
                      {skin.description}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  {isEquipped ? (
                    <button
                      disabled
                      className="w-full py-2 bg-emerald-500/80 text-white font-game text-xs rounded-xl border border-white/30 flex items-center justify-center gap-1 opacity-90 cursor-default shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> EQUIPPED
                    </button>
                  ) : isUnlocked ? (
                    <button
                      id={`btn-equip-${skin.id}`}
                      onClick={() => {
                        soundManager.playClick();
                        onSelectSkin(skin.id);
                      }}
                      className="btn-glass-emerald w-full py-2 font-game text-xs text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      id={`btn-buy-${skin.id}`}
                      disabled={!canAfford}
                      onClick={() => {
                        if (canAfford) {
                          onBuySkin(skin);
                        }
                      }}
                      className={`w-full py-2 font-game text-xs rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        canAfford
                          ? 'btn-glass-gold text-slate-900 cursor-pointer shadow-sm'
                          : 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> UNLOCK FOR {skin.price} ⭐
                    </button>
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
