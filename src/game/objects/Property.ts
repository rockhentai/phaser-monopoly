import { Scene } from 'phaser';
import { BoardCell, CellType, PropertyColor } from '../types/GameTypes';

export interface PropertyInfo {
    id: number;
    name: string;
    type: CellType;
    price?: number;
    baseRent: number;
    currentRent: number;
    ownerId?: number;
    houses: number;
    hotel: boolean;
    mortgaged: boolean;
    canPurchase: boolean;
    color?: PropertyColor;
    position: { x: number; y: number };
}

export class Property {
    private scene: Scene;
    private cellData: BoardCell;
    private container: Phaser.GameObjects.Container;
    
    // 地产状态
    private ownerId?: number;
    private houses: number = 0;
    private hotel: boolean = false;
    private mortgaged: boolean = false;
    
    // 视觉元素
    private ownerIndicator?: Phaser.GameObjects.Graphics;
    private buildingIndicators: Phaser.GameObjects.Text[] = [];

    constructor(scene: Scene, cellData: BoardCell, boardContainer: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.cellData = cellData;
        this.container = boardContainer;
        
        console.log(`🏠 创建地产: ${cellData.name} (位置 ${cellData.id})`);
    }

    // 购买地产
    public purchase(playerId: number): boolean {
        if (this.ownerId !== undefined) {
            console.log(`❌ 地产 ${this.cellData.name} 已被拥有`);
            return false;
        }

        this.ownerId = playerId;
        this.updateVisualOwnership();
        
        console.log(`✅ 玩家 ${playerId + 1} 购买了 ${this.cellData.name}`);
        return true;
    }

    // 建造房屋
    public buildHouse(): boolean {
        if (!this.canBuildHouse()) {
            return false;
        }

        this.houses++;
        this.updateBuildingVisuals();
        
        console.log(`🏗️ 在 ${this.cellData.name} 建造了第 ${this.houses} 栋房屋`);
        return true;
    }

    // 建造酒店
    public buildHotel(): boolean {
        if (!this.canBuildHotel()) {
            return false;
        }

        this.houses = 0; // 移除所有房屋
        this.hotel = true;
        this.updateBuildingVisuals();
        
        console.log(`🏨 在 ${this.cellData.name} 建造了酒店`);
        return true;
    }

    // 检查是否可以建造房屋
    public canBuildHouse(): boolean {
        if (this.ownerId === undefined) return false;
        if (this.hotel) return false;
        if (this.houses >= 4) return false;
        if (this.mortgaged) return false;
        if (this.cellData.type !== CellType.PROPERTY) return false;
        
        // TODO: 检查是否拥有同色地产套组
        return true;
    }

    // 检查是否可以建造酒店
    public canBuildHotel(): boolean {
        if (this.ownerId === undefined) return false;
        if (this.hotel) return false;
        if (this.houses !== 4) return false;
        if (this.mortgaged) return false;
        if (this.cellData.type !== CellType.PROPERTY) return false;
        
        return true;
    }

    // 抵押地产
    public mortgage(): boolean {
        if (!this.canMortgage()) {
            return false;
        }

        this.mortgaged = true;
        this.updateVisualOwnership();
        
        console.log(`🏦 ${this.cellData.name} 已抵押`);
        return true;
    }

    // 赎回地产
    public unmortgage(): boolean {
        if (!this.mortgaged) {
            return false;
        }

        this.mortgaged = false;
        this.updateVisualOwnership();
        
        console.log(`💰 ${this.cellData.name} 已赎回`);
        return true;
    }

    // 检查是否可以抵押
    public canMortgage(): boolean {
        if (this.ownerId === undefined) return false;
        if (this.mortgaged) return false;
        if (this.houses > 0 || this.hotel) return false; // 有建筑时不能抵押
        
        return true;
    }

    // 获取抵押价值
    public getMortgageValue(): number {
        return Math.floor((this.cellData.price || 0) / 2);
    }

    // 获取赎回成本
    public getRedeemCost(): number {
        const mortgageValue = this.getMortgageValue();
        return Math.floor(mortgageValue * 1.1); // 抵押价值的110%
    }

    // 获取当前租金
    public getCurrentRent(diceTotal?: number, propertyManager?: any): number {
        if (this.ownerId === undefined || this.mortgaged) {
            return 0;
        }

        switch (this.cellData.type) {
            case CellType.PROPERTY:
                return this.getPropertyRent();
                
            case CellType.RAILROAD:
                return this.getRailroadRent(propertyManager);
                
            case CellType.UTILITY:
                return this.getUtilityRent(diceTotal, propertyManager);
                
            default:
                return 0;
        }
    }

    // 计算地产租金
    private getPropertyRent(): number {
        if (!this.cellData.rent || this.cellData.rent.length === 0) {
            return 0;
        }

        if (this.hotel) {
            return this.cellData.rent[5] || 0; // 酒店租金
        } else if (this.houses > 0) {
            return this.cellData.rent[this.houses] || 0; // 房屋租金
        } else {
            // TODO: 检查是否拥有同色地产套组，如果是则租金翻倍
            return this.cellData.rent[0] || 0; // 基础租金
        }
    }

