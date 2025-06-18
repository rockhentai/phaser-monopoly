import { Scene } from 'phaser';
import { BoardCell, CellType, PropertyColor } from '../types/GameTypes';

export class Property {
    private scene: Scene;
    private cellData: BoardCell;
    private ownerId?: number;
    private houses: number = 0;
    private hotel: boolean = false;
    private mortgaged: boolean = false;
    private ownerIndicator?: Phaser.GameObjects.Graphics;
    private buildingsContainer?: Phaser.GameObjects.Container;
    private boardContainer: Phaser.GameObjects.Container;

    constructor(scene: Scene, cellData: BoardCell, boardContainer: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.cellData = cellData;
        this.boardContainer = boardContainer;
    }

    // 获取地产基础信息
    public getInfo() {
        return {
            id: this.cellData.id,          // 地产的唯一标识符
            name: this.cellData.name,      // 地产的名称
            type: this.cellData.type,      // 地产的类型（如：地产、机会、命运等）
            color: this.cellData.color,    // 地产所属的颜色组
            price: this.cellData.price,    // 地产的购买价格
            baseRent: this.cellData.rent?.[0] || 0,  // 地产的基础租金（无建筑时）
            ownerId: this.ownerId,         // 地产所有者的玩家ID
            houses: this.houses,           // 当前建造的房屋数量（0-4）
            hotel: this.hotel,             // 是否已建造酒店
            mortgaged: this.mortgaged,     // 地产是否已被抵押
            canPurchase: this.canPurchase(),  // 该地产当前是否可被购买
            currentRent: this.getCurrentRent()  // 根据建筑情况计算的当前租金
        };
    }

    // 检查是否可以购买
    public canPurchase(): boolean {
        return this.ownerId === undefined && 
               (this.cellData.type === CellType.PROPERTY || 
                this.cellData.type === CellType.UTILITY || 
                this.cellData.type === CellType.RAILROAD) && 
               !this.mortgaged &&
               this.cellData.price !== undefined;
    }

    // 购买地产
    public purchase(playerId: number): boolean {
        if (!this.canPurchase()) {
            return false;
        }

        const oldRent = this.getCurrentRent(); // 购买前的租金（应该是0）
        this.ownerId = playerId;
        const newRent = this.getCurrentRent(); // 购买后的租金（应该是基础租金）
        
        console.log(`🏠 玩家${playerId + 1} 购买了 ${this.cellData.name}，价格：$${this.cellData.price}`);
        console.log(`📊 租金变化: $${oldRent} → $${newRent}`);
        
        // 明确更新租金状态
        this.updateRentStatus();
        
        // 显示所有权标识
        this.showOwnershipIndicator(playerId);
        
        return true;
    }

    // 更新租金状态（明确处理租金变化）
    private updateRentStatus(): void {
        const currentRent = this.getCurrentRent();
        console.log(`💰 ${this.cellData.name} 租金更新为: $${currentRent}`);
        
        // 如果需要，这里可以添加其他租金变化时的处理逻辑
        // 比如通知其他系统、更新UI等
    }

    // 计算当前租金
    public getCurrentRent(diceTotal?: number, propertyManager?: any): number {
        if (this.ownerId === undefined || this.mortgaged) {
            return 0;
        }

        // 处理公用事业的特殊租金计算
        if (this.cellData.type === CellType.UTILITY) {
            if (!diceTotal || !propertyManager) {
                return 0; // 公用事业需要骰子点数和地产管理器才能计算租金
            }
            
            // 计算玩家拥有的公用事业数量
            const utilitiesOwned = this.countPlayerUtilities(this.ownerId, propertyManager);
            
            if (utilitiesOwned === 1) {
                return diceTotal * 4; // 拥有1个公用事业：骰子点数 × 4
            } else if (utilitiesOwned >= 2) {
                return diceTotal * 10; // 拥有2个公用事业：骰子点数 × 10
            }
            
            return 0;
        }

        // 处理铁路的特殊租金计算
        if (this.cellData.type === CellType.RAILROAD) {
            if (!propertyManager) {
                return this.cellData.rent?.[0] || 0;
            }
            
            // 计算玩家拥有的铁路数量
            const railroadsOwned = this.countPlayerRailroads(this.ownerId, propertyManager);
            const rentIndex = Math.min(railroadsOwned - 1, 3); // 最多4个铁路
            
            return this.cellData.rent?.[rentIndex] || 0;
        }

        // 普通地产租金计算
        if (!this.cellData.rent) {
            return 0;
        }

        // 基础租金
        let rent = this.cellData.rent[0];

        if (this.hotel) {
            // 酒店租金
            rent = this.cellData.rent[5] || rent * 10;
        } else if (this.houses > 0) {
            // 房屋租金
            rent = this.cellData.rent[this.houses] || rent * (this.houses + 1);
        }

        return rent;
    }

