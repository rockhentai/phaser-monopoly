// 大富翁游戏类型定义

// 棋盘格子类型
export enum CellType {
    PROPERTY = 'property',      // 地产
    RAILROAD = 'railroad',      // 铁路
    UTILITY = 'utility',        // 公用事业
    TAX = 'tax',               // 税收
    CHANCE = 'chance',         // 机会
    COMMUNITY_CHEST = 'community_chest',  // 命运
    GO = 'go',                 // 出发点
    JAIL = 'jail',             // 监狱
    GO_TO_JAIL = 'go_to_jail', // 进入监狱
    FREE_PARKING = 'free_parking', // 免费停车
    CORNER = 'corner'          // 角落特殊格子
}

// 地产颜色组
export enum PropertyColor {
    BROWN = 'brown',
    LIGHT_BLUE = 'light_blue',
    PINK = 'pink',
    ORANGE = 'orange',
    RED = 'red',
    YELLOW = 'yellow',
    GREEN = 'green',
    DARK_BLUE = 'dark_blue'
}

// 玩家状态
export enum PlayerStatus {
    ACTIVE = 'active',         // 正常状态
    IN_JAIL = 'in_jail',      // 在监狱中
    BANKRUPT = 'bankrupt'      // 破产
}

// 卡片类型
export enum CardType {
    COMMUNITY_CHEST = 'community_chest', // 命运卡
    CHANCE = 'chance'                    // 机会卡
}

// 卡片效果类型
export enum CardEffect {
    MOVE_TO_POSITION = 'move_to_position',     // 移动到指定位置
    MOVE_RELATIVE = 'move_relative',           // 相对移动
    COLLECT_MONEY = 'collect_money',           // 收取金钱
    PAY_MONEY = 'pay_money',                   // 支付金钱
    PAY_PER_HOUSE = 'pay_per_house',          // 按房屋数量支付
    GO_TO_JAIL = 'go_to_jail',                // 进入监狱
    GET_OUT_OF_JAIL_FREE = 'get_out_of_jail_free', // 获得出狱卡
    MOVE_TO_NEAREST_RAILROAD = 'move_to_nearest_railroad', // 移动到最近的车站
    MOVE_TO_NEAREST_UTILITY = 'move_to_nearest_utility'    // 移动到最近的公用事业
}

// 卡片接口
export interface Card {
    id: number;
    title: string;
    description: string;
    type: CardType;
    effect: CardEffect;
    value?: number;              // 金钱数额或移动步数
    targetPosition?: number;     // 目标位置
    canKeep?: boolean;          // 是否可以保留（如出狱卡）
}

// 棋盘格子接口
export interface BoardCell {
    id: number;
    name: string;
    type: CellType;
    position: {
        x: number;
        y: number;
    };
    price?: number;
    rent?: number[];
    color?: PropertyColor;
    owner?: number;
    houses?: number;
    mortgaged?: boolean;
}

// 玩家接口
export interface Player {
    id: number;
    name: string;
    emoji: string;            // 玩家代币的emoji
    position: number;         // 当前在棋盘上的位置（0-39）
    money: number;
    properties: number[];
    status: PlayerStatus;
    jailTurns: number;
    color: string;           // 玩家主题颜色
    isActive: boolean;       // 是否为当前回合玩家
    specialCards: Card[];    // 持有的特殊卡片（如出狱卡）
}

// 玩家代币显示属性
export interface PlayerToken {
    playerId: number;
    emoji: string;
    position: number;
    displayPosition: {
        x: number;
        y: number;
    };
    scale: number;
}

// 游戏状态接口
export interface GameState {
    currentPlayer: number;
    players: Player[];
    board: BoardCell[];
    diceValues: [number, number];
    gamePhase: 'setup' | 'playing' | 'ended';
    round: number;
    communityChestDeck: Card[];  // 命运卡片堆
    chanceDeck: Card[];          // 机会卡片堆
}

// 骰子接口
export interface DiceResult {
    dice1: number;
    dice2: number;
    total: number;
    isDouble: boolean;
}

// 卡片执行结果接口
export interface CardExecutionResult {
    success: boolean;
    message: string;
    playerMoved?: boolean;
    moneyChanged?: number;
    cardToKeep?: Card;
    needsPlayerChoice?: boolean;
    specialRentType?: 'double_railroad' | 'dice_utility'; // 特殊租金类型
}

// 预定义的玩家配置
export const PLAYER_CONFIGS = [
    {
        id: 0,
        name: '玩家1',
        emoji: '🚗',
        color: '#FF0000'  // 红色
    },
    {
        id: 1,
        name: '玩家2',
        emoji: '🚢',
        color: '#0000FF'  // 蓝色
    },
    {
        id: 2,
        name: '玩家3',
        emoji: '✈️',
        color: '#00FF00'  // 绿色
    },
    {
        id: 3,
        name: '玩家4',
        emoji: '🎩',
        color: '#FFD700'  // 金色
    }
]; 