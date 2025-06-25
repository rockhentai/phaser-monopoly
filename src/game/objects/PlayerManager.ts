import { Scene } from 'phaser';
import { Player, PlayerStatus, PLAYER_CONFIGS } from '../types/GameTypes';

export class PlayerManager {
    private scene: Scene;
    private players: Player[] = [];
    private activePlayerIndex: number = 0;
    private playerTokens: Map<number, Phaser.GameObjects.Container> = new Map();
    private boardContainer: Phaser.GameObjects.Container;
    private isMoving: boolean = false;

    constructor(scene: Scene, boardContainer: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.boardContainer = boardContainer;
    }

    // 初始化玩家
    public initializePlayers(playerCount: number): void {
        // 清理现有玩家
        this.clearPlayers();
        
        // 创建新玩家
        for (let i = 0; i < playerCount; i++) {
            const config = PLAYER_CONFIGS[i];
            const player: Player = {
                id: config.id,
                name: config.name,
                emoji: config.emoji,
                position: 0,
                money: 1500,
                properties: [],
                status: PlayerStatus.ACTIVE,
                jailTurns: 0,
                color: config.color,
                isActive: i === 0,
                specialCards: []
            };
            
            this.players.push(player);
            this.createPlayerToken(player);
        }
        
        this.activePlayerIndex = 0;
        console.log(`👥 初始化了 ${playerCount} 个玩家`);
    }

    // 创建玩家代币
    private createPlayerToken(player: Player): void {
        const tokenContainer = this.scene.add.container(0, 0);
        
        // 创建背景圆圈
        const background = this.scene.add.graphics();
        background.fillStyle(Phaser.Display.Color.HexStringToColor(player.color).color, 0.8);
        background.fillCircle(0, 0, 15);
        background.lineStyle(2, 0x000000);
        background.strokeCircle(0, 0, 15);
        
        // 创建emoji文本
        const emojiText = this.scene.add.text(0, 0, player.emoji, {
            fontSize: '16px',
            align: 'center'
        });
        emojiText.setOrigin(0.5);
        
        tokenContainer.add([background, emojiText]);
        
        // 设置初始位置（出发点）
        this.updateTokenPosition(tokenContainer, 0, player.id);
        
        this.playerTokens.set(player.id, tokenContainer);
        this.boardContainer.add(tokenContainer);
    }

    // 更新代币位置
    private updateTokenPosition(tokenContainer: Phaser.GameObjects.Container, position: number, playerId: number): void {
        const positions = this.getBoardPositions();
        const basePos = positions[position];
        
        if (!basePos) {
            console.error(`无效的位置: ${position}`);
            return;
        }
        
        // 计算偏移，避免多个玩家重叠
        const playersAtPosition = this.players.filter(p => p.position === position);
        const playerIndex = playersAtPosition.findIndex(p => p.id === playerId);
        
        const offsetX = (playerIndex % 2) * 20 - 10;
        const offsetY = Math.floor(playerIndex / 2) * 20 - 10;
        
        tokenContainer.setPosition(basePos.x + offsetX, basePos.y + offsetY);
    }

    // 获取棋盘位置坐标
    private getBoardPositions(): { x: number, y: number }[] {
        // 这些坐标对应棋盘上40个格子的位置
        return [
            // 0: 出发点 (右下角)
            { x: 300, y: 300 },
            
            // 1-9: 底边 (从右到左)
            { x: 230, y: 300 }, { x: 160, y: 300 }, { x: 90, y: 300 }, { x: 20, y: 300 },
            { x: -50, y: 300 }, { x: -120, y: 300 }, { x: -190, y: 300 }, { x: -260, y: 300 }, { x: -330, y: 300 },
            
            // 10: 监狱 (左下角)
            { x: -300, y: 300 },
            
            // 11-19: 左边 (从下到上)
            { x: -300, y: 230 }, { x: -300, y: 160 }, { x: -300, y: 90 }, { x: -300, y: 20 },
            { x: -300, y: -50 }, { x: -300, y: -120 }, { x: -300, y: -190 }, { x: -300, y: -260 }, { x: -300, y: -330 },
            
            // 20: 免费停车 (左上角)
            { x: -300, y: -300 },
            
            // 21-29: 顶边 (从左到右)
            { x: -230, y: -300 }, { x: -160, y: -300 }, { x: -90, y: -300 }, { x: -20, y: -300 },
            { x: 50, y: -300 }, { x: 120, y: -300 }, { x: 190, y: -300 }, { x: 260, y: -300 }, { x: 330, y: -300 },
            
            // 30: 进入监狱 (右上角)
            { x: 300, y: -300 },
            
            // 31-39: 右边 (从上到下)
            { x: 300, y: -230 }, { x: 300, y: -160 }, { x: 300, y: -90 }, { x: 300, y: -20 },
            { x: 300, y: 50 }, { x: 300, y: 120 }, { x: 300, y: 190 }, { x: 300, y: 260 }, { x: 300, y: 330 }
        ];
    }

