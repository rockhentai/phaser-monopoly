import { Scene } from 'phaser';
import { Card, CardType, CardEffect, CardExecutionResult, Player, PlayerStatus } from '../types/GameTypes';
import { shuffleCommunityChestCards } from '../data/CommunityChestData';
import { shuffleChanceCards } from '../data/ChanceData';

export class CardManager {
    private scene: Scene;
    private communityChestDeck: Card[] = [];
    private communityChestDiscardPile: Card[] = [];
    private chanceDeck: Card[] = [];
    private chanceDiscardPile: Card[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
        this.initializeDecks();
    }

    private initializeDecks(): void {
        // 初始化并洗牌命运卡片
        this.communityChestDeck = shuffleCommunityChestCards();
        console.log('📚 命运卡片堆已初始化，共', this.communityChestDeck.length, '张卡片');
        
        // 初始化并洗牌机会卡片
        this.chanceDeck = shuffleChanceCards();
        console.log('🎯 机会卡片堆已初始化，共', this.chanceDeck.length, '张卡片');
    }

    // 抽取命运卡片
    public drawCommunityChestCard(): Card {
        // 如果卡片堆为空，重新洗牌
        if (this.communityChestDeck.length === 0) {
            this.reshuffleCommunityChest();
        }

        const card = this.communityChestDeck.pop();
        if (!card) {
            throw new Error('命运卡片堆为空！');
        }

        console.log('🎴 抽取命运卡片:', card.title);
        return card;
    }

    // 抽取机会卡片
    public drawChanceCard(): Card {
        // 如果卡片堆为空，重新洗牌
        if (this.chanceDeck.length === 0) {
            this.reshuffleChance();
        }

        const card = this.chanceDeck.pop();
        if (!card) {
            throw new Error('机会卡片堆为空！');
        }

        console.log('🎯 抽取机会卡片:', card.title);
        return card;
    }

