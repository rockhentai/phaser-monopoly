import { Scene } from 'phaser';
import { Board } from '../objects/Board';
import { Dice } from '../objects/Dice';
import { DiceResult, Player, CellType, PlayerStatus, Card, CardType } from '../types/GameTypes';
import { CardManager } from '../objects/CardManager';
import { CardDialog } from '../objects/CardDialog';
import { PropertyManager } from '../objects/PropertyManager';
import { PropertyDialog } from '../objects/PropertyDialog';
import { TaxDialog } from '../objects/TaxDialog';
import { JailDialog } from '../objects/JailDialog';

export class Game extends Scene {
    private board!: Board;
    private dice!: Dice;
    private cardManager!: CardManager;
    private cardDialog!: CardDialog;
    private propertyManager!: PropertyManager;
    private propertyDialog!: PropertyDialog;
    private taxDialog!: TaxDialog;
    private jailDialog!: JailDialog;
    
    // 游戏状态
    private gameStarted: boolean = false;
    private isPlayerTurn: boolean = true;
    private hasRolledThisTurn: boolean = false;
    private consecutiveDoubles: number = 0;
    private lastDiceResult?: DiceResult;
    
    // UI元素
    private statusText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;
    private playerInfoText!: Phaser.GameObjects.Text;
    
    constructor() {
        super('Game');
    }

    create() {
        console.log('🎮 游戏场景开始创建...');
        
        // 设置背景色
        this.cameras.main.setBackgroundColor('#2E8B57'); // 海绿色背景
        
        // 创建棋盘
        this.board = new Board(this);
        
        // 创建骰子
        this.dice = new Dice(this, 850, 200);
        
        // 创建卡片管理器
        this.cardManager = new CardManager(this);
        
        // 创建对话框
        this.cardDialog = new CardDialog(this);
        this.propertyManager = new PropertyManager(this, this.board.getContainer());
        this.propertyDialog = new PropertyDialog(this, this.propertyManager);
        this.taxDialog = new TaxDialog(this);
        this.jailDialog = new JailDialog(this);
        
        // 创建UI
        this.createUI();
        
        // 初始化玩家
        this.board.initializePlayers(2);
        
        // 设置输入监听
        this.setupInputHandlers();
        
        // 更新状态显示
        this.updateGameStatus();
        
        console.log('✅ 游戏场景创建完成');
    }

