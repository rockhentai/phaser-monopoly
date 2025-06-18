import { Scene } from 'phaser';
import { DiceResult } from '../types/GameTypes';

export class Dice {
    private scene: Scene;
    private container: Phaser.GameObjects.Container;
    private dice1Graphics: Phaser.GameObjects.Graphics;
    private dice2Graphics: Phaser.GameObjects.Graphics;
    private dice1Value: number = 1;
    private dice2Value: number = 1;
    private isRolling: boolean = false;
    private rollSound?: Phaser.Sound.BaseSound;

    // 骰子点数位置配置
    private readonly DOT_POSITIONS = {
        1: [[0, 0]], // 中心
        2: [[-15, -15], [15, 15]], // 对角
        3: [[-15, -15], [0, 0], [15, 15]], // 对角+中心
        4: [[-15, -15], [15, -15], [-15, 15], [15, 15]], // 四角
        5: [[-15, -15], [15, -15], [0, 0], [-15, 15], [15, 15]], // 四角+中心
        6: [[-15, -15], [15, -15], [-15, 0], [15, 0], [-15, 15], [15, 15]] // 两列
    };

    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        
        this.createDice();
        this.updateDiceDisplay();
    }

    private createDice(): void {
        // 创建第一个骰子
        this.dice1Graphics = this.scene.add.graphics();
        this.dice1Graphics.x = -40; // 左边骰子
        this.dice1Graphics.y = 0;

        // 创建第二个骰子
        this.dice2Graphics = this.scene.add.graphics();
        this.dice2Graphics.x = 40; // 右边骰子
        this.dice2Graphics.y = 0;

        this.container.add([this.dice1Graphics, this.dice2Graphics]);

        // 添加骰子标签
        const diceLabel = this.scene.add.text(0, -60, '🎲 骰子', {
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center'
        });
        diceLabel.setOrigin(0.5);
        this.container.add(diceLabel);
    }

    private drawDice(graphics: Phaser.GameObjects.Graphics, value: number): void {
        graphics.clear();
        
        // 绘制骰子背景
        graphics.fillStyle(0xFFFFFF);
        graphics.lineStyle(3, 0x000000);
        graphics.fillRoundedRect(-25, -25, 50, 50, 8);
        graphics.strokeRoundedRect(-25, -25, 50, 50, 8);

        // 绘制点数
        graphics.fillStyle(0x000000);
        const positions = this.DOT_POSITIONS[value as keyof typeof this.DOT_POSITIONS];
        
        positions.forEach(([x, y]) => {
            graphics.fillCircle(x, y, 4);
        });

        // 添加3D效果阴影
        graphics.fillStyle(0xCCCCCC);
        graphics.fillRoundedRect(-23, -23, 46, 46, 6);
        
        // 重新绘制白色背景
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRoundedRect(-25, -25, 48, 48, 8);
        
        // 重新绘制点数
        graphics.fillStyle(0x000000);
        positions.forEach(([x, y]) => {
            graphics.fillCircle(x, y, 4);
        });
    }

    private updateDiceDisplay(): void {
        this.drawDice(this.dice1Graphics, this.dice1Value);
        this.drawDice(this.dice2Graphics, this.dice2Value);
    }

    // 掷骰子主方法
    public roll(onComplete?: (result: DiceResult) => void): DiceResult | null {
        if (this.isRolling) {
            console.log('骰子正在滚动中...');
            return null;
        }

        this.isRolling = true;
        
        // 播放滚动音效（如果有）
        this.playRollSound();

        // 开始滚动动画
        this.startRollingAnimation(() => {
            // 生成最终结果
            this.dice1Value = Phaser.Math.Between(1, 6);
            this.dice2Value = Phaser.Math.Between(1, 6);
            // this.dice1Value = 3;
            // this.dice2Value = 4;
            
            const result: DiceResult = {
                dice1: this.dice1Value,
                dice2: this.dice2Value,
                total: this.dice1Value + this.dice2Value,
                isDouble: this.dice1Value === this.dice2Value
            };

            // 显示最终结果
            this.updateDiceDisplay();
            this.showResult(result);
            
            this.isRolling = false;
            
            if (onComplete) {
                onComplete(result);
            }

            return result;
        });

        return null; // 异步操作，通过回调返回结果
    }

    // 骰子滚动动画
    private startRollingAnimation(onComplete: () => void): void {
        const rollDuration = 1500; // 1.5秒滚动时间
        const rollInterval = 100; // 每100ms更新一次
        const rollCount = rollDuration / rollInterval;
        let currentRoll = 0;

        // 添加容器震动效果
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            repeat: rollCount / 2,
            ease: 'Power2'
        });

        // 添加旋转效果
        this.scene.tweens.add({
            targets: [this.dice1Graphics, this.dice2Graphics],
            rotation: Math.PI * 4, // 旋转4圈
            duration: rollDuration,
            ease: 'Power2'
        });

        const rollTimer = this.scene.time.addEvent({
            delay: rollInterval,
            callback: () => {
                // 随机更新骰子显示
                const tempValue1 = Phaser.Math.Between(1, 6);
                const tempValue2 = Phaser.Math.Between(1, 6);
                
                this.drawDice(this.dice1Graphics, tempValue1);
                this.drawDice(this.dice2Graphics, tempValue2);
                
                currentRoll++;
                
                if (currentRoll >= rollCount) {
                    rollTimer.destroy();
                    
                    // 重置旋转
                    this.dice1Graphics.rotation = 0;
                    this.dice2Graphics.rotation = 0;
                    
                    onComplete();
                }
            },
            repeat: rollCount - 1
        });
    }

    // 显示骰子结果
    private showResult(result: DiceResult): void {
        // 创建结果文本
        const resultText = this.scene.add.text(0, 60, 
            `🎲 ${result.dice1} + ${result.dice2} = ${result.total}` + 
            (result.isDouble ? '\n🎉 双数！' : ''), 
            {
                fontSize: '14px',
                color: result.isDouble ? '#FFD700' : '#FFFFFF',
                fontStyle: 'bold',
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        resultText.setOrigin(0.5);
        this.container.add(resultText);

        // 结果文本动画
        this.scene.tweens.add({
            targets: resultText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        // 3秒后淡出结果文本
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: resultText,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    resultText.destroy();
                }
            });
        });

        // 如果是双数，添加特殊效果
        if (result.isDouble) {
            this.showDoubleEffect();
        }
    }

    // 双数特殊效果
    private showDoubleEffect(): void {
        // 创建闪光效果
        const sparkles: Phaser.GameObjects.Text[] = [];
        
        for (let i = 0; i < 8; i++) {
            const sparkle = this.scene.add.text(
                Phaser.Math.Between(-60, 60), 
                Phaser.Math.Between(-60, 60), 
                '✨', 
                {
                    fontSize: '16px'
                }
            );
            sparkle.setOrigin(0.5);
            this.container.add(sparkle);
            sparkles.push(sparkle);

            // 闪烁动画
            this.scene.tweens.add({
                targets: sparkle,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }

        // 容器闪光效果
        this.scene.tweens.add({
            targets: this.container,
            tint: 0xFFD700,
            duration: 200,
            yoyo: true,
            repeat: 3
        });
    }

    // 播放滚动音效
    private playRollSound(): void {
        // 这里可以添加音效，目前使用控制台输出模拟
        console.log('🎵 骰子滚动音效...');
    }

    // 获取当前骰子值
    public getCurrentValues(): { dice1: number, dice2: number } {
        return {
            dice1: this.dice1Value,
            dice2: this.dice2Value
        };
    }

    // 检查是否在滚动
    public isCurrentlyRolling(): boolean {
        return this.isRolling;
    }

    // 设置骰子位置
    public setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    // 显示/隐藏骰子
    public setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    // 销毁骰子
    public destroy(): void {
        this.container.destroy();
    }
} 