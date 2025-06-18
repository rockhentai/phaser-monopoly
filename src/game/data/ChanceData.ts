import { Card, CardType, CardEffect } from '../types/GameTypes';

// 机会卡片数据
const CHANCE_CARDS: Card[] = [
    {
        id: 1,
        title: '前进到出发点',
        description: '前进到出发点，收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 0
    },
    {
        id: 2,
        title: '前进到上海大街',
        description: '如果经过出发点，收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 24 // 红色地产组的第二个位置
    },
    {
        id: 3,
        title: '前进到香港街',
        description: '如果经过出发点，收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 11 // 粉色地产组的第一个位置
    },
    {
        id: 4,
        title: '前进到最近的车站',
        description: '如果无人拥有，可以从银行购买。如果有主人，支付双倍租金',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_NEAREST_RAILROAD
    },
    {
        id: 5,
        title: '前进到台北车站',
        description: '如果经过出发点，收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 15 // 台北车站位置
    },
    {
        id: 6,
        title: '前进到最近的公用事业',
        description: '如果无人拥有，可以从银行购买。如果有主人，掷骰子并支付10倍的点数',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_NEAREST_UTILITY
    },
    {
        id: 7,
        title: '银行错误，有利于你',
        description: '收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.COLLECT_MONEY,
        value: 200
    },
    {
        id: 8,
        title: '免费出狱卡',
        description: '此卡可保留到使用时或出售',
        type: CardType.CHANCE,
        effect: CardEffect.GET_OUT_OF_JAIL_FREE,
        canKeep: true
    },
    {
        id: 9,
        title: '后退3格',
        description: '向后移动3格',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_RELATIVE,
        value: -3
    },
    {
        id: 10,
        title: '直接进入监狱',
        description: '直接进入监狱，不能经过出发点，不能收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.GO_TO_JAIL
    },
    {
        id: 11,
        title: '房屋和酒店维修费',
        description: '每栋房屋支付$25，每间酒店支付$100',
        type: CardType.CHANCE,
        effect: CardEffect.PAY_PER_HOUSE,
        value: 25 // 每栋房屋的费用（酒店费用在代码中处理为100）
    },
    {
        id: 12,
        title: '缴纳穷人税',
        description: '支付$15',
        type: CardType.CHANCE,
        effect: CardEffect.PAY_MONEY,
        value: 15
    },
    {
        id: 13,
        title: '前往南京车站',
        description: '如果经过出发点，收取$200',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 5 // 第一个车站
    },
    {
        id: 14,
        title: '前往信义路',
        description: '前进到信义路',
        type: CardType.CHANCE,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 39 // 最后一个高级地产
    },
    {
        id: 15,
        title: '你被选为董事长',
        description: '向每位玩家支付$50',
        type: CardType.CHANCE,
        effect: CardEffect.PAY_MONEY,
        value: 50 // 这里需要特殊处理，支付给所有其他玩家
    },
    {
        id: 16,
        title: '你的建筑贷款到期',
        description: '收取$150',
        type: CardType.CHANCE,
        effect: CardEffect.COLLECT_MONEY,
        value: 150
    }
];

// 洗牌函数
export function shuffleChanceCards(): Card[] {
    const shuffled = [...CHANCE_CARDS];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    console.log('🔀 机会卡片已洗牌');
    return shuffled;
}

// 获取所有机会卡片（用于调试）
export function getAllChanceCards(): Card[] {
    return [...CHANCE_CARDS];
}

export { CHANCE_CARDS }; 