    // 计算铁路租金
    private getRailroadRent(propertyManager?: any): number {
        if (!propertyManager || !this.cellData.rent) {
            return this.cellData.rent?.[0] || 25;
        }

        // 计算玩家拥有的铁路数量
        const playerProperties = propertyManager.getPlayerProperties(this.ownerId!);
        const railroadCount = playerProperties.filter((prop: any) => 
            prop.getInfo().type === CellType.RAILROAD
        ).length;

        const rentIndex = Math.min(railroadCount - 1, 3);
        return this.cellData.rent[rentIndex] || 25;
    }

    // 计算公用事业租金
    private getUtilityRent(diceTotal?: number, propertyManager?: any): number {
        if (!diceTotal || !propertyManager) {
            return 0;
        }

        // 计算玩家拥有的公用事业数量
        const playerProperties = propertyManager.getPlayerProperties(this.ownerId!);
        const utilityCount = playerProperties.filter((prop: any) => 
            prop.getInfo().type === CellType.UTILITY
        ).length;

        const multiplier = utilityCount === 1 ? 4 : 10;
        return diceTotal * multiplier;
    }

    // 更新所有权视觉显示
    private updateVisualOwnership(): void {
        // 移除旧的所有权指示器
        if (this.ownerIndicator) {
            this.ownerIndicator.destroy();
            this.ownerIndicator = undefined;
        }

        if (this.ownerId !== undefined) {
            this.ownerIndicator = this.scene.add.graphics();
            
            // 根据玩家ID设置颜色
            const playerColors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFD700]; // 红、蓝、绿、金
            const color = playerColors[this.ownerId % playerColors.length];
            
            if (this.mortgaged) {
                // 抵押状态：使用虚线边框
                this.ownerIndicator.lineStyle(3, color, 0.6);
                this.ownerIndicator.strokeRect(
                    this.cellData.position.x - 32, 
                    this.cellData.position.y - 22, 
                    64, 44
                );
                
                // 添加抵押标识
                const mortgageText = this.scene.add.text(
                    this.cellData.position.x, 
                    this.cellData.position.y, 
                    'M', {
                    fontSize: '12px',
                    color: '#FFFFFF',
                    backgroundColor: '#FF0000',
                    padding: { x: 2, y: 1 }
                });
                mortgageText.setOrigin(0.5);
                this.container.add(mortgageText);
            } else {
                // 正常拥有：实线边框
                this.ownerIndicator.lineStyle(3, color);
                this.ownerIndicator.strokeRect(
                    this.cellData.position.x - 32, 
                    this.cellData.position.y - 22, 
                    64, 44
                );
            }
            
            this.container.add(this.ownerIndicator);
        }
    }

    // 更新建筑视觉显示
    private updateBuildingVisuals(): void {
        // 清除旧的建筑指示器
        this.buildingIndicators.forEach(indicator => indicator.destroy());
        this.buildingIndicators = [];

        if (this.hotel) {
            // 显示酒店
            const hotelText = this.scene.add.text(
                this.cellData.position.x, 
                this.cellData.position.y - 30, 
                '🏨', {
                fontSize: '16px'
            });
            hotelText.setOrigin(0.5);
            this.buildingIndicators.push(hotelText);
            this.container.add(hotelText);
        } else if (this.houses > 0) {
            // 显示房屋
            for (let i = 0; i < this.houses; i++) {
                const houseText = this.scene.add.text(
                    this.cellData.position.x - 15 + (i * 8), 
                    this.cellData.position.y - 30, 
                    '🏠', {
                    fontSize: '10px'
                });
                houseText.setOrigin(0.5);
                this.buildingIndicators.push(houseText);
                this.container.add(houseText);
            }
        }
    }

    // 获取地产信息
    public getInfo(): PropertyInfo {
        return {
            id: this.cellData.id,
            name: this.cellData.name,
            type: this.cellData.type,
            price: this.cellData.price,
            baseRent: this.cellData.rent?.[0] || 0,
            currentRent: this.getCurrentRent(),
            ownerId: this.ownerId,
            houses: this.houses,
            hotel: this.hotel,
            mortgaged: this.mortgaged,
            canPurchase: this.ownerId === undefined,
            color: this.cellData.color,
            position: this.cellData.position
        };
    }

    // 获取所有者ID
    public getOwnerId(): number | undefined {
        return this.ownerId;
    }

    // 重置地产状态
    public reset(): void {
        this.ownerId = undefined;
        this.houses = 0;
        this.hotel = false;
        this.mortgaged = false;
        
        // 清除视觉元素
        if (this.ownerIndicator) {
            this.ownerIndicator.destroy();
            this.ownerIndicator = undefined;
        }
        
        this.buildingIndicators.forEach(indicator => indicator.destroy());
        this.buildingIndicators = [];
        
        console.log(`🔄 地产 ${this.cellData.name} 已重置`);
    }

    // 销毁
    public destroy(): void {
        this.reset();
    }
}