    private createUI(): void {
        // 状态文本 - 显示在棋盘上方
        this.statusText = this.add.text(350, 50, '游戏准备中...', {
            fontSize: '20px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // 玩家信息文本 - 显示在右侧
        this.playerInfoText = this.add.text(750, 300, '', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            wordWrap: { width: 250 }
        });

        // 操作说明文本 - 显示在底部
        this.instructionText = this.add.text(350, 700, '按空格键开始游戏', {
            fontSize: '18px',
            color: '#FFFF00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
    }

    private setupInputHandlers(): void {
        // 空格键 - 掷骰子或开始游戏
        this.input.keyboard!.on('keydown-SPACE', () => {
            this.handleSpaceKey();
        });

        // 回车键 - 结束回合
        this.input.keyboard!.on('keydown-ENTER', () => {
            this.handleEnterKey();
        });

        // ESC键 - 重新开始游戏
        this.input.keyboard!.on('keydown-ESC', () => {
            this.restartGame();
        });

        // 数字键1-4 - 快速选择玩家数量（游戏开始前）
        for (let i = 1; i <= 4; i++) {
            this.input.keyboard!.on(`keydown-DIGIT${i}`, () => {
                if (!this.gameStarted) {
                    this.board.initializePlayers(i);
                    this.updateGameStatus();
                }
            });
        }
    }

    private handleSpaceKey(): void {
        // 如果有对话框显示，不处理空格键
        if (this.cardDialog.isDialogVisible() || 
            this.propertyDialog.isDialogVisible() || 
            this.taxDialog.isDialogVisible() ||
            this.jailDialog.isDialogVisible()) {
            return;
        }

        if (!this.gameStarted) {
            this.startGame();
        } else if (this.isPlayerTurn && !this.hasRolledThisTurn && !this.board.isPlayerMoving()) {
            this.rollDice();
        }
    }

    private handleEnterKey(): void {
        // 如果有对话框显示，不处理回车键
        if (this.cardDialog.isDialogVisible() || 
            this.propertyDialog.isDialogVisible() || 
            this.taxDialog.isDialogVisible() ||
            this.jailDialog.isDialogVisible()) {
            return;
        }

        if (this.gameStarted && this.hasRolledThisTurn && !this.board.isPlayerMoving()) {
            this.endTurn();
        }
    }

    private startGame(): void {
        this.gameStarted = true;
        this.hasRolledThisTurn = false;
        this.updateGameStatus();
        console.log('🎮 游戏开始！');
    }

    private rollDice(): void {
        if (this.dice.isCurrentlyRolling()) {
            return;
        }

        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            return;
        }

        console.log(`🎲 ${activePlayer.name} 开始掷骰子...`);

        this.dice.roll((result: DiceResult) => {
            this.lastDiceResult = result;
            this.hasRolledThisTurn = true;
            
            console.log(`🎲 掷骰结果: ${result.dice1} + ${result.dice2} = ${result.total}${result.isDouble ? ' (双数!)' : ''}`);

            // 检查连续双数
            if (result.isDouble) {
                this.consecutiveDoubles++;
                if (this.consecutiveDoubles >= 3) {
                    console.log('⚠️ 连续三次双数，进入监狱！');
                    this.sendPlayerToJail(activePlayer);
                    this.endTurn();
                    return;
                }
            } else {
                this.consecutiveDoubles = 0;
            }

            // 检查玩家是否在监狱中
            if (activePlayer.status === PlayerStatus.IN_JAIL) {
                this.handleJailTurn(activePlayer, result);
            } else {
                // 正常移动
                this.movePlayerAndHandleLanding(activePlayer, result.total);
            }
        });
    }

    private handleJailTurn(player: Player, diceResult: DiceResult): void {
        player.jailTurns++;
        
        if (diceResult.isDouble) {
            // 掷出双数，出狱
            console.log(`🎉 ${player.name} 掷出双数，获得自由！`);
            player.status = PlayerStatus.ACTIVE;
            player.jailTurns = 0;
            this.consecutiveDoubles = 0; // 重置连续双数计数
            
            // 移动玩家
            this.movePlayerAndHandleLanding(player, diceResult.total);
        } else if (player.jailTurns >= 3) {
            // 第三回合必须支付出狱
            console.log(`💰 ${player.name} 第三回合，必须支付 $50 出狱`);
            if (player.money >= 50) {
                player.money -= 50;
                player.status = PlayerStatus.ACTIVE;
                player.jailTurns = 0;
                this.movePlayerAndHandleLanding(player, diceResult.total);
            } else {
                console.log(`💸 ${player.name} 资金不足，无法出狱`);
                this.endTurn();
            }
        } else {
            // 显示监狱选择对话框
            const hasJailCard = player.specialCards?.some(card => 
                card.effect === 'get_out_of_jail_free'
            ) || false;
            
            this.jailDialog.showJailOptions(player, hasJailCard, (choice) => {
                this.handleJailChoice(player, choice, diceResult);
            });
        }
    }

    private handleJailChoice(player: Player, choice: 'pay' | 'card' | 'cancel', diceResult: DiceResult): void {
        switch (choice) {
            case 'pay':
                if (player.money >= 50) {
                    player.money -= 50;
                    player.status = PlayerStatus.ACTIVE;
                    player.jailTurns = 0;
                    console.log(`💰 ${player.name} 支付 $50 出狱`);
                    this.movePlayerAndHandleLanding(player, diceResult.total);
                } else {
                    console.log(`💸 ${player.name} 资金不足`);
                    this.endTurn();
                }
                break;
                
            case 'card':
                if (this.cardManager.useGetOutOfJailCard(player)) {
                    console.log(`🎴 ${player.name} 使用出狱卡获得自由`);
                    this.movePlayerAndHandleLanding(player, diceResult.total);
                } else {
                    console.log(`❌ ${player.name} 没有出狱卡`);
                    this.endTurn();
                }
                break;
                
            case 'cancel':
                console.log(`🏛️ ${player.name} 选择继续关押`);
                this.endTurn();
                break;
        }
    }

    private movePlayerAndHandleLanding(player: Player, steps: number): void {
        const oldPosition = player.position;
        
        this.board.movePlayer(player.id, steps, () => {
            const newPosition = player.position;
            
            // 检查是否经过或停在出发点
            if (newPosition < oldPosition || (oldPosition + steps) >= 40) {
                if (newPosition !== 0) {
                    console.log(`💰 ${player.name} 经过出发点，获得 $200`);
                } else {
                    console.log(`🎯 ${player.name} 停在出发点，获得 $200`);
                }
                player.money += 200;
            }
            
            // 处理落地效果
            this.handleLandingEffect(player, newPosition);
        });
    }

    private handleLandingEffect(player: Player, position: number): void {
        const cell = this.board.getCell(position);
        if (!cell) {
            this.updateGameStatus();
            return;
        }

        console.log(`📍 ${player.name} 到达: ${cell.name}`);
        this.board.highlightCell(position);

        switch (cell.type) {
            case CellType.PROPERTY:
            case CellType.RAILROAD:
            case CellType.UTILITY:
                this.handlePropertyLanding(player, position);
                break;
                
            case CellType.CHANCE:
                this.handleChanceLanding(player);
                break;
                
            case CellType.COMMUNITY_CHEST:
                this.handleCommunityChestLanding(player);
                break;
                
            case CellType.TAX:
                this.handleTaxLanding(player, cell);
                break;
                
            case CellType.GO_TO_JAIL:
                this.sendPlayerToJail(player);
                break;
                
            case CellType.GO:
                // 出发点奖励已在移动时处理
                break;
                
            case CellType.JAIL:
                // 只是参观监狱，无特殊效果
                console.log(`👀 ${player.name} 参观监狱`);
                break;
                
            case CellType.FREE_PARKING:
                console.log(`🅿️ ${player.name} 免费停车`);
                break;
                
            default:
                console.log(`❓ 未知格子类型: ${cell.type}`);
        }

        this.updateGameStatus();
    }

    private handlePropertyLanding(player: Player, position: number): void {
        const propertyInfo = this.propertyManager.getPropertyInfo(position);
        if (!propertyInfo) return;

        if (propertyInfo.canPurchase) {
            // 可以购买
            this.propertyDialog.showPurchaseDialog(position, player.id, player.money, (action) => {
                if (action === 'buy') {
                    const result = this.propertyManager.attemptPurchase(position, player.id, player.money);
                    if (result.success) {
                        player.money -= result.cost;
                        player.properties.push(position);
                        console.log(`✅ ${result.message}`);
                    } else {
                        console.log(`❌ ${result.message}`);
                    }
                }
                this.updateGameStatus();
            });
        } else if (propertyInfo.ownerId !== undefined && propertyInfo.ownerId !== player.id) {
            // 需要支付租金
            const rentInfo = this.propertyManager.collectRent(position, player.id, this.lastDiceResult?.total);
            if (rentInfo.amount > 0 && rentInfo.toPlayerId !== undefined) {
                const owner = this.board.getPlayerManager().getPlayer(rentInfo.toPlayerId);
                if (owner) {
                    this.propertyDialog.showRentDialog(
                        position,
                        player.id,
                        rentInfo.toPlayerId,
                        player.name,
                        owner.name,
                        rentInfo.propertyName,
                        rentInfo.amount,
                        () => {
                            player.money -= rentInfo.amount;
                            owner.money += rentInfo.amount;
                            console.log(`💰 ${player.name} 向 ${owner.name} 支付租金 $${rentInfo.amount}`);
                            this.updateGameStatus();
                        }
                    );
                }
            }
        } else if (propertyInfo.ownerId === player.id) {
            // 自己的地产，可以建造
            if (propertyInfo.type === CellType.PROPERTY) {
                this.propertyDialog.showBuildDialog(position, player.id, player.money, (action) => {
                    if (action === 'build') {
                        const result = this.propertyManager.buildHouse(position, player.id);
                        if (result.success) {
                            player.money -= result.cost;
                            console.log(`🏗️ ${result.message}`);
                        } else {
                            console.log(`❌ ${result.message}`);
                        }
                    }
                    this.updateGameStatus();
                });
            }
        }
    }

    private handleChanceLanding(player: Player): void {
        const card = this.cardManager.drawChanceCard();
        const result = this.cardManager.executeCard(card, player, this.board.getPlayerManager().getAllPlayers(), this.board);
        
        this.cardDialog.showCard(card, result, () => {
            if (result.playerMoved) {
                // 更新玩家在棋盘上的位置
                this.board.getPlayerManager().updatePlayerPosition(player.id, player.position);
                
                // 如果移动到新位置，可能需要处理新位置的效果
                if (player.position !== this.board.getPlayerManager().getPlayer(player.id)?.position) {
                    this.handleLandingEffect(player, player.position);
                    return; // 避免重复更新状态
                }
            }
            this.updateGameStatus();
        });
    }

    private handleCommunityChestLanding(player: Player): void {
        const card = this.cardManager.drawCommunityChestCard();
        const result = this.cardManager.executeCard(card, player, this.board.getPlayerManager().getAllPlayers(), this.board);
        
        this.cardDialog.showCard(card, result, () => {
            if (result.playerMoved) {
                // 更新玩家在棋盘上的位置
                this.board.getPlayerManager().updatePlayerPosition(player.id, player.position);
                
                // 如果移动到新位置，可能需要处理新位置的效果
                if (player.position !== this.board.getPlayerManager().getPlayer(player.id)?.position) {
                    this.handleLandingEffect(player, player.position);
                    return; // 避免重复更新状态
                }
            }
            this.updateGameStatus();
        });
    }

    private handleTaxLanding(player: Player, cell: any): void {
        const playerProperties = this.propertyManager.getPlayerProperties(player.id);
        
        this.taxDialog.showTaxDialog(player, cell, playerProperties, (choice) => {
            let taxAmount = 0;
            
            if (cell.name === '所得税') {
                if (choice === 'fixed') {
                    taxAmount = cell.price || 200;
                } else {
                    const totalAssets = this.calculatePlayerAssets(player, playerProperties);
                    taxAmount = Math.floor(totalAssets * 0.1);
                }
            } else {
                // 奢侈税
                taxAmount = cell.price || 100;
            }
            
            player.money -= taxAmount;
            console.log(`💸 ${player.name} 支付 ${cell.name} $${taxAmount}`);
            this.updateGameStatus();
        });
    }

    private calculatePlayerAssets(player: Player, properties: any[]): number {
        let total = player.money;
        
        properties.forEach(prop => {
            const info = prop.getInfo();
            total += info.price || 0;
            if (info.houses > 0) {
                total += info.houses * Math.floor((info.price || 0) / 2);
            }
            if (info.hotel) {
                total += Math.floor((info.price || 0) * 0.8);
            }
        });
        
        return total;
    }

    private sendPlayerToJail(player: Player): void {
        console.log(`🚔 ${player.name} 被送进监狱`);
        player.position = 10; // 监狱位置
        player.status = PlayerStatus.IN_JAIL;
        player.jailTurns = 0;
        this.consecutiveDoubles = 0;
        
        // 更新玩家在棋盘上的位置
        this.board.getPlayerManager().updatePlayerPosition(player.id, 10);
    }

    private endTurn(): void {
        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        
        // 如果掷出双数且不在监狱，可以再次行动
        if (this.lastDiceResult?.isDouble && 
            activePlayer?.status !== PlayerStatus.IN_JAIL && 
            this.consecutiveDoubles < 3) {
            console.log(`🎲 ${activePlayer?.name} 掷出双数，可以再次行动！`);
            this.hasRolledThisTurn = false;
            this.updateGameStatus();
            return;
        }

        // 重置回合状态
        this.hasRolledThisTurn = false;
        this.consecutiveDoubles = 0;
        
        // 切换到下一个玩家
        this.board.nextPlayer();
        this.updateGameStatus();
        
        console.log('🔄 回合结束');
    }

    private updateGameStatus(): void {
        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        const allPlayers = this.board.getPlayerManager().getAllPlayers();
        
        if (!activePlayer) {
            this.statusText.setText('等待玩家初始化...');
            this.instructionText.setText('按数字键1-4选择玩家数量，然后按空格键开始');
            this.playerInfoText.setText('');
            return;
        }

        // 更新状态文本
        let statusMsg = '';
        if (!this.gameStarted) {
            statusMsg = `准备开始 - 当前玩家: ${activePlayer.name} ${activePlayer.emoji}`;
        } else if (activePlayer.status === PlayerStatus.IN_JAIL) {
            statusMsg = `${activePlayer.name} ${activePlayer.emoji} 在监狱中 (第${activePlayer.jailTurns + 1}回合)`;
        } else if (this.hasRolledThisTurn) {
            statusMsg = `${activePlayer.name} ${activePlayer.emoji} 已掷骰 - 按回车键结束回合`;
        } else {
            statusMsg = `${activePlayer.name} ${activePlayer.emoji} 的回合`;
        }
        
        this.statusText.setText(statusMsg);

        // 更新操作说明
        let instructionMsg = '';
        if (!this.gameStarted) {
            instructionMsg = '按空格键开始游戏 | 按数字键1-4选择玩家数量';
        } else if (activePlayer.status === PlayerStatus.IN_JAIL) {
            instructionMsg = '在监狱中 - 按空格键掷骰子尝试出狱';
        } else if (this.hasRolledThisTurn) {
            instructionMsg = '按回车键结束回合';
        } else {
            instructionMsg = '按空格键掷骰子 | 按ESC键重新开始';
        }
        
        this.instructionText.setText(instructionMsg);

        // 更新玩家信息
        let playerInfo = '=== 玩家信息 ===\n';
        allPlayers.forEach((player, index) => {
            const isActive = player.id === activePlayer.id;
            const statusIcon = isActive ? '👉' : '  ';
            const jailInfo = player.status === PlayerStatus.IN_JAIL ? ' [监狱]' : '';
            const propertyCount = player.properties.length;
            
            playerInfo += `${statusIcon} ${player.name} ${player.emoji}\n`;
            playerInfo += `   💰 $${player.money}\n`;
            playerInfo += `   🏠 ${propertyCount}个地产${jailInfo}\n`;
            if (index < allPlayers.length - 1) playerInfo += '\n';
        });
        
        this.playerInfoText.setText(playerInfo);
    }

    private restartGame(): void {
        console.log('🔄 重新开始游戏');
        
        // 重置游戏状态
        this.gameStarted = false;
        this.hasRolledThisTurn = false;
        this.consecutiveDoubles = 0;
        this.isPlayerTurn = true;
        this.lastDiceResult = undefined;
        
        // 重置棋盘和玩家
        this.board.getPlayerManager().resetAllPlayers();
        this.propertyManager.resetAllProperties();
        
        // 重新初始化
        this.board.initializePlayers(2);
        this.updateGameStatus();
    }

    // 场景销毁时的清理
    destroy(): void {
        this.cardDialog?.destroy();
        this.propertyDialog?.destroy();
        this.taxDialog?.destroy();
        this.jailDialog?.destroy();
        this.board?.destroy();
        this.dice?.destroy();
        super.destroy();
    }
}