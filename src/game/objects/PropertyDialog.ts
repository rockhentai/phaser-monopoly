import { Scene } from 'phaser';
import { Property } from './Property';
import { PropertyManager } from './PropertyManager';

export class PropertyDialog {
    private scene: Scene;
    private propertyManager: PropertyManager;
    private container?: Phaser.GameObjects.Container;
    private background?: Phaser.GameObjects.Graphics;
    private isVisible: boolean = false;
    private currentCallback?: (action: 'buy' | 'build' | 'cancel') => void;

    constructor(scene: Scene, propertyManager: PropertyManager) {
        this.scene = scene;
        this.propertyManager = propertyManager;
    }

    // 显示地产购买对话框
    public showPurchaseDialog(
        position: number, 
        playerId: number, 
        playerMoney: number,
        onAction: (action: 'buy' | 'cancel') => void
    ): void {
        if (this.isVisible) {
            this.hide();
        }

        const propertyInfo = this.propertyManager.getPropertyInfo(position);
        if (!propertyInfo || !propertyInfo.canPurchase) {
            return;
        }
        this.createDialog();

        // 创建对话框内容
        const title = this.scene.add.text(0, -180, '🏠 地产购买', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // 地产名称
        const propertyName = this.scene.add.text(0, -140, propertyInfo.name, {
            fontSize: '22px',
            color: '#2c3e50',
            fontStyle: 'bold'
        });
        propertyName.setOrigin(0.5);

        // 基本信息区域背景
        const infoBg = this.scene.add.graphics();
        infoBg.fillStyle(0xf8f9fa, 0.8);
        infoBg.lineStyle(1, 0xdee2e6);
        infoBg.fillRoundedRect(-180, -115, 360, 60, 5);
        infoBg.strokeRoundedRect(-180, -115, 360, 60, 5);

        // 地产基本信息
        const infoText = this.scene.add.text(0, -105, 
            `💰 价格: $${propertyInfo.price}`, {
            fontSize: '18px',
            color: '#495057',
            fontStyle: 'bold'
        });
        infoText.setOrigin(0.5);

        const rentText = this.scene.add.text(0, -85, 
            `🏘️ 基础租金: $${propertyInfo.baseRent}`, {
            fontSize: '18px',
            color: '#495057',
            fontStyle: 'bold'
        });
        rentText.setOrigin(0.5);

        const moneyText = this.scene.add.text(0, -65, 
            `💳 你的资金: $${playerMoney}`, {
            fontSize: '18px',
            color: playerMoney >= (propertyInfo.price || 0) ? '#28a745' : '#dc3545',
            fontStyle: 'bold'
        });
        moneyText.setOrigin(0.5);

        // 租金详情区域
        if (propertyInfo.baseRent > 0) {
            // 租金详情标题
            const rentTitle = this.scene.add.text(0, -35, '📋 租金详情:', {
                fontSize: '16px',
                color: '#6c757d',
                fontStyle: 'bold'
            });
            rentTitle.setOrigin(0.5);

            // 租金详情背景
            const rentBg = this.scene.add.graphics();
            rentBg.fillStyle(0xf1f3f4, 0.9);
            rentBg.lineStyle(1, 0xdee2e6);
            rentBg.fillRoundedRect(-180, -15, 360, 110, 5);
            rentBg.strokeRoundedRect(-180, -15, 360, 110, 5);

            // 租金详情文字 - 分两列显示
            const leftColumn = this.scene.add.text(-90, 5,
                `空地: $${propertyInfo.baseRent}\n` +
                `1栋房屋: $${propertyInfo.baseRent * 5}\n` +
                `2栋房屋: $${propertyInfo.baseRent * 15}`, {
                fontSize: '14px',
                color: '#6c757d',
                align: 'left',
                lineSpacing: 8
            });
            leftColumn.setOrigin(0.5, 0);

            const rightColumn = this.scene.add.text(90, 5,
                `3栋房屋: $${propertyInfo.baseRent * 45}\n` +
                `4栋房屋: $${propertyInfo.baseRent * 80}\n` +
                `酒店: $${propertyInfo.baseRent * 125}`, {
                fontSize: '14px',
                color: '#6c757d',
                align: 'left',
                lineSpacing: 8
            });
            rightColumn.setOrigin(0.5, 0);

            this.container!.add([rentTitle, rentBg, leftColumn, rightColumn]);
        }

        // 购买按钮
        const buyButton = this.createButton(-80, 130, '购买', '#28a745', () => {
            this.hide();
            onAction('buy');
        });

        // 取消按钮
        const cancelButton = this.createButton(80, 130, '取消', '#dc3545', () => {
            this.hide();
            onAction('cancel');
        });

        // 检查资金是否足够
        if (playerMoney < (propertyInfo.price || 0)) {
            buyButton.btn.setAlpha(0.6);
            buyButton.btn.disableInteractive();
            
            const warningBg = this.scene.add.graphics();
            warningBg.fillStyle(0xffe6e6, 0.9);
            warningBg.lineStyle(1, 0xff9999);
            warningBg.fillRoundedRect(-120, 160, 240, 30, 5);
            warningBg.strokeRoundedRect(-120, 160, 240, 30, 5);
            
            const warningText = this.scene.add.text(0, 175, '❌ 资金不足，无法购买！', {
                fontSize: '14px',
                color: '#dc3545',
                fontStyle: 'bold'
            });
            warningText.setOrigin(0.5);
            this.container!.add([warningBg, warningText]);
        }

        this.container!.add([title, propertyName, infoBg, infoText, rentText, moneyText, buyButton.container, cancelButton.container]);
        this.show();
    }

    // 显示建造对话框
    public showBuildDialog(
        position: number,
        playerId: number,
        playerMoney: number,
        onAction: (action: 'build' | 'cancel') => void
    ): void {
        if (this.isVisible) {
            this.hide();
        }

        const propertyInfo = this.propertyManager.getPropertyInfo(position);
        if (!propertyInfo || propertyInfo.ownerId !== playerId) {
            return;
        }
        this.createDialog();

        // 创建对话框内容
        const title = this.scene.add.text(0, -160, '🏗️ 建造房屋', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // 地产名称
        const propertyName = this.scene.add.text(0, -120, propertyInfo.name, {
            fontSize: '22px',
            color: '#2c3e50',
            fontStyle: 'bold'
        });
        propertyName.setOrigin(0.5);

        // 当前状态区域背景
        const statusBg = this.scene.add.graphics();
        statusBg.fillStyle(0xf8f9fa, 0.8);
        statusBg.lineStyle(1, 0xdee2e6);
        statusBg.fillRoundedRect(-180, -95, 360, 40, 5);
        statusBg.strokeRoundedRect(-180, -95, 360, 40, 5);

        // 当前状态
        let statusText = `当前建筑: `;
        if (propertyInfo.hotel) {
            statusText += '🏨 酒店';
        } else if (propertyInfo.houses > 0) {
            statusText += `🏠 ${propertyInfo.houses}栋房屋`;
        } else {
            statusText += '🏞️ 空地';
        }

        const currentStatus = this.scene.add.text(0, -75, statusText, {
            fontSize: '18px',
            color: '#495057',
            fontStyle: 'bold'
        });
        currentStatus.setOrigin(0.5);

        // 建造成本区域背景
        const costBg = this.scene.add.graphics();
        costBg.fillStyle(0xf1f3f4, 0.9);
        costBg.lineStyle(1, 0xdee2e6);
        costBg.fillRoundedRect(-180, -45, 360, 50, 5);
        costBg.strokeRoundedRect(-180, -45, 360, 50, 5);

        // 建造成本
        const buildCost = Math.floor((propertyInfo.price || 0) / 2);
        const costText = this.scene.add.text(0, -35, `💰 建造成本: $${buildCost}`, {
            fontSize: '18px',
            color: '#495057',
            fontStyle: 'bold'
        });
        costText.setOrigin(0.5);

        const moneyText = this.scene.add.text(0, -15, `💳 你的资金: $${playerMoney}`, {
            fontSize: '18px',
            color: playerMoney >= buildCost ? '#28a745' : '#dc3545',
            fontStyle: 'bold'
        });
        moneyText.setOrigin(0.5);

        // 租金预览区域
        let nextRent = 0;
        let nextLevel = '';
        if (propertyInfo.hotel) {
            nextLevel = '已达最高级别';
        } else if (propertyInfo.houses === 4) {
            nextRent = propertyInfo.baseRent * 125;
            nextLevel = '升级为🏨酒店';
        } else {
            const multipliers = [5, 15, 45, 80];
            nextRent = propertyInfo.baseRent * multipliers[propertyInfo.houses];
            nextLevel = `升级为🏠${propertyInfo.houses + 1}栋房屋`;
        }

        if (nextLevel !== '已达最高级别') {
            // 预览区域背景
            const previewBg = this.scene.add.graphics();
            previewBg.fillStyle(0xe8f5e8, 0.9);
            previewBg.lineStyle(1, 0xc3e6c3);
            previewBg.fillRoundedRect(-180, 15, 360, 50, 5);
            previewBg.strokeRoundedRect(-180, 15, 360, 50, 5);

            const previewTitle = this.scene.add.text(0, 25, '📈 升级预览:', {
                fontSize: '16px',
                color: '#6c757d',
                fontStyle: 'bold'
            });
            previewTitle.setOrigin(0.5);

            const rentPreview = this.scene.add.text(0, 45, `${nextLevel} → 租金: $${nextRent}`, {
                fontSize: '16px',
                color: '#28a745',
                fontStyle: 'bold'
            });
            rentPreview.setOrigin(0.5);
            
            this.container!.add([previewBg, previewTitle, rentPreview]);
        } else {
            // 已满级提示
            const maxLevelBg = this.scene.add.graphics();
            maxLevelBg.fillStyle(0xfff3cd, 0.9);
            maxLevelBg.lineStyle(1, 0xffeaa7);
            maxLevelBg.fillRoundedRect(-120, 15, 240, 30, 5);
            maxLevelBg.strokeRoundedRect(-120, 15, 240, 30, 5);

            const maxLevelText = this.scene.add.text(0, 30, '🏆 已达最高级别！', {
                fontSize: '16px',
                color: '#856404',
                fontStyle: 'bold'
            });
            maxLevelText.setOrigin(0.5);
            
            this.container!.add([maxLevelBg, maxLevelText]);
        }

        // 按钮
        let canBuild = false;
        let buildButtonText = '建造';
        let buildButtonColor = '#28a745';

        if (propertyInfo.hotel) {
            buildButtonText = '已满级';
            buildButtonColor = '#6c757d';
        } else if (propertyInfo.houses === 4) {
            buildButtonText = '建造酒店';
            canBuild = playerMoney >= buildCost;
        } else {
            buildButtonText = '建造房屋';
            canBuild = playerMoney >= buildCost;
        }

        const buildButton = this.createButton(-80, 90, buildButtonText, buildButtonColor, () => {
            this.hide();
            onAction('build');
        });

        const cancelButton = this.createButton(80, 90, '取消', '#dc3545', () => {
            this.hide();
            onAction('cancel');
        });

        // 检查是否可以建造
        if (!canBuild || propertyInfo.hotel) {
            buildButton.btn.setAlpha(0.6);
            buildButton.btn.disableInteractive();
            
            if (!canBuild && !propertyInfo.hotel) {
                const warningBg = this.scene.add.graphics();
                warningBg.fillStyle(0xffe6e6, 0.9);
                warningBg.lineStyle(1, 0xff9999);
                warningBg.fillRoundedRect(-120, 120, 240, 30, 5);
                warningBg.strokeRoundedRect(-120, 120, 240, 30, 5);
                
                const warningText = this.scene.add.text(0, 135, '❌ 资金不足，无法建造！', {
                    fontSize: '14px',
                    color: '#dc3545',
                    fontStyle: 'bold'
                });
                warningText.setOrigin(0.5);
                this.container!.add([warningBg, warningText]);
            }
        }

        this.container!.add([title, propertyName, statusBg, currentStatus, costBg, costText, moneyText, buildButton.container, cancelButton.container]);
        this.show();
    }

    // 显示收租对话框
    public showRentDialog(
        position: number,
        payerId: number,
        ownerId: number,
        playerName: string,
        ownerName: string,
        propertyName: string,
        rentAmount: number,
        onConfirm: () => void
    ): void {
        if (this.isVisible) {
            this.hide();
        }

        this.createDialog();

        // 创建对话框内容
        const title = this.scene.add.text(0, -160, '💰 收取租金', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // 地产名称
        const propertyNameText = this.scene.add.text(0, -120, propertyName, {
            fontSize: '22px',
            color: '#2c3e50',
            fontStyle: 'bold'
        });
        propertyNameText.setOrigin(0.5);

        // 收租信息区域背景
        const rentBg = this.scene.add.graphics();
        rentBg.fillStyle(0xfff3cd, 0.9);
        rentBg.lineStyle(2, 0xffc107);
        rentBg.fillRoundedRect(-200, -85, 400, 120, 10);
        rentBg.strokeRoundedRect(-200, -85, 400, 120, 10);

        // 玩家信息
        const playerInfo = this.scene.add.text(0, -70, 
            `👤 支付方: ${playerName}`, {
            fontSize: '18px',
            color: '#6c757d',
            fontStyle: 'bold'
        });
        playerInfo.setOrigin(0.5);

        const ownerInfo = this.scene.add.text(0, -45, 
            `🏠 地产所有者: ${ownerName}`, {
            fontSize: '18px',
            color: '#28a745',
            fontStyle: 'bold'
        });
        ownerInfo.setOrigin(0.5);

        // 租金金额 - 突出显示
        const rentAmountBg = this.scene.add.graphics();
        rentAmountBg.fillStyle(0xdc3545, 0.1);
        rentAmountBg.lineStyle(2, 0xdc3545);
        rentAmountBg.fillRoundedRect(-120, -25, 240, 40, 8);
        rentAmountBg.strokeRoundedRect(-120, -25, 240, 40, 8);

        const rentAmountText = this.scene.add.text(0, -5, 
            `💸 租金: $${rentAmount}`, {
            fontSize: '20px',
            color: '#dc3545',
            fontStyle: 'bold'
        });
        rentAmountText.setOrigin(0.5);

        // 说明文字
        const explanationBg = this.scene.add.graphics();
        explanationBg.fillStyle(0xf8f9fa, 0.8);
        explanationBg.lineStyle(1, 0xdee2e6);
        explanationBg.fillRoundedRect(-180, 45, 360, 60, 5);
        explanationBg.strokeRoundedRect(-180, 45, 360, 60, 5);

        const explanation = this.scene.add.text(0, 55, 
            `📋 租金说明:`, {
            fontSize: '16px',
            color: '#6c757d',
            fontStyle: 'bold'
        });
        explanation.setOrigin(0.5);

        const explanationDetail = this.scene.add.text(0, 80, 
            `踩到他人地产需要支付租金\n点击确认完成支付`, {
            fontSize: '14px',
            color: '#6c757d',
            align: 'center',
            lineSpacing: 4
        });
        explanationDetail.setOrigin(0.5);

        // 确认按钮
        const confirmButton = this.createButton(0, 130, '确认支付', '#dc3545', () => {
            this.hide();
            onConfirm();
        });

        this.container!.add([
            title, 
            propertyNameText, 
            rentBg, 
            playerInfo, 
            ownerInfo, 
            rentAmountBg, 
            rentAmountText, 
            explanationBg, 
            explanation, 
            explanationDetail, 
            confirmButton.container
        ]);
        
        this.show();
    }

    // 创建对话框基础结构
    private createDialog(): void {
        this.container = this.scene.add.container(512, 384); // 屏幕中央

        // 背景遮罩
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.5);
        this.background.fillRect(0, 0, 1024, 768);

        // 对话框背景
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0xFFFFFF, 0.98);
        dialogBg.lineStyle(4, 0x2c3e50, 0.8);
        dialogBg.fillRoundedRect(-250, -200, 500, 400, 15);
        dialogBg.strokeRoundedRect(-250, -200, 500, 400, 15);

        // 添加阴影效果
        const shadowBg = this.scene.add.graphics();
        shadowBg.fillStyle(0x000000, 0.2);
        shadowBg.fillRoundedRect(-247, -197, 500, 400, 15);

        this.container.add([shadowBg, dialogBg]);
        this.container.setDepth(1000); // 确保在最上层
    }

    // 创建按钮
    private createButton(
        x: number, 
        y: number, 
        text: string, 
        color: string, 
        callback: () => void
    ): { container: Phaser.GameObjects.Container, btn: Phaser.GameObjects.Graphics } {
        const buttonContainer = this.scene.add.container(x, y);
        
        const btn = this.scene.add.graphics();
        btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
        btn.fillRoundedRect(-60, -20, 120, 40, 8);
        btn.lineStyle(2, 0x333333, 0.6);
        btn.strokeRoundedRect(-60, -20, 120, 40, 8);
        
        // 添加按钮阴影
        const btnShadow = this.scene.add.graphics();
        btnShadow.fillStyle(0x000000, 0.2);
        btnShadow.fillRoundedRect(-58, -18, 120, 40, 8);
        
        const btnText = this.scene.add.text(0, 0, text, {
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        btnText.setOrigin(0.5);
        
        buttonContainer.add([btnShadow, btn, btnText]);
        
        // 添加交互
        btn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', callback);
        btn.on('pointerover', () => {
            btn.setAlpha(0.85);
            btnShadow.setAlpha(0.3);
            buttonContainer.setScale(1.05);
        });
        btn.on('pointerout', () => {
            btn.setAlpha(1);
            btnShadow.setAlpha(0.2);
            buttonContainer.setScale(1);
        });

        return { container: buttonContainer, btn };
    }

    // 显示对话框
    private show(): void {
        if (this.container && this.background) {
            this.isVisible = true;
            this.scene.add.existing(this.background);
            this.scene.add.existing(this.container);
            
            // 添加淡入动画
            this.container.setAlpha(0);
            this.background.setAlpha(0);
            
            this.scene.tweens.add({
                targets: [this.container, this.background],
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
        }
    }

    // 隐藏对话框
    public hide(): void {
        if (this.isVisible && this.container && this.background) {
            this.isVisible = false;
            
            this.scene.tweens.add({
                targets: [this.container, this.background],
                alpha: 0,
                duration: 150,
                ease: 'Power2',
                onComplete: () => {
                    this.container?.destroy();
                    this.background?.destroy();
                    this.container = undefined;
                    this.background = undefined;
                }
            });
        }
    }

    // 检查是否可见
    public isDialogVisible(): boolean {
        return this.isVisible;
    }

    // 销毁
    public destroy(): void {
        this.hide();
    }
} 