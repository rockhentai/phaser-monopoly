import { Scene } from 'phaser';
import { BoardCell, CellType, PropertyColor } from '../types/GameTypes';
import { BOARD_DATA, PROPERTY_COLORS, BOARD_CONFIG } from '../data/BoardData';
import { PlayerManager } from './PlayerManager';

export class Board {
    private scene: Scene;
    private cells: BoardCell[];
    private cellGraphics: Phaser.GameObjects.Graphics[] = [];
    private cellTexts: Phaser.GameObjects.Text[] = [];
    private boardContainer: Phaser.GameObjects.Container;
    private playerManager: PlayerManager;

    constructor(scene: Scene) {
        this.scene = scene;
        this.cells = [...BOARD_DATA];
        this.boardContainer = scene.add.container(350, 420);
        this.createBoard();
        
        // 初始化玩家管理器
        this.playerManager = new PlayerManager(scene, this.boardContainer);
    }

    private createBoard(): void {
        // 创建棋盘背景
        this.createBackground();
        
        // 创建所有格子
        this.cells.forEach((cell, index) => {
            this.createCell(cell, index);
        });

        // 创建中央区域
        this.createCenterArea();
    }

    private createBackground(): void {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xf0f8ff); // 淡蓝色背景
        bg.fillRect(-335, -435, 770, 770);
        bg.lineStyle(3, 0x000000);
        bg.strokeRect(-335, -435, 770, 770);
        this.boardContainer.add(bg);
    }

    private createCell(cell: BoardCell, index: number): void {
        const graphics = this.scene.add.graphics();
        const x = cell.position.x;
        const y = cell.position.y;

        // 设置格子基础样式
        this.setCellStyle(graphics, cell);
        
        // 绘制格子矩形
        if (this.isCornerCell(index)) {
            // 角落格子 (正方形)
            graphics.fillRect(x - 35, y - 35, 70, 70);
            graphics.strokeRect(x - 35, y - 35, 70, 70);
        } else {
            // 普通格子 (长方形)
            if (index >= 1 && index <= 9) {
                // 底边
                graphics.fillRect(x - 35, y - 25, 70, 50);
                graphics.strokeRect(x - 35, y - 25, 70, 50);
            } else if (index >= 11 && index <= 19) {
                // 左边
                graphics.fillRect(x - 25, y - 35, 50, 70);
                graphics.strokeRect(x - 25, y - 35, 50, 70);
            } else if (index >= 21 && index <= 29) {
                // 顶边
                graphics.fillRect(x - 35, y - 25, 70, 50);
                graphics.strokeRect(x - 35, y - 25, 70, 50);
            } else if (index >= 31 && index <= 39) {
                // 右边
                graphics.fillRect(x - 25, y - 35, 50, 70);
                graphics.strokeRect(x - 25, y - 35, 50, 70);
            }
        }

        this.cellGraphics.push(graphics);
        this.boardContainer.add(graphics);

        // 创建格子文本
        this.createCellText(cell, x, y, index);
        
        // 如果是地产，添加颜色条
        if (cell.type === CellType.PROPERTY && cell.color) {
            this.createPropertyColorBar(cell, x, y, index);
        }
    }

    private setCellStyle(graphics: Phaser.GameObjects.Graphics, cell: BoardCell): void {
        // 设置边框
        graphics.lineStyle(2, 0x000000);

        // 根据格子类型设置填充颜色
        switch (cell.type) {
            case CellType.GO:
                graphics.fillStyle(0x90EE90); // 浅绿色
                break;
            case CellType.PROPERTY:
                graphics.fillStyle(0xFFFFFF); // 白色
                break;
            case CellType.RAILROAD:
                graphics.fillStyle(0x000000); // 黑色
                break;
            case CellType.UTILITY:
                graphics.fillStyle(0xFFFFE0); // 浅黄色
                break;
            case CellType.TAX:
                graphics.fillStyle(0xFFB6C1); // 浅粉色
                break;
            case CellType.CHANCE:
                graphics.fillStyle(0xFF6347); // 橙红色
                break;
            case CellType.COMMUNITY_CHEST:
                graphics.fillStyle(0x87CEEB); // 天蓝色
                break;
            case CellType.JAIL:
                graphics.fillStyle(0xD3D3D3); // 浅灰色
                break;
            case CellType.GO_TO_JAIL:
                graphics.fillStyle(0xFF4500); // 橙红色
                break;
            case CellType.FREE_PARKING:
                graphics.fillStyle(0x98FB98); // 淡绿色
                break;
            default:
                graphics.fillStyle(0xFFFFFF);
        }
    }

    private createCellText(cell: BoardCell, x: number, y: number, index: number): void {
        let textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '10px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 60 }
        };

        // 特殊格子使用更大的字体
        if (this.isCornerCell(index)) {
            textStyle.fontSize = '12px';
            textStyle.fontStyle = 'bold';
            textStyle.wordWrap = { width: 65 };
        }

        // 铁路站使用白色字体
        if (cell.type === CellType.RAILROAD) {
            textStyle.color = '#FFFFFF';
        }

        const text = this.scene.add.text(x, y, cell.name, textStyle);
        text.setOrigin(0.5);

        // 如果是地产，添加价格信息
        if (cell.price && cell.type === CellType.PROPERTY) {
            const priceText = this.scene.add.text(x, y + 12, `$${cell.price}`, {
                fontSize: '8px',
                color: '#666666',
                align: 'center'
            });
            priceText.setOrigin(0.5);
            this.cellTexts.push(priceText);
            this.boardContainer.add(priceText);
        }

        this.cellTexts.push(text);
        this.boardContainer.add(text);
    }

    private createPropertyColorBar(cell: BoardCell, x: number, y: number, index: number): void {
        if (!cell.color) return;

        const colorGraphics = this.scene.add.graphics();
        const color = PROPERTY_COLORS[cell.color];
        colorGraphics.fillStyle(color);

        // 根据位置决定颜色条的位置
        if (index >= 1 && index <= 9) {
            // 底边 - 颜色条在上方
            colorGraphics.fillRect(x - 30, y - 20, 60, 6);
        } else if (index >= 11 && index <= 19) {
            // 左边 - 颜色条在右方
            colorGraphics.fillRect(x + 17, y - 30, 6, 60);
        } else if (index >= 21 && index <= 29) {
            // 顶边 - 颜色条在下方
            colorGraphics.fillRect(x - 30, y + 14, 60, 6);
        } else if (index >= 31 && index <= 39) {
            // 右边 - 颜色条在左方
            colorGraphics.fillRect(x - 23, y - 30, 6, 60);
        }

        this.boardContainer.add(colorGraphics);
    }

    private createCenterArea(): void {
        // 创建中央区域背景
        const centerBg = this.scene.add.graphics();
        centerBg.fillStyle(0xF5F5F5); // 白烟色
        // 调整中央区域位置和大小，为上方的状态文本留出空间
        centerBg.fillRect(-160, -60, 320, 180);
        centerBg.lineStyle(2, 0x000000);
        centerBg.strokeRect(-160, -60, 320, 180);
        
        // 添加游戏标题 - 稍微向下移动
        const title = this.scene.add.text(0, -30, '大富翁', {
            fontSize: '24px',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center'
        });
        title.setOrigin(0.5);

        // 添加游戏logo或装饰 - 向下调整
        const logo = this.scene.add.text(0, 0, '🎲', {
            fontSize: '32px',
            align: 'center'
        });
        logo.setOrigin(0.5);

        // 添加游戏提示信息 - 向下调整
        const gameInfo = this.scene.add.text(0, 40, '当前玩家: 等待初始化\n点击空格键开始游戏', {
            fontSize: '11px',
            color: '#666666',
            align: 'center'
        });
        gameInfo.setOrigin(0.5);

        this.boardContainer.add([centerBg, title, logo, gameInfo]);
    }

    private isCornerCell(index: number): boolean {
        return index === 0 || index === 10 || index === 20 || index === 30;
    }

    // === 玩家管理相关方法 ===
    
    // 初始化玩家（默认2个玩家）
    public initializePlayers(playerCount: number = 2): void {
        this.playerManager.initializePlayers(playerCount);
        this.updateCenterInfo();
    }

    // 移动玩家
    public movePlayer(playerId: number, steps: number, onComplete?: () => void): void {
        const player = this.playerManager.getPlayer(playerId);
        if (!player) {
            if (onComplete) onComplete();
            return;
        }
        
        console.log(`玩家 ${player.name} (${player.emoji}) 准备移动 ${steps} 步，当前位置 ${player.position}: ${this.cells[player.position].name}`);
        
        // 使用步进式移动，移动完成后显示到达信息
        this.playerManager.movePlayer(playerId, steps, () => {
            const finalPosition = player.position;
            const cellName = this.cells[finalPosition].name;
            console.log(`✅ 移动完成！到达位置 ${finalPosition}: ${cellName}`);
            
            // 调用外部传入的回调
            if (onComplete) {
                onComplete();
            }
        });
    }

    // 检查是否有玩家在移动
    public isPlayerMoving(): boolean {
        return this.playerManager.isPlayerMoving();
    }

    // 切换到下一个玩家
    public nextPlayer(): void {
        const nextPlayer = this.playerManager.nextPlayer();
        if (nextPlayer) {
            this.updateCenterInfo();
            console.log(`轮到玩家 ${nextPlayer.name} (${nextPlayer.emoji})`);
        }
    }

    // 更新中央信息显示
    private updateCenterInfo(): void {
        const activePlayer = this.playerManager.getActivePlayer();
        if (activePlayer) {
            // 找到中央信息文本并更新
            const children = this.boardContainer.list;
            for (const child of children) {
                if (child instanceof Phaser.GameObjects.Text && child.text.includes('当前玩家')) {
                    child.setText(`当前玩家: ${activePlayer.name} ${activePlayer.emoji}\n点击空格键掷骰子`);
                    break;
                }
            }
        }
    }

    // 获取玩家管理器
    public getPlayerManager(): PlayerManager {
        return this.playerManager;
    }

    // 获取棋盘容器
    public getContainer(): Phaser.GameObjects.Container {
        return this.boardContainer;
    }

    // === 原有方法保持不变 ===
    
    // 获取指定位置的格子信息
    public getCell(position: number): BoardCell | null {
        return this.cells[position] || null;
    }

    // 获取所有格子信息
    public getAllCells(): BoardCell[] {
        return [...this.cells];
    }

    // 高亮指定格子
    public highlightCell(position: number, color: number = 0xFFFF00): void {
        if (this.cellGraphics[position]) {
            // 创建高亮效果
            const cell = this.cells[position];
            const x = cell.position.x;
            const y = cell.position.y;
            
            const highlight = this.scene.add.graphics();
            highlight.lineStyle(4, color);
            
            if (this.isCornerCell(position)) {
                highlight.strokeRect(x - 37, y - 37, 74, 74);
            } else {
                if (position >= 1 && position <= 9) {
                    highlight.strokeRect(x - 37, y - 27, 74, 54);
                } else if (position >= 11 && position <= 19) {
                    highlight.strokeRect(x - 27, y - 37, 54, 74);
                } else if (position >= 21 && position <= 29) {
                    highlight.strokeRect(x - 37, y - 27, 74, 54);
                } else if (position >= 31 && position <= 39) {
                    highlight.strokeRect(x - 27, y - 37, 54, 74);
                }
            }
            
            this.boardContainer.add(highlight);
            
            // 2秒后移除高亮
            this.scene.time.delayedCall(2000, () => {
                highlight.destroy();
            });
        }
    }

    // 更新格子所有者信息
    public updateCellOwner(position: number, playerId: number): void {
        if (this.cells[position]) {
            this.cells[position].owner = playerId;
            // 这里可以添加视觉上的所有者标识
        }
    }

    // 销毁棋盘
    public destroy(): void {
        this.playerManager.destroy();
        this.boardContainer.destroy();
        this.cellGraphics = [];
        this.cellTexts = [];
    }
} 