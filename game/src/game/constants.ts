export const GAME_CONFIG = {
    TITLE: 'TUI Crawler',
    VERSION: '1.0.0',
    
    SCREEN_WIDTH: 120,
    SCREEN_HEIGHT: 80,
    
    MIN_TERMINAL_WIDTH: 120,
    MIN_TERMINAL_HEIGHT: 80,
    
    RENDER_FPS: 30,
    GAME_TICK_RATE: 1 / 10,
    
    TILE_SIZE: 1,
    SUB_TILES_PER_TILE: 4,
    
    API_BASE_URL: process.env.API_URL || 'http://localhost:3000/api',
    
    MAX_USERNAME_LENGTH: 20,
    MIN_USERNAME_LENGTH: 3,
    MAX_PASSWORD_LENGTH: 128,
    MIN_PASSWORD_LENGTH: 8,
    
    MAX_CHARACTER_NAME_LENGTH: 20,
    MIN_CHARACTER_NAME_LENGTH: 2,
};

export const DUNGEON_CONFIG = {
    TYPES: {
        THIRTY_SEC: {
            id: 'THIRTY_SEC',
            name: '30 Second',
            duration: 30,
            keys: 3,
            coins: 5,
            potions: { health: 2, mana: 2 },
        },
        SIXTY_SEC: {
            id: 'SIXTY_SEC',
            name: '60 Second',
            duration: 60,
            keys: 5,
            coins: 10,
            potions: { health: 2, mana: 2 },
        },
        ONE_TWENTY_SEC: {
            id: 'ONE_TWENTY_SEC',
            name: '120 Second',
            duration: 120,
            keys: 8,
            coins: 20,
            potions: { health: 2, mana: 2 },
        },
    },
};

export const CHARACTER_CLASSES = {
    WIZARD: {
        id: 'WIZARD',
        name: 'Wizard',
        description: 'Masters of magic, can use wands and swords',
        startingHp: 5,
        startingMana: 5,
        hpPerLevel: 1,
        manaPerLevel: 2,
        allowedWeapons: ['WAND', 'SWORD'],
    },
    FIGHTER: {
        id: 'FIGHTER',
        name: 'Fighter',
        description: 'Warriors of strength, can use axes and swords',
        startingHp: 5,
        startingMana: 5,
        hpPerLevel: 2,
        manaPerLevel: 1,
        allowedWeapons: ['AXE', 'SWORD'],
    },
};

export const WEAPON_TYPES = {
    SWORD: {
        id: 'SWORD',
        name: 'Sword',
        damageMultiplier: 1.0,
        speedMultiplier: 1.0,
        rangeMultiplier: 1.0,
    },
    AXE: {
        id: 'AXE',
        name: 'Axe',
        damageMultiplier: 1.5,
        speedMultiplier: 0.7,
        rangeMultiplier: 0.9,
    },
    WAND: {
        id: 'WAND',
        name: 'Wand',
        damageMultiplier: 0.5,
        speedMultiplier: 1.2,
        rangeMultiplier: 3.0,
        requiresMana: true,
    },
};

export const ENEMY_TYPES = {
    SKELETON: {
        id: 'SKELETON',
        name: 'Skeleton',
        baseHp: 3,
        baseDamage: 1,
        baseSpeed: 1.0,
        experienceValue: 10,
        color: 0xcccccc,
    },
    GOBLIN: {
        id: 'GOBLIN',
        name: 'Goblin',
        baseHp: 2,
        baseDamage: 1,
        baseSpeed: 1.5,
        experienceValue: 15,
        color: 0x00ff00,
    },
    ORC: {
        id: 'ORC',
        name: 'Orc',
        baseHp: 5,
        baseDamage: 2,
        baseSpeed: 0.7,
        experienceValue: 25,
        color: 0x008800,
    },
    WIZARD: {
        id: 'WIZARD',
        name: 'Evil Wizard',
        baseHp: 4,
        baseDamage: 2,
        baseSpeed: 0.9,
        experienceValue: 30,
        isRanged: true,
        color: 0xff00ff,
    },
};

