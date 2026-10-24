export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type ObstacleType = 
  | 'SPIKY_CACTUS' 
  | 'CHOMPER_PLANT' 
  | 'BOUNCY_SLIME' 
  | 'ROLLING_BOULDER' 
  | 'FLYING_BIRD'
  | 'DOUBLE_SPIKE'
  | 'SPRING_MUSHROOM';

export type PowerUpType = 
  | 'SHIELD' 
  | 'DOUBLE_JUMP' 
  | 'MAGNET' 
  | 'GIANT_BALL' 
  | 'SLOW_MO';

export interface Player {
  x: number;
  y: number;
  radius: number;
  vy: number;
  isGrounded: boolean;
  jumpCount: number;
  maxJumps: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  eyeLookAngle: number;
  isBlinking: boolean;
  blinkTimer: number;
  sweatTimer: number;
  skinId: string;
  hasShield: boolean;
  isGiant: boolean;
  hasMagnet: boolean;
  isSlowMo: boolean;
  powerUpTimers: Record<PowerUpType, number>;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedMultiplier: number;
  passed: boolean;
  animFrame: number;
  bobOffset: number;
  scaleX?: number;
  scaleY?: number;
  customData?: Record<string, number | boolean | string>;
}

export interface Collectible {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'STAR' | 'POWERUP';
  powerUpType?: PowerUpType;
  bobTimer: number;
  collected: boolean;
  glowAngle: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  shape: 'CIRCLE' | 'STAR' | 'DUST' | 'SWEAT' | 'SPARK' | 'CONFETTI' | 'HEART';
  lifetime: number;
  maxLifetime: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
  scale: number;
  lifetime: number;
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  primaryColor: string;
  secondaryColor: string;
  pattern: 'SOLID' | 'STRIPES' | 'SPOTS' | 'WATERMELON' | 'BASKETBALL' | 'SMILEY' | 'NINJA' | 'GALAXY' | 'GOLDEN';
  accessory: 'NONE' | 'CAP' | 'SUNGLASSES' | 'CROWN' | 'HEADBAND' | 'PROP_HAT' | 'CAT_EARS' | 'WIZARD_HAT';
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardStars: number;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  starsCollectedThisRun: number;
  totalStars: number;
  distance: number;
  jumpsPerformed: number;
  obstaclesJumped: number;
  powerUpsCollected: number;
  nearMisses: number;
  currentSpeed: number;
  combo: number;
  maxCombo: number;
  deathCause: string;
}

export interface ThemeColors {
  name: string;
  skyTop: string;
  skyBottom: string;
  cloudColor: string;
  mountainColor: string;
  hillColor: string;
  foregroundHillColor: string;
  groundTop: string;
  groundBase: string;
  groundDecor: string;
  sunMoonColor: string;
  isNight: boolean;
}
