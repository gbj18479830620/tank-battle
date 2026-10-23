(() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Constants                                                          */
  /* ------------------------------------------------------------------ */

  const TILE = 32;
  const COLS = 16;
  const ROWS = 16;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  const TANK_SIZE = 28;
  const HALF_TANK = TANK_SIZE / 2;
  const BASE_COL = 7;
  const BASE_ROW = 14;
  const BASE_X = BASE_COL * TILE;
  const BASE_Y = BASE_ROW * TILE;
  const BASE_W = TILE * 2;
  const BASE_H = TILE * 2;
  const BASE_CENTER = { x: BASE_X + BASE_W / 2, y: BASE_Y + BASE_H / 2 };
  const PLAYER_SPAWN = { x: 3.5 * TILE, y: 13.5 * TILE };
  const ENEMY_SPAWNS = [
    { x: 1.5 * TILE, y: 18 },
    { x: 8.5 * TILE, y: 18 },
    { x: 14.5 * TILE, y: 18 },
  ];
  const STEP = 1 / 60;
  const RES = 2;
  const TAU = Math.PI * 2;
  const HS_KEY = "steel-vanguard-high-score";
  const MUTE_KEY = "steel-vanguard-muted";

  const T = Object.freeze({
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    TREE: 4,
    BASE: 5,
  });

  const DIRS = Object.freeze({
    up: { x: 0, y: -1, angle: 0 },
    right: { x: 1, y: 0, angle: Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI },
    left: { x: -1, y: 0, angle: -Math.PI / 2 },
  });

  const DIR_LIST = ["up", "right", "down", "left"];

  /* ------------------------------------------------------------------ */
  /*  Level data                                                         */
  /* ------------------------------------------------------------------ */

  const MAPS = [
    [
      "................",
      "..###......###..",
      "..###......###..",
      "................",
      "....##....##....",
      "....##....##....",
      "................",
      "..==..####..==..",
      "..==..####..==..",
      "................",
      "..###......###..",
      "..###......###..",
      "................",
      "......####......",
      "......#EE#......",
      "......#EE#......",
    ],
    [
      "................",
      "..###....###....",
      "..###....###....",
      "................",
      "...==..==..==...",
      "...==..==..==...",
      "................",
      "..####....####..",
      "..####....####..",
      "................",
      "....~~....~~....",
      "....~~....~~....",
      "................",
      "......####......",
      "......#EE#......",
      "......#EE#......",
    ],
    [
      "................",
      "..==.##..##.==..",
      "..==.##..##.==..",
      "***..........***",
      "....##~~~~##....",
      "....##~~~~##....",
      "................",
      "..####....####..",
      "..####....####..",
      "................",
      "...==..==..==...",
      "...==..==..==...",
      "....**....**....",
      "......####......",
      "......#EE#......",
      "......#EE#......",
    ],
  ];

  const LEVELS = [
    {
      name: "前哨站",
      code: "OUTPOST",
      map: MAPS[0],
      desc: "敌军侦察编队正在逼近。依托废墟掩体，守住南侧指挥基地。",
      total: 10,
      maxActive: 3,
      spawnEvery: 1.65,
      queue: ["grunt", "grunt", "fast", "grunt", "heavy", "grunt", "fast", "grunt", "heavy", "fast"],
    },
    {
      name: "熔炉",
      code: "FOUNDRY",
      map: MAPS[1],
      desc: "废弃冶炼区的钢墙交错纵横。敌军装甲力量已在此集结，准备强行突破。",
      total: 14,
      maxActive: 4,
      spawnEvery: 1.5,
      queue: ["grunt", "fast", "grunt", "heavy", "elite", "fast", "grunt", "heavy", "grunt", "elite", "fast", "heavy", "grunt", "elite"],
    },
    {
      name: "核心",
      code: "CITADEL",
      map: MAPS[2],
      desc: "最终防线。冷却水渠与合金壁垒构成最后战场，任何一枚炮弹都可能决定战局。",
      total: 18,
      maxActive: 5,
      spawnEvery: 1.35,
      queue: ["grunt", "fast", "elite", "heavy", "fast", "grunt", "elite", "heavy", "grunt", "fast", "elite", "heavy", "grunt", "elite", "fast", "heavy", "grunt", "elite"],
    },
  ];

  const ENEMY_TYPES = {
    grunt: {
      label: "侦察兵",
      hp: 1,
      speed: 44,
      bulletSpeed: 205,
      score: 100,
      fireMin: 1.5,
      fireMax: 2.7,
      color: "#ff9b54",
      accent: "#ffd7a3",
    },
    fast: {
      label: "突击者",
      hp: 1,
      speed: 72,
      bulletSpeed: 225,
      score: 160,
      fireMin: 1.7,
      fireMax: 3.0,
      color: "#f2dc63",
      accent: "#fff6b4",
    },
    heavy: {
      label: "重装者",
      hp: 3,
      speed: 32,
      bulletSpeed: 245,
      score: 300,
      fireMin: 1.6,
      fireMax: 2.8,
      color: "#ff5b6d",
      accent: "#ffc1c1",
    },
    elite: {
      label: "猎杀者",
      hp: 2,
      speed: 54,
      bulletSpeed: 265,
      score: 240,
      fireMin: 1.25,
      fireMax: 2.2,
      color: "#b58bff",
      accent: "#e3d3ff",
    },
  };

  const PLAYER_PALETTE = {
    track: "#12343b",
    trackLight: "#286873",
    hull: "#56dce8",
    hullDark: "#1b7580",
    highlight: "#c8fbff",
    accent: "#ffe3a4",
  };

  const ENEMY_PALETTES = {
    grunt: { track: "#3d2618", trackLight: "#80502c", hull: "#e4803f", hullDark: "#873f1b", highlight: "#ffc888", accent: "#ffe4c3" },
    fast: { track: "#3a3417", trackLight: "#7e732b", hull: "#d9c64f", hullDark: "#7c6d1f", highlight: "#fff2a0", accent: "#fffad3" },
    heavy: { track: "#3a1a20", trackLight: "#7f3542", hull: "#e34f62", hullDark: "#7f2433", highlight: "#ffb0ba", accent: "#ffd9dd" },
    elite: { track: "#271d3c", trackLight: "#5f4a8c", hull: "#a985e8", hullDark: "#57407f", highlight: "#e7d8ff", accent: "#f4eaff" },
  };

  const POWERUP_INFO = {
    shield: { title: "能量护盾", detail: "装甲短时间无敌", icon: "◆", tone: "cyan" },
    rapid: { title: "速射模块", detail: "射速大幅提升", icon: "⚡", tone: "amber" },
    life: { title: "备用装甲", detail: "增加一次出击机会", icon: "+", tone: "green" },
    freeze: { title: "低温脉冲", detail: "冻结全场敌军", icon: "❄", tone: "cyan" },
  };

  /* ------------------------------------------------------------------ */
  /*  DOM                                                                */
  /* ------------------------------------------------------------------ */

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayCard = document.getElementById("overlayCard");
  const overlayEyebrow = document.getElementById("overlayEyebrow");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayDesc = document.getElementById("overlayDesc");
  const overlayStats = document.getElementById("overlayStats");
  const overlayBtn = document.getElementById("overlayBtn");
  const overlayBtnText = document.getElementById("overlayBtnText");
  const overlayHint = document.getElementById("overlayHint");
  const levelLabel = document.getElementById("levelLabel");
  const scoreLabel = document.getElementById("scoreLabel");
  const livesLabel = document.getElementById("livesLabel");
  const enemiesLabel = document.getElementById("enemiesLabel");
  const progressBar = document.getElementById("progressBar");
  const missionCode = document.getElementById("missionCode");
  const missionName = document.getElementById("missionName");
  const missionDesc = document.getElementById("missionDesc");
  const missionTrack = document.getElementById("missionTrack");
  const missionProgress = document.getElementById("missionProgress");
  const highScoreLabel = document.getElementById("highScoreLabel");
  const pauseBtn = document.getElementById("pauseBtn");
  const soundBtn = document.getElementById("soundBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toastIcon");
  const toastTitle = document.getElementById("toastTitle");
  const toastDetail = document.getElementById("toastDetail");
  const fireBtn = document.getElementById("fireBtn");
  const touchButtons = Array.from(document.querySelectorAll("[data-dir]"));

  /* ------------------------------------------------------------------ */
  /*  Tiny helpers                                                       */
  /* ------------------------------------------------------------------ */

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (array) => array[Math.floor(Math.random() * array.length)];
  const padScore = (value) => String(Math.max(0, Math.floor(value))).padStart(6, "0");

  function shuffle(array) {
    const out = array.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function overlap(a, b, inset = 0) {
    return (
      a.x + inset < b.x + b.w - inset &&
      a.x + a.w - inset > b.x + inset &&
      a.y + inset < b.y + b.h - inset &&
      a.y + a.h - inset > b.y + inset
    );
  }

  function pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* storage can be unavailable in private contexts — game still works */
    }
  }

  function readHighScore() {
    const value = Number.parseInt(readStorage(HS_KEY, "0"), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Audio                                                              */
  /* ------------------------------------------------------------------ */

  const sound = {
    context: null,
    master: null,
    noiseBuffer: null,
    enabled: readStorage(MUTE_KEY, "0") !== "1",

    init() {
      if (!this.context) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;
        this.context = new AudioCtx();
        this.master = this.context.createGain();
        this.master.gain.value = this.enabled ? 0.2 : 0;
        this.master.connect(this.context.destination);

        const length = Math.floor(this.context.sampleRate * 0.7);
        this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
      }
      if (this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
      return true;
    },

    setEnabled(enabled) {
      this.enabled = enabled;
      writeStorage(MUTE_KEY, enabled ? "0" : "1");
      if (this.master) {
        this.master.gain.setTargetAtTime(enabled ? 0.2 : 0, this.context.currentTime, 0.02);
      }
    },

    tone(freq, duration, type = "square", volume = 0.14, slide = 1, delay = 0) {
      if (!this.enabled || !this.init() || !this.context) return;
      const now = this.context.currentTime + delay;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(30, freq), now);
      if (slide !== 1) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },

    noise(duration = 0.25, volume = 0.3, frequency = 900) {
      if (!this.enabled || !this.init() || !this.context || !this.noiseBuffer) return;
      const now = this.context.currentTime;
      const src = this.context.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(frequency, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + duration);
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(now);
      src.stop(now + duration);
    },

    shoot(isPlayer) {
      this.tone(isPlayer ? 420 : 260, 0.055, "square", isPlayer ? 0.1 : 0.06, 0.48);
      this.tone(isPlayer ? 940 : 620, 0.025, "sawtooth", 0.035, 0.7);
    },

    impact() {
      this.tone(120, 0.06, "square", 0.06, 0.65);
    },

    brick() {
      this.noise(0.12, 0.11, 1100);
      this.tone(96, 0.08, "triangle", 0.04, 0.7);
    },

    explosion(big = false) {
      this.noise(big ? 0.55 : 0.28, big ? 0.34 : 0.18, big ? 700 : 1200);
      this.tone(big ? 72 : 105, big ? 0.45 : 0.2, "triangle", big ? 0.16 : 0.08, 0.5);
    },

    pickup() {
      this.tone(523, 0.08, "sine", 0.1, 1.12, 0);
      this.tone(659, 0.08, "sine", 0.1, 1.12, 0.07);
      this.tone(880, 0.12, "sine", 0.1, 1.08, 0.14);
    },

    ready() {
      this.tone(340, 0.09, "square", 0.08, 1, 0);
      this.tone(510, 0.12, "square", 0.08, 1, 0.1);
    },

    levelClear() {
      [392, 523, 659, 784].forEach((freq, i) => {
        this.tone(freq, 0.16, "triangle", 0.09, 1, i * 0.11);
      });
    },

    gameOver() {
      [300, 240, 180, 120].forEach((freq, i) => {
        this.tone(freq, 0.2, "triangle", 0.09, 0.86, i * 0.14);
      });
    },

    click() {
      this.tone(640, 0.035, "square", 0.05, 0.85);
    },
  };

  /* ------------------------------------------------------------------ */
  /*  State                                                              */
  /* ------------------------------------------------------------------ */

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    mode: "menu",
    time: 0,
    levelIndex: 0,
    grid: [],
    base: { alive: true, flash: 0, destroyedAt: 0 },
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    powerups: [],
    decals: [],
    score: 0,
    lives: 3,
    killsTotal: 0,
    total: 10,
    killed: 0,
    spawned: 0,
    spawnTimer: 0,
    rapidTimer: 0,
    freezeTimer: 0,
    respawnTimer: 0,
    shake: 0,
    countdown: 0,
    endTimer: 0,
    endReason: "",
    fireHeld: false,
    virtualDir: null,
    lastPlayerDir: "up",
    highScore: readHighScore(),
  };

  const pressedCodes = new Set();
  const directionOrder = [];
  let accumulator = 0;
  let lastFrame = 0;
  let overlayAction = null;
  let toastTimer = 0;
  let entityId = 1;

  const KEY_DIRECTIONS = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowRight: "right",
    KeyD: "right",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
  };

  const FIRE_KEYS = new Set(["Space", "KeyJ", "KeyK"]);
  const PAUSE_KEYS = new Set(["KeyP", "Escape"]);

  /* ------------------------------------------------------------------ */
  /*  Setup and level flow                                               */
  /* ------------------------------------------------------------------ */

  function parseMap(rows) {
    const chars = {
      ".": T.EMPTY,
      "#": T.BRICK,
      "=": T.STEEL,
      "~": T.WATER,
      "*": T.TREE,
      E: T.BASE,
    };
    const grid = rows.map((row) => Array.from(row, (char) => (chars[char] !== undefined ? chars[char] : T.EMPTY)));
    if (grid.length !== ROWS || grid.some((row) => row.length !== COLS)) {
      console.warn("Steel Vanguard: map dimensions are not 16×16.");
    }
    return grid;
  }

  function createPlayer(shield = 2.4) {
    return {
      id: "player",
      isPlayer: true,
      x: PLAYER_SPAWN.x - HALF_TANK,
      y: PLAYER_SPAWN.y - HALF_TANK,
      w: TANK_SIZE,
      h: TANK_SIZE,
      dir: "up",
      speed: 88,
      cooldown: 0,
      shieldTimer: shield,
      spawnTimer: 0,
      flashTimer: 0,
      hp: 1,
      maxHp: 1,
      tread: 0,
      moving: false,
      alive: true,
    };
  }

  function buildLevel(index) {
    const cfg = LEVELS[index];
    state.levelIndex = index;
    state.grid = parseMap(cfg.map);
    state.base = { alive: true, flash: 0, destroyedAt: 0 };
    state.player = createPlayer(2.4);
    state.enemies = [];
    state.bullets = [];
    state.particles = [];
    state.powerups = [];
    state.decals = [];
    state.total = cfg.total;
    state.killed = 0;
    state.spawned = 0;
    state.spawnTimer = 0.9;
    state.rapidTimer = 0;
    state.freezeTimer = 0;
    state.respawnTimer = 0;
    state.shake = 0;
    state.countdown = 1.85;
    state.endTimer = 0;
    state.endReason = "";
    state.fireHeld = false;
    state.virtualDir = null;
    state.lastPlayerDir = "up";
    updateMissionUI();
    updateHUD();
    hideToast();
  }

  function startCampaign() {
    sound.init();
    sound.click();
    clearHeldInput();
    state.score = 0;
    state.lives = 3;
    state.killsTotal = 0;
    buildLevel(0);
    state.mode = "countdown";
    hideOverlay();
    updateHUD();
  }

  function loadLevel(index) {
    clearHeldInput();
    buildLevel(index);
    state.mode = "countdown";
    hideOverlay();
    updateHUD();
    sound.ready();
  }

  function initMenu() {
    buildLevel(0);
    state.score = 0;
    state.lives = 3;
    state.killsTotal = 0;
    state.player = createPlayer(0);
    state.mode = "menu";
    updateHUD();
    showMenuOverlay();
  }

  function showMenuOverlay() {
    showOverlay({
      eyebrow: "ARCADE PROTOCOL // 1985",
      title: "坦克大战",
      desc: "守住南方基地，击退一波又一波钢铁洪流。三个战区，只有一条防线。",
      stats: [
        { label: "战区", value: "03", className: "cyan" },
        { label: "个人最佳", value: padScore(state.highScore), className: "amber" },
        { label: "档案", value: "LOCAL" },
      ],
      button: "开始战斗",
      hint: "方向键 / WASD 移动 · 空格 开火 · P 暂停",
      action: startCampaign,
    });
  }

  function showLevelClear() {
    const cfg = LEVELS[state.levelIndex];
    const next = LEVELS[state.levelIndex + 1];
    showOverlay({
      eyebrow: `SECTOR CLEAR // ${cfg.code}`,
      title: "战区肃清",
      desc: `${cfg.name}的敌军已被全部击毁。装甲单位仍在线，继续向${next.name}推进。`,
      stats: [
        { label: "累计积分", value: padScore(state.score), className: "amber" },
        { label: "击毁敌军", value: String(state.killed), className: "cyan" },
        { label: "装甲单元", value: `×${state.lives}` },
      ],
      button: "进入下一战区",
      hint: "按 ENTER 继续",
      action: () => loadLevel(state.levelIndex + 1),
    });
  }

  function showVictory() {
    showOverlay({
      eyebrow: "CAMPAIGN COMPLETE // ALL CLEAR",
      title: "全境解放",
      desc: "最后一道防线守住了。钢铁洪流停止推进，你的呼号将被写入街机厅的历史。",
      stats: [
        { label: "最终积分", value: padScore(state.score), className: "amber" },
        { label: "总击毁", value: String(state.killsTotal), className: "cyan" },
        { label: "个人最佳", value: padScore(state.highScore) },
      ],
      button: "再战一次",
      hint: "按 ENTER 重新部署",
      action: startCampaign,
    });
  }

  function showGameOver(reason) {
    state.mode = "gameover";
    updateHUD();
    const baseLost = reason === "base";
    showOverlay({
      eyebrow: baseLost ? "MISSION FAILED // SIGNAL LOST" : "MISSION FAILED // UNIT LOST",
      title: baseLost ? "基地失守" : "全军覆没",
      desc: baseLost
        ? "指挥基地被炮弹摧毁。防线崩溃，剩余敌军正在向城区推进。"
        : "最后一台装甲单元已被击毁。防线无人驻守，反击行动宣告失败。",
      stats: [
        { label: "抵达战区", value: String(state.levelIndex + 1).padStart(2, "0") },
        { label: "作战积分", value: padScore(state.score), className: "amber" },
        { label: "个人最佳", value: padScore(state.highScore), className: "cyan" },
      ],
      button: "重新部署",
      hint: "按 ENTER 重新开始",
      action: startCampaign,
    });
    sound.gameOver();
  }

  function showPause() {
    showOverlay({
      eyebrow: "TACTICAL HOLD // STANDBY",
      title: "战术暂停",
      desc: "战场时间已冻结。检查路线，调整呼吸，然后继续推进。",
      stats: [
        { label: "战区", value: String(state.levelIndex + 1).padStart(2, "0") },
        { label: "积分", value: padScore(state.score), className: "amber" },
        { label: "剩余敌军", value: String(Math.max(0, state.total - state.killed)), className: "cyan" },
      ],
      button: "继续战斗",
      hint: "按 P 或 ESC 继续",
      action: resumeGame,
    });
  }

  function showOverlay(config) {
    overlayEyebrow.textContent = config.eyebrow;
    overlayTitle.textContent = config.title;
    overlayDesc.textContent = config.desc;
    overlayStats.replaceChildren();
    config.stats.forEach((stat) => {
      const cell = document.createElement("div");
      cell.className = "overlay-stat";
      const label = document.createElement("small");
      label.textContent = stat.label;
      const value = document.createElement("strong");
      value.textContent = stat.value;
      if (stat.className) value.classList.add(stat.className);
      cell.append(label, value);
      overlayStats.append(cell);
    });
    overlayBtnText.textContent = config.button;
    overlayHint.textContent = config.hint || "";
    overlayAction = config.action;
    overlay.classList.remove("is-hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlayCard.style.animation = "none";
    void overlayCard.offsetWidth;
    overlayCard.style.animation = "";
    window.setTimeout(() => {
      if (!overlay.classList.contains("is-hidden")) {
        overlayBtn.focus({ preventScroll: true });
      }
    }, 30);
  }

  function hideOverlay() {
    overlay.classList.add("is-hidden");
    overlay.setAttribute("aria-hidden", "true");
    overlayBtn.blur();
    overlayAction = null;
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "paused";
    clearHeldInput();
    pauseBtn.setAttribute("aria-label", "继续游戏");
    pauseBtn.title = "继续 (P)";
    showPause();
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    hideOverlay();
    state.mode = "playing";
    pauseBtn.setAttribute("aria-label", "暂停游戏");
    pauseBtn.title = "暂停 (P)";
    accumulator = 0;
  }

  function triggerEnd(reason) {
    if (state.mode === "ending" || state.mode === "gameover") return;
    state.mode = "ending";
    state.endReason = reason;
    state.endTimer = reason === "base" ? 2.15 : 1.55;
    state.fireHeld = false;
    state.virtualDir = null;
    registerHighScore();
    updateHUD();
  }

  function checkLevelClear() {
    if (state.mode !== "playing") return;
    const cfg = LEVELS[state.levelIndex];
    if (state.killed >= cfg.total && state.enemies.length === 0 && state.base.alive) {
      state.fireHeld = false;
      state.virtualDir = null;
      state.bullets = [];
      registerHighScore();
      if (state.levelIndex === LEVELS.length - 1) {
        state.mode = "victory";
        updateHUD();
        sound.levelClear();
        showVictory();
      } else {
        state.mode = "levelclear";
        updateHUD();
        sound.levelClear();
        showLevelClear();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  HUD                                                                */
  /* ------------------------------------------------------------------ */

  function updateMissionUI() {
    const cfg = LEVELS[state.levelIndex];
    missionCode.textContent = `OP. ${String(state.levelIndex + 1).padStart(2, "0")} / ${cfg.code}`;
    missionName.textContent = cfg.name;
    missionDesc.textContent = cfg.desc;
  }

  function updateHUD() {
    const cfg = LEVELS[state.levelIndex];
    const remaining = Math.max(0, state.total - state.killed);
    const ratio = state.total > 0 ? clamp(state.killed / state.total, 0, 1) : 0;
    const percent = Math.round(ratio * 100);

    levelLabel.textContent = String(state.levelIndex + 1).padStart(2, "0");
    scoreLabel.textContent = padScore(state.score);
    livesLabel.textContent = `×${Math.max(0, state.lives)}`;
    enemiesLabel.textContent = String(remaining).padStart(2, "0");
    progressBar.style.width = `${percent}%`;
    missionTrack.style.width = `${percent}%`;
    missionProgress.textContent = `${percent}%`;
    highScoreLabel.textContent = padScore(state.highScore);
    missionName.textContent = cfg.name;

    const playable = state.mode === "playing" || state.mode === "paused";
    pauseBtn.disabled = !playable;
  }

  function registerHighScore() {
    if (state.score > state.highScore) {
      state.highScore = state.score;
      writeStorage(HS_KEY, state.highScore);
      highScoreLabel.textContent = padScore(state.highScore);
    }
  }

  function addScore(amount, x, y) {
    state.score += amount;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      writeStorage(HS_KEY, state.highScore);
    }
    if (x !== undefined && y !== undefined) {
      addFloatText(x, y, `+${amount}`, "#ffe2a1");
    }
    updateHUD();
  }

  let toastSequence = 0;
  function showToast(type, titleOverride, detailOverride) {
    const info = POWERUP_INFO[type];
    if (!info) return;
    toastSequence += 1;
    const seq = toastSequence;
    toast.dataset.tone = info.tone;
    toastIcon.textContent = info.icon;
    toastTitle.textContent = titleOverride || info.title;
    toastDetail.textContent = detailOverride || info.detail;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      if (seq === toastSequence) toast.classList.remove("is-visible");
    }, 1900);
  }

  function hideToast() {
    toastSequence += 1;
    window.clearTimeout(toastTimer);
    toast.classList.remove("is-visible");
  }

  /* ------------------------------------------------------------------ */
  /*  Input                                                              */
  /* ------------------------------------------------------------------ */

  function clearHeldInput() {
    pressedCodes.clear();
    directionOrder.length = 0;
    state.fireHeld = false;
    state.virtualDir = null;
    touchButtons.forEach((button) => button.classList.remove("is-pressed"));
    fireBtn.classList.remove("is-pressed");
  }

  function currentDirection() {
    if (state.virtualDir) return state.virtualDir;
    for (let i = directionOrder.length - 1; i >= 0; i -= 1) {
      const code = directionOrder[i];
      const dir = KEY_DIRECTIONS[code];
      if (dir && pressedCodes.has(code)) return dir;
    }
    return null;
  }

  function beginDirection(code) {
    if (!KEY_DIRECTIONS[code] || pressedCodes.has(code)) return;
    pressedCodes.add(code);
    directionOrder.push(code);
  }

  function endDirection(code) {
    pressedCodes.delete(code);
    const index = directionOrder.indexOf(code);
    if (index >= 0) directionOrder.splice(index, 1);
  }

  window.addEventListener("keydown", (event) => {
    const dir = KEY_DIRECTIONS[event.code];
    if (dir) {
      event.preventDefault();
      sound.init();
      beginDirection(event.code);
      return;
    }

    if (FIRE_KEYS.has(event.code)) {
      event.preventDefault();
      sound.init();
      if (!state.fireHeld) {
        state.fireHeld = true;
        if (state.mode === "playing" && state.player) tryFire(state.player);
      }
      return;
    }

    if (PAUSE_KEYS.has(event.code)) {
      event.preventDefault();
      if (state.mode === "playing") pauseGame();
      else if (state.mode === "paused") resumeGame();
      return;
    }

    if (event.code === "Enter" && overlayAction) {
      event.preventDefault();
      overlayBtn.click();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (KEY_DIRECTIONS[event.code]) {
      event.preventDefault();
      endDirection(event.code);
    } else if (FIRE_KEYS.has(event.code)) {
      event.preventDefault();
      state.fireHeld = false;
    }
  });

  window.addEventListener("blur", () => {
    clearHeldInput();
    if (state.mode === "playing") pauseGame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearHeldInput();
      if (state.mode === "playing") pauseGame();
    }
  });

  touchButtons.forEach((button) => {
    const dir = button.dataset.dir;
    const press = (event) => {
      event.preventDefault();
      sound.init();
      state.virtualDir = dir;
      touchButtons.forEach((item) => item.classList.toggle("is-pressed", item === button));
      if (button.setPointerCapture && event.pointerId !== undefined) {
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
    };
    const release = (event) => {
      if (event) event.preventDefault();
      if (state.virtualDir === dir) state.virtualDir = null;
      button.classList.remove("is-pressed");
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  const pressFire = (event) => {
    if (event) event.preventDefault();
    sound.init();
    state.fireHeld = true;
    fireBtn.classList.add("is-pressed");
    if (state.mode === "playing" && state.player) tryFire(state.player);
    if (fireBtn.setPointerCapture && event && event.pointerId !== undefined) {
      try {
        fireBtn.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };
  const releaseFire = (event) => {
    if (event) event.preventDefault();
    state.fireHeld = false;
    fireBtn.classList.remove("is-pressed");
  };
  fireBtn.addEventListener("pointerdown", pressFire);
  fireBtn.addEventListener("pointerup", releaseFire);
  fireBtn.addEventListener("pointercancel", releaseFire);
  fireBtn.addEventListener("lostpointercapture", releaseFire);

  /* ------------------------------------------------------------------ */
  /*  Collision helpers                                                  */
  /* ------------------------------------------------------------------ */

  const TANK_BLOCKERS = new Set([T.BRICK, T.STEEL, T.WATER, T.BASE]);

  function tankBlocked(tank, x, y) {
    if (x < 0 || y < 0 || x + TANK_SIZE > W || y + TANK_SIZE > H) return true;

    const c0 = clamp(Math.floor((x + 1) / TILE), 0, COLS - 1);
    const c1 = clamp(Math.floor((x + TANK_SIZE - 2) / TILE), 0, COLS - 1);
    const r0 = clamp(Math.floor((y + 1) / TILE), 0, ROWS - 1);
    const r1 = clamp(Math.floor((y + TANK_SIZE - 2) / TILE), 0, ROWS - 1);

    for (let row = r0; row <= r1; row += 1) {
      for (let col = c0; col <= c1; col += 1) {
        if (TANK_BLOCKERS.has(state.grid[row][col])) return true;
      }
    }

    const candidate = { x, y, w: TANK_SIZE, h: TANK_SIZE };
    if (state.player && state.player !== tank && overlap(candidate, state.player, 1.5)) return true;
    for (const enemy of state.enemies) {
      if (enemy !== tank && overlap(candidate, enemy, 1.5)) return true;
    }
    return false;
  }

  function moveTank(tank, dx, dy) {
    let moved = false;
    if (dx !== 0) {
      const nx = tank.x + dx;
      if (!tankBlocked(tank, nx, tank.y)) {
        tank.x = nx;
        moved = true;
      }
    }
    if (dy !== 0) {
      const ny = tank.y + dy;
      if (!tankBlocked(tank, tank.x, ny)) {
        tank.y = ny;
        moved = true;
      }
    }
    if (moved) {
      tank.tread = (tank.tread || 0) + Math.abs(dx) + Math.abs(dy);
    }
    return moved;
  }

  function canStep(tank, dir, distance = 4) {
    const vector = DIRS[dir];
    return !tankBlocked(tank, tank.x + vector.x * distance, tank.y + vector.y * distance);
  }

  function countBullets(ownerId) {
    let total = 0;
    for (const bullet of state.bullets) {
      if (bullet.ownerId === ownerId) total += 1;
    }
    return total;
  }

  /* ------------------------------------------------------------------ */
  /*  Firing                                                             */
  /* ------------------------------------------------------------------ */

  function tryFire(tank) {
    if (state.mode !== "playing" || !tank) return false;
    if (tank.cooldown > 0) return false;

    const isPlayer = Boolean(tank.isPlayer);
    const limit = isPlayer ? (state.rapidTimer > 0 ? 4 : 3) : tank.maxBullets || 1;
    if (countBullets(tank.id) >= limit) return false;

    const dir = DIRS[tank.dir];
    const cx = tank.x + HALF_TANK + dir.x * 18;
    const cy = tank.y + HALF_TANK + dir.y * 18;
    const speed = isPlayer ? 345 : tank.bulletSpeed;

    state.bullets.push({
      x: cx,
      y: cy,
      vx: dir.x * speed,
      vy: dir.y * speed,
      w: 6,
      h: 6,
      ownerId: tank.id,
      fromPlayer: isPlayer,
      color: isPlayer ? "#7df5ff" : tank.type === "elite" ? "#c7a8ff" : "#ffc06d",
      dead: false,
    });

    tank.cooldown = isPlayer ? (state.rapidTimer > 0 ? 0.15 : 0.36) : rand(ENEMY_TYPES[tank.type].fireMin, ENEMY_TYPES[tank.type].fireMax);
    addMuzzle(cx, cy, dir, isPlayer ? "#7df5ff" : "#ffc06d");
    sound.shoot(isPlayer);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Update: player                                                     */
  /* ------------------------------------------------------------------ */

  function updatePlayer(dt) {
    if (!state.player) {
      if (state.respawnTimer > 0 && state.lives > 0 && state.base.alive) {
        state.respawnTimer -= dt;
        if (state.respawnTimer <= 0) spawnPlayer();
      }
      return;
    }

    const player = state.player;
    player.shieldTimer = Math.max(0, player.shieldTimer - dt);
    player.flashTimer = Math.max(0, player.flashTimer - dt);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.moving = false;

    const dir = currentDirection();
    if (dir) {
      state.lastPlayerDir = dir;
      player.dir = dir;
      const vector = DIRS[dir];
      player.moving = moveTank(player, vector.x * player.speed * dt, vector.y * player.speed * dt);
    }

    if (state.fireHeld) tryFire(player);
  }

  function spawnPlayer() {
    const player = createPlayer(2.8);
    state.player = player;
    state.respawnTimer = 0;

    for (const enemy of state.enemies.slice()) {
      if (overlap(player, enemy, 2)) {
        killEnemy(enemy, { byPlayer: false, score: false, drop: false, silent: true });
      }
    }

    addRing(player.x + HALF_TANK, player.y + HALF_TANK, 4, 26, "#7df5ff", 0.45);
    addFloatText(player.x + HALF_TANK, player.y - 4, "重新部署", "#a8f6ff");
  }

  function playerHit() {
    const player = state.player;
    if (!player) return;
    if (player.shieldTimer > 0) {
      addRing(player.x + HALF_TANK, player.y + HALF_TANK, 6, 20, "#7df5ff", 0.3);
      sound.impact();
      return;
    }

    addExplosion(player.x + HALF_TANK, player.y + HALF_TANK, 1.75, "#7df5ff");
    sound.explosion(true);
    state.player = null;
    state.lives = Math.max(0, state.lives - 1);
    state.rapidTimer = 0;
    state.fireHeld = false;
    updateHUD();

    if (state.lives > 0) {
      state.respawnTimer = 1.7;
    } else {
      triggerEnd("lives");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Update: enemies                                                    */
  /* ------------------------------------------------------------------ */

  function spawnEnemy(spawnIndex) {
    const cfg = LEVELS[state.levelIndex];
    if (state.spawned >= cfg.total) return false;
    const spawn = ENEMY_SPAWNS[spawnIndex];
    if (!spawn) return false;

    const typeName = cfg.queue[state.spawned % cfg.queue.length];
    const def = ENEMY_TYPES[typeName];
    const levelScale = 1 + state.levelIndex * 0.045;

    const enemy = {
      id: `enemy-${entityId++}`,
      isPlayer: false,
      type: typeName,
      x: spawn.x - HALF_TANK,
      y: spawn.y - HALF_TANK,
      w: TANK_SIZE,
      h: TANK_SIZE,
      dir: "down",
      speed: def.speed * levelScale,
      bulletSpeed: def.bulletSpeed * (1 + state.levelIndex * 0.035),
      cooldown: rand(0.75, 1.5),
      shieldTimer: 0.85,
      spawnTimer: 0.75,
      flashTimer: 0,
      hp: def.hp,
      maxHp: def.hp,
      maxBullets: typeName === "elite" ? 2 : 1,
      tread: 0,
      moving: false,
      alive: true,
      ai: {
        turnTimer: rand(0.2, 0.8),
        blocked: 0,
        target: Math.random() < 0.55 ? "base" : "player",
      },
    };

    if (tankBlocked(enemy, enemy.x, enemy.y)) return false;

    state.enemies.push(enemy);
    state.spawned += 1;
    addRing(spawn.x, spawn.y, 2, 22, "#ffb45c", 0.5);
    return true;
  }

  function updateSpawner(dt) {
    if (state.spawned >= state.total) return;
    if (state.enemies.length >= LEVELS[state.levelIndex].maxActive) {
      state.spawnTimer = Math.max(state.spawnTimer, 0.25);
      return;
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer > 0) return;

    const available = [];
    for (let i = 0; i < ENEMY_SPAWNS.length; i += 1) {
      const spawn = ENEMY_SPAWNS[i];
      const probe = {
        x: spawn.x - HALF_TANK,
        y: spawn.y - HALF_TANK,
        w: TANK_SIZE,
        h: TANK_SIZE,
      };
      if (!tankBlocked(probe, probe.x, probe.y)) available.push(i);
    }

    if (available.length === 0) {
      state.spawnTimer = 0.35;
      return;
    }

    const spawned = spawnEnemy(pick(available));
    if (spawned) {
      state.spawnTimer = LEVELS[state.levelIndex].spawnEvery * rand(0.82, 1.16);
    } else {
      state.spawnTimer = 0.35;
    }
  }

  function aiTarget(enemy) {
    if (enemy.ai.target === "player" && state.player) {
      return { x: state.player.x + HALF_TANK, y: state.player.y + HALF_TANK };
    }
    return BASE_CENTER;
  }

  function aimDirection(enemy, target) {
    const cx = enemy.x + HALF_TANK;
    const cy = enemy.y + HALF_TANK;
    const dx = target.x - cx;
    const dy = target.y - cy;
    if (Math.abs(dx) < 15) return dy > 0 ? "down" : "up";
    if (Math.abs(dy) < 15) return dx > 0 ? "right" : "left";
    return null;
  }

  function chooseEnemyDirection(enemy) {
    enemy.ai.turnTimer = rand(0.45, 1.35);
    if (Math.random() < 0.2) {
      enemy.ai.target = Math.random() < 0.66 ? "base" : "player";
    }

    const target = aiTarget(enemy);
    const cx = enemy.x + HALF_TANK;
    const cy = enemy.y + HALF_TANK;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const preferred = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");

    const candidates = [];
    if (Math.random() < 0.8) candidates.push(preferred);
    for (const dir of shuffle(DIR_LIST)) {
      if (!candidates.includes(dir)) candidates.push(dir);
    }

    for (const dir of candidates) {
      if (canStep(enemy, dir, 5)) {
        enemy.dir = dir;
        return;
      }
    }
    enemy.dir = pick(DIR_LIST);
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
      enemy.shieldTimer = Math.max(0, enemy.shieldTimer - dt);

      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer = Math.max(0, enemy.spawnTimer - dt);
        continue;
      }

      if (state.freezeTimer > 0) {
        enemy.moving = false;
        continue;
      }

      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.ai.turnTimer -= dt;

      const target = aiTarget(enemy);
      const aim = aimDirection(enemy, target);
      if (aim) {
        enemy.dir = aim;
        enemy.ai.turnTimer = Math.max(enemy.ai.turnTimer, 0.2);
      } else if (enemy.ai.turnTimer <= 0) {
        chooseEnemyDirection(enemy);
      }

      const vector = DIRS[enemy.dir];
      const moved = moveTank(enemy, vector.x * enemy.speed * dt, vector.y * enemy.speed * dt);
      enemy.moving = moved;

      if (!moved) {
        enemy.ai.blocked += dt;
        if (enemy.ai.blocked > 0.18) {
          chooseEnemyDirection(enemy);
          enemy.ai.blocked = 0;
        }
      } else {
        enemy.ai.blocked = 0;
      }

      if (enemy.cooldown <= 0) {
        const wantsToFire = aim !== null || Math.random() < 0.44;
        if (wantsToFire) tryFire(enemy);
        if (enemy.cooldown <= 0) {
          enemy.cooldown = rand(ENEMY_TYPES[enemy.type].fireMin, ENEMY_TYPES[enemy.type].fireMax);
        }
      }
    }
  }

  function killEnemy(enemy, options = {}) {
    const {
      byPlayer = true,
      score = true,
      drop = true,
      silent = false,
    } = options;

    const index = state.enemies.indexOf(enemy);
    if (index < 0) return;
    state.enemies.splice(index, 1);

    const cx = enemy.x + HALF_TANK;
    const cy = enemy.y + HALF_TANK;
    addExplosion(cx, cy, enemy.type === "heavy" ? 1.7 : 1.25, enemy.isPlayer ? "#7df5ff" : ENEMY_TYPES[enemy.type].color);
    if (!silent) sound.explosion(enemy.type === "heavy");

    state.killed += 1;
    state.killsTotal += 1;
    const scoreValue = ENEMY_TYPES[enemy.type].score;
    if (byPlayer && score) addScore(scoreValue, cx, cy - 4);

    if (drop && !silent && Math.random() < 0.23 && state.powerups.length < 2) {
      spawnPowerup(cx, cy);
    }

    updateHUD();
  }

  /* ------------------------------------------------------------------ */
  /*  Update: bullets                                                    */
  /* ------------------------------------------------------------------ */

  function bulletOverlapsTile(bullet, row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    const type = state.grid[row][col];
    if (type === T.EMPTY || type === T.WATER || type === T.TREE) return false;
    return true;
  }

  function destroyBrick(col, row) {
    if (state.grid[row][col] !== T.BRICK) return;
    state.grid[row][col] = T.EMPTY;
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    addBrickDebris(cx, cy);
    state.decals.push({
      x: cx + rand(-5, 5),
      y: cy + rand(-5, 5),
      r: rand(9, 16),
      alpha: rand(0.22, 0.35),
    });
    if (state.decals.length > 42) state.decals.shift();
  }

  function destroyBase() {
    if (!state.base.alive) return;
    state.base.alive = false;
    state.base.flash = 1;
    state.base.destroyedAt = state.time;
    for (let row = BASE_ROW; row < BASE_ROW + 2; row += 1) {
      for (let col = BASE_COL; col < BASE_COL + 2; col += 1) {
        state.grid[row][col] = T.EMPTY;
      }
    }
    addExplosion(BASE_CENTER.x, BASE_CENTER.y, 2.8, "#ffb45c");
    addExplosion(BASE_CENTER.x - 12, BASE_CENTER.y - 6, 1.5, "#ff6b55");
    state.decals.push({ x: BASE_CENTER.x, y: BASE_CENTER.y, r: 42, alpha: 0.55 });
    sound.explosion(true);
    triggerEnd("base");
  }

  function bulletHitTerrain(bullet) {
    const points = [
      [bullet.x, bullet.y],
      [bullet.x - 3, bullet.y - 3],
      [bullet.x + 3, bullet.y - 3],
      [bullet.x - 3, bullet.y + 3],
      [bullet.x + 3, bullet.y + 3],
    ];

    let hit = false;
    let hitRow = -1;
    let hitCol = -1;
    let hitType = T.EMPTY;

    for (const [px, py] of points) {
      const col = Math.floor(px / TILE);
      const row = Math.floor(py / TILE);
      if (!bulletOverlapsTile(bullet, row, col)) continue;
      const type = state.grid[row][col];
      if (!hit || (bullet.fromPlayer && type === T.BRICK)) {
        hit = true;
        hitRow = row;
        hitCol = col;
        hitType = type;
        if (type === T.BRICK) break;
      }
    }

    if (!hit) return false;

    if (hitType === T.BRICK) {
      destroyBrick(hitCol, hitRow);
      addImpact(bullet.x, bullet.y, "#ffb168");
      sound.brick();
    } else if (hitType === T.STEEL) {
      addImpact(bullet.x, bullet.y, "#a8c9d6");
      sound.impact();
    } else if (hitType === T.BASE) {
      if (!bullet.fromPlayer) {
        destroyBase();
      } else {
        addImpact(bullet.x, bullet.y, "#ffd07f");
        sound.impact();
      }
    }

    return true;
  }

  function updateBullets(dt) {
    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = state.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.x < -8 || bullet.x > W + 8 || bullet.y < -8 || bullet.y > H + 8) {
        state.bullets.splice(i, 1);
        continue;
      }

      if (bulletHitTerrain(bullet)) {
        state.bullets.splice(i, 1);
        continue;
      }

      if (bullet.fromPlayer) {
        let struck = false;
        for (const enemy of state.enemies.slice()) {
          if (overlap(bullet, enemy, 0)) {
            state.bullets.splice(i, 1);
            if (enemy.shieldTimer > 0 || enemy.spawnTimer > 0) {
              addRing(enemy.x + HALF_TANK, enemy.y + HALF_TANK, 8, 16, "#ffc06d", 0.22);
              sound.impact();
            } else {
              enemy.hp -= 1;
              enemy.flashTimer = 0.12;
              if (enemy.hp <= 0) {
                killEnemy(enemy, { byPlayer: true, score: true, drop: true });
              } else {
                addImpact(bullet.x, bullet.y, "#ffd5a1");
                sound.impact();
                addFloatText(enemy.x + HALF_TANK, enemy.y - 2, `${enemy.hp}/${enemy.maxHp}`, "#ffd5a1");
              }
            }
            struck = true;
            break;
          }
        }
        if (struck) continue;
      } else if (state.player) {
        if (overlap(bullet, state.player, 0)) {
          state.bullets.splice(i, 1);
          if (state.player.shieldTimer > 0) {
            addImpact(bullet.x, bullet.y, "#7df5ff");
            sound.impact();
          } else {
            playerHit();
          }
          continue;
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Update: powerups                                                   */
  /* ------------------------------------------------------------------ */

  function spawnPowerup(cx, cy) {
    const col = clamp(Math.floor(cx / TILE), 0, COLS - 1);
    const row = clamp(Math.floor(cy / TILE), 0, ROWS - 1);
    if (TANK_BLOCKERS.has(state.grid[row][col])) return;

    const kinds = ["shield", "rapid", "life", "freeze"];
    state.powerups.push({
      x: cx,
      y: cy,
      kind: pick(kinds),
      life: 12,
      maxLife: 12,
      phase: Math.random() * TAU,
    });
  }

  function applyPowerup(powerup) {
    const info = POWERUP_INFO[powerup.kind];
    addRing(powerup.x, powerup.y, 6, 30, "#a8f6ff", 0.35);
    addFloatText(powerup.x, powerup.y - 8, info.title, "#d7fbff");
    switch (powerup.kind) {
      case "shield":
        if (state.player) state.player.shieldTimer = Math.max(state.player.shieldTimer, 6.5);
        break;
      case "rapid":
        state.rapidTimer = 10;
        break;
      case "life":
        state.lives += 1;
        break;
      case "freeze":
        state.freezeTimer = 5.5;
        break;
      default:
        break;
    }
    addScore(50, powerup.x, powerup.y);
    updateHUD();
    showToast(powerup.kind);
    sound.pickup();
  }

  function updatePowerups(dt) {
    for (let i = state.powerups.length - 1; i >= 0; i -= 1) {
      const powerup = state.powerups[i];
      powerup.life -= dt;
      if (powerup.life <= 0) {
        state.powerups.splice(i, 1);
        continue;
      }
      if (state.player) {
        const pickupRect = { x: powerup.x - 13, y: powerup.y - 13, w: 26, h: 26 };
        if (overlap(state.player, pickupRect)) {
          state.powerups.splice(i, 1);
          applyPowerup(powerup);
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Particles                                                          */
  /* ------------------------------------------------------------------ */

  function addParticle(particle) {
    if (state.particles.length > 420) state.particles.shift();
    state.particles.push(particle);
  }

  function addFloatText(x, y, text, color) {
    addParticle({
      kind: "text",
      x,
      y,
      vx: rand(-4, 4),
      vy: -22,
      life: 0.95,
      maxLife: 0.95,
      text,
      color,
      size: 10,
    });
  }

  function addRing(x, y, start, end, color, duration = 0.3) {
    if (reduceMotion) return;
    addParticle({
      kind: "ring",
      x,
      y,
      radius: start,
      endRadius: end,
      life: duration,
      maxLife: duration,
      color,
    });
  }

  function addMuzzle(x, y, dir, color) {
    for (let i = 0; i < 3; i += 1) {
      addParticle({
        kind: "spark",
        x,
        y,
        vx: dir.x * rand(40, 130) + rand(-35, 35),
        vy: dir.y * rand(40, 130) + rand(-35, 35),
        life: rand(0.05, 0.16),
        maxLife: 0.16,
        color,
        size: rand(1, 2.2),
      });
    }
    addRing(x, y, 1, 8, color, 0.12);
  }

  function addImpact(x, y, color) {
    for (let i = 0; i < 5; i += 1) {
      const angle = Math.random() * TAU;
      const speed = rand(20, 95);
      addParticle({
        kind: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.08, 0.25),
        maxLife: 0.25,
        color,
        size: rand(0.8, 2),
      });
    }
    addRing(x, y, 2, 11, color, 0.16);
  }

  function addBrickDebris(x, y) {
    for (let i = 0; i < 10; i += 1) {
      addParticle({
        kind: "debris",
        x: x + rand(-9, 9),
        y: y + rand(-9, 9),
        vx: rand(-70, 70),
        vy: rand(-70, 70),
        life: rand(0.25, 0.65),
        maxLife: 0.65,
        color: Math.random() < 0.4 ? "#b45a3f" : "#7a3526",
        size: rand(2, 5),
        angle: rand(0, TAU),
        spin: rand(-8, 8),
      });
    }
  }

  function addExplosion(x, y, scale = 1, color = "#ffb45c") {
    state.shake = Math.max(state.shake, reduceMotion ? 0 : 5 * scale);
    addRing(x, y, 4, 32 * scale, color, 0.38);
    for (let i = 0; i < Math.floor(12 + scale * 8); i += 1) {
      const angle = Math.random() * TAU;
      const speed = rand(25, 150) * scale;
      addParticle({
        kind: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.15, 0.55),
        maxLife: 0.55,
        color: Math.random() < 0.35 ? "#fff3d0" : color,
        size: rand(1.2, 3.2),
      });
    }
    for (let i = 0; i < Math.floor(5 + scale * 3); i += 1) {
      addParticle({
        kind: "smoke",
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: rand(-18, 18),
        vy: rand(-22, 8),
        life: rand(0.35, 0.9),
        maxLife: 0.9,
        color: Math.random() < 0.5 ? "#4d4a45" : "#2d2d2b",
        size: rand(6, 13) * Math.min(scale, 1.6),
      });
    }
    for (let i = 0; i < Math.floor(3 + scale * 2); i += 1) {
      addParticle({
        kind: "debris",
        x,
        y,
        vx: rand(-90, 90),
        vy: rand(-90, 90),
        life: rand(0.25, 0.7),
        maxLife: 0.7,
        color: "#6b5743",
        size: rand(2, 5),
        angle: rand(0, TAU),
        spin: rand(-9, 9),
      });
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      if (p.kind === "ring") {
        continue;
      }
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;

      if (p.kind === "spark" || p.kind === "debris") {
        p.vx *= Math.pow(0.05, dt);
        p.vy *= Math.pow(0.05, dt);
      }
      if (p.kind === "smoke") {
        p.vx *= Math.pow(0.2, dt);
        p.vy = (p.vy || 0) * Math.pow(0.2, dt) - 4 * dt;
        p.size += 10 * dt;
      }
      if (p.kind === "debris") {
        p.angle += (p.spin || 0) * dt;
      }
      if (p.kind === "text") {
        p.vy *= Math.pow(0.4, dt);
      }
    }
    if (state.shake > 0) {
      state.shake = Math.max(0, state.shake - dt * 23);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Main update                                                        */
  /* ------------------------------------------------------------------ */

  function update(dt) {
    state.rapidTimer = Math.max(0, state.rapidTimer - dt);
    state.freezeTimer = Math.max(0, state.freezeTimer - dt);
    state.base.flash = Math.max(0, state.base.flash - dt);

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePowerups(dt);
    updateSpawner(dt);
    updateParticles(dt);
    checkLevelClear();
  }

  function updateIdle(dt) {
    if (state.mode === "countdown") {
      state.countdown -= dt;
      if (state.countdown <= 0) {
        state.countdown = 0;
        state.mode = "playing";
        updateHUD();
        sound.ready();
      }
      return;
    }

    if (state.mode === "ending") {
      state.endTimer -= dt;
      updateParticles(dt);
      if (state.endTimer <= 0) {
        showGameOver(state.endReason);
      }
      return;
    }

    if (state.mode !== "paused") {
      updateParticles(dt);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render: background and terrain                                     */
  /* ------------------------------------------------------------------ */

  function tileHash(col, row) {
    let n = (col * 374761393 + row * 668265263 + 0x9e3779b9) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function rr(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBackground(now) {
    ctx.fillStyle = "#05080a";
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.43, 30, W * 0.5, H * 0.5, W * 0.72);
    glow.addColorStop(0, "rgba(18, 46, 51, 0.36)");
    glow.addColorStop(0.55, "rgba(10, 26, 30, 0.12)");
    glow.addColorStop(1, "rgba(3, 6, 7, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(107, 160, 166, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = TILE; x < W; x += TILE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = TILE; y < H; y += TILE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(124, 177, 182, 0.04)";
    ctx.beginPath();
    for (let x = TILE * 4; x < W; x += TILE * 4) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = TILE * 4; y < H; y += TILE * 4) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();

    // Edge markings.
    const sweep = (now * 12) % 120;
    ctx.save();
    ctx.strokeStyle = "rgba(94, 231, 242, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, W - 7, H - 7);
    ctx.strokeStyle = "rgba(255, 180, 92, 0.2)";
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(3 + 34, 3);
    ctx.moveTo(3, 3);
    ctx.lineTo(3, 3 + 22);
    ctx.moveTo(W - 3, H - 3);
    ctx.lineTo(W - 37, H - 3);
    ctx.moveTo(W - 3, H - 3);
    ctx.lineTo(W - 3, H - 25);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 180, 92, 0.9)";
    ctx.fillRect(W - 33 - sweep, H - 5, 30, 1);
    ctx.restore();
  }

  function drawDecals() {
    for (const decal of state.decals) {
      ctx.fillStyle = `rgba(2, 3, 3, ${decal.alpha})`;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y, decal.r, decal.r * 0.72, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawBrick(col, row) {
    const x = col * TILE;
    const y = row * TILE;
    const hash = tileHash(col, row);
    const r = Math.floor(105 + hash * 28);
    const g = Math.floor(43 + hash * 16);
    const b = Math.floor(32 + hash * 10);

    ctx.fillStyle = "#1b0e0b";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, TILE, TILE);

    for (let line = 0; line < 4; line += 1) {
      const top = y + line * 8;
      ctx.fillStyle = "rgba(255, 193, 145, 0.18)";
      ctx.fillRect(x, top + 1, TILE, 1);
      ctx.fillStyle = "rgba(20, 9, 7, 0.68)";
      ctx.fillRect(x, top + 7, TILE, 1);
      const seams = line % 2 === 0 ? [15] : [7, 23];
      ctx.fillStyle = "rgba(20, 9, 7, 0.62)";
      for (const seam of seams) {
        ctx.fillRect(x + seam, top, 1, 8);
      }
    }

    if (hash > 0.76) {
      ctx.strokeStyle = "rgba(37, 13, 9, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 6);
      ctx.lineTo(x + 12, y + 11);
      ctx.lineTo(x + 9, y + 15);
      ctx.stroke();
    }
  }

  function drawSteel(col, row) {
    const x = col * TILE;
    const y = row * TILE;
    const hash = tileHash(col, row);
    ctx.fillStyle = "#0b1419";
    ctx.fillRect(x, y, TILE, TILE);

    for (let py = 0; py < 2; py += 1) {
      for (let px = 0; px < 2; px += 1) {
        const bx = x + 2 + px * 15;
        const by = y + 2 + py * 15;
        ctx.fillStyle = hash > 0.5 ? "#364a54" : "#30434c";
        ctx.fillRect(bx, by, 13, 13);
        ctx.fillStyle = "rgba(159, 193, 204, 0.24)";
        ctx.fillRect(bx, by, 13, 1);
        ctx.fillRect(bx, by, 1, 13);
        ctx.fillStyle = "rgba(5, 10, 12, 0.55)";
        ctx.fillRect(bx + 12, by + 1, 1, 12);
        ctx.fillRect(bx + 1, by + 12, 12, 1);
        ctx.fillStyle = "#0b1419";
        ctx.fillRect(bx + 3, by + 3, 2, 2);
        ctx.fillRect(bx + 8, by + 8, 2, 2);
        ctx.fillStyle = "rgba(137, 176, 188, 0.25)";
        ctx.fillRect(bx + 3, by + 3, 1, 1);
        ctx.fillRect(bx + 8, by + 8, 1, 1);
      }
    }
  }

  function drawWater(col, row, now) {
    const x = col * TILE;
    const y = row * TILE;
    const hash = tileHash(col, row);
    ctx.fillStyle = "#06131d";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "rgba(12, 48, 67, 0.58)";
    ctx.fillRect(x, y, TILE, TILE);

    for (let line = 0; line < 3; line += 1) {
      const baseY = y + 8 + line * 9;
      const phase = now * 2.1 + col * 0.62 + row * 0.41 + line * 1.8;
      ctx.strokeStyle = line === 1 ? "rgba(70, 170, 197, 0.4)" : "rgba(43, 118, 147, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let px = 0; px <= TILE; px += 4) {
        const wave = Math.sin(phase + px * 0.23) * 1.5;
        if (px === 0) ctx.moveTo(x + px, baseY + wave);
        else ctx.lineTo(x + px, baseY + wave);
      }
      ctx.stroke();
    }

    if (hash > 0.65) {
      const sparkle = (now * 1.7 + hash * 8) % 4;
      if (sparkle < 1.2) {
        ctx.fillStyle = "rgba(166, 238, 255, 0.55)";
        ctx.fillRect(x + 6 + hash * 16, y + 13 + hash * 8, 3, 1);
      }
    }
  }

  function drawTreeGround(col, row) {
    const x = col * TILE + TILE / 2;
    const y = row * TILE + TILE / 2;
    ctx.fillStyle = "rgba(4, 13, 8, 0.36)";
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 16, 13, 0, 0, TAU);
    ctx.fill();
  }

  function drawTreeCanopy(col, row, now) {
    const x = col * TILE;
    const y = row * TILE;
    const hash = tileHash(col, row);
    const sway = reduceMotion ? 0 : Math.sin(now * 1.25 + col * 0.8 + row * 0.5) * 1.1;

    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = "#0a2115";
    ctx.beginPath();
    ctx.arc(x + 9 + sway, y + 12, 11, 0, TAU);
    ctx.arc(x + 23 + sway * 0.5, y + 9, 10, 0, TAU);
    ctx.arc(x + 17 + sway, y + 22, 12, 0, TAU);
    ctx.arc(x + 5 + sway * 0.5, y + 23, 8, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#153d29";
    ctx.beginPath();
    ctx.arc(x + 8 + sway, y + 10, 7, 0, TAU);
    ctx.arc(x + 22 + sway * 0.4, y + 11, 7, 0, TAU);
    ctx.arc(x + 15 + sway, y + 21, 8, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(53, 117, 76, 0.72)";
    ctx.beginPath();
    ctx.arc(x + 9 + sway, y + 8, 3, 0, TAU);
    ctx.arc(x + 22 + sway, y + 10, 2.4, 0, TAU);
    ctx.arc(x + 12 + sway, y + 18, 2.7, 0, TAU);
    ctx.fill();

    if (hash > 0.7) {
      ctx.fillStyle = "rgba(116, 171, 112, 0.4)";
      ctx.fillRect(x + 25, y + 22, 2, 2);
      ctx.fillRect(x + 7, y + 20, 2, 1);
    }
    ctx.restore();
  }

  function drawTiles(now) {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = state.grid[row][col];
        if (tile === T.BRICK) drawBrick(col, row);
        else if (tile === T.STEEL) drawSteel(col, row);
        else if (tile === T.WATER) drawWater(col, row, now);
        else if (tile === T.TREE) drawTreeGround(col, row);
      }
    }
  }

  function drawSpawnPads(now) {
    ENEMY_SPAWNS.forEach((spawn, index) => {
      const pulse = 0.34 + Math.sin(now * 2.8 + index * 1.7) * 0.12;
      ctx.save();
      ctx.translate(spawn.x, spawn.y);
      ctx.strokeStyle = `rgba(255, 180, 92, ${pulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = -now * 11;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(255, 180, 92, ${pulse + 0.12})`;
      ctx.beginPath();
      ctx.moveTo(-9, 8);
      ctx.lineTo(0, -1);
      ctx.lineTo(9, 8);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawBase(now) {
    const x = BASE_X;
    const y = BASE_Y;
    const cx = BASE_CENTER.x;
    const cy = BASE_CENTER.y;

    // Concrete platform.
    ctx.fillStyle = "#0c1214";
    ctx.fillRect(x + 3, y + 4, BASE_W - 6, BASE_H - 4);
    ctx.strokeStyle = "rgba(124, 164, 168, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3.5, y + 4.5, BASE_W - 7, BASE_H - 5);

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fillRect(x + 7, y + 8, BASE_W - 14, 1);
    for (let i = 0; i < 7; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255, 180, 92, 0.19)" : "rgba(8, 11, 12, 0.5)";
      ctx.fillRect(x + 5 + i * 8, y + 1, 5, 2);
    }

    if (state.base.alive) {
      const nearbyEnemy = state.enemies.some((enemy) => {
        const ex = enemy.x + HALF_TANK;
        const ey = enemy.y + HALF_TANK;
        return (ex - cx) ** 2 + (ey - cy) ** 2 < 135 ** 2;
      });
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 39);
      glow.addColorStop(0, "rgba(255, 190, 106, 0.3)");
      glow.addColorStop(0.55, "rgba(255, 160, 70, 0.08)");
      glow.addColorStop(1, "rgba(255, 160, 70, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 39, 0, TAU);
      ctx.fill();

      if (nearbyEnemy) {
        const alpha = 0.22 + Math.sin(now * 8) * 0.12;
        ctx.strokeStyle = `rgba(255, 95, 109, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 30 + Math.sin(now * 5) * 2, 0, TAU);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "#f2c66f";
      ctx.strokeStyle = "#3a2610";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(5, -11);
      ctx.lineTo(21, -7);
      ctx.lineTo(13, 0);
      ctx.lineTo(18, 12);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 16);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-18, 12);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-21, -7);
      ctx.lineTo(-5, -11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffe7ad";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3.4, -4);
      ctx.lineTo(11, -4);
      ctx.lineTo(5, 1);
      ctx.lineTo(7.5, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-7.5, 8);
      ctx.lineTo(-5, 1);
      ctx.lineTo(-11, -4);
      ctx.lineTo(-3.4, -4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#6b4313";
      ctx.beginPath();
      ctx.arc(0, -1, 2.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 247, 208, 0.75)";
      ctx.fillRect(-1, -2, 1, 1);
      ctx.restore();

      // Small live beacon.
      const blink = 0.5 + Math.sin(now * 4.4) * 0.5;
      ctx.fillStyle = `rgba(142, 240, 163, ${0.35 + blink * 0.55})`;
      ctx.fillRect(x + BASE_W - 10, y + 8, 3, 3);
    } else {
      const age = Math.max(0, now - state.base.destroyedAt);
      ctx.fillStyle = "#070707";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 25, 21, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 117, 64, 0.56)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i += 1) {
        const angle = i * 1.26 + 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * (13 + i * 3), cy + Math.sin(angle) * (10 + i * 2));
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255, 107, 67, ${0.2 + Math.min(0.35, age * 0.08)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 7 + Math.sin(now * 5) * 1.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#3b2c1b";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.4);
      ctx.fillRect(-16, 2, 12, 4);
      ctx.rotate(0.9);
      ctx.fillRect(-4, -12, 4, 13);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render: objects                                                    */
  /* ------------------------------------------------------------------ */

  function drawPowerups(now) {
    for (const powerup of state.powerups) {
      const info = POWERUP_INFO[powerup.kind];
      const bob = reduceMotion ? 0 : Math.sin(now * 3.1 + powerup.phase) * 2;
      const x = powerup.x;
      const y = powerup.y + bob;
      const blink = powerup.life < 3.5 ? (Math.sin(now * 14) > 0 ? 0.45 : 1) : 1;
      const color =
        powerup.kind === "rapid" ? "#ffb45c" :
        powerup.kind === "life" ? "#8ef0a3" :
        powerup.kind === "freeze" ? "#a7c8ff" : "#5ee7f2";

      ctx.save();
      ctx.globalAlpha = blink;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(5, 12, 14, 0.92)";
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 15);
      ctx.lineTo(x + 8, y - 15);
      ctx.lineTo(x + 12, y - 11);
      ctx.lineTo(x + 12, y + 15);
      ctx.lineTo(x - 12, y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.055)";
      ctx.fillRect(x - 10, y - 13, 18, 1);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.strokeRect(x - 9.5, y - 12.5, 18, 24);

      ctx.translate(x, y);
      if (powerup.kind === "shield") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, -4.5);
        ctx.lineTo(5.5, 4);
        ctx.lineTo(0, 8);
        ctx.lineTo(-5.5, 4);
        ctx.lineTo(-7, -4.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#071113";
        ctx.fillRect(-1.5, -4, 3, 7);
      } else if (powerup.kind === "rapid") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(2, -9);
        ctx.lineTo(8, -9);
        ctx.lineTo(3, -1);
        ctx.lineTo(7, -1);
        ctx.lineTo(-3, 9);
        ctx.lineTo(0, 1);
        ctx.lineTo(-5, 1);
        ctx.closePath();
        ctx.fill();
      } else if (powerup.kind === "life") {
        ctx.fillStyle = color;
        ctx.fillRect(-2, -8, 4, 16);
        ctx.fillRect(-8, -2, 16, 4);
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI / 3) * i);
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();

      // Tiny label above the crate.
      ctx.save();
      ctx.globalAlpha = 0.65 * blink;
      ctx.fillStyle = color;
      ctx.font = '700 5px "Cascadia Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText({ shield: "SHD", rapid: "RPD", life: "LIFE", freeze: "CRYO" }[powerup.kind], x, y - 19);
      ctx.restore();
      void info;
    }
  }

  function drawTank(tank, now) {
    const isPlayer = Boolean(tank.isPlayer);
    const palette = isPlayer ? PLAYER_PALETTE : ENEMY_PALETTES[tank.type];
    const cx = tank.x + HALF_TANK;
    const cy = tank.y + HALF_TANK;
    const dir = DIRS[tank.dir];
    const spawnK = tank.spawnTimer > 0 ? 1 - tank.spawnTimer / 0.75 : 1;
    const scale = tank.spawnTimer > 0 ? 0.72 + spawnK * 0.28 : 1;
    const flash = tank.flashTimer > 0;
    const hull = flash ? "#fff4e2" : palette.hull;
    const highlight = flash ? "#ffffff" : palette.highlight;

    // Spawn portal under the tank.
    if (tank.spawnTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + spawnK * 0.55;
      ctx.strokeStyle = isPlayer ? "#7df5ff" : "#ffb45c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 - spawnK * 8, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 28 - spawnK * 12, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(dir.angle);
    ctx.scale(scale, scale);

    // Ground shadow.
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 14, 0, 0, TAU);
    ctx.fill();

    // Tracks.
    ctx.fillStyle = "#0a0f11";
    rr(-15, -14, 8, 28, 1.5);
    ctx.fill();
    rr(7, -14, 8, 28, 1.5);
    ctx.fill();
    ctx.fillStyle = palette.track;
    ctx.fillRect(-14, -13, 6, 26);
    ctx.fillRect(8, -13, 6, 26);

    const treadOffset = Math.floor(tank.tread || 0) % 5;
    ctx.fillStyle = palette.trackLight;
    for (let y = -12 + treadOffset; y < 13; y += 5) {
      ctx.fillRect(-14, y, 6, 1.5);
      ctx.fillRect(8, y, 6, 1.5);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
    ctx.fillRect(-14, -13, 1, 26);
    ctx.fillRect(8, -13, 1, 26);

    // Hull.
    ctx.fillStyle = "#081012";
    rr(-10.5, -11.5, 21, 24, 3);
    ctx.fill();
    ctx.fillStyle = hull;
    rr(-9, -10, 18, 21.5, 2.4);
    ctx.fill();

    // Hull plating and shadow.
    ctx.fillStyle = "rgba(4, 12, 14, 0.32)";
    ctx.fillRect(-9, 7, 18, 4);
    ctx.fillStyle = highlight;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(-8, -9, 16, 1.3);
    ctx.globalAlpha = 1;

    // Front nose plate.
    ctx.fillStyle = palette.hullDark;
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-5.5, -11);
    ctx.lineTo(5.5, -11);
    ctx.lineTo(8, -7);
    ctx.lineTo(8, -4);
    ctx.lineTo(-8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-5, -9, 10, 1.5);

    // Side accents.
    ctx.fillStyle = palette.hullDark;
    ctx.fillRect(-8.5, 0, 2, 7);
    ctx.fillRect(6.5, 0, 2, 7);

    // Special silhouette details.
    if (tank.type === "heavy") {
      ctx.fillStyle = palette.hullDark;
      ctx.fillRect(-12, -5, 3, 12);
      ctx.fillRect(9, -5, 3, 12);
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.fillRect(-12, -3, 3, 1);
      ctx.fillRect(9, -3, 3, 1);
    } else if (tank.type === "fast") {
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-8, 5, 4, 1.5);
      ctx.fillRect(-2, 5, 4, 1.5);
      ctx.fillRect(4, 5, 4, 1.5);
    } else if (tank.type === "elite") {
      ctx.fillStyle = palette.hullDark;
      ctx.beginPath();
      ctx.moveTo(-9, 3);
      ctx.lineTo(-13, 7);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, 3);
      ctx.lineTo(13, 7);
      ctx.lineTo(9, 9);
      ctx.closePath();
      ctx.fill();
    }

    // Barrel.
    ctx.fillStyle = "#071012";
    ctx.fillRect(-3, -22, 6, 17);
    ctx.fillStyle = palette.highlight;
    ctx.fillRect(-1.4, -21, 2.8, 14);
    ctx.fillStyle = palette.hullDark;
    ctx.fillRect(-4.5, -24, 9, 5);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-2.5, -23, 5, 1.3);

    // Turret.
    ctx.fillStyle = "#071012";
    ctx.beginPath();
    ctx.arc(0, -1, 8.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = palette.hullDark;
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.arc(0, -1, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(-1, -2, 2.1, 0, TAU);
    ctx.fill();

    if (isPlayer) {
      ctx.fillStyle = "#0b3137";
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(1.6, -1.5);
      ctx.lineTo(4.2, -1.5);
      ctx.lineTo(2.2, 0.2);
      ctx.lineTo(3, 3);
      ctx.lineTo(0, 1.3);
      ctx.lineTo(-3, 3);
      ctx.lineTo(-2.2, 0.2);
      ctx.lineTo(-4.2, -1.5);
      ctx.lineTo(-1.6, -1.5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(7, 16, 18, 0.65)";
      ctx.fillRect(-2, 6, 4, 1.5);
    }

    // Headlight.
    ctx.fillStyle = isPlayer ? "#d9ffff" : palette.accent;
    ctx.beginPath();
    ctx.arc(0, -10.6, 1.15, 0, TAU);
    ctx.fill();

    ctx.restore();

    // Damage shield / spawn shield.
    if (tank.shieldTimer > 0 && tank.spawnTimer <= 0) {
      const alpha = isPlayer ? 0.58 : 0.32;
      const radius = 20.5 + Math.sin(now * 7 + tank.x) * 1.2;
      ctx.save();
      ctx.strokeStyle = isPlayer ? `rgba(125, 245, 255, ${alpha})` : `rgba(255, 198, 109, ${alpha})`;
      ctx.fillStyle = isPlayer ? "rgba(94, 231, 242, 0.055)" : "rgba(255, 180, 92, 0.025)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -now * 12;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * TAU + now * 0.25;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isPlayer ? "rgba(125, 245, 255, 0.18)" : "rgba(255, 198, 109, 0.12)";
      ctx.stroke();
      ctx.restore();
    }

    // Health pips for armored enemies.
    if (tank.maxHp > 1 && tank.spawnTimer <= 0) {
      const totalWidth = tank.maxHp * 5 - 1;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(cx - totalWidth / 2 - 1, cy - 23, totalWidth + 2, 3.5);
      for (let i = 0; i < tank.maxHp; i += 1) {
        ctx.fillStyle = i < tank.hp ? palette.accent : "rgba(255, 255, 255, 0.14)";
        ctx.fillRect(cx - totalWidth / 2 + i * 5, cy - 22.3, 4, 2);
      }
      ctx.restore();
    }

    // Frozen tint.
    if (!isPlayer && state.freezeTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "rgba(133, 193, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(196, 231, 255, 0.8)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI / 3) * i + now * 0.15;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * -9, cy + Math.sin(angle) * -9);
        ctx.lineTo(cx + Math.cos(angle) * 9, cy + Math.sin(angle) * 9);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBullets(now) {
    for (const bullet of state.bullets) {
      const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
      const tx = bullet.x - (bullet.vx / speed) * 11;
      const ty = bullet.y - (bullet.vy / speed) * 11;
      ctx.save();
      ctx.strokeStyle = bullet.color;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = bullet.color;
      ctx.fillRect(bullet.x - 2.5, bullet.y - 2.5, 5, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fffdf0";
      ctx.fillRect(bullet.x - 1, bullet.y - 1, 2, 2);
      ctx.restore();
    }
    void now;
  }

  function drawParticles() {
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === "ring") {
        const progress = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.62;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + (p.endRadius - p.radius) * progress, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === "smoke") {
        ctx.save();
        ctx.globalAlpha = alpha * 0.38;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "spark") {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx || 0) * 0.025, p.y - (p.vy || 0) * 0.025);
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === "debris") {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.kind === "text") {
        ctx.save();
        ctx.globalAlpha = clamp(alpha * 1.4, 0, 1);
        ctx.fillStyle = p.color;
        ctx.font = '800 10px "Cascadia Mono", "Courier New", monospace';
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }
    }
  }

  function drawBuffBar(now) {
    const items = [];
    if (state.rapidTimer > 0) items.push({ label: "RPD", ratio: state.rapidTimer / 10, color: "#ffb45c" });
    if (state.freezeTimer > 0) items.push({ label: "CRYO", ratio: state.freezeTimer / 5.5, color: "#a7c8ff" });
    if (state.player && state.player.shieldTimer > 0) {
      items.push({ label: "SHD", ratio: clamp(state.player.shieldTimer / 6.5, 0.05, 1), color: "#5ee7f2" });
    }
    if (items.length === 0) return;

    let x = 8;
    const y = H - 15;
    ctx.save();
    ctx.globalAlpha = 0.86;
    for (const item of items) {
      const width = 45;
      ctx.fillStyle = "rgba(4, 10, 12, 0.8)";
      ctx.fillRect(x, y, width, 8);
      ctx.fillStyle = item.color;
      ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * item.ratio), 2);
      ctx.fillStyle = "rgba(220, 240, 241, 0.72)";
      ctx.font = '600 6px "Cascadia Mono", monospace';
      ctx.fillText(item.label, x + 4, y + 7);
      x += width + 4;
    }
    ctx.restore();
    void now;
  }

  function drawCountdown() {
    const cfg = LEVELS[state.levelIndex];
    const count = Math.max(1, Math.ceil(state.countdown));
    ctx.save();
    const gradient = ctx.createLinearGradient(0, H * 0.32, 0, H * 0.7);
    gradient.addColorStop(0, "rgba(4, 8, 10, 0)");
    gradient.addColorStop(0.32, "rgba(4, 8, 10, 0.74)");
    gradient.addColorStop(0.68, "rgba(4, 8, 10, 0.74)");
    gradient.addColorStop(1, "rgba(4, 8, 10, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, H * 0.3, W, H * 0.42);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffb45c";
    ctx.font = '700 8px "Cascadia Mono", monospace';
    ctx.fillText(`MISSION ${String(state.levelIndex + 1).padStart(2, "0")} // ${cfg.code}`, W / 2, H * 0.42);

    ctx.fillStyle = "#f2fbfa";
    ctx.font = '900 34px "Arial Black", "Microsoft YaHei", sans-serif';
    ctx.fillText(cfg.name, W / 2, H * 0.49);

    ctx.strokeStyle = "rgba(255, 180, 92, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 66, H * 0.515);
    ctx.lineTo(W / 2 + 66, H * 0.515);
    ctx.stroke();

    ctx.fillStyle = "rgba(195, 218, 219, 0.6)";
    ctx.font = '600 8px "Cascadia Mono", monospace';
    ctx.fillText("DEFEND THE SOUTHERN BASE", W / 2, H * 0.55);

    ctx.fillStyle = "#5ee7f2";
    ctx.font = '800 11px "Cascadia Mono", monospace';
    ctx.fillText("READY", W / 2, H * 0.60);
    ctx.fillStyle = "rgba(125, 245, 255, 0.5)";
    ctx.font = '700 8px "Cascadia Mono", monospace';
    ctx.fillText(String(count).padStart(2, "0"), W / 2, H * 0.632);
    ctx.restore();
  }

  function drawEndOverlay() {
    if (state.mode !== "ending") return;
    const alpha = 0.08 + Math.sin(state.time * 8) * 0.03;
    ctx.fillStyle = state.endReason === "base" ? `rgba(255, 75, 75, ${alpha})` : `rgba(255, 162, 75, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
    if (state.endTimer < 0.55) {
      ctx.save();
      ctx.globalAlpha = clamp((0.55 - state.endTimer) / 0.55, 0, 1) * 0.8;
      ctx.fillStyle = "#ff5f6d";
      ctx.font = '900 27px "Arial Black", "Microsoft YaHei", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(state.endReason === "base" ? "基地失联" : "信号中断", W / 2, H / 2);
      ctx.restore();
    }
  }

  function drawDangerVignette() {
    if (state.mode !== "playing") return;
    let near = false;
    for (const enemy of state.enemies) {
      const dx = enemy.x + HALF_TANK - BASE_CENTER.x;
      const dy = enemy.y + HALF_TANK - BASE_CENTER.y;
      if (dx * dx + dy * dy < 150 * 150) {
        near = true;
        break;
      }
    }
    if (!near) return;
    const pulse = 0.08 + Math.sin(state.time * 5) * 0.035;
    const gradient = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
    gradient.addColorStop(0, "rgba(255, 60, 70, 0)");
    gradient.addColorStop(1, `rgba(255, 60, 70, ${pulse})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.72);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.12)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.48)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(0, 0, W, 1);
    ctx.fillRect(0, H - 1, W, 1);
    ctx.fillRect(0, 0, 1, H);
    ctx.fillRect(W - 1, 0, 1, H);
  }

  /* ------------------------------------------------------------------ */
  /*  Render: frame                                                      */
  /* ------------------------------------------------------------------ */

  function render(now) {
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(now);

    const shakeAmount = reduceMotion ? 0 : state.shake;
    ctx.save();
    if (shakeAmount > 0.1) {
      ctx.translate(rand(-shakeAmount, shakeAmount), rand(-shakeAmount, shakeAmount));
    }

    drawDecals();
    drawTiles(now);
    drawBase(now);
    drawSpawnPads(now);
    drawPowerups(now);

    for (const enemy of state.enemies) drawTank(enemy, now);
    if (state.player) drawTank(state.player, now);

    // Tree canopies sit above tanks to give the classic ambush feel.
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (state.grid[row][col] === T.TREE) drawTreeCanopy(col, row, now);
      }
    }

    drawBullets(now);
    drawParticles();
    drawBuffBar(now);
    drawDangerVignette();
    drawEndOverlay();

    if (state.mode === "countdown") drawCountdown();

    ctx.restore();
    drawVignette();
  }

  /* ------------------------------------------------------------------ */
  /*  Loop                                                               */
  /* ------------------------------------------------------------------ */

  function frame(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = Math.min(0.05, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;
    state.time += dt;

    if (state.mode === "playing") {
      accumulator = Math.min(accumulator + dt, 0.12);
      let steps = 0;
      while (accumulator >= STEP && steps < 5) {
        update(STEP);
        accumulator -= STEP;
        steps += 1;
        if (state.mode !== "playing") break;
      }
    } else {
      accumulator = 0;
      updateIdle(dt);
    }

    render(state.time);
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /*  UI wiring                                                          */
  /* ------------------------------------------------------------------ */

  overlayBtn.addEventListener("click", () => {
    sound.init();
    sound.click();
    if (typeof overlayAction === "function") {
      const action = overlayAction;
      overlayAction = null;
      action();
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused") resumeGame();
  });

  soundBtn.addEventListener("click", () => {
    sound.init();
    sound.setEnabled(!sound.enabled);
    updateSoundButton();
    if (sound.enabled) sound.click();
  });

  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* fullscreen may be disabled by the browser */
    }
  });

  function updateSoundButton() {
    soundBtn.setAttribute("aria-pressed", sound.enabled ? "true" : "false");
    soundBtn.title = sound.enabled ? "关闭声音" : "开启声音";
    soundBtn.setAttribute("aria-label", sound.enabled ? "关闭声音" : "开启声音");
  }

  window.addEventListener("pointerdown", () => sound.init(), { once: true });
  window.addEventListener("keydown", () => sound.init(), { once: true });

  window.addEventListener("resize", () => {
    // Canvas uses a fixed 2× backing store; CSS scales it responsively.
  });

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */

  updateSoundButton();
  initMenu();
  requestAnimationFrame(frame);
})();
