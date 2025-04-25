import * as Phaser from 'phaser';

interface GameObjects {
  ground?: Phaser.GameObjects.TileSprite;
  dino?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  obstacles?: Phaser.Physics.Arcade.Group;
  clouds?: Phaser.GameObjects.Group;
  scoreText?: Phaser.GameObjects.Text;
  gameModeText?: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private gameSpeed: number = 10;
  private spawnTime: number = 0;
  private score: number = 0;
  private isGameRunning: boolean = false;
  private gameObjects: GameObjects = {};
  private jumpSound?: Phaser.Sound.BaseSound;
  private hitSound?: Phaser.Sound.BaseSound;
  private pointSound?: Phaser.Sound.BaseSound;
  private gameMode: string = 'solo';
  private animationsReady: boolean = false;
  private debugText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Check if animations are ready from the registry
    this.animationsReady = this.game.registry.get('animationsReady') === true;
    console.log('GameScene init - animations ready:', this.animationsReady);
  }

  create() {
    // Get the game mode from registry
    this.gameMode = this.game.registry.get('gameMode') || 'solo';
    
    this.isGameRunning = true;
    this.gameSpeed = 10;
    this.score = 0;
    this.spawnTime = 0;

    // Create background
    const { width, height } = this.game.config;
    this.add.rectangle(0, 0, width as number, height as number, 0xffffff)
      .setOrigin(0, 0);

    // Add debug text to help troubleshoot
    this.debugText = this.add.text(width as number / 2, height as number / 2 - 60, 'Loading game...', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff0000'
    }).setOrigin(0.5).setDepth(1000);

    // Create ground with error handling
    try {
      this.debugText.setText('Creating ground...');
      this.gameObjects.ground = this.add.tileSprite(
        0, 
        (height as number) - 30, 
        width as number, 
        30, 
        'ground'
      ).setOrigin(0, 1);
      
      // Add physics to the ground
      this.physics.add.existing(this.gameObjects.ground, true);
      this.debugText.setText('Ground created successfully');
    } catch (error) {
      console.error('Error creating ground:', error);
      this.debugText.setText('Error creating ground. Using fallback...');
      
      // Create a fallback ground as a plain rectangle
      const fallbackGroundRect = this.add.rectangle(
        0,
        (height as number) - 30,
        width as number,
        30,
        0xCCCCCC
      ).setOrigin(0, 1);
      
      this.gameObjects.ground = this.add.tileSprite(
        0,
        (height as number) - 30,
        width as number,
        30,
        '__DEFAULT'
      ).setOrigin(0, 1);
      this.gameObjects.ground.setVisible(false);
      
      this.physics.add.existing(this.gameObjects.ground, true);
    }
    
    // Create a debug rectangle to verify positioning (only in development)
    if (process.env.NODE_ENV !== 'production') {
      this.add.rectangle(
        100, 
        (height as number) - 60,
        40,
        60,
        0xFF0000
      ).setOrigin(0.5, 1).setDepth(100);
    }
    
    // Create dino character
    this.debugText.setText('Creating dinosaur at center...');
    try {
      // Force position the dinosaur in the middle of the screen where it will be visible
      const dinoX = 100;
      const dinoY = (height as number) - 60;
      
      // First add a visible rectangle to mark where the dino should be
      this.add.rectangle(dinoX, dinoY, 50, 70, 0xFF00FF).setOrigin(0.5, 1);
      
      // Create the dino with static texture first
      this.gameObjects.dino = this.physics.add.sprite(dinoX, dinoY, 'dino-idle');
      
      // Configure the dino properties
      this.gameObjects.dino
        .setOrigin(0.5, 1)
        .setCollideWorldBounds(true)
        .setGravityY(2000)
        .setDepth(10)
        .setScale(2.0); // Make it twice as big
      
      this.debugText.setText(`Dino created at: ${dinoX},${dinoY} with dimensions: ${this.gameObjects.dino.width}x${this.gameObjects.dino.height}`);
    } catch (error) {
      console.error('Error creating dinosaur:', error);
      this.debugText.setText('ERROR: Failed to create dinosaur');
      
      // Last resort: Create a rectangle where dinosaur should be
      this.add.rectangle(
        100, 
        (height as number) - 60, 
        40, 
        60, 
        0x0000FF
      ).setOrigin(0.5, 1).setDepth(50);
    }
    
    // Set collision between dino and ground
    if (this.gameObjects.dino && this.gameObjects.ground) {
      this.physics.add.collider(this.gameObjects.dino, this.gameObjects.ground);
      this.debugText.setText('Collision set up.');
    }
    
    // Create obstacles group
    this.gameObjects.obstacles = this.physics.add.group();
    
    // Create clouds group
    this.gameObjects.clouds = this.add.group();
    
    // Set up collision between dino and obstacles
    if (this.gameObjects.dino && this.gameObjects.obstacles) {
      this.physics.add.collider(
        this.gameObjects.dino, 
        this.gameObjects.obstacles, 
        this.gameOver, 
        undefined, 
        this
      );
    }
    
    // Set up score
    this.gameObjects.scoreText = this.add.text(width as number - 20, 20, '00000', { 
      fontSize: '20px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#535353'
    }).setOrigin(1, 0);
    
    // Display game mode (solo or challenge)
    this.gameObjects.gameModeText = this.add.text(20, 20, 
      this.gameMode === 'solo' ? 'SOLO MODE' : 'CHALLENGE MODE', { 
      fontSize: '16px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: this.gameMode === 'solo' ? '#3a7e4d' : '#7e3a3a'
    }).setOrigin(0, 0);
    
    // Set up input
    this.input.keyboard?.on('keydown-SPACE', this.jump, this);
    this.input.keyboard?.on('keydown-DOWN', this.duck, this);
    this.input.keyboard?.on('keyup-DOWN', this.stand, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
    
    // Leave debug text visible longer
    this.time.delayedCall(10000, () => {
      if (this.debugText) this.debugText.setVisible(false);
    });
  }

  // Safe method to set the dino to running state
  private setDinoRunning() {
    if (!this.gameObjects.dino) {
      if (this.debugText) this.debugText.setText('ERROR: No dinosaur object exists');
      return;
    }
    
    if (this.animationsReady) {
      try {
        this.gameObjects.dino.play('dino-run');
        if (this.debugText) this.debugText.setText('Playing dino-run animation');
      } catch (error) {
        console.error('Failed to play dino-run animation:', error);
        this.gameObjects.dino.setTexture('dino-idle');
        if (this.debugText) this.debugText.setText('Using static dino-idle texture');
      }
    } else {
      // Just use the static texture if animations aren't ready
      this.gameObjects.dino.setTexture('dino-idle');
      if (this.debugText) this.debugText.setText('Using static dino-idle texture (no animations)');
    }
  }
  
  update(time: number, delta: number) {
    if (!this.isGameRunning) return;
    
    // Update score
    this.score += 0.05;
    if (this.gameObjects.scoreText) {
      this.gameObjects.scoreText.setText(Math.floor(this.score).toString().padStart(5, '0'));
    }
    
    // Speed up game over time
    if (Math.floor(this.score) % 100 === 0 && Math.floor(this.score) > 0) {
      this.gameSpeed += 0.5;
    }
    
    // Spawn obstacles
    this.spawnTime += delta;
    if (this.spawnTime >= Phaser.Math.Between(1500, 3000)) {
      this.spawnObstacle();
      this.spawnTime = 0;
    }
    
    // Spawn clouds occasionally
    if (Phaser.Math.Between(0, 1000) > 990) {
      this.spawnCloud();
    }
    
    // Update ground position to create infinite scroll effect
    if (this.gameObjects.ground) {
      this.gameObjects.ground.tilePositionX += this.gameSpeed;
    }
    
    // Update obstacles
    if (this.gameObjects.obstacles) {
      this.gameObjects.obstacles.getChildren().forEach((obstacle: Phaser.GameObjects.GameObject) => {
        const obstacleSprite = obstacle as Phaser.Physics.Arcade.Sprite;
        obstacleSprite.x -= this.gameSpeed;
        
        // Remove obstacles when they go off-screen
        if (obstacleSprite.x < -obstacleSprite.width) {
          obstacleSprite.destroy();
        }
      });
    }
    
    // Update clouds
    if (this.gameObjects.clouds) {
      this.gameObjects.clouds.getChildren().forEach((cloud: Phaser.GameObjects.GameObject) => {
        const cloudImage = cloud as Phaser.GameObjects.Image;
        cloudImage.x -= this.gameSpeed / 2;
        
        // Remove clouds when they go off-screen
        if (cloudImage.x < -cloudImage.width) {
          cloudImage.destroy();
        }
      });
    }
  }
  
  private jump() {
    if (!this.isGameRunning) return;
    
    const { dino } = this.gameObjects;
    
    // Only allow jumping if the dino is on the ground
    if (dino?.body.touching.down) {
      dino.setVelocityY(-800);
      dino.setTexture('dino-idle');
    }
  }
  
  private duck() {
    if (!this.isGameRunning) return;
    
    const { dino } = this.gameObjects;
    
    // Only duck if the dino is on the ground
    if (dino?.body.touching.down) {
      dino.setTexture('dino-duck');
      dino.body.setSize(dino.width, dino.height / 2);
    }
  }
  
  private stand() {
    if (!this.isGameRunning) return;
    
    const { dino } = this.gameObjects;
    
    // Return to running pose
    if (dino?.body.touching.down) {
      if (this.animationsReady) {
        try {
          dino.play('dino-run');
        } catch (error) {
          console.error('Error playing dino-run animation in stand():', error);
          dino.setTexture('dino-idle');
        }
      } else {
        dino.setTexture('dino-idle');
      }
      
      dino.body.setSize(dino.width, dino.height);
    }
  }
  
  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.isGameRunning) return;
    
    // Jump if tap on upper half of screen, duck if tap on lower half
    if (pointer.y < (Number(this.game.config.height) / 2)) {
      this.jump();
    } else {
      this.duck();
      
      // Set a timer to stand up after a brief period
      this.time.delayedCall(500, this.stand, [], this);
    }
  }
  
  private spawnObstacle() {
    if (!this.isGameRunning) return;
    
    const { width, height } = this.game.config;
    
    // Choose randomly between cactus or bird, only using bird if animations are available
    const canUseBird = this.animationsReady;
    const obstacleType = canUseBird && Phaser.Math.Between(0, 10) > 8 ? 'bird' : 'cactus';
    
    if (obstacleType === 'bird') {
      // Birds fly at different heights
      const birdHeight = Phaser.Math.Between(1, 2) === 1 
        ? (height as number) - 90  // High bird
        : (height as number) - 60; // Low bird
      
      try {
        const bird = this.physics.add.sprite(width as number, birdHeight, 'bird-1')
          .setOrigin(0, 1);
        
        if (this.animationsReady) {
          try {
            bird.play('bird-fly');
          } catch (error) {
            console.error('Failed to play bird-fly animation:', error);
          }
        }
        
        if (this.gameObjects.obstacles) {
          this.gameObjects.obstacles.add(bird);
        }
      } catch (error) {
        console.error('Error creating bird obstacle:', error);
      }
    } else {
      // Various cactus types
      const cactusNum = Phaser.Math.Between(1, 6);
      const cactusSize = cactusNum <= 3 ? 'small' : 'big';
      const cactusVariant = ((cactusNum - 1) % 3) + 1;
      const cactusKey = `cactus-${cactusSize}-${cactusVariant}`;
      
      try {
        const cactus = this.physics.add.sprite(
          width as number, 
          (height as number) - 30, 
          cactusKey
        ).setOrigin(0, 1);
        
        if (this.gameObjects.obstacles) {
          this.gameObjects.obstacles.add(cactus);
        }
      } catch (error) {
        console.error('Error creating cactus obstacle:', error);
        // Create a fallback obstacle
        const fallbackCactus = this.physics.add.sprite(
          width as number, 
          (height as number) - 30, 
          'dino-idle'
        ).setOrigin(0, 1);
        
        if (this.gameObjects.obstacles) {
          this.gameObjects.obstacles.add(fallbackCactus);
        }
      }
    }
  }
  
  private spawnCloud() {
    if (!this.isGameRunning) return;
    
    const { width, height } = this.game.config;
    const cloudY = Phaser.Math.Between(30, (height as number) / 2);
    
    try {
      if (this.textures.exists('cloud')) {
        const cloud = this.add.image(width as number, cloudY, 'cloud');
        if (this.gameObjects.clouds) {
          this.gameObjects.clouds.add(cloud);
        }
      }
    } catch (error) {
      console.error('Error spawning cloud:', error);
    }
  }
  
  private gameOver() {
    this.isGameRunning = false;
    
    // Change dino to hurt sprite
    if (this.gameObjects.dino) {
      this.gameObjects.dino.setTexture('dino-hurt');
    }
    
    // Stop animations safely
    try {
      this.anims.pauseAll();
    } catch (error) {
      console.error('Error pausing animations:', error);
    }
    
    // Store the high score
    const highScore = localStorage.getItem('dinoHighScore') || '0';
    if (this.score > parseInt(highScore)) {
      localStorage.setItem('dinoHighScore', Math.floor(this.score).toString());
    }
    
    // Wait a moment then show game over scene
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', { 
        score: Math.floor(this.score),
        highScore: Math.max(Math.floor(this.score), parseInt(highScore)),
        gameMode: this.gameMode
      });
    });
  }
}