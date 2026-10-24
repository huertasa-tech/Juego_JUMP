import { soundManager } from '../audio/soundEffects';
import { Achievement, Collectible, FloatingText, GameStats, Obstacle, ObstacleType, Particle, Player, PowerUpType, ThemeColors } from '../types';
import { FUNNY_DEATH_MESSAGES, GAME_CONSTANTS, INITIAL_ACHIEVEMENTS, THEMES } from './constants';

export class GameEngine {
  public player: Player;
  public obstacles: Obstacle[] = [];
  public collectibles: Collectible[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public stats: GameStats;
  public theme: ThemeColors;
  public themeIndex: number = 0;
  public currentSpeed: number = GAME_CONSTANTS.BASE_SPEED;
  public scrollX: number = 0;
  public gameTime: number = 0;
  public isGameOver: boolean = false;
  public isPaused: boolean = false;
  public screenShake: { x: number; y: number; intensity: number } = { x: 0, y: 0, intensity: 0 };
  public achievements: Achievement[] = [];

  private nextObstacleId: number = 1;
  private nextCollectibleId: number = 1;
  private nextParticleId: number = 1;
  private nextTextId: number = 1;
  private nextObstacleDistance: number = 320;
  private groundY: number;

  constructor() {
    this.groundY = GAME_CONSTANTS.CANVAS_HEIGHT - GAME_CONSTANTS.GROUND_HEIGHT;
    this.theme = THEMES[0];
    this.player = this.createInitialPlayer();
    this.stats = this.createInitialStats();
    this.loadSavedData();
  }

  private createInitialPlayer(): Player {
    return {
      x: 180,
      y: this.groundY - GAME_CONSTANTS.PLAYER_RADIUS,
      radius: GAME_CONSTANTS.PLAYER_RADIUS,
      vy: 0,
      isGrounded: true,
      jumpCount: 0,
      maxJumps: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      eyeLookAngle: 0,
      isBlinking: false,
      blinkTimer: 0,
      sweatTimer: 0,
      skinId: 'classic_orange',
      hasShield: false,
      isGiant: false,
      hasMagnet: false,
      isSlowMo: false,
      powerUpTimers: {
        SHIELD: 0,
        DOUBLE_JUMP: 0,
        MAGNET: 0,
        GIANT_BALL: 0,
        SLOW_MO: 0,
      },
    };
  }

  private createInitialStats(): GameStats {
    return {
      score: 0,
      highScore: 0,
      starsCollectedThisRun: 0,
      totalStars: 0,
      distance: 0,
      jumpsPerformed: 0,
      obstaclesJumped: 0,
      powerUpsCollected: 0,
      nearMisses: 0,
      currentSpeed: GAME_CONSTANTS.BASE_SPEED,
      combo: 0,
      maxCombo: 0,
      deathCause: '',
    };
  }

  private loadSavedData() {
    try {
      const savedHigh = localStorage.getItem('jumping_ball_high_score');
      if (savedHigh) this.stats.highScore = parseInt(savedHigh, 10) || 0;

      const savedStars = localStorage.getItem('jumping_ball_total_stars');
      if (savedStars) this.stats.totalStars = parseInt(savedStars, 10) || 0;

      const savedAchievements = localStorage.getItem('jumping_ball_achievements');
      if (savedAchievements) {
        this.achievements = JSON.parse(savedAchievements);
      } else {
        this.achievements = [...INITIAL_ACHIEVEMENTS];
      }

      const savedSkin = localStorage.getItem('jumping_ball_active_skin');
      if (savedSkin) {
        this.player.skinId = savedSkin;
      }
    } catch {
      this.achievements = [...INITIAL_ACHIEVEMENTS];
    }
  }

  public saveGameData() {
    try {
      localStorage.setItem('jumping_ball_high_score', this.stats.highScore.toString());
      localStorage.setItem('jumping_ball_total_stars', this.stats.totalStars.toString());
      localStorage.setItem('jumping_ball_achievements', JSON.stringify(this.achievements));
      localStorage.setItem('jumping_ball_active_skin', this.player.skinId);
    } catch (e) {
      console.warn('Failed to save game state to localStorage', e);
    }
  }

  public resetGame() {
    const prevHigh = this.stats.highScore;
    const prevStars = this.stats.totalStars;
    const currentSkin = this.player.skinId;

    this.player = this.createInitialPlayer();
    this.player.skinId = currentSkin;

    this.stats = this.createInitialStats();
    this.stats.highScore = prevHigh;
    this.stats.totalStars = prevStars;

    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.currentSpeed = GAME_CONSTANTS.BASE_SPEED;
    this.scrollX = 0;
    this.gameTime = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.nextObstacleDistance = 320;
    this.themeIndex = 0;
    this.theme = THEMES[0];
  }

  // Handle Player Jump Action
  public triggerJump(): boolean {
    if (this.isGameOver || this.isPaused) return false;

    // Allowed jumps (at least 2 for fun, or when double jump active)
    const effectiveMaxJumps = this.player.powerUpTimers.DOUBLE_JUMP > 0 ? 3 : this.player.maxJumps;

    if (this.player.isGrounded || this.player.jumpCount < effectiveMaxJumps) {
      const isDouble = this.player.jumpCount > 0;
      this.player.vy = isDouble ? GAME_CONSTANTS.DOUBLE_JUMP_FORCE : GAME_CONSTANTS.JUMP_FORCE;
      this.player.isGrounded = false;
      this.player.jumpCount++;

      // Squash and stretch
      this.player.scaleX = 0.75;
      this.player.scaleY = 1.35;

      // Jump dust cloud
      this.spawnDustParticles(this.player.x, this.groundY, 8);

      // Sound
      soundManager.playJump(isDouble);

      // Stats
      this.stats.jumpsPerformed++;
      this.checkAchievementProgress('first_jump', 1);
      this.checkAchievementProgress('high_flyer', this.stats.jumpsPerformed);
      if (isDouble) {
        this.checkAchievementProgress('double_jump_master', 1);
      }

      return true;
    }
    return false;
  }

  // Main Update Loop
  public update(dt: number) {
    if (this.isGameOver || this.isPaused) return;

    this.gameTime += dt * 1000;

    // Speed progression curve
    const targetSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.BASE_SPEED + (this.stats.distance / 120) * GAME_CONSTANTS.SPEED_INCREASE_RATE
    );
    const speedMult = this.player.isSlowMo ? 0.65 : 1.0;
    this.currentSpeed = targetSpeed * speedMult;
    this.stats.currentSpeed = this.currentSpeed;

    // Advance Distance & Scroll
    const stepMove = this.currentSpeed * (dt * 60);
    this.scrollX += stepMove;
    this.stats.distance += stepMove * 0.1;
    this.stats.score = Math.floor(this.stats.distance + this.stats.starsCollectedThisRun * 25);

    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      this.saveGameData();
    }