export const LEADERBOARD_PERIODS = {
    HOURLY: {
        id: 'HOURLY',
        name: 'Last Hour',
        duration: 60 * 60 * 1000,
    },
    DAILY: {
        id: 'DAILY',
        name: 'Today',
        duration: 24 * 60 * 60 * 1000,
    },
    WEEKLY: {
        id: 'WEEKLY',
        name: 'This Week',
        duration: 7 * 24 * 60 * 60 * 1000,
    },
    MONTHLY: {
        id: 'MONTHLY',
        name: 'This Month',
        duration: 30 * 24 * 60 * 60 * 1000,
    },
};

export const COLORS = {
    PRIMARY: 0x00ffff,
    SECONDARY: 0xff00ff,
    SUCCESS: 0x00ff00,
    DANGER: 0xff0000,
    WARNING: 0xffff00,
    INFO: 0x0088ff,
    
    PLAYER: 0x00ff00,
    ENEMY: 0xff0000,
    ITEM: 0xffff00,
    KEY: 0xffd700,
    COIN: 0xffd700,
    POTION_HEALTH: 0xff0088,
    POTION_MANA: 0x0088ff,
    
    WALL: 0x888888,
    FLOOR: 0x333333,
    DOOR: 0x8b4513,
    TORCH: 0xff8800,
    
    UI_BACKGROUND: 0x222222,
    UI_BORDER: 0x666666,
    UI_TEXT: 0xffffff,
    UI_TEXT_DIM: 0x888888,
};

export const INPUT_KEYS = {
    MOVE_UP: ['w', 'W', 'ArrowUp'],
    MOVE_DOWN: ['s', 'S', 'ArrowDown'],
    MOVE_LEFT: ['a', 'A', 'ArrowLeft'],
    MOVE_RIGHT: ['d', 'D', 'ArrowRight'],
    
    ATTACK: [' ', 'Space'],
    RUN: ['Shift'],
    SWAP_WEAPON: ['Tab'],
    
    USE_HEALTH_POTION: ['q', 'Q'],
    USE_MANA_POTION: ['e', 'E'],
    
    INTERACT: ['f', 'F', 'Enter'],
    
    PAUSE: ['Escape', 'p', 'P'],
    
    MENU_UP: ['w', 'W', 'ArrowUp'],
    MENU_DOWN: ['s', 'S', 'ArrowDown'],
    MENU_SELECT: ['Enter', ' ', 'Space'],
    MENU_BACK: ['Escape', 'Backspace'],
};

export const EXPERIENCE_LEVELS = (() => {
    const levels: number[] = [0];
    let total = 0;
    
    for (let level = 1; level <= 100; level++) {
        const required = Math.floor(100 * Math.pow(1.5, level - 1));
        total += required;
        levels.push(total);
    }
    
    return levels;
})();

export const ANIMATION_FRAMES = {
    PLAYER_WALK: 2,
    ENEMY_WALK: 2,
    ATTACK_SWING: 3,
    SPELL_CAST: 4,
    DEATH: 4,
    HIT_FLASH: 2,
    TORCH_FLICKER: 3,
};

export const PARTICLE_CONFIGS = {
    HIT_SPARKS: {
        count: 5,
        lifetime: 0.3,
        speed: 50,
        color: 0xffff00,
    },
    BLOOD: {
        count: 8,
        lifetime: 0.5,
        speed: 30,
        color: 0xff0000,
    },
    MAGIC_SPARKLE: {
        count: 10,
        lifetime: 0.8,
        speed: 20,
        color: 0x00ffff,
    },
    COIN_PICKUP: {
        count: 6,
        lifetime: 0.4,
        speed: 40,
        color: 0xffd700,
    },
};