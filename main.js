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

class LevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUpScene' });
  }

  preload() {
    // load game assets
    this.load.image('skill1', 'assets/sprites/skill/attack_boost.png');
    this.load.image('skill2', 'assets/sprites/skill/attack_speed_boost.png');
    this.load.image('skill3', 'assets/sprites/tile/floor_2.png');
  }

  create() {

    // create a text object and set its style
    this.add.text(300, 185, "increase attack range", {
      fontSize: "24px",
      fill: "#ffffff",
      backgroundColor: "#000"
    });

    this.add.text(300, 285, "increase attack speed", {
      fontSize: "24px",
      fill: "#ffffff",
      backgroundColor: "#000"
    });

    // set the text object's background to transparent
    // text.setPadding(0, 0, 0, 0);
    // text.setBackgroundColor("rgba(0,0,0,0)");

    // Add skill card images
    this.add.image(260, 200, 'skill1').setScale(3).setInteractive().setData('skill', {bulletDuration: 200}).on('clicked', this.onSkillCardClicked, this);
    this.add.image(260, 300, 'skill2').setScale(3).setInteractive().setData('skill', {atkCooldown: 50}).on('clicked', this.onSkillCardClicked, this);
    // this.add.image(300, 400, 'skill3').setScale(3).setInteractive().on('clicked', this.onSkillCardClicked, this);

    // Add text
    this.add.text(400, 100, 'Choose a skill to learn', { font: '32px Arial', fill: '#ffffff' }).setOrigin(0.5);

    // Add input events for skill cards
    this.input.on('gameobjectdown', function (pointer, gameObject)
    {
      gameObject.emit('clicked', gameObject);
    }, this);
  }

  onSkillCardClicked(gameObject) {
    const skill = gameObject.getData('skill');
    this.scene.stop();
    this.scene.resume('MainGameScene', {
      action: 'levelup',
      ...skill
    });
    // Handle skill card click event
    // For example, you can save the selected skill to a variable and close the LevelUpScene
  }
}

class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene', active: false });
  }

  create() {
    // Add a resume button
    this.resumeButton = this.add.text(400, 300, 'Resume', { fontSize: '32px', fill: '#fff' })
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.stop();
        this.scene.resume('MainGameScene');
      });

    // Set the position of the button
    this.resumeButton.setOrigin(0.5);
  }
}

class MainGameScene extends Phaser.Scene {

  player;
  bullets;
  enemies;
  hpBarFill;
  hpBar;
  cursors;
  enemySpeed = 50;
  playerHP = 100;
  enemyHP = 2;
  maxEnemy = 20;
  currentNumEnemy = 0;
  lastFired = 0;
  attackCooldown = 350;
  bulletSpeed = 500;
  bulletDuration = 200;
  playerDirection;
  levelCountText;
  killCountText;
  killCount = 0;
  wakeup = false;
  pauseBtn;
  resumeBtn;
  expBar;
  expBarFill;
  playerXP = 0;
  playerLevel = 1;

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

    // this.killCountText = this.add.text(this.game.config.width - 10, 10, 'Kills: 0', { fontSize: '24px', fill: '#fff' });
    // this.killCountText.setOrigin(1, 0);

    this.levelCountText = this.add.text(this.game.config.width - 20, 10, 'Lv: 1', { fontSize: '16px', fill: '#fff' });
    this.levelCountText.setOrigin(1, 0);

    this.killCountText = this.add.text(this.game.config.width - 20, 40, 'Kills: 0', { fontSize: '16px', fill: '#fff' });
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

    // Create a new graphics object
    this.hpBar = this.add.graphics();

    // Draw a background rectangle for the bar
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(10, 10, 200, 15);

    this.hpBarFill = this.add.graphics();
    this.hpBarFill.fillStyle(0xff0000, 1);
    this.hpBarFill.fillRect(10, 10, 200, 15);

    // Create a new graphics object
    this.expBar = this.add.graphics();

