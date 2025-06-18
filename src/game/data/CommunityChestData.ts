import { Card, CardType, CardEffect } from '../types/GameTypes';

// 命运卡片数据配置
export const COMMUNITY_CHEST_CARDS: Card[] = [
    {
        id: 1,
        title: '前进到出发',
        description: '前进到出发格子，收取 $200',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.MOVE_TO_POSITION,
        targetPosition: 0
    },
    {
        id: 2,
        title: '银行错误',
        description: '银行错误，对你有利。收取 $200',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 200
    },
    {
        id: 3,
        title: '医生费用',
        description: '支付医生费用 $50',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.PAY_MONEY,
        value: 50
    },
    {
        id: 4,
        title: '继承遗产',
        description: '继承遗产，获得 $100',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 100
    },
    {
        id: 5,
        title: '所得税退款',
        description: '所得税退款，获得 $20',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 20
    },
    {
        id: 6,
        title: '人寿保险到期',
        description: '人寿保险到期，收取 $100',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 100
    },
    {
        id: 7,
        title: '医院费用',
        description: '支付医院费用 $100',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.PAY_MONEY,
        value: 100
    },
    {
        id: 8,
        title: '学费',
        description: '支付学费 $50',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.PAY_MONEY,
        value: 50
    },
    {
        id: 9,
        title: '直接前往监狱',
        description: '直接前往监狱，不经过出发格子，不收取 $200',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.GO_TO_JAIL
    },
    {
        id: 10,
        title: '获得出狱卡',
        description: '免费出狱卡，可保留此卡直到使用或交易',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.GET_OUT_OF_JAIL_FREE,
        canKeep: true
    },
    {
        id: 11,
        title: '圣诞基金到期',
        description: '圣诞基金到期，收取 $100',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 100
    },
    {
        id: 12,
        title: '慈善捐款',
        description: '慈善捐款，支付 $50',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.PAY_MONEY,
        value: 50
    },
    {
        id: 13,
        title: '美容比赛奖金',
        description: '美容比赛第二名，收取 $10',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 10
    },
    {
        id: 14,
        title: '房屋维修费',
        description: '房屋维修费：每栋房屋 $40，每座酒店 $115',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.PAY_PER_HOUSE,
        value: 40  // 房屋费用，酒店费用在执行时硬编码为115
    },
    {
        id: 15,
        title: '生日快乐',
        description: '今天是你的生日，每位玩家给你 $10',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 10  // 每位玩家给的金额，实际金额在执行时计算
    },
    {
        id: 16,
        title: '股票红利',
        description: '股票红利，收取 $50',
        type: CardType.COMMUNITY_CHEST,
        effect: CardEffect.COLLECT_MONEY,
        value: 50
    }
];

// 洗牌函数
export function shuffleCommunityChestCards(): Card[] {
    const cards = [...COMMUNITY_CHEST_CARDS];
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
} 