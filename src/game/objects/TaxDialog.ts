import { Scene } from 'phaser';
import { BoardCell, Player } from '../types/GameTypes';

export class TaxDialog {
    private scene: Scene;
    private dialogContainer?: Phaser.GameObjects.Container;
    private isVisible: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    // 显示税收对话框
    public showTaxDialog(
        player: Player, 
        cell: BoardCell, 
        playerProperties: any[], 
        onChoice: (choice: 'fixed' | 'percentage') => void
    ): void {
        if (this.isVisible) return;

        this.isVisible = true;
        
        // 计算选项
        const fixedAmount = cell.price || 200; // 固定金额
        const totalAssets = this.calculateTotalAssets(player, playerProperties);
        const percentageAmount = Math.floor(totalAssets * 0.1); // 10%资产
        
        // 创建对话框容器
        this.dialogContainer = this.scene.add.container(512, 384);
        
        // 背景
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.7);
        background.fillRect(-400, -300, 800, 600);
        
        // 对话框背景
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0xffffff);
        dialogBg.lineStyle(3, 0x000000);
        dialogBg.fillRoundedRect(-250, -150, 500, 300, 10);
        dialogBg.strokeRoundedRect(-250, -150, 500, 300, 10);
        
        // 标题
        const title = this.scene.add.text(0, -100, `${cell.name}`, {
            fontSize: '24px',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center'
        });
        title.setOrigin(0.5);
        
        // 税收说明
        const description = this.scene.add.text(0, -60, 
            cell.name === '所得税' ? 
            '选择支付方式：\n• 固定金额\n• 或总资产的10%（较少者）' :
            '支付奢侈税：', 
            {
                fontSize: '16px',
                color: '#333333',
                align: 'center'
            }
        );
        description.setOrigin(0.5);
        
        // 按钮容器
        const buttonsContainer = this.scene.add.container(0, 60);
        
        if (cell.name === '所得税') {
            // 所得税：提供两种选择
            
            // 固定金额按钮
            const fixedButton = this.createButton(
                -120, 0, 
                `固定金额\n$${fixedAmount}`, 
                0x4CAF50,
                () => {
                    this.hideDialog();
                    onChoice('fixed');
                }
            );
            
            // 百分比按钮
            const percentButton = this.createButton(
                120, 0, 
                `总资产10%\n$${percentageAmount}`, 
                0x2196F3,
                () => {
                    this.hideDialog();
                    onChoice('percentage');
                }
            );
            
            // 提示选择较少的
            const hint = this.scene.add.text(0, -20, 
                `建议选择：$${Math.min(fixedAmount, percentageAmount)} (较少者)`, {
                fontSize: '14px',
                color: '#666666',
                align: 'center'
            });
            hint.setOrigin(0.5);
            
            buttonsContainer.add([fixedButton, percentButton, hint]);
        } else {
            // 奢侈税：只有一个选择
            const payButton = this.createButton(
                0, 0, 
                `支付 $${fixedAmount}`, 
                0xFF5722,
                () => {
                    this.hideDialog();
                    onChoice('fixed');
                }
            );
            
            buttonsContainer.add(payButton);
        }
        
        this.dialogContainer.add([background, dialogBg, title, description, buttonsContainer]);
        this.dialogContainer.setDepth(1000);
    }
    
    // 创建按钮
    private createButton(
        x: number, 
        y: number, 
        text: string, 
        color: number, 
        onClick: () => void
    ): Phaser.GameObjects.Container {
        const button = this.scene.add.container(x, y);
        
        // 按钮背景
        const bg = this.scene.add.graphics();
        bg.fillStyle(color);
        bg.lineStyle(2, 0x000000);
        bg.fillRoundedRect(-60, -25, 120, 50, 8);
        bg.strokeRoundedRect(-60, -25, 120, 50, 8);
        
        // 按钮文本
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        
        // 交互
        bg.setInteractive(new Phaser.Geom.Rectangle(-60, -25, 120, 50), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', onClick);
        bg.on('pointerover', () => {
            bg.clear();
            // 简单的颜色亮化处理
            const brighterColor = color + 0x202020;
            bg.fillStyle(brighterColor);
            bg.lineStyle(2, 0x000000);
            bg.fillRoundedRect(-60, -25, 120, 50, 8);
            bg.strokeRoundedRect(-60, -25, 120, 50, 8);
        });
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color);
            bg.lineStyle(2, 0x000000);
            bg.fillRoundedRect(-60, -25, 120, 50, 8);
            bg.strokeRoundedRect(-60, -25, 120, 50, 8);
        });
        
        return button;
    }
    
    // 计算玩家总资产
    private calculateTotalAssets(player: Player, playerProperties: any[]): number {
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
    
    // 隐藏对话框
    private hideDialog(): void {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = undefined;
        }
        this.isVisible = false;
    }
    
    // 检查对话框是否可见
    public isDialogVisible(): boolean {
        return this.isVisible;
    }
    
    // 销毁对话框
    public destroy(): void {
        this.hideDialog();
    }
} 