    // 重新洗牌命运卡片
    private reshuffleCommunityChest(): void {
        console.log('🔄 重新洗牌命运卡片');
        this.communityChestDeck = [...this.communityChestDiscardPile];
        this.communityChestDiscardPile = [];
        
        // 洗牌
        for (let i = this.communityChestDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.communityChestDeck[i], this.communityChestDeck[j]] = [this.communityChestDeck[j], this.communityChestDeck[i]];
        }
    }

    // 重新洗牌机会卡片
    private reshuffleChance(): void {
        console.log('🔄 重新洗牌机会卡片');
        this.chanceDeck = [...this.chanceDiscardPile];
        this.chanceDiscardPile = [];
        
        // 洗牌
        for (let i = this.chanceDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.chanceDeck[i], this.chanceDeck[j]] = [this.chanceDeck[j], this.chanceDeck[i]];
        }
    }

    // 执行卡片效果
    public executeCard(card: Card, player: Player, allPlayers: Player[], board: any): CardExecutionResult {
        console.log('⚡ 执行卡片效果:', card.title, '对玩家', player.name);

        let result: CardExecutionResult = {
            success: false,
            message: ''
        };

        try {
            switch (card.effect) {
                case CardEffect.MOVE_TO_POSITION:
                    result = this.handleMoveToPosition(card, player, board);
                    break;

                case CardEffect.MOVE_RELATIVE:
                    result = this.handleMoveRelative(card, player, board);
                    break;

                case CardEffect.COLLECT_MONEY:
                    result = this.handleCollectMoney(card, player, allPlayers);
                    break;

                case CardEffect.PAY_MONEY:
                    result = this.handlePayMoney(card, player, allPlayers);
                    break;

                case CardEffect.PAY_PER_HOUSE:
                    result = this.handlePayPerHouse(card, player, board);
                    break;

                case CardEffect.GO_TO_JAIL:
                    result = this.handleGoToJail(card, player);
                    break;

                case CardEffect.GET_OUT_OF_JAIL_FREE:
                    result = this.handleGetOutOfJailFree(card, player);
                    break;

                case CardEffect.MOVE_TO_NEAREST_RAILROAD:
                    result = this.handleMoveToNearestRailroad(card, player, board);
                    break;

                case CardEffect.MOVE_TO_NEAREST_UTILITY:
                    result = this.handleMoveToNearestUtility(card, player, board);
                    break;

                default:
                    result.message = `未知的卡片效果: ${card.effect}`;
                    break;
            }

            // 如果卡片不能保留，放入相应的弃牌堆
            if (!card.canKeep) {
                if (card.type === CardType.COMMUNITY_CHEST) {
                    this.communityChestDiscardPile.push(card);
                } else if (card.type === CardType.CHANCE) {
                    this.chanceDiscardPile.push(card);
                }
            }

        } catch (error) {
            console.error('执行卡片效果时发生错误:', error);
            result.message = '执行卡片效果时发生错误';
        }

        return result;
    }

    // 移动到指定位置
    private handleMoveToPosition(card: Card, player: Player, board: any): CardExecutionResult {
        const targetPosition = card.targetPosition!;
        const oldPosition = player.position;
        
        // 检查是否经过出发格子
        let passedGo = false;
        if (targetPosition < oldPosition || targetPosition === 0) {
            passedGo = true;
        }

        player.position = targetPosition;

        let moneyGained = 0;
        if (passedGo && targetPosition !== 0) {
            moneyGained += 200;
            player.money += 200;
        } else if (targetPosition === 0) {
            moneyGained += 200; // 正好停在出发格子也获得200
            player.money += 200;
        }

        return {
            success: true,
            message: `${player.name} 移动到 ${targetPosition} 号位置${moneyGained > 0 ? `, 获得 $${moneyGained}` : ''}`,
            playerMoved: true,
            moneyChanged: moneyGained
        };
    }

    // 相对移动
    private handleMoveRelative(card: Card, player: Player, board: any): CardExecutionResult {
        const steps = card.value!;
        const oldPosition = player.position;
        const newPosition = (oldPosition + steps) % 40;
        
        // 检查是否经过出发格子
        let passedGo = newPosition < oldPosition;
        
        player.position = newPosition;

        let moneyGained = 0;
        if (passedGo) {
            moneyGained = 200;
            player.money += 200;
        }

        return {
            success: true,
            message: `${player.name} 前进 ${steps} 步到 ${newPosition} 号位置${moneyGained > 0 ? `, 经过出发获得 $${moneyGained}` : ''}`,
            playerMoved: true,
            moneyChanged: moneyGained
        };
    }

    // 收取金钱
    private handleCollectMoney(card: Card, player: Player, allPlayers: Player[]): CardExecutionResult {
        let totalMoney = 0;

        if (card.id === 15) { // 生日快乐卡片 - 从每位其他玩家收取金钱
            const amountPerPlayer = card.value!;
            const otherPlayers = allPlayers.filter(p => p.id !== player.id && p.status !== PlayerStatus.BANKRUPT);
            
            for (const otherPlayer of otherPlayers) {
                const payment = Math.min(amountPerPlayer, otherPlayer.money);
                otherPlayer.money -= payment;
                totalMoney += payment;
            }
            
            player.money += totalMoney;
            
            return {
                success: true,
                message: `${player.name} 过生日！从其他玩家处总共收取 $${totalMoney}`,
                moneyChanged: totalMoney
            };
        } else {
            // 普通收取金钱
            const amount = card.value!;
            player.money += amount;
            
            return {
                success: true,
                message: `${player.name} 收取 $${amount}`,
                moneyChanged: amount
            };
        }
    }

    // 支付金钱
    private handlePayMoney(card: Card, player: Player, allPlayers?: Player[]): CardExecutionResult {
        const amount = card.value!;
        
        if (card.id === 115) { // 你被选为董事长卡片 - 向每位其他玩家支付金钱
            if (!allPlayers) {
                console.error('处理董事长卡片时缺少玩家列表');
                return {
                    success: false,
                    message: '卡片执行失败'
                };
            }
            
            const otherPlayers = allPlayers.filter(p => p.id !== player.id && p.status !== PlayerStatus.BANKRUPT);
            let totalPaid = 0;
            
            for (const otherPlayer of otherPlayers) {
                const payment = Math.min(amount, player.money - totalPaid);
                if (payment > 0) {
                    otherPlayer.money += payment;
                    totalPaid += payment;
                }
            }
            
            player.money -= totalPaid;
            
            return {
                success: true,
                message: `${player.name} 被选为董事长！向其他玩家总共支付 $${totalPaid}`,
                moneyChanged: -totalPaid
            };
        } else {
            // 普通支付金钱
            player.money -= amount;

            return {
                success: true,
                message: `${player.name} 支付 $${amount}`,
                moneyChanged: -amount
            };
        }
    }

    // 按房屋数量支付
    private handlePayPerHouse(card: Card, player: Player, board: any): CardExecutionResult {
        const houseRate = card.value!; // 每栋房屋的费用
        const hotelRate = 115; // 每座酒店的费用
        
        let totalHouses = 0;
        let totalHotels = 0;

        // 计算玩家拥有的房屋和酒店数量
        for (const propertyId of player.properties) {
            const property = board.getCell(propertyId);
            if (property && property.houses) {
                if (property.houses === 5) { // 5表示酒店
                    totalHotels++;
                } else {
                    totalHouses += property.houses;
                }
            }
        }

        const totalCost = (totalHouses * houseRate) + (totalHotels * hotelRate);
        player.money -= totalCost;

        return {
            success: true,
            message: `${player.name} 支付房屋维修费 $${totalCost} (${totalHouses}栋房屋 × $${houseRate} + ${totalHotels}座酒店 × $${hotelRate})`,
            moneyChanged: -totalCost
        };
    }

    // 进入监狱
    private handleGoToJail(card: Card, player: Player): CardExecutionResult {
        player.position = 10; // 监狱位置
        player.status = PlayerStatus.IN_JAIL;
        player.jailTurns = 0;

        return {
            success: true,
            message: `${player.name} 被送进监狱`,
            playerMoved: true
        };
    }

    // 获得出狱卡
    private handleGetOutOfJailFree(card: Card, player: Player): CardExecutionResult {
        // 将卡片添加到玩家的特殊卡片中
        if (!player.specialCards) {
            player.specialCards = [];
        }
        player.specialCards.push(card);

        return {
            success: true,
            message: `${player.name} 获得出狱卡`,
            cardToKeep: card
        };
    }

    // 移动到最近的车站
    private handleMoveToNearestRailroad(card: Card, player: Player, board: any): CardExecutionResult {
        const railroads = [5, 15, 25, 35]; // 车站位置
        const currentPosition = player.position;
        
        // 找到最近的车站
        let nearestRailroad = railroads[0];
        let minDistance = this.calculateDistance(currentPosition, railroads[0]);
        
        for (const railroad of railroads) {
            const distance = this.calculateDistance(currentPosition, railroad);
            if (distance < minDistance) {
                minDistance = distance;
                nearestRailroad = railroad;
            }
        }

        const oldPosition = player.position;
        player.position = nearestRailroad;
        
        // 检查是否经过出发格子
        let passedGo = nearestRailroad < oldPosition;
        let moneyGained = 0;
        if (passedGo) {
            moneyGained = 200;
            player.money += 200;
        }

        return {
            success: true,
            message: `${player.name} 移动到最近的车站 (位置 ${nearestRailroad})${moneyGained > 0 ? `, 经过出发获得 $${moneyGained}` : ''}`,
            playerMoved: true,
            moneyChanged: moneyGained,
            specialRentType: 'double_railroad' // 标记为双倍车站租金
        };
    }

    // 移动到最近的公用事业
    private handleMoveToNearestUtility(card: Card, player: Player, board: any): CardExecutionResult {
        const utilities = [12, 28]; // 公用事业位置
        const currentPosition = player.position;
        
        // 找到最近的公用事业
        let nearestUtility = utilities[0];
        let minDistance = this.calculateDistance(currentPosition, utilities[0]);
        
        for (const utility of utilities) {
            const distance = this.calculateDistance(currentPosition, utility);
            if (distance < minDistance) {
                minDistance = distance;
                nearestUtility = utility;
            }
        }

        const oldPosition = player.position;
        player.position = nearestUtility;
        
        // 检查是否经过出发格子
        let passedGo = nearestUtility < oldPosition;
        let moneyGained = 0;
        if (passedGo) {
            moneyGained = 200;
            player.money += 200;
        }

        return {
            success: true,
            message: `${player.name} 移动到最近的公用事业 (位置 ${nearestUtility})${moneyGained > 0 ? `, 经过出发获得 $${moneyGained}` : ''}`,
            playerMoved: true,
            moneyChanged: moneyGained,
            specialRentType: 'dice_utility', // 标记为骰子倍数公用事业租金
            needsPlayerChoice: true // 需要重新掷骰子计算租金
        };
    }

    // 计算两个位置之间的距离（考虑环形棋盘）
    private calculateDistance(from: number, to: number): number {
        const directDistance = (to - from + 40) % 40;
        return directDistance;
    }

    // 使用出狱卡
    public useGetOutOfJailCard(player: Player): boolean {
        if (!player.specialCards) {
            return false;
        }

        const jailCardIndex = player.specialCards.findIndex(card => 
            card.effect === CardEffect.GET_OUT_OF_JAIL_FREE
        );

        if (jailCardIndex === -1) {
            return false;
        }

        // 移除出狱卡并将其放回对应的弃牌堆
        const jailCard = player.specialCards.splice(jailCardIndex, 1)[0];
        
        if (jailCard.type === CardType.COMMUNITY_CHEST) {
            this.communityChestDiscardPile.push(jailCard);
        }
        // 将来添加机会卡的处理

        // 释放玩家
        player.status = PlayerStatus.ACTIVE;
        player.jailTurns = 0;

        console.log(`${player.name} 使用出狱卡获得自由`);
        return true;
    }

    // 获取剩余卡片数量
    public getRemainingCardsCount(type: CardType): number {
        switch (type) {
            case CardType.COMMUNITY_CHEST:
                return this.communityChestDeck.length;
            case CardType.CHANCE:
                return this.chanceDeck.length;
            default:
                return 0;
        }
    }
} 