import { Scene } from 'phaser';
import { Player, PlayerToken, PlayerStatus, PLAYER_CONFIGS } from '../types/GameTypes';
import { BOARD_DATA } from '../data/BoardData';

export class PlayerManager {
    private scene: Scene;
    private players: Player[] = [];
    private playerTokens: Map<number, Phaser.GameObjects.Text> = new Map();
    private playerBackgrounds: Map<number, Phaser.GameObjects.Graphics> = new Map();
    private container: Phaser.GameObjects.Container;
    private isMoving: boolean = false; // 防止同时移动多个玩家

    constructor(scene: Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    // 初始化玩家
    public initializePlayers(playerCount: number = 2): Player[] {
        this.players = [];
        
        for (let i = 0; i < Math.min(playerCount, 4); i++) {
            const config = PLAYER_CONFIGS[i];
            const player: Player = {
                id: config.id,
                name: config.name,
                emoji: config.emoji,
                position: 0, // 所有玩家从出发点开始
                money: 1500, // 初始资金
                properties: [],
                status: PlayerStatus.ACTIVE,
                jailTurns: 0,
                color: config.color,
                isActive: i === 0, // 第一个玩家开始
                specialCards: [] // 初始化特殊卡片数组
            };
            
            this.players.push(player);
            this.createPlayerToken(player);
        }
        
        return this.players;
    }

    // 创建玩家代币显示
    private createPlayerToken(player: Player): void {
        const cellData = BOARD_DATA[player.position];
        const tokenPosition = this.calculateTokenPosition(player.position, player.id);
        
        // 创建背景圆圈
        const background = this.scene.add.graphics();
        background.fillStyle(parseInt(player.color.replace('#', '0x')));
        background.fillCircle(tokenPosition.x, tokenPosition.y, 18);
        background.alpha = 0.3;
        
        const token = this.scene.add.text(
            tokenPosition.x, 
            tokenPosition.y, 
            player.emoji, 
            {
                fontSize: '24px',
                align: 'center'
            }
        );
        token.setOrigin(0.5);
        
        this.container.add([background, token]);
        this.playerTokens.set(player.id, token);
        this.playerBackgrounds.set(player.id, background);
        
        // 如果是当前玩家，添加高亮效果
        if (player.isActive) {
            this.highlightActivePlayer(player.id);
        }
    }

    // 计算玩家代币在格子中的位置（支持多个玩家在同一格子）
    private calculateTokenPosition(cellPosition: number, playerId: number): { x: number, y: number } {
        const cellData = BOARD_DATA[cellPosition];
        const baseX = cellData.position.x;
        const baseY = cellData.position.y;
        
        // 计算在同一格子中的玩家数量和当前玩家的索引
        const playersInCell = this.players.filter(p => p.position === cellPosition);
        const playerIndex = playersInCell.findIndex(p => p.id === playerId);
        
        // 根据玩家数量调整位置，避免重叠
        let offsetX = 0;
        let offsetY = 0;
        
        if (playersInCell.length > 1) {
            switch (playersInCell.length) {
                case 2:
                    offsetX = playerIndex === 0 ? -15 : 15;
                    break;
                case 3:
                    offsetX = (playerIndex - 1) * 15;
                    break;
                case 4:
                    offsetX = (playerIndex % 2 === 0 ? -15 : 15);
                    offsetY = (playerIndex < 2 ? -10 : 10);
                    break;
            }
        }
        
        return {
            x: baseX + offsetX,
            y: baseY + offsetY
        };
    }

    // 移动玩家到新位置（一步一步移动）
    public movePlayer(playerId: number, steps: number, onComplete?: () => void): void {
        if (this.isMoving) {
            console.log('已有玩家在移动中，请等待...');
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player || steps <= 0) {
            if (onComplete) onComplete();
            return;
        }
        
        this.isMoving = true;
        const startPosition = player.position;
        
        console.log(`${player.name} (${player.emoji}) 开始移动 ${steps} 步，从位置 ${startPosition}`);
        
        // 一步一步移动
        this.movePlayerStep(playerId, steps, 0, startPosition, onComplete);
    }

    // 递归方法：一步一步移动玩家
    private movePlayerStep(playerId: number, totalSteps: number, currentStep: number, startPosition: number, onComplete?: () => void): void {
        if (currentStep >= totalSteps) {
            // 移动完成
            this.isMoving = false;
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                const cellName = BOARD_DATA[player.position].name;
                console.log(`${player.name} (${player.emoji}) 移动完成，到达位置 ${player.position}: ${cellName}`);
                
                // 检查是否经过出发点
                const endPosition = player.position;
                if (startPosition > endPosition || (startPosition + totalSteps) >= 40) {
                    console.log(`🎉 ${player.name} 经过了出发点！获得 $200`);
                    player.money += 200;
                }
            }
            
            // 重新排列该位置的所有玩家
            this.rearrangePlayersAtPosition(player?.position || 0);
            
            if (onComplete) onComplete();
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.isMoving = false;
            if (onComplete) onComplete();
            return;
        }

        // 计算下一个位置
        const nextPosition = (player.position + 1) % 40;
        const oldPosition = player.position;
        player.position = nextPosition;

        // 获取代币和背景
        const token = this.playerTokens.get(playerId);
        const background = this.playerBackgrounds.get(playerId);
        
        if (!token || !background) {
            this.isMoving = false;
            if (onComplete) onComplete();
            return;
        }

        // 计算新位置
        const newTokenPosition = this.calculateTokenPosition(nextPosition, playerId);
        
        // 创建移动动画
        const moveDistance = Math.sqrt(
            Math.pow(newTokenPosition.x - token.x, 2) + 
            Math.pow(newTokenPosition.y - token.y, 2)
        );
        
        // 根据移动距离调整动画时间（最短300ms，最长600ms）
        const animationDuration = Math.min(600, Math.max(300, moveDistance * 2));
        
        // 移动代币
        this.scene.tweens.add({
            targets: token,
            x: newTokenPosition.x,
            y: newTokenPosition.y,
            duration: animationDuration,
            ease: 'Power2',
            onComplete: () => {
                // 移动背景圆圈
                background.clear();
                background.fillStyle(parseInt(player.color.replace('#', '0x')));
                background.fillCircle(newTokenPosition.x, newTokenPosition.y, 18);
                background.alpha = 0.3;
                
                // 重新排列旧位置的玩家
                this.rearrangePlayersAtPosition(oldPosition);
                
                // 继续下一步移动
                this.scene.time.delayedCall(100, () => {
                    this.movePlayerStep(playerId, totalSteps, currentStep + 1, startPosition, onComplete);
                });
            }
        });

        // 添加跳跃效果
        this.scene.tweens.add({
            targets: token,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: animationDuration / 2,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // 重新排列指定位置的所有玩家
    private rearrangePlayersAtPosition(position: number): void {
        const playersAtPosition = this.players.filter(p => p.position === position);
        
        playersAtPosition.forEach(player => {
            const token = this.playerTokens.get(player.id);
            const background = this.playerBackgrounds.get(player.id);
            
            if (token && background) {
                const newPosition = this.calculateTokenPosition(position, player.id);
                
                // 平滑移动到新排列位置
                this.scene.tweens.add({
                    targets: token,
                    x: newPosition.x,
                    y: newPosition.y,
                    duration: 200,
                    ease: 'Power1'
                });

                // 更新背景位置
                background.clear();
                background.fillStyle(parseInt(player.color.replace('#', '0x')));
                background.fillCircle(newPosition.x, newPosition.y, 18);
                background.alpha = 0.3;
            }
        });
    }

    // 更新玩家代币位置（公共方法，用于卡片效果等）
    public updatePlayerTokenPosition(playerId: number): void {
        const player = this.players.find(p => p.id === playerId);
        const token = this.playerTokens.get(playerId);
        const background = this.playerBackgrounds.get(playerId);
        
        if (!player || !token || !background) return;
        
        const newPosition = this.calculateTokenPosition(player.position, playerId);
        
        // 添加移动动画
        this.scene.tweens.add({
            targets: token,
            x: newPosition.x,
            y: newPosition.y,
            duration: 500,
            ease: 'Power2'
        });

        // 更新背景位置
        background.clear();
        background.fillStyle(parseInt(player.color.replace('#', '0x')));
        background.fillCircle(newPosition.x, newPosition.y, 18);
        background.alpha = 0.3;
    }

    // 高亮当前活跃玩家
    public highlightActivePlayer(playerId: number): void {
        // 清除所有玩家的高亮
        this.players.forEach(player => {
            player.isActive = false;
            const token = this.playerTokens.get(player.id);
            if (token) {
                token.clearTint();
                token.setScale(1);
            }
        });
        
        // 高亮指定玩家
        const activePlayer = this.players.find(p => p.id === playerId);
        if (activePlayer) {
            activePlayer.isActive = true;
            const token = this.playerTokens.get(playerId);
            if (token) {
                token.setTint(0xFFFF00); // 黄色高亮
                token.setScale(1.2); // 稍微放大
            }
        }
    }

    // 检查是否有玩家在移动
    public isPlayerMoving(): boolean {
        return this.isMoving;
    }

    // 获取玩家信息
    public getPlayer(playerId: number): Player | undefined {
        return this.players.find(p => p.id === playerId);
    }

    // 获取所有玩家
    public getAllPlayers(): Player[] {
        return [...this.players];
    }

    // 获取当前活跃玩家
    public getActivePlayer(): Player | undefined {
        return this.players.find(p => p.isActive);
    }

    // 切换到下一个玩家
    public nextPlayer(): Player | undefined {
        if (this.isMoving) {
            console.log('玩家移动中，无法切换');
            return undefined;
        }

        const currentPlayer = this.getActivePlayer();
        if (!currentPlayer) return undefined;
        
        const activePlayers = this.players.filter(p => p.status !== PlayerStatus.BANKRUPT);
        const currentIndex = activePlayers.findIndex(p => p.id === currentPlayer.id);
        const nextIndex = (currentIndex + 1) % activePlayers.length;
        const nextPlayer = activePlayers[nextIndex];
        
        this.highlightActivePlayer(nextPlayer.id);
        return nextPlayer;
    }

    // 获取指定位置的所有玩家
    public getPlayersAtPosition(position: number): Player[] {
        return this.players.filter(p => p.position === position);
    }

    // 销毁所有玩家代币
    public destroy(): void {
        this.playerTokens.forEach(token => token.destroy());
        this.playerBackgrounds.forEach(bg => bg.destroy());
        this.playerTokens.clear();
        this.playerBackgrounds.clear();
        this.players = [];
        this.isMoving = false;
    }
} 