    // Dynamic Theme Progression (Switches every 350m for a lively cartoon adventure)
    const newThemeIdx = Math.floor(this.stats.distance / 350) % THEMES.length;
    if (newThemeIdx !== this.themeIndex) {
      this.themeIndex = newThemeIdx;
      this.theme = THEMES[this.themeIndex];
      this.addFloatingText(this.player.x + 80, this.player.y - 60, `ZONE: ${this.theme.name.toUpperCase()}!`, '#fde047', 22);
      soundManager.playSpeedUp();
    }

    // Update Player Physics
    this.updatePlayer(dt);

    // Update Power-Up Timers
    this.updatePowerUps(dt);

    // Spawn Obstacles & Collectibles
    this.handleSpawning(stepMove);

    // Move & Update Obstacles
    this.updateObstacles(stepMove);

    // Move & Update Collectibles (Star Magnet pull)
    this.updateCollectibles(stepMove);

    // Particle update
    this.updateParticles(dt);

    // Floating text update
    this.updateFloatingTexts(dt);

    // Screen Shake dampening
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() * 2 - 1) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() * 2 - 1) * this.screenShake.intensity;
      this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 25);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }

    // Achievement Progress checks
    this.checkAchievementProgress('score_100', this.stats.score);
    this.checkAchievementProgress('score_500', this.stats.score);
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const currentRadius = p.isGiant ? GAME_CONSTANTS.GIANT_RADIUS : p.radius;

    // Gravity
    p.vy += GAME_CONSTANTS.GRAVITY;
    p.y += p.vy;

    // Rolling rotation based on speed
    p.rotation += (this.currentSpeed * 0.05);

    // Landing detection
    if (p.y + currentRadius >= this.groundY) {
      p.y = this.groundY - currentRadius;
      if (!p.isGrounded) {
        // Just landed! Squash effect
        p.scaleX = 1.35;
        p.scaleY = 0.7;
        this.spawnDustParticles(p.x, this.groundY, 5);
      }
      p.isGrounded = true;
      p.vy = 0;
      p.jumpCount = 0;
    } else {
      p.isGrounded = false;
    }

    // Elastic squash/stretch recovery
    p.scaleX += (1.0 - p.scaleX) * 0.15;
    p.scaleY += (1.0 - p.scaleY) * 0.15;

    // Eye blinking timer
    p.blinkTimer += dt;
    if (p.blinkTimer > 2.8) {
      p.isBlinking = true;
      if (p.blinkTimer > 3.0) {
        p.isBlinking = false;
        p.blinkTimer = 0;
      }
    }

    // Eye target tracking & sweat reaction
    let closestObstacle: Obstacle | null = null;
    let minObsDist = Infinity;
    this.obstacles.forEach(obs => {
      const dist = obs.x - p.x;
      if (dist > 0 && dist < minObsDist) {
        minObsDist = dist;
        closestObstacle = obs;
      }
    });

    if (closestObstacle && minObsDist < 260) {
      const targetObs = closestObstacle as Obstacle;
      const dx = targetObs.x - p.x;
      const dy = targetObs.y - p.y;
      p.eyeLookAngle = Math.atan2(dy, dx);
      if (minObsDist < 110) {
        p.sweatTimer = 0.5; // Trigger cute worried sweat drop
      }
    } else {
      p.eyeLookAngle = 0;
    }

    if (p.sweatTimer > 0) {
      p.sweatTimer -= dt;
    }
  }

  private updatePowerUps(dt: number) {
    const timers = this.player.powerUpTimers;
    (Object.keys(timers) as PowerUpType[]).forEach(type => {
      if (timers[type] > 0) {
        timers[type] = Math.max(0, timers[type] - dt);
      }
    });

    this.player.hasShield = timers.SHIELD > 0;
    this.player.hasMagnet = timers.MAGNET > 0;
    this.player.isGiant = timers.GIANT_BALL > 0;
    this.player.isSlowMo = timers.SLOW_MO > 0;
  }

  private handleSpawning(stepMove: number) {
    this.nextObstacleDistance -= stepMove;

    if (this.nextObstacleDistance <= 0) {
      this.spawnRandomObstaclePattern();
      // Set next spawn distance based on speed
      this.nextObstacleDistance =
        GAME_CONSTANTS.OBSTACLE_MIN_SPAWN_DIST +
        Math.random() * (GAME_CONSTANTS.OBSTACLE_MAX_SPAWN_DIST - GAME_CONSTANTS.OBSTACLE_MIN_SPAWN_DIST);
    }
  }

  private spawnRandomObstaclePattern() {
    const spawnX = GAME_CONSTANTS.CANVAS_WIDTH + 60;
    const types: ObstacleType[] = [
      'SPIKY_CACTUS',
      'CHOMPER_PLANT',
      'BOUNCY_SLIME',
      'ROLLING_BOULDER',
      'FLYING_BIRD',
      'DOUBLE_SPIKE',
      'SPRING_MUSHROOM',
    ];

    // Pick obstacle based on current distance
    const availableTypes = this.stats.distance > 200 ? types : types.slice(0, 4);
    const chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    let width = 50;
    let height = 65;
    let y = this.groundY - height;

    if (chosenType === 'SPIKY_CACTUS') {
      width = 46;
      height = 68;
      y = this.groundY - height;
    } else if (chosenType === 'DOUBLE_SPIKE') {
      width = 72;
      height = 45;
      y = this.groundY - height;
    } else if (chosenType === 'CHOMPER_PLANT') {
      width = 54;
      height = 70;
      y = this.groundY - height;
    } else if (chosenType === 'BOUNCY_SLIME') {
      width = 52;
      height = 48;
      y = this.groundY - height;
    } else if (chosenType === 'ROLLING_BOULDER') {
      width = 60;
      height = 60;
      y = this.groundY - height;
    } else if (chosenType === 'FLYING_BIRD') {
      width = 48;
      height = 42;
      y = this.groundY - 110 - Math.random() * 40; // in air
    } else if (chosenType === 'SPRING_MUSHROOM') {
      width = 48;
      height = 55;
      y = this.groundY - height;
    }

    const obs: Obstacle = {
      id: this.nextObstacleId++,
      type: chosenType,
      x: spawnX,
      y,
      width,
      height,
      speedMultiplier: chosenType === 'ROLLING_BOULDER' ? 1.25 : 1.0,
      passed: false,
      animFrame: 0,
      bobOffset: Math.random() * Math.PI * 2,
    };
    this.obstacles.push(obs);

    // Spawn stars in an arc over the obstacle
    if (Math.random() < GAME_CONSTANTS.STAR_SPAWN_CHANCE) {
      this.spawnStarArc(spawnX, y - 40);
    }

    // Rare chance to spawn a floating Power-Up
    if (Math.random() < GAME_CONSTANTS.POWERUP_SPAWN_CHANCE) {
      const pTypes: PowerUpType[] = ['SHIELD', 'DOUBLE_JUMP', 'MAGNET', 'GIANT_BALL'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      this.collectibles.push({
        id: this.nextCollectibleId++,
        x: spawnX + 120,
        y: this.groundY - 130,
        radius: 20,
        type: 'POWERUP',
        powerUpType: pType,
        bobTimer: Math.random() * 10,
        collected: false,
        glowAngle: 0,
      });
    }
  }

  private spawnStarArc(baseX: number, apexY: number) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const offsetX = (i - 1) * 36;
      const offsetY = i === 1 ? -22 : 0;
      this.collectibles.push({
        id: this.nextCollectibleId++,
        x: baseX + offsetX,
        y: apexY + offsetY,
        radius: 14,
        type: 'STAR',
        bobTimer: i * 0.4,
        collected: false,
        glowAngle: 0,
      });
    }
  }

  private updateObstacles(stepMove: number) {
    const p = this.player;
    const pRadius = p.isGiant ? GAME_CONSTANTS.GIANT_RADIUS : p.radius;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= stepMove * obs.speedMultiplier;

      // Collision Check
      if (this.checkCollision(p, obs)) {
        if (p.isGiant) {
          // Giant ball smashes right through obstacles!
          this.smashObstacle(obs, i);
          continue;
        } else if (p.hasShield) {
          // Shield absorbs hit
          p.hasShield = false;
          p.powerUpTimers.SHIELD = 0;
          this.obstacles.splice(i, 1);
          this.screenShake.intensity = 8;
          soundManager.playShieldAbsorb();
          this.addFloatingText(p.x, p.y - 40, 'SHIELD SAVED!', '#38bdf8', 20);
          this.spawnSparkleParticles(obs.x, obs.y, '#38bdf8', 15);
          continue;
        } else {
          // Game Over hit!
          this.handleGameOver(obs.type);
          return;
        }
      }

      // Near Miss / Jump Over detection
      if (!obs.passed && obs.x + obs.width < p.x - pRadius) {
        obs.passed = true;
        this.stats.obstaclesJumped++;
        this.stats.combo++;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);

        // Near miss reward
        const verticalDist = Math.abs(p.y + pRadius - obs.y);
        if (verticalDist < GAME_CONSTANTS.NEAR_MISS_DISTANCE && !p.isGrounded) {
          this.stats.nearMisses++;
          soundManager.playNearMiss();
          this.addFloatingText(p.x + 30, p.y - 30, 'CLOSE CALL! +50', '#f59e0b', 18);
          this.stats.score += 50;
          this.checkAchievementProgress('near_miss_10', this.stats.nearMisses);
        }
      }

      // Remove off-screen obstacles
      if (obs.x < -150) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private smashObstacle(obs: Obstacle, index: number) {
    this.obstacles.splice(index, 1);
    this.screenShake.intensity = 14;
    soundManager.playCrush();
    this.stats.score += 100;
    this.addFloatingText(obs.x + obs.width / 2, obs.y, 'SMASH! +100', '#f97316', 22);
    this.spawnSparkleParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ea580c', 20);
  }

  private updateCollectibles(stepMove: number) {
    const p = this.player;
    const pRadius = p.isGiant ? GAME_CONSTANTS.GIANT_RADIUS : p.radius;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.x -= stepMove;

      // Magnet pull logic
      if (p.hasMagnet && item.type === 'STAR') {
        const dx = p.x - item.x;
        const dy = p.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 260 && dist > 1) {
          item.x += (dx / dist) * 10;
          item.y += (dy / dist) * 10;
        }
      }

      // Pickup Collision
      const dx = p.x - item.x;
      const dy = p.y - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pRadius + item.radius) {
        // Collected!
        if (item.type === 'STAR') {
          this.stats.starsCollectedThisRun++;
          this.stats.totalStars++;
          this.stats.score += 25;
          soundManager.playStarCollect();
          this.addFloatingText(item.x, item.y - 15, '+1 ⭐', '#facc15', 18);
          this.spawnSparkleParticles(item.x, item.y, '#facc15', 8);
          this.checkAchievementProgress('stars_50', this.stats.totalStars);
        } else if (item.type === 'POWERUP' && item.powerUpType) {
          this.stats.powerUpsCollected++;
          p.powerUpTimers[item.powerUpType] = GAME_CONSTANTS.POWERUP_DURATION;
          soundManager.playPowerUp();

          let text = 'POWER UP!';
          let color = '#38bdf8';
          if (item.powerUpType === 'SHIELD') {
            text = 'SHIELD ACTIVATED!';
            color = '#38bdf8';
          } else if (item.powerUpType === 'DOUBLE_JUMP') {
            text = 'TRIPLE JUMP ACTIVE!';
            color = '#fde047';
          } else if (item.powerUpType === 'MAGNET') {
            text = 'STAR MAGNET ON!';
            color = '#ef4444';
          } else if (item.powerUpType === 'GIANT_BALL') {
            text = 'MEGA GIANT STOMP!';
            color = '#a855f7';
          }

          this.addFloatingText(p.x, p.y - 50, text, color, 20);
          this.spawnSparkleParticles(item.x, item.y, color, 18);
          this.checkAchievementProgress('powerup_15', this.stats.powerUpsCollected);
        }

        this.collectibles.splice(i, 1);
        this.saveGameData();
        continue;
      }

      // Remove off-screen
      if (item.x < -60) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private checkCollision(p: Player, obs: Obstacle): boolean {
    const pRadius = (p.isGiant ? GAME_CONSTANTS.GIANT_RADIUS : p.radius) * 0.88; // Fair hitbox margin

    // Closest point on obstacle bounding box
    const closestX = Math.max(obs.x, Math.min(p.x, obs.x + obs.width));
    const closestY = Math.max(obs.y, Math.min(p.y, obs.y + obs.height));

    const dx = p.x - closestX;
    const dy = p.y - closestY;
    const distanceSq = dx * dx + dy * dy;

    return distanceSq < pRadius * pRadius;
  }

  private handleGameOver(obstacleType: ObstacleType) {
    this.isGameOver = true;
    soundManager.playCrash();
    this.screenShake.intensity = 18;

    // Funny death messages
    let msg = FUNNY_DEATH_MESSAGES[Math.floor(Math.random() * FUNNY_DEATH_MESSAGES.length)];
    if (obstacleType === 'SPIKY_CACTUS' || obstacleType === 'DOUBLE_SPIKE') {
      msg = "Ouch! You popped against a prickly spike!";
    } else if (obstacleType === 'CHOMPER_PLANT') {
      msg = "Chomp! The monster plant swallowed your high score!";
    } else if (obstacleType === 'BOUNCY_SLIME') {
      msg = "Splat! You got stuck inside a gooey blue slime!";
    } else if (obstacleType === 'FLYING_BIRD') {
      msg = "Tweet tweet! Airborne collision with the yellow bird!";
    }
    this.stats.deathCause = msg;

    // Crash burst particles
    this.spawnSparkleParticles(this.player.x, this.player.y, '#ef4444', 25);
    this.saveGameData();
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.lifetime += dt;
      p.alpha = Math.max(0, 1 - p.lifetime / p.maxLifetime);

      if (p.lifetime >= p.maxLifetime) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.lifetime += dt;
      ft.alpha = Math.max(0, 1 - ft.lifetime / 1.2);
      ft.scale = Math.min(1.2, 1 + Math.sin(ft.lifetime * 5) * 0.2);

      if (ft.lifetime >= 1.2) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, fontSize: number = 18) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1.0,
      vy: -1.8,
      scale: 1.0,
      lifetime: 0,
    });
  }

  public spawnDustParticles(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: this.nextParticleId++,
        x: x + (Math.random() * 20 - 10),
        y: y - 2,
        vx: (Math.random() - 0.5) * 4 - 2,
        vy: -Math.random() * 2.5 - 0.5,
        size: Math.random() * 6 + 3,
        color: '#e2e8f0',
        alpha: 0.8,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: 'DUST',
        lifetime: 0,
        maxLifetime: 0.4 + Math.random() * 0.3,
      });
    }
  }

  public spawnSparkleParticles(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 4,
        color,
        alpha: 1.0,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.4,
        shape: Math.random() > 0.4 ? 'STAR' : 'CIRCLE',
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.4,
      });
    }
  }

  public checkAchievementProgress(id: string, progressValue: number) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.progress = Math.max(ach.progress, progressValue);
      if (ach.progress >= ach.target) {
        ach.unlocked = true;
        this.stats.totalStars += ach.rewardStars;
        soundManager.playPowerUp();
        this.addFloatingText(
          this.player.x,
          this.player.y - 70,
          `🏆 UNLOCKED: ${ach.title}! +${ach.rewardStars}⭐`,
          '#facc15',
          20
        );
        this.saveGameData();
      }
    }
  }
}
