import { BoardCell, CellType, PropertyColor } from '../types/GameTypes';

// 大富翁棋盘数据配置 (40个格子)
// 重新设计坐标系统 - 以屏幕中心为基准，确保所有格子都可见
export const BOARD_DATA: BoardCell[] = [
    // 底边 (右下角开始，向左) - 从右到左，ID 0-9
    {
        id: 0,
        name: '出发',
        type: CellType.GO,
        position: { x: 400, y: 300 }  // 右下角
    },
    {
        id: 1,
        name: '中山南路',
        type: CellType.PROPERTY,
        position: { x: 330, y: 300 },
        price: 60,
        rent: [2, 10, 30, 90, 160, 250],
        color: PropertyColor.BROWN
    },
    {
        id: 2,
        name: '命运',
        type: CellType.COMMUNITY_CHEST,
        position: { x: 260, y: 300 }
    },
    {
        id: 3,
        name: '中山北路',
        type: CellType.PROPERTY,
        position: { x: 190, y: 300 },
        price: 60,
        rent: [4, 20, 60, 180, 320, 450],
        color: PropertyColor.BROWN
    },
    {
        id: 4,
        name: '所得税',
        type: CellType.TAX,
        position: { x: 120, y: 300 },
        price: 200
    },
    {
        id: 5,
        name: '南京车站',
        type: CellType.RAILROAD,
        position: { x: 50, y: 300 },
        price: 200,
        rent: [25, 50, 100, 200]
    },
    {
        id: 6,
        name: '天津路',
        type: CellType.PROPERTY,
        position: { x: -20, y: 300 },
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        color: PropertyColor.LIGHT_BLUE
    },
    {
        id: 7,
        name: '机会',
        type: CellType.CHANCE,
        position: { x: -90, y: 300 }
    },
    {
        id: 8,
        name: '北京路',
        type: CellType.PROPERTY,
        position: { x: -160, y: 300 },
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        color: PropertyColor.LIGHT_BLUE
    },
    {
        id: 9,
        name: '上海路',
        type: CellType.PROPERTY,
        position: { x: -230, y: 300 },
        price: 120,
        rent: [8, 40, 100, 300, 450, 600],
        color: PropertyColor.LIGHT_BLUE
    },

    // 左边 (左下角到左上角) - 从下到上，ID 10-19
    {
        id: 10,
        name: '监狱',
        type: CellType.JAIL,
        position: { x: -300, y: 300 }  // 左下角
    },
    {
        id: 11,
        name: '香港街',
        type: CellType.PROPERTY,
        position: { x: -300, y: 230 },
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        color: PropertyColor.PINK
    },
    {
        id: 12,
        name: '电力公司',
        type: CellType.UTILITY,
        position: { x: -300, y: 160 },
        price: 150
    },
    {
        id: 13,
        name: '台湾街',
        type: CellType.PROPERTY,
        position: { x: -300, y: 90 },
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        color: PropertyColor.PINK
    },
    {
        id: 14,
        name: '澳门街',
        type: CellType.PROPERTY,
        position: { x: -300, y: 20 },
        price: 160,
        rent: [12, 60, 180, 500, 700, 900],
        color: PropertyColor.PINK
    },
    {
        id: 15,
        name: '台北车站',
        type: CellType.RAILROAD,
        position: { x: -300, y: -50 },
        price: 200,
        rent: [25, 50, 100, 200]
    },
    {
        id: 16,
        name: '大连路',
        type: CellType.PROPERTY,
        position: { x: -300, y: -120 },
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        color: PropertyColor.ORANGE
    },
    {
        id: 17,
        name: '命运',
        type: CellType.COMMUNITY_CHEST,
        position: { x: -300, y: -190 }
    },
    {
        id: 18,
        name: '哈尔滨路',
        type: CellType.PROPERTY,
        position: { x: -300, y: -260 },
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        color: PropertyColor.ORANGE
    },
    {
        id: 19,
        name: '长春路',
        type: CellType.PROPERTY,
        position: { x: -300, y: -330 },
        price: 200,
        rent: [16, 80, 220, 600, 800, 1000],
        color: PropertyColor.ORANGE
    },

    // 顶边 (左上角到右上角) - 从左到右，ID 20-29
    {
        id: 20,
        name: '免费停车',
        type: CellType.FREE_PARKING,
        position: { x: -300, y: -400 }  // 左上角
    },
    {
        id: 21,
        name: '南京路',
        type: CellType.PROPERTY,
        position: { x: -230, y: -400 },
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        color: PropertyColor.RED
    },
    {
        id: 22,
        name: '机会',
        type: CellType.CHANCE,
        position: { x: -160, y: -400 }
    },
    {
        id: 23,
        name: '北京大街',
        type: CellType.PROPERTY,
        position: { x: -90, y: -400 },
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        color: PropertyColor.RED
    },
    {
        id: 24,
        name: '上海大街',
        type: CellType.PROPERTY,
        position: { x: -20, y: -400 },
        price: 240,
        rent: [20, 100, 300, 750, 925, 1100],
        color: PropertyColor.RED
    },
    {
        id: 25,
        name: '高雄车站',
        type: CellType.RAILROAD,
        position: { x: 50, y: -400 },
        price: 200,
        rent: [25, 50, 100, 200]
    },
    {
        id: 26,
        name: '天津大街',
        type: CellType.PROPERTY,
        position: { x: 120, y: -400 },
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        color: PropertyColor.YELLOW
    },
    {
        id: 27,
        name: '成都路',
        type: CellType.PROPERTY,
        position: { x: 190, y: -400 },
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        color: PropertyColor.YELLOW
    },
    {
        id: 28,
        name: '自来水厂',
        type: CellType.UTILITY,
        position: { x: 260, y: -400 },
        price: 150
    },
    {
        id: 29,
        name: '重庆路',
        type: CellType.PROPERTY,
        position: { x: 330, y: -400 },
        price: 280,
        rent: [24, 120, 360, 850, 1025, 1200],
        color: PropertyColor.YELLOW
    },

    // 右边 (右上角到右下角) - 从上到下，ID 30-39
    {
        id: 30,
        name: '进入监狱',
        type: CellType.GO_TO_JAIL,
        position: { x: 400, y: -400 }  // 右上角
    },
    {
        id: 31,
        name: '中华路',
        type: CellType.PROPERTY,
        position: { x: 400, y: -330 },
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        color: PropertyColor.GREEN
    },
    {
        id: 32,
        name: '中山路',
        type: CellType.PROPERTY,
        position: { x: 400, y: -260 },
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        color: PropertyColor.GREEN
    },
    {
        id: 33,
        name: '命运',
        type: CellType.COMMUNITY_CHEST,
        position: { x: 400, y: -190 }
    },
    {
        id: 34,
        name: '长安街',
        type: CellType.PROPERTY,
        position: { x: 400, y: -120 },
        price: 320,
        rent: [28, 150, 450, 1000, 1200, 1400],
        color: PropertyColor.GREEN
    },
    {
        id: 35,
        name: '台中车站',
        type: CellType.RAILROAD,
        position: { x: 400, y: -50 },
        price: 200,
        rent: [25, 50, 100, 200]
    },
    {
        id: 36,
        name: '机会',
        type: CellType.CHANCE,
        position: { x: 400, y: 20 }
    },
    {
        id: 37,
        name: '新生南路',
        type: CellType.PROPERTY,
        position: { x: 400, y: 90 },
        price: 350,
        rent: [35, 175, 500, 1100, 1300, 1500],
        color: PropertyColor.DARK_BLUE
    },
    {
        id: 38,
        name: '奢侈税',
        type: CellType.TAX,
        position: { x: 400, y: 160 },
        price: 100
    },
    {
        id: 39,
        name: '信义路',
        type: CellType.PROPERTY,
        position: { x: 400, y: 230 },
        price: 400,
        rent: [50, 200, 600, 1400, 1700, 2000],
        color: PropertyColor.DARK_BLUE
    }
];

// 颜色配置
export const PROPERTY_COLORS = {
    [PropertyColor.BROWN]: 0x8B4513,
    [PropertyColor.LIGHT_BLUE]: 0x87CEEB,
    [PropertyColor.PINK]: 0xFF69B4,
    [PropertyColor.ORANGE]: 0xFF4500,
    [PropertyColor.RED]: 0xFF0000,
    [PropertyColor.YELLOW]: 0xFFFF00,
    [PropertyColor.GREEN]: 0x008000,
    [PropertyColor.DARK_BLUE]: 0x000080
};

// 棋盘尺寸配置
export const BOARD_CONFIG = {
    width: 700,
    height: 700,
    cellWidth: 70,
    cellHeight: 70,
    centerX: 50,
    centerY: -50
}; 