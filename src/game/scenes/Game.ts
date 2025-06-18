import { Scene } from 'phaser';
import { Board } from '../objects/Board';
import { PropertyManager } from '../objects/PropertyManager';
import { PropertyDialog } from '../objects/PropertyDialog';
import { Dice } from '../objects/Dice';
import { CardManager } from '../objects/CardManager';
import { CardDialog } from '../objects/CardDialog';
import { JailDialog } from '../objects/JailDialog';
import { TaxDialog } from '../objects/TaxDialog';
import { DiceResult, Player, CellType, PlayerStatus } from '../types/GameTypes';

export class Game extends Scene
{
    private board!: Board;
    private propertyManager!: PropertyManager;
    private propertyDialog!: PropertyDialog;
    private dice!: Dice;
    private cardManager!: CardManager;
    private cardDialog!: CardDialog;
    private jailDialog!: JailDialog;
    private taxDialog!: TaxDialog;
    private keys!: {
        ESC: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
        TAB: Phaser.Input.Keyboard.Key;
        NUM_1: Phaser.Input.Keyboard.Key;
        NUM_2: Phaser.Input.Keyboard.Key;
        NUM_3: Phaser.Input.Keyboard.Key;
        NUM_4: Phaser.Input.Keyboard.Key;
        P: Phaser.Input.Keyboard.Key;
        B: Phaser.Input.Keyboard.Key;
        M: Phaser.Input.Keyboard.Key;
        SHIFT: Phaser.Input.Keyboard.Key;
    };
    private instructionText!: Phaser.GameObjects.Text;
    private gameStateText!: Phaser.GameObjects.Text;
    private playerListContainer!: Phaser.GameObjects.Container;
    private playerListBackground!: Phaser.GameObjects.Graphics;
    private playerListTexts: Phaser.GameObjects.Text[] = [];
    private lastDiceResult?: DiceResult;
    private hasRolledThisTurn: boolean = false; // 新增：跟踪当前回合是否已经掷过骰子
    private consecutiveDoubles: number = 0; // 新增：跟踪连续双数次数

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x228B22); // 森林绿背景

        // 创建棋盘
        this.board = new Board(this);

        // 创建地产管理系统
        this.propertyManager = new PropertyManager(this, this.board.getContainer());

        // 创建地产对话框系统
        this.propertyDialog = new PropertyDialog(this, this.propertyManager);

        // 创建卡片管理系统
        this.cardManager = new CardManager(this);
        
        // 创建卡片对话框系统
        this.cardDialog = new CardDialog(this);

        // 创建监狱对话框系统
        this.jailDialog = new JailDialog(this);

        // 创建税收对话框系统
        this.taxDialog = new TaxDialog(this);

        // 创建骰子系统 - 放在右上角
        this.dice = new Dice(this, 900, 150);

        // 创建键盘控制
        this.keys = this.input.keyboard!.addKeys({
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            TAB: Phaser.Input.Keyboard.KeyCodes.TAB,
            NUM_1: Phaser.Input.Keyboard.KeyCodes.ONE,
            NUM_2: Phaser.Input.Keyboard.KeyCodes.TWO,
            NUM_3: Phaser.Input.Keyboard.KeyCodes.THREE,
            NUM_4: Phaser.Input.Keyboard.KeyCodes.FOUR,
            P: Phaser.Input.Keyboard.KeyCodes.P,
            B: Phaser.Input.Keyboard.KeyCodes.B,
            M: Phaser.Input.Keyboard.KeyCodes.M,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
        }) as any;

        // 初始化玩家（默认2个玩家）
        this.board.initializePlayers(2);

        // 创建UI界面
        this.createUI();

        // 设置键盘事件监听
        this.setupKeyboardEvents();

        // 添加鼠标点击事件用于高亮格子
        this.input.on('pointerdown', this.handlePointerDown, this);

        console.log('🎮 大富翁游戏开始！');
        console.log('🎲 按空格键掷骰子');
        console.log('💡 移动到地产时会自动弹出购买/建造对话框');
        console.log('🏦 按M键抵押地产');
        console.log('⏭️ 按Tab键切换玩家');
        console.log('⚡ 按Shift+Tab强制切换');
        console.log('🧪 按1-4键测试移动');
        console.log('🚪 按ESC键返回主菜单');
    }

    private createUI(): void {
        // 创建操作说明
        // this.instructionText = this.add.text(20, 20, 
        //     '🎮 游戏操作：\n' +
        //     '🎲 空格键 - 掷骰子\n' +
        //     '⏭️ Tab键 - 切换玩家\n' +
        //     '⚡ Shift+Tab - 强制切换\n' +
        //     '🏦 M键 - 抵押地产\n' +
        //     '🧪 1-4键 - 测试移动\n' +
        //     '🚪 ESC键 - 返回主菜单\n' +
        //     '👆 点击格子 - 高亮显示\n' +
        //     '💡 购买/建造自动弹窗', 
        //     {
        //         fontSize: '14px',
        //         color: '#FFFFFF',
        //         backgroundColor: '#000000',
        //         padding: { x: 8, y: 6 }
        //     }
        // );
        // this.instructionText.setAlpha(0.8);

        // 创建游戏状态信息 - 移动到棋盘中央上方
        // this.gameStateText = this.add.text(512, 280, '', {
        //     fontSize: '16px',
        //     color: '#000000',
        //     backgroundColor: '#FFFFFF',
        //     padding: { x: 12, y: 8 },
        //     align: 'center'
        // });
        // this.gameStateText.setOrigin(0.5); // 设置中心对齐
        // this.gameStateText.setAlpha(0.9);

        // 创建玩家列表UI
        this.createPlayerListUI();

        this.updateGameStateDisplay();
    }

    private createPlayerListUI(): void {
        console.log('🎯 创建玩家列表UI...');
        // 创建玩家列表容器，位置在棋盘右侧，骰子下方
        const startX = 800; // 向右移动到更合适的位置
        const startY = 250; // 调整到骰子下方，避免重叠
        
        this.playerListContainer = this.add.container(startX, startY);
        console.log(`📍 玩家列表位置: (${startX}, ${startY})`);
        
        // 创建背景 - 减小尺寸以适应屏幕
        this.playerListBackground = this.add.graphics();
        this.playerListBackground.fillStyle(0x000000, 0.8);
        this.playerListBackground.lineStyle(2, 0xFFFFFF);
        this.playerListBackground.fillRoundedRect(0, 0, 220, 340, 10);
        this.playerListBackground.strokeRoundedRect(0, 0, 220, 340, 10);
        this.playerListContainer.add(this.playerListBackground);
        
        // 创建标题
        const title = this.add.text(110, 20, '👥 玩家列表', {
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center'
        });
        title.setOrigin(0.5);
        this.playerListContainer.add(title);
        
        // 初始化玩家文本数组
        this.playerListTexts = [];
        
        this.updatePlayerListDisplay();
    }

    private updatePlayerListDisplay(): void {
        console.log('🔄 更新玩家列表显示...');
        // 清除之前的玩家文本
        this.playerListTexts.forEach(text => text.destroy());
        this.playerListTexts = [];

        const allPlayers = this.board.getPlayerManager().getAllPlayers();
        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        console.log(`👥 共有 ${allPlayers.length} 个玩家`);

        allPlayers.forEach((player, index) => {
            const y = 50 + index * 90; // 每个玩家间隔80像素，增加间距
            
            // 创建玩家卡片背景
            const cardBg = this.add.graphics();
            
            // 根据是否为当前玩家设置背景颜色
            if (activePlayer && player.id === activePlayer.id) {
                cardBg.fillStyle(0x4CAF50, 0.3); // 绿色背景表示当前玩家
                cardBg.lineStyle(2, 0x4CAF50);
            } else {
                cardBg.fillStyle(0x333333, 0.3);
                cardBg.lineStyle(1, 0x666666);
            }
            
            cardBg.fillRoundedRect(10, y - 10, 200, 80, 5); // 增加卡片高度到80
            cardBg.strokeRoundedRect(10, y - 10, 200, 80, 5);
            this.playerListContainer.add(cardBg);

            // 玩家基本信息
            const playerInfo = this.add.text(20, y, 
                `${player.emoji} ${player.name}`, 
                {
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontStyle: 'bold'
                }
            );

            // 金钱信息
            const moneyInfo = this.add.text(20, y + 20, 
                `💰 $${player.money}`, 
                {
                    fontSize: '14px',
                    color: '#FFD700'
                }
            );

            // 位置信息
            const cell = this.board.getCell(player.position);
            const positionInfo = this.add.text(20, y + 35, 
                `📍 ${cell?.name || '未知位置'}`, 
                {
                    fontSize: '12px',
                    color: '#CCCCCC'
                }
            );

            // 状态信息
            let statusText = '';
            let statusColor = '#CCCCCC';
            
            if (player.status === PlayerStatus.IN_JAIL) {
                statusText = `🏛️ 监狱 (${player.jailTurns + 1}/3)`;
                statusColor = '#FF6B6B';
            } else if (activePlayer && player.id === activePlayer.id) {
                statusText = '🎯 当前回合';
                statusColor = '#4CAF50';
            } else {
                statusText = '⏳ 等待中';
                statusColor = '#888888';
            }

            const statusInfo = this.add.text(20, y + 55, statusText, {
                fontSize: '12px',
                color: statusColor
            });

            // 地产数量
            const propertyCount = player.properties.length;
            const propertyInfo = this.add.text(160, y + 20, 
                `🏠 ${propertyCount}`, 
                {
                    fontSize: '12px',
                    color: '#87CEEB'
                }
            );

            // 将所有文本添加到容器和数组中
            this.playerListContainer.add([playerInfo, moneyInfo, positionInfo, statusInfo, propertyInfo]);
            this.playerListTexts.push(playerInfo, moneyInfo, positionInfo, statusInfo, propertyInfo);
        });
    }

    private updateGameStateDisplay(): void {
        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) return;

        // let stateInfo = `🎯 当前玩家: ${activePlayer.name} ${activePlayer.emoji}\n`;
        // stateInfo += `💰 资金: $${activePlayer.money}\n`;
        // stateInfo += `📍 位置: ${activePlayer.position} - ${this.board.getCell(activePlayer.position)?.name}\n`;
        
        // // 显示监狱状态
        // if (activePlayer.status === PlayerStatus.IN_JAIL) {
        //     stateInfo += `🏛️ 监狱状态: 第${activePlayer.jailTurns + 1}回合 | 可选择: 支付罚金或使用出狱卡\n`;
        // }
        
        // 显示当前位置的地产信息
        // const diceTotal = this.lastDiceResult?.total || 0;
        // const propertyInfo = this.propertyManager.getPropertyInfo(activePlayer.position, diceTotal);
        // if (propertyInfo) {
        //     if (propertyInfo.canPurchase) {
        //         stateInfo += `🏠 可购买！价格: $${propertyInfo.price} (移动后自动弹窗)\n`;
        //     } else if (propertyInfo.ownerId !== undefined) {
        //         const owner = this.board.getPlayerManager().getPlayer(propertyInfo.ownerId);
        //         if (propertyInfo.ownerId === activePlayer.id) {
        //             stateInfo += `🏡 你的地产 | 当前租金: $${propertyInfo.currentRent} | 可建造: ${propertyInfo.houses < 4 || (!propertyInfo.hotel && propertyInfo.houses === 4) ? '是' : '否'}\n`;
        //         } else {
        //             stateInfo += `👤 所有者: ${owner?.name || '未知'} | 租金: $${propertyInfo.currentRent}\n`;
        //         }
        //     }
        // }
        
        // 显示回合状态
        // if (this.hasRolledThisTurn) {
        //     if (this.board.isPlayerMoving()) {
        //         stateInfo += `🚶 正在移动中...`;
        //     } else if (this.lastDiceResult?.isDouble) {
        //         stateInfo += `🎉 双数奖励！可以再次掷骰子`;
        //     } else {
        //         stateInfo += `🎯 回合进行中 - 可以购买地产(自动切换玩家)`;
        //     }
        // } else {
        //     stateInfo += `🎲 可以掷骰子`;
        // }
        
        // if (this.lastDiceResult) {
        //     stateInfo += `\n上次掷骰: ${this.lastDiceResult.dice1} + ${this.lastDiceResult.dice2} = ${this.lastDiceResult.total}`;
        //     if (this.lastDiceResult.isDouble) {
        //         stateInfo += ' (双数!)';
        //     }
        // }

        // this.gameStateText.setText(stateInfo);
        
        // 更新玩家列表显示
        if (this.playerListContainer) {
            this.updatePlayerListDisplay();
        }
    }

    private setupKeyboardEvents(): void {
        // ESC键返回主菜单
        this.keys.ESC.on('down', () => {
            this.scene.start('MainMenu');
        });

        // 空格键掷骰子
        this.keys.SPACE.on('down', () => {
            this.rollDiceAndMove();
        });

        // Tab键切换玩家
        this.keys.TAB.on('down', () => {
            this.switchToNextPlayer();
        });

        // 数字键测试移动
        this.keys.NUM_1.on('down', () => {
            this.testMovePlayer(1);
        });

        this.keys.NUM_2.on('down', () => {
            this.testMovePlayer(2);
        });

        this.keys.NUM_3.on('down', () => {
            this.testMovePlayer(3);
        });

        this.keys.NUM_4.on('down', () => {
            this.testMovePlayer(4);
        });

        // P键购买地产
        this.keys.P.on('down', () => {
            this.handlePropertyPurchase();
        });

        // B键建造房屋
        this.keys.B.on('down', () => {
            this.handleBuildHouse();
        });

        // M键抵押地产
        this.keys.M.on('down', () => {
            this.handleMortgage();
        });

        // Shift+Tab键强制切换玩家
        this.keys.SHIFT.on('down', () => {
            if (this.input.keyboard!.checkDown(this.keys.TAB)) {
                this.forceNextPlayer();
            }
        });
    }

    private rollDiceAndMove(): void {
        // 检查是否有玩家在移动或骰子在滚动或对话框已打开
        if (this.board.isPlayerMoving() || this.dice.isCurrentlyRolling() || this.propertyDialog.isDialogVisible()) {
            console.log('⚠️ 请等待当前操作完成');
            return;
        }

        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            console.log('❌ 没有活跃玩家！');
            return;
        }

        // 如果玩家在监狱中，处理监狱逻辑
        if (activePlayer.status === PlayerStatus.IN_JAIL) {
            this.handleJailRoll(activePlayer);
            return;
        }

        // 检查当前玩家是否已经掷过骰子（除非是双数）
        if (this.hasRolledThisTurn && !(this.lastDiceResult?.isDouble)) {
            console.log('⚠️ 当前玩家已经掷过骰子，请等待移动完成后自动切换玩家');
            return;
        }

        console.log(`🎲 ${activePlayer.name} 开始掷骰子...`);

        // 掷骰子并在完成后移动玩家
        this.dice.roll((result: DiceResult) => {
            this.lastDiceResult = result;
            this.hasRolledThisTurn = true; // 标记本回合已掷骰子
            
            console.log(`🎲 ${activePlayer.name} 掷出: ${result.dice1} + ${result.dice2} = ${result.total}`);
            
            // 处理连续双数计数
            if (result.isDouble) {
                this.consecutiveDoubles++;
                console.log(`🎉 掷出双数！连续第${this.consecutiveDoubles}次`);
                
                // 检查是否连续三次双数
                if (this.consecutiveDoubles >= 3) {
                    console.log('🏛️ 连续三次双数！直接进入监狱');
                    this.sendPlayerToJail(activePlayer, '连续三次双数');
                    return;
                }
                
                console.log('💡 双数奖励！完成移动后可以再次掷骰子');
            } else {
                // 重置连续双数计数
                this.consecutiveDoubles = 0;
            }

            // 更新状态显示
            this.updateGameStateDisplay();

            // 等待一小段时间让玩家看清结果，然后开始移动
            this.time.delayedCall(500, () => {
                // 使用移动完成回调来处理后续逻辑
                this.board.movePlayer(activePlayer.id, result.total, () => {
                    // 移动完成的回调
                    console.log(`✅ ${activePlayer.name} 移动完成`);
                    
                    // 更新显示
                    this.updateGameStateDisplay();
                    
                    if (result.isDouble) {
                        // 双数：先处理地产，然后允许再次掷骰子
                        console.log('💡 双数奖励！处理完当前位置后可以再次掷骰子');
                        this.handleMoveCompletion(activePlayer, true); // 传入 true 表示是双数情况
                    } else {
                        // 非双数：处理地产
                        this.handleMoveCompletion(activePlayer);
                    }
                });
            });
        });
    }

    // 处理玩家移动完成后的逻辑
    private handleMoveCompletion(player: Player, isDouble: boolean = false, specialRentType?: 'double_railroad' | 'dice_utility'): void {
        const cell = this.board.getCell(player.position);
        const propertyInfo = this.propertyManager.getPropertyInfo(player.position);
        
        console.log('handleMoveCompletion', player.name, '到达位置', player.position, cell?.name, '类型:', cell?.type);
        
        // 首先检查特殊格子
        if (cell?.type === CellType.GO) {
            console.log('🎯 正好停在出发点！获得额外奖励');
            // 玩家正好停在出发点，额外获得$200（总共$400）
            player.money += 200;
            console.log(`💰 ${player.name} 正好停在出发点，额外获得 $200！当前资金: $${player.money}`);
            this.updateGameStateDisplay();
            // 延迟后处理回合结束
            this.time.delayedCall(1000, () => {
                this.handleTurnEnd(player, isDouble);
            });
            return;
        }
        
        if (cell?.type === CellType.COMMUNITY_CHEST) {
            console.log('🎴 到达命运格子，抽取命运卡片');
            this.handleCommunityChestCard(player, isDouble);
            return;
        }
        
        if (cell?.type === CellType.CHANCE) {
            console.log('🎯 到达机会格子，抽取机会卡片');
            this.handleChanceCard(player, isDouble);
            return;
        }
        
        if (cell?.type === CellType.JAIL) {
            console.log('👀 到达监狱格子，仅参观');
            // 只是参观监狱，无特殊效果，直接结束回合
            this.handleTurnEnd(player, isDouble);
            return;
        }
        
        if (cell?.type === CellType.GO_TO_JAIL) {
            console.log('🚔 到达进入监狱格子');
            this.sendPlayerToJail(player, '落在进入监狱格子');
            return;
        }
        
        if (cell?.type === CellType.TAX) {
            console.log('💸 到达税收格子，需要支付税金');
            this.handleTax(player, cell, isDouble);
            return;
        }
        
        // 然后检查是否需要收租
        let diceTotal = this.lastDiceResult?.total || 0;
        
        // 如果是公用事业的特殊租金，需要重新掷骰子
        if (specialRentType === 'dice_utility' && cell?.type === CellType.UTILITY) {
            console.log('⚡ 公用事业特殊租金：需要重新掷骰子计算租金');
            // 这里应该重新掷骰子，但为了简化，我们使用当前骰子结果
            // 在实际游戏中，这里应该弹出对话框让玩家重新掷骰子
        }
        
        const rentInfo = this.propertyManager.collectRent(player.position, player.id, diceTotal, specialRentType);
        
        if (rentInfo.amount > 0 && rentInfo.toPlayerId !== undefined) {
            const owner = this.board.getPlayerManager().getPlayer(rentInfo.toPlayerId);
            if (owner) {
                console.log('💰 到达他人地产，需要支付租金');
                this.propertyDialog.showRentDialog(
                    player.position,
                    player.id,
                    rentInfo.toPlayerId,
                    player.name,
                    owner.name,
                    rentInfo.propertyName,
                    rentInfo.amount,
                    () => {
                        // 执行收租
                        this.handleRentPayment(player, owner, { 
                            currentRent: rentInfo.amount, 
                            name: rentInfo.propertyName 
                        }, isDouble);
                    }
                );
                return; // 等待收租对话框处理完成
            }
        }
        
        // 最后处理地产购买/建造
        if (propertyInfo && propertyInfo.canPurchase) {
            console.log('🏠 到达可购买地产，弹出购买对话框');
            // 弹出购买对话框
            this.propertyDialog.showPurchaseDialog(
                player.position,
                player.id,
                player.money,
                (action) => {
                    if (action === 'buy') {
                        this.executePurchase(player, isDouble);
                    } else {
                        // 取消购买，处理回合结束
                        this.handleTurnEnd(player, isDouble);
                    }
                }
            );
        } else if (propertyInfo && propertyInfo.ownerId === player.id) {
            // 玩家自己的地产，检查是否可以建造
            if (propertyInfo.houses < 4 || (!propertyInfo.hotel && propertyInfo.houses === 4)) {
                console.log('🏗️ 到达自己的地产，弹出建造对话框');
                this.propertyDialog.showBuildDialog(
                    player.position,
                    player.id,
                    player.money,
                    (action) => {
                        if (action === 'build') {
                            this.executeBuild(player, isDouble);
                        } else {
                            // 取消建造，处理回合结束
                            this.handleTurnEnd(player, isDouble);
                        }
                    }
                );
            } else {
                // 已经是最高级别的地产，直接结束回合
                this.handleTurnEnd(player, isDouble);
            }
        } else {
            // 没有可购买地产或可建造的情况，直接结束回合
            this.handleTurnEnd(player, isDouble);
        }
    }

    // 执行购买操作
    private executePurchase(player: any, isDouble: boolean = false): void {
        const result = this.propertyManager.attemptPurchase(
            player.position, 
            player.id, 
            player.money
        );

        if (result.success) {
            // 扣除玩家资金
            player.money -= result.cost;
            player.properties.push(player.position);
            console.log(`✅ ${result.message}`);
            console.log(`💰 剩余资金: $${player.money}`);
            
            // 延迟更新状态显示，确保地产信息已正确更新
            this.time.delayedCall(100, () => {
                const updatedPropertyInfo = this.propertyManager.getPropertyInfo(player.position);
                console.log(`📊 购买后地产信息更新: ${updatedPropertyInfo?.name} 租金: $${updatedPropertyInfo?.currentRent}`);
                this.updateGameStateDisplay();
            });
            
            // 购买完成，处理回合结束
            this.time.delayedCall(1000, () => {
                this.handleTurnEnd(player, isDouble);
            });
        } else {
            console.log(`❌ ${result.message}`);
            this.updateGameStateDisplay();
        }
    }

    // 执行建造操作
    private executeBuild(player: any, isDouble: boolean = false): void {
        const result = this.propertyManager.buildHouse(player.position, player.id);

        if (result.success) {
            // 扣除建造费用
            player.money -= result.cost;
            console.log(`✅ ${result.message}，花费 $${result.cost}`);
            console.log(`💰 剩余资金: $${player.money}`);
            
            this.updateGameStateDisplay();
            
            // 建造完成，处理回合结束
            this.time.delayedCall(1000, () => {
                this.handleTurnEnd(player, isDouble);
            });
        } else {
            console.log(`❌ ${result.message}`);
            this.updateGameStateDisplay();
        }
    }

    // 切换到下一个玩家并重置回合状态
    private switchToNextPlayerAndResetTurn(): void {
        this.board.nextPlayer();
        this.hasRolledThisTurn = false; // 重置新玩家的掷骰子状态
        this.consecutiveDoubles = 0; // 重置连续双数计数
        this.updateGameStateDisplay();
        
        const newActivePlayer = this.board.getPlayerManager().getActivePlayer();
        if (newActivePlayer) {
            console.log(`⏭️ 轮到 ${newActivePlayer.name} ${newActivePlayer.emoji}`);
        }
    }

    private testMovePlayer(steps: number): void {
        // 检查是否有玩家在移动或骰子在滚动
        if (this.board.isPlayerMoving() || this.dice.isCurrentlyRolling()) {
            console.log('⚠️ 请等待当前操作完成');
            return;
        }

        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            console.log('❌ 没有活跃玩家！');
            return;
        }

        console.log(`🧪 测试移动: ${activePlayer.name} 移动 ${steps} 步`);
        this.board.movePlayer(activePlayer.id, steps);
        
        // 移动完成后更新显示
        this.time.delayedCall(steps * 500 + 500, () => {
            this.updateGameStateDisplay();
        });
    }

    private switchToNextPlayer(): void {
        // 检查是否有玩家在移动或骰子在滚动
        if (this.board.isPlayerMoving() || this.dice.isCurrentlyRolling()) {
            console.log('⚠️ 请等待当前操作完成');
            return;
        }

        // 检查当前玩家是否已经掷过骰子
        if (!this.hasRolledThisTurn) {
            console.log('⚠️ 当前玩家还未掷骰子，确定要切换吗？请先掷骰子 (按空格键)');
            return;
        }

        this.switchToNextPlayerAndResetTurn();
        console.log('⏭️ 手动切换到下一个玩家');
    }

    private forceNextPlayer(): void {
        // 检查是否有玩家在移动或骰子在滚动
        if (this.board.isPlayerMoving() || this.dice.isCurrentlyRolling()) {
            console.log('⚠️ 请等待当前操作完成');
            return;
        }

        this.switchToNextPlayerAndResetTurn();
        console.log('⚡ 强制切换到下一个玩家');
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer): void {
        // 随机高亮一个格子进行测试
        const randomPosition = Phaser.Math.Between(0, 39);
        const cell = this.board.getCell(randomPosition);
        if (cell) {
            this.board.highlightCell(randomPosition);
            console.log(`👆 点击高亮格子 ${randomPosition}: ${cell.name}`);
            
            // 显示格子详细信息
            if (cell.price) {
                console.log(`💰 价格: $${cell.price}`);
            }
            if (cell.type) {
                console.log(`🏷️ 类型: ${cell.type}`);
            }
            
            // 显示在该位置的玩家
            const playersAtPosition = this.board.getPlayerManager().getPlayersAtPosition(randomPosition);
            if (playersAtPosition.length > 0) {
                const playerNames = playersAtPosition.map(p => `${p.name}(${p.emoji})`).join(', ');
                console.log(`👥 该位置的玩家: ${playerNames}`);
            }
        }
    }

    // === 地产系统相关方法 ===

    private handlePropertyPurchase(): void {
        // 如果对话框已经打开，不处理手动购买
        if (this.propertyDialog.isDialogVisible()) {
            console.log('⚠️ 购买对话框已打开，请在对话框中操作');
            return;
        }

        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            console.log('❌ 没有活跃玩家！');
            return;
        }

        // 检查是否已经掷过骰子且移动完成
        if (!this.hasRolledThisTurn) {
            console.log('⚠️ 请先掷骰子移动到地产位置！');
            return;
        }

        const result = this.propertyManager.attemptPurchase(
            activePlayer.position, 
            activePlayer.id, 
            activePlayer.money
        );

        if (result.success) {
            // 扣除玩家资金
            activePlayer.money -= result.cost;
            activePlayer.properties.push(activePlayer.position);
            console.log(`✅ ${result.message}`);
            console.log(`💰 剩余资金: $${activePlayer.money}`);
            console.log(`⏭️ 购买完成，1.5秒后自动切换到下一个玩家`);
            
            this.updateGameStateDisplay();
            
            // 购买成功后延迟切换到下一个玩家
            this.time.delayedCall(1500, () => {
                // 确保当前玩家还是同一个（防止已经手动切换）
                const currentActivePlayer = this.board.getPlayerManager().getActivePlayer();
                if (currentActivePlayer && currentActivePlayer.id === activePlayer.id) {
                    this.switchToNextPlayerAndResetTurn();
                }
            });
        } else {
            console.log(`❌ ${result.message}`);
            this.updateGameStateDisplay();
        }
    }

    private handleBuildHouse(): void {
        // 如果对话框已经打开，不处理手动建造
        if (this.propertyDialog.isDialogVisible()) {
            console.log('⚠️ 建造对话框已打开，请在对话框中操作');
            return;
        }

        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            console.log('❌ 没有活跃玩家！');
            return;
        }

        // 检查是否已经掷过骰子且移动完成
        if (!this.hasRolledThisTurn) {
            console.log('⚠️ 请先掷骰子移动到地产位置！');
            return;
        }

        const result = this.propertyManager.buildHouse(activePlayer.position, activePlayer.id);

        if (result.success) {
            // 扣除建造费用
            activePlayer.money -= result.cost;
            console.log(`✅ ${result.message}，花费 $${result.cost}`);
            console.log(`💰 剩余资金: $${activePlayer.money}`);
            console.log(`⏭️ 建造完成，1.5秒后自动切换到下一个玩家`);
            
            this.updateGameStateDisplay();
            
            // 建造成功后延迟切换到下一个玩家
            this.time.delayedCall(1500, () => {
                // 确保当前玩家还是同一个（防止已经手动切换）
                const currentActivePlayer = this.board.getPlayerManager().getActivePlayer();
                if (currentActivePlayer && currentActivePlayer.id === activePlayer.id) {
                    this.switchToNextPlayerAndResetTurn();
                }
            });
        } else {
            console.log(`❌ ${result.message}`);
            this.updateGameStateDisplay();
        }
    }

    private handleMortgage(): void {
        const activePlayer = this.board.getPlayerManager().getActivePlayer();
        if (!activePlayer) {
            console.log('❌ 没有活跃玩家！');
            return;
        }

        const result = this.propertyManager.mortgageProperty(activePlayer.position, activePlayer.id);

        if (result.success) {
            // 增加玩家资金
            activePlayer.money += result.value;
            console.log(`✅ ${result.message}`);
            console.log(`💰 剩余资金: $${activePlayer.money}`);
            console.log(`⏭️ 抵押完成，1.5秒后自动切换到下一个玩家`);
            
            this.updateGameStateDisplay();
            
            // 抵押成功后延迟切换到下一个玩家
            this.time.delayedCall(1500, () => {
                // 确保当前玩家还是同一个（防止已经手动切换）
                const currentActivePlayer = this.board.getPlayerManager().getActivePlayer();
                if (currentActivePlayer && currentActivePlayer.id === activePlayer.id) {
                    this.switchToNextPlayerAndResetTurn();
                }
            });
        } else {
            console.log(`❌ ${result.message}`);
            this.updateGameStateDisplay();
        }
    }

    // 处理命运卡片
    private handleCommunityChestCard(player: Player, isDouble: boolean): void {
        // 检查是否有对话框打开
        if (this.propertyDialog.isDialogVisible() || this.cardDialog.isDialogVisible()) {
            console.log('⚠️ 已有对话框打开，等待关闭');
            return;
        }

        try {
            // 抽取命运卡片
            const card = this.cardManager.drawCommunityChestCard();
            
            // 执行卡片效果
            const allPlayers = this.board.getPlayerManager().getAllPlayers();
            const executionResult = this.cardManager.executeCard(card, player, allPlayers, this.board);
            
            console.log('🎴 卡片执行结果:', executionResult.message);
            
            // 如果卡片执行导致玩家移动，更新显示
            if (executionResult.playerMoved) {
                // 更新玩家位置显示
                this.board.getPlayerManager().updatePlayerTokenPosition(player.id);
            }
            
            // 显示卡片对话框
            this.cardDialog.showCard(card, executionResult, (confirmed) => {
                if (confirmed) {
                    console.log('✅ 卡片效果已确认');
                    
                    // 更新游戏状态显示
                    this.updateGameStateDisplay();
                    
                    // 如果卡片执行后玩家发生了移动，需要再次检查新位置
                    if (executionResult.playerMoved) {
                        console.log('🔄 卡片效果导致移动，检查新位置效果');
                        // 递归处理新位置的效果
                        this.time.delayedCall(500, () => {
                            this.handleMoveCompletion(player, isDouble);
                        });
                        return;
                    }
                    
                    // 处理回合结束
                    this.handleTurnEnd(player, isDouble);
                }
            });
            
        } catch (error) {
            console.error('❌ 处理命运卡片时发生错误:', error);
            // 发生错误时直接处理回合结束
            this.handleTurnEnd(player, isDouble);
        }
    }

    // 处理机会卡片
    private handleChanceCard(player: Player, isDouble: boolean): void {
        // 检查是否有对话框打开
        if (this.propertyDialog.isDialogVisible() || this.cardDialog.isDialogVisible()) {
            console.log('⚠️ 已有对话框打开，等待关闭');
            return;
        }

        try {
            // 抽取机会卡片
            const card = this.cardManager.drawChanceCard();
            
            // 执行卡片效果
            const allPlayers = this.board.getPlayerManager().getAllPlayers();
            const executionResult = this.cardManager.executeCard(card, player, allPlayers, this.board);
            
            console.log('🎯 卡片执行结果:', executionResult.message);
            
            // 如果卡片执行导致玩家移动，更新显示
            if (executionResult.playerMoved) {
                // 更新玩家位置显示
                this.board.getPlayerManager().updatePlayerTokenPosition(player.id);
            }
            
            // 显示卡片对话框
            this.cardDialog.showCard(card, executionResult, (confirmed) => {
                if (confirmed) {
                    console.log('✅ 卡片效果已确认');
                    
                    // 更新游戏状态显示
                    this.updateGameStateDisplay();
                    
                    // 如果卡片执行后玩家发生了移动，需要再次检查新位置
                    if (executionResult.playerMoved) {
                        console.log('🔄 卡片效果导致移动，检查新位置效果');
                        // 递归处理新位置的效果，传递特殊租金类型
                        this.time.delayedCall(500, () => {
                            this.handleMoveCompletion(player, isDouble, executionResult.specialRentType);
                        });
                        return;
                    }
                    
                    // 处理回合结束
                    this.handleTurnEnd(player, isDouble);
                }
            });
            
        } catch (error) {
            console.error('❌ 处理机会卡片时发生错误:', error);
            // 发生错误时直接处理回合结束
            this.handleTurnEnd(player, isDouble);
        }
    }

    // 处理回合结束
    private handleTurnEnd(player: Player, isDouble: boolean): void {
        if (isDouble) {
            // 双数情况：重置掷骰子状态，允许再次掷骰子
            console.log('⏭️ 回合结束，双数奖励！可以再次掷骰子');
            this.hasRolledThisTurn = false;
            this.updateGameStateDisplay();
        } else {
            // 非双数情况：立即切换玩家
            console.log('⏭️ 回合结束，切换到下一个玩家');
            // 给一个很短的延迟让玩家看到状态更新
            this.time.delayedCall(500, () => {
                const currentActivePlayer = this.board.getPlayerManager().getActivePlayer();
                if (currentActivePlayer && currentActivePlayer.id === player.id) {
                    this.switchToNextPlayerAndResetTurn();
                }
            });
        }
    }

    // 处理租金支付
    private handleRentPayment(player: any, owner: any, propertyInfo: any, isDouble: boolean): void {
        const rentAmount = propertyInfo.currentRent;
        
        // 扣除当前玩家的资金
        player.money -= rentAmount;
        
        // 增加地产所有者的资金
        owner.money += rentAmount;
        
        console.log(`💰 ${player.name} 向 ${owner.name} 支付租金 $${rentAmount} (${propertyInfo.name})`);
        console.log(`💳 ${player.name} 剩余资金: $${player.money}`);
        console.log(`💳 ${owner.name} 剩余资金: $${owner.money}`);
        
        // 检查玩家是否破产
        if (player.money < 0) {
            console.log(`🏦 ${player.name} 资金不足！需要处理债务...`);
            // TODO: 实现破产处理逻辑
        }
        
        // 更新游戏状态显示
        this.updateGameStateDisplay();
        
        // 收租完成后处理回合结束
        this.time.delayedCall(1000, () => {
            this.handleTurnEnd(player, isDouble);
        });
    }

    // 发送玩家进入监狱
    private sendPlayerToJail(player: Player, reason: string): void {
        console.log(`🏛️ ${player.name} 因${reason}进入监狱`);
        
        // 设置玩家状态
        player.status = PlayerStatus.IN_JAIL;
        player.position = 10; // 监狱位置
        player.jailTurns = 0;
        
        // 重置连续双数计数
        this.consecutiveDoubles = 0;
        
        // 更新玩家位置显示
        this.board.getPlayerManager().updatePlayerTokenPosition(player.id);
        
        // 更新游戏状态显示
        this.updateGameStateDisplay();
        
        // 延迟后切换到下一个玩家
        this.time.delayedCall(1000, () => {
            this.switchToNextPlayerAndResetTurn();
        });
    }

    // 处理在监狱中掷骰子
    private handleJailRoll(player: Player): void {
        console.log(`🏛️ ${player.name} 在监狱中，显示监狱选择对话框...`);
        
        // 检查是否有出狱卡
        const hasJailCard = player.specialCards && 
                           player.specialCards.some(card => card.effect === 'get_out_of_jail_free' as any);
        
        // 显示监狱选择对话框
        this.jailDialog.showJailOptions(player, hasJailCard || false, (choice) => {
            switch (choice) {
                case 'pay':
                    this.handleJailPayment(player);
                    break;
                    
                case 'card':
                    this.handleJailCardUse(player);
                    break;
                    
                case 'cancel':
                    this.rollDiceInJail(player);
                    break;
            }
        });
    }
    
    // 处理支付出狱费用
    private handleJailPayment(player: Player): void {
        if (player.money >= 50) {
            player.money -= 50;
            console.log(`💰 ${player.name} 支付$50出狱`);
            this.releasePlayerFromJail(player, '支付$50');
            
            // 出狱后重新掷骰子
            this.rollDiceAfterJailRelease(player);
        } else {
            console.log('💸 资金不足支付出狱费用！');
            // 资金不足，只能掷骰子尝试双数
            this.rollDiceInJail(player);
        }
    }
    
    // 处理使用出狱卡
    private handleJailCardUse(player: Player): void {
        if (this.cardManager.useGetOutOfJailCard(player)) {
            console.log(`🎴 ${player.name} 使用出狱卡出狱`);
            this.releasePlayerFromJail(player, '使用出狱卡');
            
            // 出狱后重新掷骰子
            this.rollDiceAfterJailRelease(player);
        } else {
            console.log('❌ 没有可用的出狱卡！');
            // 没有出狱卡，只能掷骰子尝试双数
            this.rollDiceInJail(player);
        }
    }
    
    // 在监狱中掷骰子
    private rollDiceInJail(player: Player): void {
        console.log(`🎲 ${player.name} 在监狱中掷骰子尝试出狱...`);
        
        this.dice.roll((result: DiceResult) => {
            this.lastDiceResult = result;
            this.hasRolledThisTurn = true;
            
            console.log(`🎲 ${player.name} 在监狱中掷出: ${result.dice1} + ${result.dice2} = ${result.total}`);
            
            if (result.isDouble) {
                // 掷出双数，立即出狱并移动
                console.log('🎉 掷出双数！立即出狱并移动');
                this.releasePlayerFromJail(player, '掷出双数');
                
                // 等待一小段时间然后移动
                this.time.delayedCall(1000, () => {
                    this.board.movePlayer(player.id, result.total, () => {
                        console.log(`✅ ${player.name} 出狱后移动完成`);
                        this.updateGameStateDisplay();
                        // 不重置双数计数，因为仍可再次掷骰子
                        this.handleMoveCompletion(player, true);
                    });
                });
            } else {
                // 没掷出双数，增加监狱回合数
                player.jailTurns++;
                console.log(`❌ 未掷出双数，继续关押，这是第${player.jailTurns}回合`);
                
                // 检查是否已经3回合，强制出狱
                if (player.jailTurns >= 3) {
                    console.log('⚖️ 已关押3回合，必须支付$50出狱');
                    if (player.money >= 50) {
                        player.money -= 50;
                        this.releasePlayerFromJail(player, '强制出狱并支付$50');
                        
                        // 等待一小段时间然后移动
                        this.time.delayedCall(1000, () => {
                            this.board.movePlayer(player.id, result.total, () => {
                                console.log(`✅ ${player.name} 强制出狱后移动完成`);
                                this.updateGameStateDisplay();
                                this.handleMoveCompletion(player);
                            });
                        });
                    } else {
                        console.log('💸 资金不足支付出狱费用！');
                        // TODO: 处理破产逻辑
                        this.updateGameStateDisplay();
                        this.time.delayedCall(1000, () => {
                            this.switchToNextPlayerAndResetTurn();
                        });
                    }
                } else {
                    // 继续关押，切换到下一个玩家
                    this.updateGameStateDisplay();
                    this.time.delayedCall(1000, () => {
                        this.switchToNextPlayerAndResetTurn();
                    });
                }
            }
        });
    }
    
    // 出狱后掷骰子移动
    private rollDiceAfterJailRelease(player: Player): void {
        this.time.delayedCall(1000, () => {
            this.dice.roll((result: DiceResult) => {
                this.lastDiceResult = result;
                console.log(`🎲 ${player.name} 出狱后掷骰子: ${result.dice1} + ${result.dice2} = ${result.total}`);
                
                this.board.movePlayer(player.id, result.total, () => {
                    console.log(`✅ ${player.name} 出狱后移动完成`);
                    this.updateGameStateDisplay();
                    this.handleMoveCompletion(player, result.isDouble);
                });
            });
        });
    }
    
    // 释放玩家出狱
    private releasePlayerFromJail(player: Player, reason: string): void {
        console.log(`🔓 ${player.name} ${reason}，出狱！`);
        
        // 恢复玩家状态
        player.status = PlayerStatus.ACTIVE;
        player.jailTurns = 0;
        
        // 更新游戏状态显示
        this.updateGameStateDisplay();
    }

    // 处理税收格子
    private handleTax(player: Player, cell: any, isDouble: boolean): void {
        console.log(`💸 ${player.name} 到达税收格子: ${cell.name}`);
        
        // 获取玩家拥有的地产
        const playerProperties = this.propertyManager.getPlayerProperties(player.id);
        
        // 显示税收对话框
        this.taxDialog.showTaxDialog(player, cell, playerProperties, (choice) => {
            this.processTaxPayment(player, cell, choice, playerProperties, isDouble);
        });
    }
    
    // 处理税收支付
    private processTaxPayment(
        player: Player, 
        cell: any, 
        choice: 'fixed' | 'percentage', 
        playerProperties: any[], 
        isDouble: boolean
    ): void {
        let taxAmount = 0;
        
        if (cell.name === '所得税') {
            const fixedAmount = cell.price || 200; // $200 固定金额
            
            if (choice === 'fixed') {
                taxAmount = fixedAmount;
                console.log(`💸 ${player.name} 选择支付固定所得税: $${taxAmount}`);
            } else {
                // 计算总资产的10%
                const totalAssets = this.calculatePlayerTotalAssets(player, playerProperties);
                const percentageAmount = Math.floor(totalAssets * 0.1);
                taxAmount = percentageAmount;
                console.log(`💸 ${player.name} 选择支付资产10%所得税: $${taxAmount} (总资产: $${totalAssets})`);
            }
        } else {
            // 奢侈税固定金额
            taxAmount = cell.price || 100;
            console.log(`💸 ${player.name} 支付奢侈税: $${taxAmount}`);
        }
        
        // 扣除玩家资金
        player.money -= taxAmount;
        console.log(`💳 ${player.name} 支付税收后剩余资金: $${player.money}`);
        
        // 检查玩家是否破产
        if (player.money < 0) {
            console.log(`🏦 ${player.name} 资金不足！需要处理债务...`);
            // TODO: 实现破产处理逻辑
        }
        
        // 更新游戏状态显示
        this.updateGameStateDisplay();
        
        // 税收支付完成后处理回合结束
        this.time.delayedCall(1000, () => {
            this.handleTurnEnd(player, isDouble);
        });
    }
    
    // 计算玩家总资产（现金 + 地产价值 + 建筑价值）
    private calculatePlayerTotalAssets(player: Player, playerProperties: any[]): number {
        let total = player.money; // 现金
        
        // 计算地产价值
        for (const prop of playerProperties) {
            const info = prop.getInfo();
            total += info.price || 0;
            
            // 加上建筑价值
            if (info.houses > 0) {
                total += info.houses * Math.floor((info.price || 0) / 2);
            }
            if (info.hotel) {
                total += Math.floor((info.price || 0) * 0.8);
            }
        }
        
        return total;
    }

    update() {
        // 每帧更新游戏状态显示（如果需要）
        // 这里可以添加实时状态更新逻辑
    }
}
