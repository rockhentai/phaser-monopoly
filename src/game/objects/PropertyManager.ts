import { Scene } from 'phaser';
import { BoardCell, CellType } from '../types/GameTypes';
import { Property } from './Property';
import { BOARD_DATA } from '../data/BoardData';

export class PropertyManager {
    private scene: Scene;
    private properties: Map<number, Property> = new Map();
    private container: Phaser.GameObjects.Container;

    constructor(scene: Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
        this.initializeProperties();
    }

    // 初始化所有地产
    private initializeProperties(): void {
        BOARD_DATA.forEach((cellData) => {
            if (cellData.type === CellType.PROPERTY || 
                cellData.type === CellType.RAILROAD || 
                cellData.type === CellType.UTILITY) {
                const property = new Property(this.scene, cellData, this.container);
                this.properties.set(cellData.id, property);
            }
        });

        console.log(`🏠 初始化了 ${this.properties.size} 个可购买地产`);
    }

    // 获取指定位置的地产
    public getProperty(position: number): Property | undefined {
        return this.properties.get(position);
    }

    // 尝试购买地产
    public attemptPurchase(position: number, playerId: number, playerMoney: number): {
        success: boolean;
        cost: number;
        message: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                success: false,
                cost: 0,
                message: '该位置不是可购买地产'
            };
        }

        const propertyInfo = property.getInfo();
        
        if (!propertyInfo.canPurchase) {
            if (propertyInfo.ownerId !== undefined) {
                return {
                    success: false,
                    cost: 0,
                    message: `该地产已被玩家${propertyInfo.ownerId + 1}拥有`
                };
            } else {
                return {
                    success: false,
                    cost: 0,
                    message: '该地产无法购买'
                };
            }
        }

        const cost = propertyInfo.price || 0;
        
        if (playerMoney < cost) {
            return {
                success: false,
                cost: cost,
                message: `资金不足！需要 $${cost}，当前只有 $${playerMoney}`
            };
        }

        // 执行购买
        if (property.purchase(playerId)) {
            return {
                success: true,
                cost: cost,
                message: `成功购买 ${propertyInfo.name}！`
            };
        } else {
            return {
                success: false,
                cost: 0,
                message: '购买失败'
            };
        }
    }

    // 收取租金（支持公用事业和铁路的特殊计算）
    public collectRent(position: number, fromPlayerId: number, diceTotal?: number, specialRentType?: 'double_railroad' | 'dice_utility'): {
        amount: number;
        toPlayerId?: number;
        propertyName: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                amount: 0,
                propertyName: ''
            };
        }

        const propertyInfo = property.getInfo();
        
        // 对于公用事业和铁路，需要传入额外参数
        let rentAmount = 0;
        if (propertyInfo.type === CellType.UTILITY || propertyInfo.type === CellType.RAILROAD) {
            rentAmount = property.getCurrentRent(diceTotal, this);
            
            // 处理特殊租金类型
            if (specialRentType === 'double_railroad' && propertyInfo.type === CellType.RAILROAD) {
                rentAmount *= 2; // 双倍车站租金
                console.log(`🚂 机会卡效果：车站租金翻倍！原租金 $${rentAmount/2} → 双倍租金 $${rentAmount}`);
            } else if (specialRentType === 'dice_utility' && propertyInfo.type === CellType.UTILITY) {
                // 公用事业：掷骰子并支付10倍点数
                if (diceTotal) {
                    rentAmount = diceTotal * 10;
                    console.log(`⚡ 机会卡效果：公用事业租金为骰子点数的10倍！骰子点数 ${diceTotal} × 10 = $${rentAmount}`);
                }
            }
        } else {
            rentAmount = property.getCurrentRent();
        }
        
        // 只有当租金大于0且不是自己的地产时才收租
        if (rentAmount > 0 && propertyInfo.ownerId !== fromPlayerId && !propertyInfo.mortgaged) {
            return {
                amount: rentAmount,
                toPlayerId: propertyInfo.ownerId,
                propertyName: propertyInfo.name
            };
        }
        
        return {
            amount: 0,
            toPlayerId: propertyInfo.ownerId,
            propertyName: propertyInfo.name
        };
    }

    // 建造房屋
    public buildHouse(position: number, playerId: number): {
        success: boolean;
        cost: number;
        message: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                success: false,
                cost: 0,
                message: '该位置不是地产'
            };
        }

        const propertyInfo = property.getInfo();
        
        if (propertyInfo.ownerId !== playerId) {
            return {
                success: false,
                cost: 0,
                message: '你不拥有这个地产'
            };
        }

        if (!property.canBuildHouse()) {
            return {
                success: false,
                cost: 0,
                message: '无法在此地产建造房屋'
            };
        }

        // 房屋建造成本（通常是地产价格的一半）
        const cost = Math.floor((propertyInfo.price || 0) / 2);
        
        if (property.buildHouse()) {
            return {
                success: true,
                cost: cost,
                message: `在 ${propertyInfo.name} 建造了房屋`
            };
        } else {
            return {
                success: false,
                cost: 0,
                message: '建造失败'
            };
        }
    }

    // 建造酒店
    public buildHotel(position: number, playerId: number): {
        success: boolean;
        cost: number;
        message: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                success: false,
                cost: 0,
                message: '该位置不是地产'
            };
        }

        const propertyInfo = property.getInfo();
        
        if (propertyInfo.ownerId !== playerId) {
            return {
                success: false,
                cost: 0,
                message: '你不拥有这个地产'
            };
        }

        if (!property.canBuildHotel()) {
            return {
                success: false,
                cost: 0,
                message: '无法在此地产建造酒店（需要4栋房屋）'
            };
        }

        // 酒店建造成本
        const cost = Math.floor((propertyInfo.price || 0) * 0.8);
        
        if (property.buildHotel()) {
            return {
                success: true,
                cost: cost,
                message: `在 ${propertyInfo.name} 建造了酒店`
            };
        } else {
            return {
                success: false,
                cost: 0,
                message: '建造失败'
            };
        }
    }

    // 抵押地产
    public mortgageProperty(position: number, playerId: number): {
        success: boolean;
        value: number;
        message: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                success: false,
                value: 0,
                message: '该位置不是地产'
            };
        }

        const propertyInfo = property.getInfo();
        
        if (propertyInfo.ownerId !== playerId) {
            return {
                success: false,
                value: 0,
                message: '你不拥有这个地产'
            };
        }

        if (!property.canMortgage()) {
            return {
                success: false,
                value: 0,
                message: '无法抵押此地产（可能有建筑或已抵押）'
            };
        }

        const value = property.getMortgageValue();
        
        if (property.mortgage()) {
            return {
                success: true,
                value: value,
                message: `${propertyInfo.name} 已抵押，获得 $${value}`
            };
        } else {
            return {
                success: false,
                value: 0,
                message: '抵押失败'
            };
        }
    }

    // 赎回地产
    public redeemProperty(position: number, playerId: number, playerMoney: number): {
        success: boolean;
        cost: number;
        message: string;
    } {
        const property = this.properties.get(position);
        
        if (!property) {
            return {
                success: false,
                cost: 0,
                message: '该位置不是地产'
            };
        }

        const propertyInfo = property.getInfo();
        
        if (propertyInfo.ownerId !== playerId) {
            return {
                success: false,
                cost: 0,
                message: '你不拥有这个地产'
            };
        }

        if (!propertyInfo.mortgaged) {
            return {
                success: false,
                cost: 0,
                message: '该地产未抵押'
            };
        }

        const cost = property.getRedeemCost();
        
        if (playerMoney < cost) {
            return {
                success: false,
                cost: cost,
                message: `资金不足！需要 $${cost}，当前只有 $${playerMoney}`
            };
        }

        if (property.unmortgage()) {
            return {
                success: true,
                cost: cost,
                message: `${propertyInfo.name} 已赎回`
            };
        } else {
            return {
                success: false,
                cost: 0,
                message: '赎回失败'
            };
        }
    }

    // 获取玩家拥有的所有地产
    public getPlayerProperties(playerId: number): Property[] {
        const playerProperties: Property[] = [];
        
        this.properties.forEach((property) => {
            if (property.getOwnerId() === playerId) {
                playerProperties.push(property);
            }
        });
        
        return playerProperties;
    }

    // 计算玩家地产总价值
    public getPlayerPropertyValue(playerId: number): number {
        let totalValue = 0;
        
        this.getPlayerProperties(playerId).forEach((property) => {
            const info = property.getInfo();
            totalValue += info.price || 0;
            
            // 加上建筑价值
            if (info.houses > 0) {
                totalValue += info.houses * Math.floor((info.price || 0) / 2);
            }
            if (info.hotel) {
                totalValue += Math.floor((info.price || 0) * 0.8);
            }
        });
        
        return totalValue;
    }

    // 获取地产详细信息（支持公用事业租金显示）
    public getPropertyInfo(position: number, diceTotal?: number) {
        const property = this.properties.get(position);
        if (!property) return undefined;
        
        const info = property.getInfo();
        
        // 对于公用事业和铁路，计算实际租金
        if (info.type === CellType.UTILITY || info.type === CellType.RAILROAD) {
            info.currentRent = property.getCurrentRent(diceTotal, this);
        }
        
        return info;
    }

    // 检查玩家是否拥有某个颜色组的所有地产
    public ownsColorGroup(playerId: number, color: string): boolean {
        const colorProperties = Array.from(this.properties.values()).filter(
            property => property.getInfo().color === color
        );
        
        return colorProperties.length > 0 && 
               colorProperties.every(property => property.getOwnerId() === playerId);
    }

    // 重置所有地产
    public resetAllProperties(): void {
        this.properties.forEach(property => property.reset());
        console.log('🔄 所有地产已重置');
    }

    // 销毁
    public destroy(): void {
        this.properties.forEach(property => property.destroy());
        this.properties.clear();
    }
} 