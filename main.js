// Create a new "Start Game" scene
class StartGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartGameScene' });
  }

  create() {
    // Add a button to start the game
    const startButton = this.add.text(400, 300, 'Start Game', { font: '32px Arial', fill: '#FFFFFF' });
    startButton.setOrigin(0.5, 0.5);
    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      // Start the "Main Game" scene
      this.scene.start('MainGameScene');
    });
  }
}

class MainGameScene extends Phaser.Scene {

  player;
  bullets;
  enemies;
  hpBar;
  cursors;
  enemySpeed = 50;
  playerHP = 100;
  enemyHP = 2;
  maxEnemy = 20;
  currentNumEnemy = 0;
  lastFired = 0;
  bulletSpeed = 500;
  playerDirection;
  killCountText;
  killCount = 0;
  wakeup = false;

  constructor() {
    super({ key: 'MainGameScene' });
  }

  preload() {
    // load game assets
    this.load.image('floor1', 'assets/sprites/tile/floor_1.png');
    this.load.image('floor2', 'assets/sprites/tile/floor_2.png');
    this.load.image('floor3', 'assets/sprites/tile/floor_3.png');
    this.load.image('floor4', 'assets/sprites/tile/floor_4.png');
    this.load.image('floor5', 'assets/sprites/tile/floor_5.png');
    this.load.image('floor6', 'assets/sprites/tile/floor_6.png');
    this.load.image('floor7', 'assets/sprites/tile/floor_7.png');
    this.load.image('floor8', 'assets/sprites/tile/floor_8.png');
    this.load.image('floor9', 'assets/sprites/tile/floor_9.png');
    this.load.image('bullet', 'assets/sprites/weapon/weapon_sword.png');
    this.load.spritesheet('player', 'assets/sprites/player/knight_idle_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('player-run', 'assets/sprites/player/knight_run_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('enemy', 'assets/sprites/enemy/goblin_run_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    // create a new random data generator
    const rand = new Phaser.Math.RandomDataGenerator();

    // create an array of floor sprite keys
    const floorSprites = ['floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'floor7', 'floor8', 'floor9'];

    // randomly choose a floor sprite key from the array
    const floorSpriteKey = rand.pick(floorSprites);

    const floor = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, floorSpriteKey);
    // set the tile position to the center of the screen
    floor.setPosition(this.game.config.width / 2, this.game.config.height / 2);
    // set the tile scale to fit the entire game world
    floor.setScale(1);

    this.killCountText = this.add.text(this.game.config.width - 10, 10, 'Kills: 0', { fontSize: '24px', fill: '#fff' });
    this.killCountText.setOrigin(1, 0);

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
    });

    // create game objects
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // create keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    this.hpBar = this.add.graphics();
    this.hpBar.fillStyle(0xff0000, 1);
    this.hpBar.fillRect(10, 10, 200, 20);

    // create enemy spawn timer
    this.time.addEvent({ delay: 1000, callback: this.spawnEnemy, callbackScope: this, loop: true });
  }

  update() {
    this.killCountText.setText('Kills: ' + this.killCount);

    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
      this.player.play('idle', true);
    } else {
      this.wakeup = true;
    }
    // move the player
    if (this.cursors.left.isDown) {
      this.player.play('player-run', true);
      this.player.setVelocityX(-200);
      this.player.flipX = true;
      this.playerDirection = 'left';
    } else if (this.cursors.right.isDown) {
      this.player.play('player-run', true);
      this.player.setVelocityX(200);
      this.player.flipX = false;
      this.playerDirection = 'right';
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.player.play('player-run', true);
      this.player.setVelocityY(-200);
      this.playerDirection = 'up';
    } else if (this.cursors.down.isDown) {
      this.player.play('player-run', true);
      this.player.setVelocityY(200);
      this.playerDirection = 'down';
    } else {
      this.player.setVelocityY(0);
    }