    // 移动玩家（步进式动画）
    public movePlayer(playerId: number, steps: number, onComplete?: () => void): void {
        const player = this.getPlayer(playerId);
        const tokenContainer = this.playerTokens.get(playerId);
        
        if (!player || !tokenContainer) {
            if (onComplete) onComplete();
            return;
        }
        
        this.isMoving = true;
        let currentStep = 0;
        
        const moveOneStep = () => {
            if (currentStep >= steps) {
                this.isMoving = false;
                if (onComplete) onComplete();
                return;
            }
            
            // 更新玩家位置
            player.position = (player.position + 1) % 40;
            currentStep++;
            
            // 更新代币位置
            this.updateTokenPosition(tokenContainer, player.position, playerId);
            
            // 添加移动动画
            this.scene.tweens.add({
                targets: tokenContainer,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // 延迟后继续下一步
                    this.scene.time.delayedCall(200, moveOneStep);
                }
            });
        };
        
        moveOneStep();
    }

    // 更新玩家位置（不带动画，用于卡片效果）
    public updatePlayerPosition(playerId: number, newPosition: number): void {
        const player = this.getPlayer(playerId);
        const tokenContainer = this.playerTokens.get(playerId);
        
        if (!player || !tokenContainer) {
            return;
        }
        
        player.position = newPosition;
        this.updateTokenPosition(tokenContainer, newPosition, playerId);
    }

    // 切换到下一个玩家
    public nextPlayer(): Player | null {
        if (this.players.length === 0) {
            return null;
        }
        
        // 取消当前玩家的激活状态
        if (this.players[this.activePlayerIndex]) {
            this.players[this.activePlayerIndex].isActive = false;
        }
        
        // 切换到下一个玩家
        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        
        // 激活新玩家
        const nextPlayer = this.players[this.activePlayerIndex];
        if (nextPlayer) {
            nextPlayer.isActive = true;
        }
        
        return nextPlayer;
    }

    // 获取当前活跃玩家
    public getActivePlayer(): Player | null {
        return this.players[this.activePlayerIndex] || null;
    }

    // 获取指定玩家
    public getPlayer(playerId: number): Player | null {
        return this.players.find(p => p.id === playerId) || null;
    }

    // 获取所有玩家
    public getAllPlayers(): Player[] {
        return [...this.players];
    }

    // 检查是否有玩家在移动
    public isPlayerMoving(): boolean {
        return this.isMoving;
    }

    // 重置所有玩家
    public resetAllPlayers(): void {
        this.players.forEach(player => {
            player.position = 0;
            player.money = 1500;
            player.properties = [];
            player.status = PlayerStatus.ACTIVE;
            player.jailTurns = 0;
            player.specialCards = [];
            player.isActive = false;
        });
        
        // 重置第一个玩家为活跃状态
        if (this.players.length > 0) {
            this.players[0].isActive = true;
            this.activePlayerIndex = 0;
        }
        
        // 重置所有代币位置
        this.playerTokens.forEach((tokenContainer, playerId) => {
            this.updateTokenPosition(tokenContainer, 0, playerId);
        });
        
        console.log('🔄 所有玩家已重置');
    }

    // 清理玩家
    private clearPlayers(): void {
        // 销毁所有代币
        this.playerTokens.forEach(tokenContainer => {
            tokenContainer.destroy();
        });
        
        this.players = [];
        this.playerTokens.clear();
        this.activePlayerIndex = 0;
    }

    // 销毁
    public destroy(): void {
        this.clearPlayers();
    }
}