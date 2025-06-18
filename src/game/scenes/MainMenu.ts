import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 250, 'logo');

        this.title = this.add.text(512, 350, '大富翁游戏', {
            fontFamily: 'Arial Black', fontSize: 42, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        const subtitle = this.add.text(512, 400, 'Phaser 3 版本', {
            fontFamily: 'Arial', fontSize: 18, color: '#cccccc',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        const startButton = this.add.text(512, 500, '点击开始查看棋盘原型', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffff00',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startButton,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        const versionText = this.add.text(512, 600, '当前开发状态：棋盘原型阶段\n包含完整的40格棋盘布局', {
            fontFamily: 'Arial', fontSize: 14, color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        const devInfo = this.add.text(20, 20, '大富翁游戏开发项目\n基于 Phaser 3 + TypeScript', {
            fontFamily: 'Arial', fontSize: 12, color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 10, y: 5 }
        });

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