    // 计算玩家拥有的公用事业数量
    private countPlayerUtilities(playerId: number, propertyManager: any): number {
        let count = 0;
        const utilities = [12, 28]; // 电力公司和自来水厂的位置
        
        for (const position of utilities) {
            const property = propertyManager.getProperty(position);
            if (property && property.getOwnerId() === playerId) {
                count++;
            }
        }
        
        return count;
    }

    // 计算玩家拥有的铁路数量
    private countPlayerRailroads(playerId: number, propertyManager: any): number {
        let count = 0;
        const railroads = [5, 15, 25, 35]; // 四个铁路车站的位置
        
        for (const position of railroads) {
            const property = propertyManager.getProperty(position);
            if (property && property.getOwnerId() === playerId) {
                count++;
            }
        }
        
        return count;
    }

    // 收取租金
    public collectRent(fromPlayerId: number): number {
        if (this.ownerId === undefined || this.ownerId === fromPlayerId || this.mortgaged) {
            return 0;
        }

        const rent = this.getCurrentRent();
        console.log(`💰 玩家${fromPlayerId + 1} 向玩家${this.ownerId + 1} 支付租金 $${rent} (${this.cellData.name})`);
        
        return rent;
    }

    // 建造房屋
    public buildHouse(): boolean {
        if (!this.canBuildHouse()) {
            return false;
        }

        const oldRent = this.getCurrentRent();
        this.houses++;
        const newRent = this.getCurrentRent();
        
        console.log(`🏗️ 在 ${this.cellData.name} 建造了第${this.houses}栋房屋`);
        console.log(`📊 租金变化: $${oldRent} → $${newRent}`);
        
        // 明确更新租金状态
        this.updateRentStatus();
        
        // 更新建筑显示
        this.updateBuildingsDisplay();
        
        return true;
    }

    // 建造酒店
    public buildHotel(): boolean {
        if (!this.canBuildHotel()) {
            return false;
        }

        const oldRent = this.getCurrentRent();
        this.houses = 0;
        this.hotel = true;
        const newRent = this.getCurrentRent();
        
        console.log(`🏨 在 ${this.cellData.name} 建造了酒店`);
        console.log(`📊 租金变化: $${oldRent} → $${newRent}`);
        
        // 明确更新租金状态
        this.updateRentStatus();
        
        // 更新建筑显示
        this.updateBuildingsDisplay();
        
        return true;
    }

    // 检查是否可以建造房屋
    public canBuildHouse(): boolean {
        return this.ownerId !== undefined && 
               !this.mortgaged && 
               this.houses < 4 && 
               !this.hotel &&
               this.cellData.type === CellType.PROPERTY;
    }

    // 检查是否可以建造酒店
    public canBuildHotel(): boolean {
        return this.ownerId !== undefined && 
               !this.mortgaged && 
               this.houses === 4 && 
               !this.hotel &&
               this.cellData.type === CellType.PROPERTY;
    }

    // 抵押地产
    public mortgage(): boolean {
        if (!this.canMortgage()) {
            return false;
        }

        const oldRent = this.getCurrentRent();
        this.mortgaged = true;
        const newRent = this.getCurrentRent(); // 抵押后租金变为0
        const mortgageValue = Math.floor((this.cellData.price || 0) / 2);
        
        console.log(`🏦 ${this.cellData.name} 已抵押，获得 $${mortgageValue}`);
        console.log(`📊 租金变化: $${oldRent} → $${newRent} (抵押状态)`);
        
        // 明确更新租金状态
        this.updateRentStatus();
        
        // 更新视觉显示
        this.updateOwnershipDisplay();
        
        return true;
    }

