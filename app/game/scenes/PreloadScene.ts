import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  private debugText?: Phaser.GameObjects.Text;
  private loadedAssets: Record<string, boolean> = {};

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create loading UI
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    this.debugText = this.add.text(width / 2, height / 2 - 80, 'Loading assets...', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ff0000'
    }).setOrigin(0.5);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // Set up loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    // Track each file complete
    this.load.on('filecomplete', (key: string) => {
      console.log('Loaded asset:', key);
      this.loadedAssets[key] = true;
      if (this.debugText) {
        this.debugText.setText(`Loaded: ${key}`);
      }
    });
    
    // Handle file load errors
    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.key);
      this.loadedAssets[file.key] = false;
      if (this.debugText) {
        this.debugText.setText(`ERROR loading: ${file.key}`);
      }
    });

    // Use base path for clarity
    this.load.setBaseURL(window.location.origin);
    
    // Verify the dino-idle explicitly first
    this.load.image('dino-idle', '/game/dino-idle.png');
    
    // Load remaining images
    this.load.image('ground', '/game/ground.png');
    this.load.image('dino-duck', '/game/dino-duck.png');
    this.load.image('dino-hurt', '/game/dino-hurt.png');
    this.load.image('restart', '/game/restart.png');
    this.load.image('game-over', '/game/game-over.png');
    this.load.image('cloud', '/game/cloud.png');
    
    // Load cactus obstacles
    this.load.image('cactus-small-1', '/game/cactus-small-1.png');
    this.load.image('cactus-small-2', '/game/cactus-small-2.png');
    this.load.image('cactus-small-3', '/game/cactus-small-3.png');
    this.load.image('cactus-big-1', '/game/cactus-big-1.png');
    this.load.image('cactus-big-2', '/game/cactus-big-2.png');
    this.load.image('cactus-big-3', '/game/cactus-big-3.png');
    
    // Clean up when loading is complete
    this.load.on('complete', () => {
      // Check if key assets loaded successfully
      const criticalAssets = ['dino-idle', 'ground'];
      const missingAssets = criticalAssets.filter(asset => !this.loadedAssets[asset]);
      
      if (missingAssets.length > 0) {
        if (this.debugText) {
          this.debugText.setText(`WARNING: Missing critical assets: ${missingAssets.join(', ')}`);
          this.debugText.setColor('#ff0000');
        }
        console.error('Missing critical assets:', missingAssets);
      } else {
        if (this.debugText) {
          this.debugText.setText('All critical assets loaded successfully!');
          this.debugText.setColor('#00ff00');
        }
      }
      
      // Store loaded state in registry for other scenes
      this.game.registry.set('assetsLoaded', this.loadedAssets);
      
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      
      this.createAnimations();
      
      // Wait a moment so players can see the debug text
      this.time.delayedCall(2000, () => {
        this.scene.start('GameScene');
      });
    });
  }
  
  createAnimations() {
    try {
      // Create dino run animation using the idle image
      this.anims.create({
        key: 'dino-run',
        frames: [
          { key: 'dino-idle' },
          { key: 'dino-idle' }
        ],
        frameRate: 10,
        repeat: -1
      });
      
      // Bird fly animation also uses a static image
      this.anims.create({
        key: 'bird-fly',
        frames: [
          { key: 'dino-duck' },
          { key: 'dino-duck' }
        ],
        frameRate: 6,
        repeat: -1
      });
      
      // Store animation creation success in registry
      this.game.registry.set('animationsReady', true);
      console.log('Animations created successfully');
      if (this.debugText) {
        this.debugText.setText(this.debugText.text + '\nAnimations created.');
      }
    } catch (error) {
      console.error('Failed to create animations:', error);
      this.game.registry.set('animationsReady', false);
      if (this.debugText) {
        this.debugText.setText(this.debugText.text + '\nAnimation creation FAILED.');
      }
    }
  }
}