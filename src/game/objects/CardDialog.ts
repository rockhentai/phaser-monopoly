import { Scene } from 'phaser';
import { Card, CardExecutionResult } from '../types/GameTypes';

export class CardDialog {
    private scene: Scene;
    private dialogContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private confirmButton!: Phaser.GameObjects.Container;
    private isVisible: boolean = false;
    private currentCallback?: (confirmed: boolean) => void;
    private cardTypeLabel!: Phaser.GameObjects.Text;

    constructor(scene: Scene) {
        this.scene = scene;
        this.createDialog();
    }

    private createDialog(): void {
        // 创建对话框容器
        this.dialogContainer = this.scene.add.container(512, 384); // 屏幕中心
        this.dialogContainer.setDepth(1000); // 确保在最上层
        this.dialogContainer.setVisible(false);

        // 创建半透明遮罩
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(-512, -384, 1024, 768);
        this.dialogContainer.add(overlay);

        // 创建对话框背景
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0xF5F5DC, 1.0); // 米色背景
        this.background.lineStyle(4, 0x8B4513, 1.0); // 棕色边框
        this.background.fillRoundedRect(-200, -150, 400, 300, 10);
        this.background.strokeRoundedRect(-200, -150, 400, 300, 10);
        this.dialogContainer.add(this.background);

        // 添加卡片装饰边框
        const decorativeBorder = this.scene.add.graphics();
        decorativeBorder.lineStyle(2, 0xDAA520, 1.0); // 金色装饰边框
        decorativeBorder.strokeRoundedRect(-180, -130, 360, 260, 8);
        this.dialogContainer.add(decorativeBorder);

        // 创建卡片类型标识
        this.cardTypeLabel = this.scene.add.text(0, -120, '', {
            fontSize: '18px',
            color: '#8B4513',
            fontStyle: 'bold',
            align: 'center'
        });
        this.cardTypeLabel.setOrigin(0.5);
        this.dialogContainer.add(this.cardTypeLabel);

        // 创建标题文本
        this.titleText = this.scene.add.text(0, -80, '', {
            fontSize: '20px',
            color: '#2c3e50',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 340 }
        });
        this.titleText.setOrigin(0.5);
        this.dialogContainer.add(this.titleText);

        // 创建描述文本
        this.descriptionText = this.scene.add.text(0, -20, '', {
            fontSize: '16px',
            color: '#34495e',
            align: 'center',
            wordWrap: { width: 340, useAdvancedWrap: true }
        });
        this.descriptionText.setOrigin(0.5);
        this.dialogContainer.add(this.descriptionText);

        // 创建确认按钮
        this.createConfirmButton();
    }

    private createConfirmButton(): void {
        this.confirmButton = this.scene.add.container(0, 80);

        // 按钮背景
        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(0x28a745, 1.0); // 绿色背景
        buttonBg.lineStyle(2, 0x1e7e34, 1.0); // 深绿色边框
        buttonBg.fillRoundedRect(-60, -20, 120, 40, 8);
        buttonBg.strokeRoundedRect(-60, -20, 120, 40, 8);

        // 按钮文本
        const buttonText = this.scene.add.text(0, 0, '确认', {
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center'
        });
        buttonText.setOrigin(0.5);

        this.confirmButton.add([buttonBg, buttonText]);
        this.dialogContainer.add(this.confirmButton);

        // 添加按钮交互
        this.confirmButton.setSize(120, 40);
        this.confirmButton.setInteractive({ useHandCursor: true });

        // 鼠标悬停效果
        this.confirmButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x34ce57, 1.0); // 更亮的绿色
            buttonBg.lineStyle(2, 0x1e7e34, 1.0);
            buttonBg.fillRoundedRect(-60, -20, 120, 40, 8);
            buttonBg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        this.confirmButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x28a745, 1.0); // 原始绿色
            buttonBg.lineStyle(2, 0x1e7e34, 1.0);
            buttonBg.fillRoundedRect(-60, -20, 120, 40, 8);
            buttonBg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        // 点击事件
        this.confirmButton.on('pointerdown', () => {
            this.handleConfirm();
        });
    }

    // 显示卡片对话框
    public showCard(card: Card, executionResult: CardExecutionResult, callback: (confirmed: boolean) => void): void {
        if (this.isVisible) {
            return;
        }

        this.currentCallback = callback;
        this.isVisible = true;

        // 设置卡片类型标题
        // 假设card.type为'chance'或'community_chest'，否则默认显示'命运'
        if (card.type === 'chance') {
            this.cardTypeLabel.setText('机会');
        } else {
            this.cardTypeLabel.setText('命运');
        }

        // 设置卡片内容
        this.titleText.setText(card.title);
        this.descriptionText.setText(card.description);

        // 如果有执行结果，显示结果信息
        if (executionResult.success) {
            let resultMessage = '\n' + executionResult.message;
            if (executionResult.moneyChanged !== undefined) {
                if (executionResult.moneyChanged > 0) {
                    resultMessage += `\n💰 获得 $${executionResult.moneyChanged}`;
                } else if (executionResult.moneyChanged < 0) {
                    resultMessage += `\n💸 支付 $${Math.abs(executionResult.moneyChanged)}`;
                }
            }
            if (executionResult.playerMoved) {
                resultMessage += '\n🚶 位置已更新';
            }
            this.descriptionText.setText(card.description + resultMessage);
        }

        // 显示对话框
        this.dialogContainer.setVisible(true);

        // 播放出现动画
        this.dialogContainer.setScale(0.8);
        this.dialogContainer.setAlpha(0.8);
        
        this.scene.tweens.add({
            targets: this.dialogContainer,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        console.log('🎴 显示卡片对话框:', card.title);
    }

    // 处理确认
    private handleConfirm(): void {
        if (!this.isVisible) {
            return;
        }

        // 播放消失动画
        this.scene.tweens.add({
            targets: this.dialogContainer,
            scale: 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.dialogContainer.setVisible(false);
                this.isVisible = false;
                
                // 调用回调函数
                if (this.currentCallback) {
                    this.currentCallback(true);
                    this.currentCallback = undefined;
                }
            }
        });

        console.log('✅ 卡片对话框确认');
    }

    // 检查对话框是否可见
    public isDialogVisible(): boolean {
        return this.isVisible;
    }

    // 强制关闭对话框
    public forceClose(): void {
        if (this.isVisible) {
            this.dialogContainer.setVisible(false);
            this.isVisible = false;
            
            if (this.currentCallback) {
                this.currentCallback(false);
                this.currentCallback = undefined;
            }
        }
    }

    // 销毁对话框
    public destroy(): void {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
        }
    }
} 