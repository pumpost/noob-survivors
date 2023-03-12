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
var enemyHP = 3;
var maxEnemy = 10;
var currentNumEnemy = 0;
var lastFired = 0;
var bulletSpeed = 500;
var playerDirection;

function preload() {
  // load game assets
  // this.load.image('player', 'assets/player.png');
  this.load.image('bullet', 'assets/sprites/aqua_ball.png');
  this.load.spritesheet('player', 'assets/sprites/player/knight_idle_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
  this.load.spritesheet('player-run', 'assets/sprites/player/knight_run_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
  this.load.spritesheet('enemy', 'assets/sprites/enemy/goblin_run_spritesheet.png', { frameWidth: 16, frameHeight: 16 });
}

function create() {
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
    player.play('idle', true);
    player.setVelocityX(0);
  }

  if (cursors.up.isDown) {
    player.setVelocityY(-200);
    playerDirection = 'up';
  } else if (cursors.down.isDown) {
    player.setVelocityY(200);
    playerDirection = 'down';
  } else {
    player.play('idle', true);
    player.setVelocityY(0);
  }

  // shoot bullets
  // if (this.input.activePointer.isDown) {
  if (this.time.now > lastFired) {
    // this.sound.play('shootSound');

    var bullet = bullets.create(player.x, player.y, 'bullet');

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

    lastFired = this.time.now + 500;
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
    } else {
      bullet.destroy();
    }
  });

  // check for player-enemy collisions
  this.physics.add.collider(player, enemies, function(player, enemy) {
    // playerHP -= 1;
    takeDamage(1)
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
    enemy.setCollideWorldBounds(true);

    enemy.play('walk', true);
    enemy.setVelocity(enemySpeed * Math.cos(Math.atan2(player.y - y, player.x - x)), enemySpeed * Math.sin(Math.atan2(player.y - y, player.x - x)));
    enemy.hp = enemyHP;
  }
}

function takeDamage(damageAmount) {
  playerHP -= damageAmount;
  console.log(playerHP)
  if (playerHP <= 0) {
    player.destroy();
  } else {
    hpBar.clear();
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(10, 10, 2 * playerHP, 20);
  }
}
