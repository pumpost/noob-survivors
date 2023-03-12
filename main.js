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
var enemyHP = 10;
var maxEnemy = 5;
var currentNumEnemy = 0;
var lastFired = 0;

function preload() {
  // load game assets
  this.load.image('player', 'assets/player.png');
  this.load.image('bullet', 'assets/bullet.png');
  // this.load.image('enemy', 'assets/enemy.png');
  this.load.spritesheet('enemy', 'assets/sprites/metalslug_mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
}

function create() {
  this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 16 }),
      frameRate: 10,
      repeat: -1,
  });

  // create game objects
  player = this.physics.add.sprite(400, 300, 'player');
  player.setCollideWorldBounds(true);

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
    player.setVelocityX(-200);
    player.angle = 180;
  } else if (cursors.right.isDown) {
    player.setVelocityX(200);
    player.angle = 0;
  } else {
    player.setVelocityX(0);
  }

  if (cursors.up.isDown) {
    player.setVelocityY(-200);
    player.angle = -90;
  } else if (cursors.down.isDown) {
    player.setVelocityY(200);
    player.angle = 90;
  } else {
    player.setVelocityY(0);
  }

  // shoot bullets
  // if (this.input.activePointer.isDown) {
  if (this.time.now > lastFired) {
    // this.sound.play('shootSound');

    // Loop through each of the 3 projectiles to be fired
    for (var i = 0; i < 3; i++) {
      // Calculate the offset angle of each projectile
      var angleOffset = (i - 1) * 0.1;

      // Create the bullet sprite
      var bullet = bullets.create(player.x, player.y, 'bullet');

      // Set the bullet's velocity based on the player's rotation and angle offset
      bullet.setVelocity(500 * Math.cos(player.rotation + angleOffset), 500 * Math.sin(player.rotation + angleOffset));

      lastFired = this.time.now + 500;
    }
  }
    // var bullet = bullets.create(player.x, player.y, 'bullet');
    // bullet.setVelocity(1000 * Math.cos(player.rotation), 1000 * Math.sin(player.rotation));
  // }

  // check for bullet-enemy collisions
  this.physics.add.collider(bullets, enemies, function(bullet, enemy) {
    enemyHP -= 1;
    if (enemyHP <= 0) {
      bullet.destroy();
      enemy.destroy();
      currentNumEnemy -= 1;
      enemyHP = 10;
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
      enemy.setScale(-1, 1); // flip sprite horizontally
    } else if (player.x > enemy.x) {
      enemy.setScale(1, 1); // flip sprite back to original
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
