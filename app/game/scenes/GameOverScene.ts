import * as Phaser from 'phaser';

interface GameOverSceneData {
  score: number;
  highScore: number;
  gameMode?: string;
}

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private highScore: number = 0;
  private gameMode: string = 'solo';

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverSceneData) {
    this.score = data.score;
    this.highScore = data.highScore;
    this.gameMode = data.gameMode || 'solo';
  }

  create() {
    const { width, height } = this.game.config;
    
    // Create white background
    this.add.rectangle(0, 0, width as number, height as number, 0xffffff)
      .setOrigin(0, 0);
      
    // Add game over image
    const gameOverImage = this.add.image(
      width as number / 2,
      height as number / 3,
      'game-over'
    ).setOrigin(0.5);
    
    // Add game mode text
    this.add.text(
      width as number / 2,
      (height as number / 3) + 40,
      `${this.gameMode.toUpperCase()} MODE`,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: this.gameMode === 'solo' ? '#3a7e4d' : '#7e3a3a',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Add score text
    this.add.text(
      width as number / 2,
      height as number / 2,
      `SCORE: ${this.score}`,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#535353',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Add high score text
    this.add.text(
      width as number / 2,
      (height as number / 2) + 40,
      `HIGH SCORE: ${this.highScore}`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#535353'
      }
    ).setOrigin(0.5);
    
    // Add social prompt text (only in challenge mode)
    if (this.gameMode === 'challenge') {
      this.add.text(
        width as number / 2,
        (height as number / 2) + 80,
        `Challenge your friends on Farcaster!`,
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#0052FF'
        }
      ).setOrigin(0.5);
    } else {
      this.add.text(
        width as number / 2,
        (height as number / 2) + 80,
        `Try again to beat your high score!`,
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#3a7e4d'
        }
      ).setOrigin(0.5);
    }
    
    // Add restart button
    const restartButton = this.add.image(
      width as number / 2,
      (height as number / 2) + 120,
      'restart'
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    // Add event listener to restart button
    restartButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
    
    // Add keyboard handler for quick restart
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}