    // Draw a background rectangle for the bar
    this.expBar.fillStyle(0x000000, 0.5);
    this.expBar.fillRect(this.game.config.width/2 - 150, 10, 300, 5);

    // Draw a rectangle for the fill
    this.expBarFill = this.add.graphics();
    this.expBarFill.fillStyle(0xffffff, 1);
    this.expBarFill.fillRect(this.game.config.width/2 - 150, 10, 0, 5);

    this.pauseBtn = this.add.text(this.game.config.width, this.game.config.height, 'Pause', { fontSize: '24px', fill: '#FFF' })
    .setInteractive()
    .on('pointerdown', () => {
      this.pauseGame();
    });

    this.pauseBtn.setOrigin(1, 1);

    this.events.on('resume', (scene, data) => {
      this.pauseBtn.visible = true;
      if (data.action == "levelup") {
        if (data.bulletDuration) {
          this.bulletDuration += data.bulletDuration;
        } else if (data.atkCooldown) {
          this.attackCooldown -= data.atkCooldown;
        }
      }
    });

    // create enemy spawn timer
    this.time.addEvent({ delay: 1000, callback: this.spawnEnemy, callbackScope: this, loop: true });
  }

  update() {

    this.expBarFill.clear();
    this.expBarFill.fillStyle(0xffffff, 1);
    this.expBarFill.fillRect(this.game.config.width/2 - 150, 10, ((this.playerXP / (10 * this.playerLevel)) * 100) * 3, 5);

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
        duration: 250, // in milliseconds
        ease: 'Linear',
        repeat: -1 // repeat indefinitely
      });
      this.time.addEvent({
        delay: this.bulletDuration,
        callback: () => {
          bullet.destroy();
        }
      });

      // set bullet velocity based on player direction
      if (this.playerDirection == 'left') {
        bullet.setVelocityX(-this.bulletSpeed);
        bullet.setVelocityY(0);
      } else if (this.playerDirection == 'up') {
        bullet.setVelocityX(0);
        bullet.setVelocityY(-this.bulletSpeed);
      } else if (this.playerDirection == 'down') {
        bullet.setVelocityX(0);
        bullet.setVelocityY(this.bulletSpeed);
      } else {
        bullet.setVelocityX(this.bulletSpeed);
        bullet.setVelocityY(0);
      }

      this.lastFired = this.time.now + this.attackCooldown;
    }

    // check for bullet-enemy collisions
    this.physics.add.collider(this.bullets, this.enemies, (bullet, enemy) => {
      enemy.hp -= 1;
      if (enemy.hp <= 0) {
        bullet.destroy();
        enemy.destroy();
        this.currentNumEnemy -= 1;
        this.killCount++;
        this.playerXP += 1;
        if (this.playerXP >= (10 * this.playerLevel)) {
          // Level up the player
          console.log("level up!!");
          this.levelUp();
        }
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
    if (this.playerHP <= 0) {
      // player.destroy();
      this.gameOver();
    } else {
      this.hpBarFill.clear();
      this.hpBarFill.fillStyle(0xff0000, 1);
      this.hpBarFill.fillRect(10, 10, 2 * this.playerHP, 15);
    }
  }

  gameOver() {
    // Pause the game
    this.pauseBtn.visible = false;
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
      this.wakeup = false;
      this.currentNumEnemy = 0;
      this.killCount = 0;
      this.attackCooldown = 350;
      this.bulletDuration = 200;
      this.playerLevel = 1;
      this.playerXP = 0;
      this.killCountText.setText('Kills: 0');
    });
  }

  pauseGame() {
    this.scene.pause();
    this.scene.launch('PauseScene');
    this.pauseBtn.visible = false;
  }

  levelUp() {
    this.playerXP = 0;
    this.playerLevel++;
    this.levelCountText.setText('Lv: ' + this.playerLevel);

    this.scene.pause();
    this.scene.launch('LevelUpScene');
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
  scene: [StartGameScene, MainGameScene, LevelUpScene, PauseScene]
};

new Phaser.Game(config);