    // 赎回地产
    public unmortgage(): boolean {
        if (!this.mortgaged || this.ownerId === undefined) {
            return false;
        }

        const oldRent = this.getCurrentRent(); // 赎回前租金为0
        this.mortgaged = false;
        const newRent = this.getCurrentRent(); // 赎回后恢复租金
        const redeemCost = Math.floor((this.cellData.price || 0) * 0.6); // 赎回成本为价格的60%
        
        console.log(`🏦 ${this.cellData.name} 已赎回，花费 $${redeemCost}`);
        console.log(`📊 租金变化: $${oldRent} → $${newRent} (赎回恢复)`);
        
        // 明确更新租金状态
        this.updateRentStatus();
        
        // 更新视觉显示
        this.updateOwnershipDisplay();
        
        return true;
    }

    // 检查是否可以抵押
    public canMortgage(): boolean {
        return this.ownerId !== undefined && 
               !this.mortgaged && 
               this.houses === 0 && 
               !this.hotel;
    }

    // 获取抵押价值
    public getMortgageValue(): number {
        return Math.floor((this.cellData.price || 0) / 2);
    }

    // 获取赎回成本
    public getRedeemCost(): number {
        return Math.floor((this.cellData.price || 0) * 0.6);
    }

    // 显示所有权标识
    private showOwnershipIndicator(playerId: number): void {
        // 玩家颜色配置
        const playerColors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFD700];
        const color = playerColors[playerId] || 0xFFFFFF;

        if (this.ownerIndicator) {
            this.ownerIndicator.destroy();
        }

        this.ownerIndicator = this.scene.add.graphics();
        this.ownerIndicator.lineStyle(3, color);
        
        const x = this.cellData.position.x;
        const y = this.cellData.position.y;
        
        // 在格子边缘绘制所有权边框
        if (this.cellData.id >= 1 && this.cellData.id <= 9) {
            // 底边
            this.ownerIndicator.strokeRect(x - 35, y - 25, 70, 50);
        } else if (this.cellData.id >= 11 && this.cellData.id <= 19) {
            // 左边
            this.ownerIndicator.strokeRect(x - 25, y - 35, 50, 70);
        } else if (this.cellData.id >= 21 && this.cellData.id <= 29) {
            // 顶边
            this.ownerIndicator.strokeRect(x - 35, y - 25, 70, 50);
        } else if (this.cellData.id >= 31 && this.cellData.id <= 39) {
            // 右边
            this.ownerIndicator.strokeRect(x - 25, y - 35, 50, 70);
        } else {
            // 角落格子 (特殊处理某些角落的可购买地产，如公用事业和铁路)
            this.ownerIndicator.strokeRect(x - 35, y - 35, 70, 70);
        }

        // 将所有权标识添加到棋盘容器
        this.boardContainer.add(this.ownerIndicator);

        console.log(`🎨 为 ${this.cellData.name} 显示所有权标识 (玩家${playerId + 1})`);
        this.updateOwnershipDisplay();
    }

    // 更新所有权显示（抵押状态等）
    private updateOwnershipDisplay(): void {
        if (!this.ownerIndicator) return;

        if (this.mortgaged) {
            // 抵押状态：虚线边框
            this.ownerIndicator.setAlpha(0.5);
        } else {
            this.ownerIndicator.setAlpha(1);
        }
    }

    // 更新建筑显示
    private updateBuildingsDisplay(): void {
        // 清除现有建筑显示
        if (this.buildingsContainer) {
            this.buildingsContainer.destroy();
        }

        if (this.houses === 0 && !this.hotel) {
            return;
        }

        this.buildingsContainer = this.scene.add.container();
        const x = this.cellData.position.x;
        const y = this.cellData.position.y;

        if (this.hotel) {
            // 显示酒店（红色大方块）
            const hotel = this.scene.add.graphics();
            hotel.fillStyle(0xFF0000);
            hotel.fillRect(x - 8, y - 15, 16, 10);
            this.buildingsContainer.add(hotel);
        } else {
            // 显示房屋（绿色小方块）
            for (let i = 0; i < this.houses; i++) {
                const house = this.scene.add.graphics();
                house.fillStyle(0x00AA00);
                house.fillRect(x - 15 + (i * 8), y - 12, 6, 6);
                this.buildingsContainer.add(house);
            }
        }

        // 将建筑容器添加到棋盘容器
        this.boardContainer.add(this.buildingsContainer);
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
        
        if (this.ownerIndicator) {
            this.ownerIndicator.destroy();
            this.ownerIndicator = undefined;
        }
        
        if (this.buildingsContainer) {
            this.buildingsContainer.destroy();
            this.buildingsContainer = undefined;
        }
    }

    // 销毁
    public destroy(): void {
        this.reset();
    }
} 