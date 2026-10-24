import { Collectible, FloatingText, Obstacle, Particle, Player, ThemeColors } from '../types';
import { GAME_CONSTANTS, SKINS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // Clear and prepare canvas
  public clear(shakeX: number = 0, shakeY: number = 0) {
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  public restore() {
    this.ctx.restore();
  }

  // Helper to safely draw rounded rectangles in all browsers/webviews
  private drawRoundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === 'function') {
      try {
        ctx.roundRect(x, y, w, h, r);
        return;
      } catch {
        // fallback
      }
    }
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  // 1. Draw Parallax Background
  public drawParallaxBackground(
    scrollX: number,
    theme: ThemeColors,
    gameTime: number
  ) {
    const ctx = this.ctx;
    const groundY = this.height - GAME_CONSTANTS.GROUND_HEIGHT;

    // --- SKY GRADIENT ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, theme.skyTop);
    skyGrad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // --- SUN / MOON ---
    const sunX = this.width * 0.82;
    const sunY = this.height * 0.22;
    ctx.save();
    if (!theme.isNight) {
      // Smiling cartoon sun with glowing rays
      ctx.fillStyle = theme.sunMoonColor;
      ctx.shadowColor = theme.sunMoonColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Rotating sun rays
      ctx.strokeStyle = theme.sunMoonColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const numRays = 8;
      const rayAngleOffset = (gameTime * 0.001) % (Math.PI * 2);
      for (let i = 0; i < numRays; i++) {
        const angle = (i * (Math.PI * 2)) / numRays + rayAngleOffset;
        const innerR = 44;
        const outerR = 56;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
        ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
        ctx.stroke();
      }

      // Cute smiling face on sun
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(sunX - 10, sunY - 4, 3.5, 0, Math.PI * 2);
      ctx.arc(sunX + 10, sunY - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX, sunY + 6, 12, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Cheeks
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(sunX - 16, sunY + 4, 5, 0, Math.PI * 2);
      ctx.arc(sunX + 16, sunY + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cartoon crescent moon & stars
      ctx.fillStyle = theme.sunMoonColor;
      ctx.shadowColor = '#e0e7ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.skyTop;
      ctx.beginPath();
      ctx.arc(sunX - 10, sunY - 6, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Twinkling stars
      for (let i = 0; i < 15; i++) {
        const starX = ((i * 137 + 45) % this.width);
        const starY = ((i * 73 + 20) % (groundY * 0.6));
        const twinkle = Math.sin(gameTime * 0.003 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + twinkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(starX, starY, 1.5 + twinkle * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // --- LAYER 1: CLOUDS (Parallax Speed 0.08) ---
    this.drawCloudLayer(scrollX * 0.08, theme.cloudColor, gameTime);

    // --- LAYER 2: DISTANT MOUNTAINS (Parallax Speed 0.18) ---
    this.drawMountainLayer(scrollX * 0.18, theme.mountainColor, groundY);

    // --- LAYER 3: MIDGROUND ROLLING HILLS (Parallax Speed 0.4) ---
    this.drawHillsLayer(scrollX * 0.4, theme.hillColor, groundY);

    // --- LAYER 4: NEAR HILLS & TREES (Parallax Speed 0.7) ---
    this.drawNearHillsLayer(scrollX * 0.7, theme.foregroundHillColor, groundY);

    // --- LAYER 5: GROUND ---
    this.drawGround(scrollX, theme, groundY);
  }

  private drawCloudLayer(offset: number, color: string, time: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;

    const clouds = [
      { x: 100, y: 70, scale: 1.1 },
      { x: 420, y: 110, scale: 0.8 },
      { x: 750, y: 60, scale: 1.3 },
      { x: 1100, y: 95, scale: 0.9 },
    ];

    const cycleWidth = 1200;
    clouds.forEach((cloud, i) => {
      const bob = Math.sin(time * 0.001 + i) * 4;
      const x = ((cloud.x - offset) % cycleWidth + cycleWidth) % cycleWidth - 100;
      const y = cloud.y + bob;
      const s = cloud.scale;

      ctx.beginPath();
      ctx.arc(x, y, 24 * s, 0, Math.PI * 2);
      ctx.arc(x + 22 * s, y - 10 * s, 28 * s, 0, Math.PI * 2);
      ctx.arc(x + 50 * s, y - 6 * s, 22 * s, 0, Math.PI * 2);
      ctx.arc(x + 68 * s, y + 2 * s, 18 * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private drawMountainLayer(offset: number, color: string, groundY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.65;

    const baseWidth = 320;
    const startX = -((offset % baseWidth) + baseWidth);

    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    for (let x = startX; x < this.width + baseWidth * 2; x += baseWidth) {
      ctx.lineTo(x + baseWidth * 0.45, groundY - 170);
      ctx.lineTo(x + baseWidth * 0.85, groundY - 80);
      ctx.lineTo(x + baseWidth, groundY);
    }
    ctx.lineTo(this.width + 100, this.height);
    ctx.lineTo(-100, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawHillsLayer(offset: number, color: string, groundY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;

    const hillWidth = 240;
    const startX = -((offset % hillWidth) + hillWidth);

    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    for (let x = startX; x < this.width + hillWidth * 2; x += hillWidth) {
      ctx.quadraticCurveTo(x + hillWidth * 0.5, groundY - 110, x + hillWidth, groundY);
    }
    ctx.lineTo(this.width + 100, this.height);
    ctx.lineTo(-100, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawNearHillsLayer(offset: number, color: string, groundY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;

    const hillWidth = 180;
    const startX = -((offset % hillWidth) + hillWidth);

    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    for (let x = startX; x < this.width + hillWidth * 2; x += hillWidth) {
      ctx.quadraticCurveTo(x + hillWidth * 0.5, groundY - 55, x + hillWidth, groundY);
    }
    ctx.lineTo(this.width + 100, this.height);
    ctx.lineTo(-100, this.height);
    ctx.closePath();
    ctx.fill();

    // Cute background cartoon flowers & mushrooms
    const itemInterval = 90;
    const itemStart = -((offset % itemInterval) + itemInterval);
    for (let x = itemStart; x < this.width + itemInterval; x += itemInterval) {
      const isFlower = (Math.abs(Math.floor((x + offset) / itemInterval)) % 2) === 0;
      if (isFlower) {
        // Little yellow/red flower
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, groundY - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x, groundY - 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, groundY - 7);
        ctx.lineTo(x, groundY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawGround(offset: number, theme: ThemeColors, groundY: number) {
    const ctx = this.ctx;
    ctx.save();

    // Top grassy/candy border
    ctx.fillStyle = theme.groundTop;
    ctx.fillRect(0, groundY, this.width, 18);

    // Dark soil body
    ctx.fillStyle = theme.groundBase;
    ctx.fillRect(0, groundY + 18, this.width, this.height - (groundY + 18));

    // Ground dividing outline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // Speed dashes and soil stones
    const dashSpacing = 48;
    const dashOffset = offset % dashSpacing;
    ctx.fillStyle = theme.groundDecor;
    for (let x = -dashOffset; x < this.width + dashSpacing; x += dashSpacing) {
      // Grass fringes on top
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 12, groundY + 10);
      ctx.lineTo(x + 24, groundY);
      ctx.fill();

      // Soil pebbles
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(x + 14, groundY + 36, 5, 0, Math.PI * 2);
      ctx.arc(x + 32, groundY + 54, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.groundDecor;
    }

    ctx.restore();
  }

  // 2. Draw Obstacles
  public drawObstacle(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

    switch (obs.type) {
      case 'SPIKY_CACTUS':
        this.drawCactus(obs, gameTime);
        break;
      case 'DOUBLE_SPIKE':
        this.drawDoubleSpike(obs, gameTime);
        break;
      case 'CHOMPER_PLANT':
        this.drawChomper(obs, gameTime);
        break;
      case 'BOUNCY_SLIME':
        this.drawSlime(obs, gameTime);
        break;
      case 'ROLLING_BOULDER':
        this.drawBoulder(obs, gameTime);
        break;
      case 'FLYING_BIRD':
        this.drawBird(obs, gameTime);
        break;
      case 'SPRING_MUSHROOM':
        this.drawMushroom(obs, gameTime);
        break;
    }

    ctx.restore();
  }

  private drawCactus(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;

    // Body
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;

    // Main stem
    ctx.beginPath();
    this.drawRoundRect(-w * 0.22, -h * 0.5, w * 0.44, h, 14);
    ctx.fill();
    ctx.stroke();

    // Left arm
    ctx.beginPath();
    this.drawRoundRect(-w * 0.5, -h * 0.25, w * 0.32, h * 0.24, 8);
    ctx.fill();
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    this.drawRoundRect(w * 0.18, -h * 0.35, w * 0.32, h * 0.24, 8);
    ctx.fill();
    ctx.stroke();

    // Goofy derp eyes
    const eyeBlink = Math.sin(gameTime * 0.005 + obs.id) > 0.94;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-w * 0.09, -h * 0.25, 6, 0, Math.PI * 2);
    ctx.arc(w * 0.09, -h * 0.25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!eyeBlink) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-w * 0.09 + 2, -h * 0.25, 3, 0, Math.PI * 2);
      ctx.arc(w * 0.09 - 1, -h * 0.25, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Little goofy smile
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -h * 0.12, 6, 0, Math.PI, false);
    ctx.stroke();

    // Spikes / needles
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    [-0.35, -0.05, 0.25].forEach(yFrac => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, h * yFrac);
      ctx.lineTo(-w * 0.38, h * yFrac - 4);
      ctx.moveTo(w * 0.24, h * yFrac);
      ctx.lineTo(w * 0.38, h * yFrac - 4);
      ctx.stroke();
    });
  }

  private drawDoubleSpike(obs: Obstacle, _gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;

    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;

    // Left spike
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, h * 0.5);
    ctx.lineTo(-w * 0.25, -h * 0.45);
    ctx.lineTo(-0.05, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right spike
    ctx.beginPath();
    ctx.moveTo(0.05, h * 0.5);
    ctx.lineTo(w * 0.25, -h * 0.5);
    ctx.lineTo(w * 0.45, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angry eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-w * 0.25, 0, 4, 0, Math.PI * 2);
    ctx.arc(w * 0.25, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-w * 0.25, 0, 2, 0, Math.PI * 2);
    ctx.arc(w * 0.25, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawChomper(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;
    const chompCycle = Math.sin(gameTime * 0.01 + obs.id) * 0.5 + 0.5;

    // Clay Pot
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, h * 0.5);
    ctx.lineTo(-w * 0.28, h * 0.15);
    ctx.lineTo(w * 0.28, h * 0.15);
    ctx.lineTo(w * 0.35, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head (Chomping monster)
    const mouthAngle = chompCycle * 0.45;
    ctx.fillStyle = '#a855f7';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;

    // Top jaw
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.36, -Math.PI * 0.9 - mouthAngle, 0.1 - mouthAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom jaw
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.36, 0.1 + mouthAngle, Math.PI * 0.9 + mouthAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sharp white cartoon teeth
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -h * 0.15);
      ctx.lineTo(i * 7 + 3.5, -h * 0.15 - 8);
      ctx.lineTo(i * 7 + 7, -h * 0.15);
      ctx.fill();
    }

    // Angry Yellow Eyes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-8, -h * 0.32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-6, -h * 0.32, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSlime(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;
    const squash = Math.sin(gameTime * 0.012 + obs.id) * 0.15;

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.ellipse(0, h * 0.1, (w * 0.44) * (1 + squash), (h * 0.38) * (1 - squash), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute kawaii eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, h * 0.05, 7, 0, Math.PI * 2);
    ctx.arc(10, h * 0.05, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupils with sparkle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-8, h * 0.05, 4, 0, Math.PI * 2);
    ctx.arc(12, h * 0.05, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-9, h * 0.03, 1.5, 0, Math.PI * 2);
    ctx.arc(11, h * 0.03, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBoulder(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const r = obs.width * 0.46;
    const rotation = gameTime * 0.008 + obs.id;

    ctx.save();
    ctx.rotate(-rotation);

    // Stone base
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stone cracks & dizzy spiral eyes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(-r * 0.2, 0);
    ctx.lineTo(-r * 0.4, r * 0.4);
    ctx.stroke();

    // Dizzy spiral face
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-8, -4, 5, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 1.6);
    ctx.stroke();

    ctx.restore();
  }

  private drawBird(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;
    const flap = Math.sin(gameTime * 0.015 + obs.id) * 12;

    // Bird body (Chubby yellow tweetie)
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flapping Wing
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-w * 0.08, flap * 0.5, w * 0.24, h * 0.16 + Math.abs(flap) * 0.2, Math.PI * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Orange Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, -4);
    ctx.lineTo(w * 0.52, 2);
    ctx.lineTo(w * 0.3, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Big eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w * 0.15, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(w * 0.18, -4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMushroom(obs: Obstacle, gameTime: number) {
    const ctx = this.ctx;
    const w = obs.width;
    const h = obs.height;
    const bounce = Math.sin(gameTime * 0.008) * 3;

    // Stem
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.drawRoundRect(-w * 0.18, -h * 0.1, w * 0.36, h * 0.55, 8);
    ctx.fill();
    ctx.stroke();

    // Cap
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -h * 0.1 + bounce, w * 0.44, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Polka dots
    ctx.fillStyle = '#ffffff';
    [-w * 0.25, 0, w * 0.25].forEach(dotX => {
      ctx.beginPath();
      ctx.arc(dotX, -h * 0.22 + bounce, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 3. Draw Collectibles (Stars & Power-Up Bubbles)
  public drawCollectible(item: Collectible, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    const bob = Math.sin(gameTime * 0.005 + item.bobTimer) * 6;
    ctx.translate(item.x, item.y + bob);

    if (item.type === 'STAR') {
      // Golden 5-point star with sparkle
      const angle = (gameTime * 0.002) % (Math.PI * 2);
      ctx.rotate(angle * 0.3);

      // Glow halo
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, item.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Star shape
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      this.drawStarShape(ctx, 0, 0, 5, item.radius, item.radius * 0.48);
      ctx.fill();
      ctx.stroke();

      // Shiny core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-item.radius * 0.25, -item.radius * 0.25, item.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // PowerUp Bubble
      const pulse = Math.sin(gameTime * 0.008) * 3;
      const r = item.radius + pulse;

      // Bubble aura
      const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.5)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.8)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Powerup icon inside
      ctx.font = 'bold 20px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let icon = '⚡';
      if (item.powerUpType === 'SHIELD') icon = '🛡️';
      if (item.powerUpType === 'DOUBLE_JUMP') icon = '🪶';
      if (item.powerUpType === 'MAGNET') icon = '🧲';
      if (item.powerUpType === 'GIANT_BALL') icon = '⭐';
      if (item.powerUpType === 'SLOW_MO') icon = '⏳';
      ctx.fillText(icon, 0, 0);
    }

    ctx.restore();
  }

  private drawStarShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  // 4. Draw Player Ball
  public drawPlayer(
    player: Player,
    gameTime: number,
    currentSpeed: number,
    isDying: boolean = false
  ) {
    const ctx = this.ctx;
    const skin = SKINS.find(s => s.id === player.skinId) || SKINS[0];
    const currentRadius = player.isGiant ? GAME_CONSTANTS.GIANT_RADIUS : player.radius;
    const groundY = this.height - GAME_CONSTANTS.GROUND_HEIGHT;

    // --- SHADOW ON GROUND ---
    const distFromGround = Math.max(0, groundY - (player.y + currentRadius));
    const shadowScale = Math.max(0.3, 1 - distFromGround / 220);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(
      player.x,
      groundY + 4,
      currentRadius * player.scaleX * shadowScale * 1.1,
      6 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // --- SPEED WIND LINES / PARTICLES TRAIL ---
    if (player.isGrounded && currentSpeed > 7.5 && !isDying) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      [-8, 0, 8].forEach((offsetY, i) => {
        const lineLen = 20 + Math.sin(gameTime * 0.02 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(player.x - currentRadius - 8, player.y + offsetY);
        ctx.lineTo(player.x - currentRadius - 8 - lineLen, player.y + offsetY);
        ctx.stroke();
      });
      ctx.restore();
    }

    // --- PLAYER BODY ---
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.scaleX, player.scaleY);

    // Ball Base with Gradient
    const ballGrad = ctx.createRadialGradient(
      -currentRadius * 0.35,
      -currentRadius * 0.35,
      currentRadius * 0.1,
      0,
      0,
      currentRadius
    );
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.3, skin.primaryColor);
    ballGrad.addColorStop(1, skin.secondaryColor);

    ctx.fillStyle = ballGrad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Skin Custom Patterns
    this.drawSkinPattern(ctx, skin, currentRadius, player.rotation);

    // --- EYES & EXPRESSION ---
    this.drawPlayerFace(ctx, player, currentRadius, isDying, gameTime);

    // --- ACCESSORIES (HATS / SUNGLASSES / CROWN) ---
    this.drawAccessory(ctx, skin.accessory, currentRadius, gameTime);

    // --- POWERUP AURAS ---
    if (player.hasShield) {
      this.drawShieldEffect(ctx, currentRadius, gameTime);
    }
    if (player.hasMagnet) {
      this.drawMagnetEffect(ctx, currentRadius, gameTime);
    }
    if (player.isGiant) {
      this.drawGiantEffect(ctx, currentRadius, gameTime);
    }

    ctx.restore();
  }

  private drawSkinPattern(
    ctx: CanvasRenderingContext2D,
    skin: typeof SKINS[0],
    radius: number,
    rotation: number
  ) {
    ctx.save();
    ctx.rotate(rotation);

    if (skin.pattern === 'WATERMELON') {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 4;
      [-0.5, 0, 0.5].forEach(frac => {
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, frac * Math.PI - 0.4, frac * Math.PI + 0.4);
        ctx.stroke();
      });
    } else if (skin.pattern === 'STRIPES') {
      ctx.strokeStyle = skin.secondaryColor;
      ctx.lineWidth = 5;
      [-radius * 0.5, 0, radius * 0.5].forEach(y => {
        ctx.beginPath();
        const halfW = Math.sqrt(Math.max(0, radius * radius - y * y));
        ctx.moveTo(-halfW, y);
        ctx.lineTo(halfW, y);
        ctx.stroke();
      });
    } else if (skin.pattern === 'SPOTS') {
      ctx.fillStyle = '#ffffff';
      [
        { x: -radius * 0.4, y: -radius * 0.3, r: 4 },
        { x: radius * 0.3, y: radius * 0.4, r: 5 },
        { x: -radius * 0.2, y: radius * 0.4, r: 3 },
      ].forEach(spot => {
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (skin.pattern === 'GOLDEN') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.drawStarShape(ctx, 0, 0, 4, radius * 0.6, radius * 0.25);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPlayerFace(
    ctx: CanvasRenderingContext2D,
    player: Player,
    radius: number,
    isDying: boolean,
    _gameTime: number
  ) {
    const eyeOffsetX = radius * 0.25;
    const eyeOffsetY = -radius * 0.15;
    const eyeRadius = radius * 0.28;

    if (isDying) {
      // Dizzy 'X X' death eyes & sad mouth
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      [-eyeOffsetX, eyeOffsetX].forEach(ex => {
        ctx.beginPath();
        ctx.moveTo(ex - 6, eyeOffsetY - 6);
        ctx.lineTo(ex + 6, eyeOffsetY + 6);
        ctx.moveTo(ex + 6, eyeOffsetY - 6);
        ctx.lineTo(ex - 6, eyeOffsetY + 6);
        ctx.stroke();
      });

      // Sad wobbly mouth
      ctx.beginPath();
      ctx.arc(0, radius * 0.35, 8, Math.PI, 0, false);
      ctx.stroke();
      return;
    }

    // Normal cartoon eyes with specular highlights & responsive pupils
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;

    // Left Eye
    ctx.beginPath();
    ctx.ellipse(-eyeOffsetX * 0.5, eyeOffsetY, eyeRadius, eyeRadius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Eye
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX * 1.2, eyeOffsetY, eyeRadius * 0.95, eyeRadius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!player.isBlinking) {
      // Pupils looking ahead / towards obstacles
      const lookDist = 4;
      const lookX = Math.cos(player.eyeLookAngle) * lookDist;
      const lookY = Math.sin(player.eyeLookAngle) * lookDist;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-eyeOffsetX * 0.5 + lookX + 2, eyeOffsetY + lookY, eyeRadius * 0.5, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX * 1.2 + lookX + 2, eyeOffsetY + lookY, eyeRadius * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Specular cartoon gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeOffsetX * 0.5 + lookX, eyeOffsetY + lookY - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX * 1.2 + lookX, eyeOffsetY + lookY - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheerful mouth
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (!player.isGrounded) {
      // "O" shape when airborne (wheee!)
      ctx.fillStyle = '#ef4444';
      ctx.ellipse(eyeOffsetX * 0.3, radius * 0.28, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Happy confident grin
      ctx.arc(eyeOffsetX * 0.3, radius * 0.18, 9, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
    }

    // Rosy blushing cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(-radius * 0.45, radius * 0.15, 5, 0, Math.PI * 2);
    ctx.arc(radius * 0.65, radius * 0.15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Sweat drop when close to obstacle!
    if (player.sweatTimer > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -radius * 0.65);
      ctx.quadraticCurveTo(-radius * 0.65, -radius * 0.45, -radius * 0.5, -radius * 0.35);
      ctx.quadraticCurveTo(-radius * 0.35, -radius * 0.45, -radius * 0.5, -radius * 0.65);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawAccessory(
    ctx: CanvasRenderingContext2D,
    acc: typeof SKINS[0]['accessory'],
    radius: number,
    gameTime: number
  ) {
    if (acc === 'NONE') return;

    if (acc === 'SUNGLASSES') {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this.drawRoundRect(-radius * 0.5, -radius * 0.3, radius * 0.55, radius * 0.38, 4);
      this.drawRoundRect(radius * 0.15, -radius * 0.3, radius * 0.55, radius * 0.38, 4);
      ctx.fill();
      ctx.stroke();
      // Bridge
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(radius * 0.05, -radius * 0.18);
      ctx.lineTo(radius * 0.15, -radius * 0.18);
      ctx.stroke();
    } else if (acc === 'CROWN') {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -radius * 0.7);
      ctx.lineTo(-radius * 0.45, -radius * 1.15);
      ctx.lineTo(-radius * 0.15, -radius * 0.85);
      ctx.lineTo(0, -radius * 1.25);
      ctx.lineTo(radius * 0.15, -radius * 0.85);
      ctx.lineTo(radius * 0.45, -radius * 1.15);
      ctx.lineTo(radius * 0.5, -radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Jewels
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -radius * 0.85, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (acc === 'HEADBAND') {
      // Red ninja headband with tails
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.fillRect(-radius * 0.8, -radius * 0.45, radius * 1.6, radius * 0.22);
      ctx.strokeRect(-radius * 0.8, -radius * 0.45, radius * 1.6, radius * 0.22);

      // Trailing fluttering ribbon behind
      const flap = Math.sin(gameTime * 0.02) * 5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.8, -radius * 0.4);
      ctx.quadraticCurveTo(-radius * 1.3, -radius * 0.3 + flap, -radius * 1.6, -radius * 0.1 + flap);
      ctx.lineTo(-radius * 1.5, -radius * 0.35 + flap);
      ctx.closePath();
      ctx.fill();
    } else if (acc === 'CAT_EARS') {
      ctx.fillStyle = '#ec4899';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      // Left ear
      ctx.beginPath();
      ctx.moveTo(-radius * 0.65, -radius * 0.6);
      ctx.lineTo(-radius * 0.4, -radius * 1.1);
      ctx.lineTo(-radius * 0.1, -radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right ear
      ctx.beginPath();
      ctx.moveTo(radius * 0.1, -radius * 0.8);
      ctx.lineTo(radius * 0.4, -radius * 1.1);
      ctx.lineTo(radius * 0.65, -radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawShieldEffect(ctx: CanvasRenderingContext2D, radius: number, gameTime: number) {
    const pulse = Math.sin(gameTime * 0.008) * 4;
    const r = radius + 12 + pulse;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating hexagon nodes
    const angle = gameTime * 0.003;
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMagnetEffect(ctx: CanvasRenderingContext2D, radius: number, gameTime: number) {
    ctx.save();
    const pulse = Math.sin(gameTime * 0.01) * 6;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawGiantEffect(ctx: CanvasRenderingContext2D, radius: number, gameTime: number) {
    ctx.save();
    const pulse = Math.sin(gameTime * 0.012) * 8;
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw Particles
  public drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    ctx.save();

    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'CIRCLE' || p.shape === 'DUST') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'STAR') {
        this.drawStarShape(ctx, 0, 0, 4, p.size, p.size * 0.4);
        ctx.fill();
      } else if (p.shape === 'CONFETTI') {
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      } else if (p.shape === 'HEART') {
        ctx.beginPath();
        ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.35, Math.PI, 0, false);
        ctx.arc(p.size * 0.35, -p.size * 0.35, p.size * 0.35, Math.PI, 0, false);
        ctx.lineTo(0, p.size * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }

  // 6. Draw Comic Floaty Popups (+100, CLOSE CALL!, NICE!)
  public drawFloatingTexts(floatingTexts: FloatingText[]) {
    const ctx = this.ctx;
    ctx.save();

    floatingTexts.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `bold ${ft.fontSize * ft.scale}px 'Luckiest Guy', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Comic dark stroke
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.5;
      ctx.strokeText(ft.text, ft.x, ft.y);

      // Bright fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();
  }
}
