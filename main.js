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
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

// define variables
var player;
var bullets;
var enemies;
var hpBar;
var enemySpeed = 50;
var playerHP = 100;
var enemyHP = 2;
var maxEnemy = 20;
var currentNumEnemy = 0;
var lastFired = 0;
var bulletSpeed = 500;
var playerDirection;
var killCountText;
var killCount = 0;
var wakeup;
var $this;


function preload() {
  // load game assets
  // this.load.image('player', 'assets/player.png');
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

function create() {
  $this = this;
  wakeup = false;

  // create a new random data generator
  let rand = new Phaser.Math.RandomDataGenerator();

  // create an array of floor sprite keys
  let floorSprites = ['floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'floor7', 'floor8', 'floor9'];

  // randomly choose a floor sprite key from the array
  let floorSpriteKey = rand.pick(floorSprites);

  let floor = this.add.tileSprite(0, 0, game.config.width, game.config.height, floorSpriteKey);
  // set the tile position to the center of the screen
  floor.setPosition(game.config.width / 2, game.config.height / 2);
  // set the tile scale to fit the entire game world
  floor.setScale(1);

  killCountText = this.add.text(game.config.width - 10, 10, 'Kills: 0', { fontSize: '24px', fill: '#fff' });
  killCountText.setOrigin(1, 0);

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
  player = this.physics.add.sprite(400, 300, 'player');
  player.setScale(2);
  player.setCollideWorldBounds(true);
  // player.play('idle', true);

  bullets = this.physics.add.group();
  enemies = this.physics.add.group();

  // create keyboard input
  cursors = this.input.keyboard.createCursorKeys();

  hpBar = this.add.graphics();
  hpBar.fillStyle(0xff0000, 1);
  hpBar.fillRect(10, 10, 200, 20);

  // create enemy spawn timer
  this.time.addEvent({ delay: 1000, callback: spawnEnemy, loop: true });
}

function update() {
  killCountText.setText('Kills: ' + killCount);

  if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
    player.play('idle', true);
  } else {
    wakeup = true;
  }

  // move the player
  if (cursors.left.isDown) {
    player.play('player-run', true);
    player.setVelocityX(-200);
    player.flipX = true;
    playerDirection = 'left';
  } else if (cursors.right.isDown) {
    player.play('player-run', true);
    player.setVelocityX(200);
    player.flipX = false;
    playerDirection = 'right';

  } else {
    // player.play('idle', true);
    player.setVelocityX(0);
  }

  if (cursors.up.isDown) {
    player.play('player-run', true);
    player.setVelocityY(-200);
    playerDirection = 'up';
  } else if (cursors.down.isDown) {
    player.play('player-run', true);
    player.setVelocityY(200);
    playerDirection = 'down';
  } else {
    // player.play('idle', true);
    player.setVelocityY(0);
  }

  // shoot bullets
  // if (this.input.activePointer.isDown) {
  if (this.time.now > lastFired && wakeup == true) {
    // this.sound.play('shootSound');

    var bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setScale(1.5);
    this.tweens.add({
      targets: bullet,
      rotation: bullet.rotation + 360, // spin 360 degrees
      duration: 500, // in milliseconds
      ease: 'Linear',
      repeat: -1 // repeat indefinitely
    });

    // set bullet velocity based on player direction
    if (playerDirection == 'left') {
      bullet.setVelocityX(-bulletSpeed);
      bullet.setVelocityY(0);
    } else if (playerDirection == 'up') {
      bullet.setVelocityX(0);
      bullet.setVelocityY(-bulletSpeed);
    } else if (playerDirection == 'down') {
      bullet.setVelocityX(0);
      bullet.setVelocityY(bulletSpeed);
    } else {
      bullet.setVelocityX(bulletSpeed);
      bullet.setVelocityY(0);
    }
    // Loop through each of the 3 projectiles to be fired
    // for (var i = 0; i < 3; i++) {
    //   // Calculate the offset angle of each projectile
    //   var angleOffset = (i - 1) * 0.1;

    //   // Create the bullet sprite
    //   var bullet = bullets.create(player.x, player.y, 'bullet');

    //   // Set the bullet's velocity based on the player's rotation and angle offset
    //   bullet.setVelocity(500 * Math.cos(player.rotation + angleOffset), 500 * Math.sin(player.rotation + angleOffset));
    // }

    lastFired = this.time.now + 350;
  }
    // var bullet = bullets.create(player.x, player.y, 'bullet');
    // bullet.setVelocity(1000 * Math.cos(player.rotation), 1000 * Math.sin(player.rotation));
  // }

  // check for bullet-enemy collisions
  this.physics.add.collider(bullets, enemies, function(bullet, enemy) {
    enemy.hp -= 1;
    if (enemy.hp <= 0) {
      bullet.destroy();
      enemy.destroy();
      currentNumEnemy -= 1;
      killCount++;
    } else {
      bullet.destroy();
    }
  });

  // check for player-enemy collisions
  this.physics.add.collider(player, enemies, (player, enemy) => {
    // playerHP -= 1;
    if (playerHP > 0) {
      takeDamage(1);
    }
  });

  bullets.getChildren().forEach(function(bullet) {
    if (bullet.y < -50 || bullet.y > game.config.height + 50 ||
        bullet.x < -50 || bullet.x > game.config.width + 50) {
      bullet.destroy();
    }
  });

  // Move enemies towards the player
  enemies.getChildren().forEach(function(enemy) {
    if (player.x < enemy.x) {
      enemy.setScale(-2, 2); // flip sprite horizontally
    } else if (player.x > enemy.x) {
      enemy.setScale(2, 2); // flip sprite back to original
    }
    var angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
  });
}

function spawnEnemy() {
  if (currentNumEnemy < maxEnemy) {
    currentNumEnemy += 1;
    var x = Phaser.Math.Between(0, game.config.width);
    var y = Phaser.Math.Between(0, game.config.height);
    var enemy = enemies.create(x, y, 'enemy');
    enemy.setScale(2);
    // enemy.setCollideWorldBounds(true);

    enemy.play('walk', true);
    enemy.setVelocity(enemySpeed * Math.cos(Math.atan2(player.y - y, player.x - x)), enemySpeed * Math.sin(Math.atan2(player.y - y, player.x - x)));
    enemy.hp = enemyHP;
  }
}

function takeDamage(damageAmount) {
  playerHP -= damageAmount;
  console.log(playerHP)
  if (playerHP <= 0) {
    // player.destroy();
    gameOver();
  } else {
    hpBar.clear();
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(10, 10, 2 * playerHP, 20);
  }
}


function gameOver() {
  // Pause the game
  $this.physics.pause();
  // Create a game over text object
  const gameOverText = $this.add.text(game.config.width / 2, game.config.height / 2, 'GAME OVER', { fontSize: '64px', fill: '#fff' });
  gameOverText.setOrigin(0.5);

  // Set up a restart button
  const restartButton = $this.add.text(game.config.width / 2, game.config.height / 2 + 100, 'Restart', { fontSize: '32px', fill: '#fff' });
  restartButton.setOrigin(0.5);
  restartButton.setInteractive({ useHandCursor: true });
  restartButton.on('pointerdown', () => {
    // Restart the game
    $this.scene.restart();
    // Reset the kill count and update the text
    playerHP = 100;
    currentNumEnemy = 0;
    killCount = 0;
    killCountText.setText('Kills: 0');
  });
}