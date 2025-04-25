"use client";

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { PreloadScene } from '../game/scenes/PreloadScene';
import { GameScene } from '../game/scenes/GameScene';
import { GameOverScene } from '../game/scenes/GameOverScene';

interface DinoGameProps {
  gameMode?: string;
}

export function DinoGame({ gameMode = 'challenge' }: DinoGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      try {
        // Make sure the container is visible and sized properly before creating the game
        if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) {
          containerRef.current.style.width = '800px';
          containerRef.current.style.height = '300px';
          containerRef.current.style.backgroundColor = '#f0f0f0';
          containerRef.current.style.visibility = 'visible';
          containerRef.current.style.display = 'block';
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          backgroundColor: '#ffffff',
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 300
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 1000 },
              debug: false
            }
          },
          scene: [PreloadScene, GameScene, GameOverScene]
        };

        console.log('Creating Phaser game with container:', containerRef.current);
        gameRef.current = new Phaser.Game(config);
        
        // Pass gameMode to the game scenes
        gameRef.current.registry.set('gameMode', gameMode);
        
        // Listen for game ready event
        gameRef.current.events.once('ready', () => {
          setIsGameReady(true);
          console.log('Phaser game is ready!');
        });

        return () => {
          if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
            setIsGameReady(false);
          }
        };
      } catch (error) {
        console.error('Error initializing game:', error);
        setGameError(error instanceof Error ? error.message : 'Unknown error initializing game');
      }
    }
  }, [gameMode]);

  // Recreate the game when gameMode changes
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('gameMode', gameMode);
      try {
        const gameScene = gameRef.current.scene.getScene('GameScene');
        if (gameScene) {
          gameScene.scene.restart();
        }
      } catch (error) {
        console.error('Error restarting game scene:', error);
      }
    }
  }, [gameMode]);

  return (
    <div className="w-full flex flex-col items-center">
      {gameError && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg">
          Error: {gameError}
        </div>
      )}
      
      {!isGameReady && (
        <div className="absolute z-10 bg-white bg-opacity-70 flex items-center justify-center p-4">
          Loading game...
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="game-container w-full max-w-[800px] h-[300px] border-2 border-[var(--app-card-border)] rounded-xl overflow-hidden shadow-lg"
        style={{ 
          minHeight: '300px',
          backgroundColor: '#f0f0f0',
          position: 'relative',
        }}
      />
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Press SPACE to jump, DOWN to duck, or tap/click the screen.
      </div>
    </div>
  );
}

export default DinoGame;