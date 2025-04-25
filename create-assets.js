const fs = require('fs');
const path = require('path');

const assetsPath = path.join(__dirname, 'public', 'game');

// Ensure the directory exists
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}

// Create a simple colored rectangle as placeholder for each image
// List of all required assets from PreloadScene.ts
const assets = [
  'ground.png',
  'dino-idle.png',
  'dino-run.png',
  'dino-duck.png',
  'dino-hurt.png',
  'restart.png',
  'game-over.png',
  'cloud.png',
  'cactus-small-1.png',
  'cactus-small-2.png',
  'cactus-small-3.png',
  'cactus-big-1.png',
  'cactus-big-2.png',
  'cactus-big-3.png',
  'bird.png'
];

console.log('Creating placeholder game assets...');
assets.forEach(asset => {
  const assetPath = path.join(assetsPath, asset);
  // Create a minimal 1x1 PNG file for each asset if it doesn't exist
  if (!fs.existsSync(assetPath)) {
    // This is a minimal valid PNG file (1x1 pixel)
    const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(assetPath, minimalPNG);
    console.log(`Created ${asset}`);
  }
});

console.log('Done creating game assets!');
