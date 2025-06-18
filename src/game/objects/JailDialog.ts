import { Scene } from 'phaser';
import { Player } from '../types/GameTypes';

export class JailDialog {
    private scene: Scene;
    private dialogContainer: Phaser.GameObjects.Container | null = null;
    private background!: Phaser.GameObjects.Graphics;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private payButton!: Phaser.GameObjects.Text;
    private useCardButton!: Phaser.GameObjects.Text;
    private cancelButton!: Phaser.GameObjects.Text;
    private isVisible: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;
        this.createDialog();
    }

    private createDialog(): void {
        // 创建容器
        this.dialogContainer = this.scene.add.container(512, 384);
        this.dialogContainer.setDepth(1000);
        this.dialogContainer.setVisible(false);

        // 创建背景
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x2c3e50, 0.95);
        this.background.lineStyle(2, 0x34495e);
        this.background.fillRoundedRect(-250, -150, 500, 300, 15);
        this.background.strokeRoundedRect(-250, -150, 500, 300, 15);

        // 创建标题
        this.titleText = this.scene.add.text(0, -100, '🏛️ 监狱选择', {
            fontSize: '24px',
            color: '#ecf0f1'
        });
        this.titleText.setOrigin(0.5);

        // 创建描述文本
        this.descriptionText = this.scene.add.text(0, -50, '', {
            fontSize: '16px',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: 400 }
        });
        this.descriptionText.setOrigin(0.5);

        // 创建支付按钮
        this.payButton = this.scene.add.text(-80, 50, '💰 支付 $50 出狱', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        });
        this.payButton.setOrigin(0.5);
        this.payButton.setInteractive({ useHandCursor: true });

        // 创建使用出狱卡按钮
        this.useCardButton = this.scene.add.text(80, 50, '🎴 使用出狱卡', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 15, y: 8 }
        });
        this.useCardButton.setOrigin(0.5);
        this.useCardButton.setInteractive({ useHandCursor: true });

        // 创建取消按钮
        this.cancelButton = this.scene.add.text(0, 100, '❌ 取消（继续关押）', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#95a5a6',
            padding: { x: 10, y: 5 }
        });
        this.cancelButton.setOrigin(0.5);
        this.cancelButton.setInteractive({ useHandCursor: true });

        // 添加到容器
        this.dialogContainer.add([
            this.background,
            this.titleText,
            this.descriptionText,
            this.payButton,
            this.useCardButton,
            this.cancelButton
        ]);

        // 添加按钮悬停效果
        this.addButtonEffects();
    }

    private addButtonEffects(): void {
        // 支付按钮效果
        this.payButton.on('pointerover', () => {
            this.payButton.setScale(1.05);
        });
        this.payButton.on('pointerout', () => {
            this.payButton.setScale(1);
        });

        // 使用卡片按钮效果
        this.useCardButton.on('pointerover', () => {
            this.useCardButton.setScale(1.05);
        });
        this.useCardButton.on('pointerout', () => {
            this.useCardButton.setScale(1);
        });

        // 取消按钮效果
        this.cancelButton.on('pointerover', () => {
            this.cancelButton.setScale(1.05);
        });
        this.cancelButton.on('pointerout', () => {
            this.cancelButton.setScale(1);
        });
    }

    public showJailOptions(player: Player, hasJailCard: boolean, onChoice: (choice: 'pay' | 'card' | 'cancel') => void): void {
        console.log('showJailOptions', player, hasJailCard);
        if (this.isVisible) return;

        this.isVisible = true;
        
        // 更新描述文本
        let description = `${player.name}，你在监狱中！\n`;
        description += `当前回合：第${player.jailTurns + 1}回合\n`;
        description += `当前资金：$${player.money}\n\n`;
        description += `你可以选择：`;

        this.descriptionText.setText(description);

        // 根据条件设置按钮可用性
        if (player.money < 50) {
            this.payButton.setAlpha(0.5);
            this.payButton.setInteractive(false);
        } else {
            this.payButton.setAlpha(1);
            this.payButton.setInteractive(true);
        }

        if (!hasJailCard) {
            this.useCardButton.setAlpha(0.5);
            this.useCardButton.setInteractive(false);
        } else {
            this.useCardButton.setAlpha(1);
            this.useCardButton.setInteractive(true);
        }

        // 设置按钮事件
        this.payButton.removeAllListeners('pointerdown');
        this.payButton.on('pointerdown', () => {
            this.hideDialog();
            onChoice('pay');
        });

        this.useCardButton.removeAllListeners('pointerdown');
        this.useCardButton.on('pointerdown', () => {
            this.hideDialog();
            onChoice('card');
        });

        this.cancelButton.removeAllListeners('pointerdown');
        this.cancelButton.on('pointerdown', () => {
            this.hideDialog();
            onChoice('cancel');
        });

        // 显示对话框
        if (this.dialogContainer) {
            this.dialogContainer.setVisible(true);
            this.dialogContainer.setScale(0.8);
            
            // 添加缩放动画
            this.scene.tweens.add({
                targets: this.dialogContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
        }
    }

    private hideDialog(): void {
        if (!this.isVisible || !this.dialogContainer) return;

        this.isVisible = false;

        // 添加缩放动画
        this.scene.tweens.add({
            targets: this.dialogContainer,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: () => {
                if (this.dialogContainer) {
                    this.dialogContainer.setVisible(false);
                    this.dialogContainer.setAlpha(1);
                }
            }
        });
    }

    public isDialogVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }
        this.isVisible = false;
    }
} 