    // shoot bullets
    if (this.time.now > this.lastFired && this.wakeup == true) {
      // this.sound.play('shootSound');

      let bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
      bullet.setScale(1.5);
      this.tweens.add({
        targets: bullet,
        rotation: bullet.rotation + 360, // spin 360 degrees
        duration: 500, // in milliseconds
        ease: 'Linear',
        repeat: -1 // repeat indefinitely
      });

      // set bullet velocity based on player direction
      if (this.playerDirection == 'left') {
        bullet.setVelocityX(-this.bulletSpeed);
        bullet.setVelocityY(0);
      } else if (this.playerDirection == 'up') {
        bullet.setVelocityX(0);
        bullet.setVelocityY(-this.bulletSpeed);
      } else if (this.layerDirection == 'down') {
        bullet.setVelocityX(0);
        bullet.setVelocityY(this.bulletSpeed);
      } else {
        bullet.setVelocityX(this.bulletSpeed);
        bullet.setVelocityY(0);
      }

      this.lastFired = this.time.now + 350;
    }

    // check for bullet-enemy collisions
    this.physics.add.collider(this.bullets, this.enemies, (bullet, enemy) => {
      enemy.hp -= 1;
      if (enemy.hp <= 0) {
        bullet.destroy();
        enemy.destroy();
        this.currentNumEnemy -= 1;
        this.killCount++;
      } else {
        bullet.destroy();
      }
    });

    // check for player-enemy collisions
    this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
      // playerHP -= 1;
      if (this.playerHP > 0) {
        this.takeDamage();
      }
    });

    this.bullets.getChildren().forEach((bullet) => {
      if (bullet.y < -50 || bullet.y > this.game.config.height + 50 ||
          bullet.x < -50 || bullet.x > this.game.config.width + 50) {
        bullet.destroy();
      }
    });

    // Move enemies towards the player
    this.enemies.getChildren().forEach((enemy) => {
      if (this.player.x < enemy.x) {
        enemy.setScale(-2, 2); // flip sprite horizontally
      } else if (this.player.x > enemy.x) {
        enemy.setScale(2, 2); // flip sprite back to original
      }
      let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      enemy.setVelocity(Math.cos(angle) * this.enemySpeed, Math.sin(angle) * this.enemySpeed);
    });
  }

  spawnEnemy() {
    if (this.currentNumEnemy < this.maxEnemy) {
      this.currentNumEnemy += 1;
      const x = Phaser.Math.Between(0, this.game.config.width);
      const y = Phaser.Math.Between(0, this.game.config.height);
      const enemy = this.enemies.create(x, y, 'enemy');
      enemy.setScale(2);
      // enemy.setCollideWorldBounds(true);
      enemy.play('walk', true);
      enemy.setVelocity(this.enemySpeed * Math.cos(Math.atan2(this.player.y - y, this.player.x - x)), this.enemySpeed * Math.sin(Math.atan2(this.player.y - y, this.player.x - x)));
      enemy.hp = this.enemyHP;
    }
  }

  takeDamage() {
    this.playerHP -= 1;
    console.log(this.playerHP)
    if (this.playerHP <= 0) {
      // player.destroy();
      this.gameOver();
    } else {
      this.hpBar.clear();
      this.hpBar.fillStyle(0xff0000, 1);
      this.hpBar.fillRect(10, 10, 2 * this.playerHP, 20);
    }
  }

  gameOver() {
    // Pause the game
    this.physics.pause();
    // Create a game over text object
    const gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'GAME OVER', { fontSize: '64px', fill: '#fff' });
    gameOverText.setOrigin(0.5);

    // Set up a restart button
    const restartButton = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 100, 'Restart', { fontSize: '32px', fill: '#fff' });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on('pointerdown', () => {
      // Restart the game
      this.scene.restart();
      // Reset the kill count and update the text
      this.playerHP = 100;
      this.currentNumEnemy = 0;
      this.killCount = 0;
      this.killCountText.setText('Kills: 0');
    });
  }
}

// initialize the game
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [StartGameScene, MainGameScene]
};

new Phaser.Game(config);