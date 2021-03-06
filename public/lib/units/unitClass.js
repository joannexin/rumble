(function () {
  if (typeof Rumble === "undefined") {
    window.Rumble = {};
  }

  var UnitClass = window.Rumble.UnitClass = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.color = args.color;
    this.attackRange = 1;
    this.moved = true;
    this.attacked = true;
    this.model = this.addModel();
    this.hpBar = this.addHpBAR();
    this.selectionSquare = this.addSelectionSquare();
    this.boardAddUnit();
    this.name = window.utils.nameUnit(this.type);
    this.nameColor = this.name + "(" + this.color + ")";
  };

  UnitClass.prototype.addModel = function() {
    var model = game.add.sprite(this.x, this.y, this.type + this.color);
    model.tint = 0xACACAC;

    model.animations.add('1', [0,1], 100, true);
    model.animations.add('2', [2,3], 100, true);
    model.inputEnabled = true;
    // model.events.onInputOver.add(function() { this.model.tint = 0xFFFFFF }, this);
    // model.events.onInputOut.add(function() { if (this.isTurnOver()) { this.model.tint = 0xACACAC }}, this);
    model.events.onInputDown.add(window.board.handleUnitClick, { context: this, contextFunction: window.board});
    model.frame = (this.x/64 < window.board.grid[0].length/2) ? 2 : 1; // face right if placed on left, vice versa
    return model;
  };

  // HP BAR
  UnitClass.prototype.addHpBAR = function() {
    var color = this.color == "Red" ? '#fa3c3a' : '#00e600';
    var width = 15 + Math.floor(this.hp * 0.2);
    var barConfig = {
      width: width,
      bar:   { color: color },
    };
    return new HealthBar(window.game, barConfig, this.model);
  };

  UnitClass.prototype.updateHpBar = function() {
    this.hpBar.setPercent(this.hp/this.maxHp * 100);
    if (this.hp <= 0) {
      var that = this;
      setTimeout(function() {
        that.hpBar.kill();
      }, 500)
    }
  };

  // selection square
  UnitClass.prototype.addSelectionSquare = function () {
    var selectionSquare = this.model.addChild(window.game.add.sprite(0, 0, 'tiles'))
    selectionSquare.frame = 40;
    selectionSquare.alpha = 0;
    window.game.add.tween(selectionSquare).to( { alpha: 1 }, 800, Phaser.Easing.Linear.None, true, 0, 1000, true);
    return selectionSquare;
  };

  UnitClass.prototype.select = function(n) {
    this.selectionSquare.frame = String(n) == 1 ? 50 : 51;
  };

  UnitClass.prototype.deselect = function() {
    this.selectionSquare.frame = 40;
  };


  UnitClass.prototype.boardAddUnit = function() {
    window.board.addUnit(this);
  };

  UnitClass.prototype.boardRemoveUnit = function() {
    window.board.removeUnit(this);
  };

  UnitClass.prototype.isTurnOver = function() {
    if (this.attacked) {
      return true;
    } else if (this.moved && !this.allEnemiesInRange()) {
      return true;
    } else {
      return false;
    }
  };

  UnitClass.prototype.startTurn = function() {
    this.moved = false;
    this.attacked = false;
    this.model.tint = 0xFFFFFF;
  };

  UnitClass.prototype.endTurn = function() {
    this.moved = true;
    this.attacked = true;
    this.model.tint = 0xACACAC;
    this.deselect();
  };

  UnitClass.prototype.isEnemyInRange = function(enemy) {
    var coors = this.atkRangeCoors();
    var that = this;
    for (var i = 0; i < coors.length; i++) {
      if (window.board.grid[coors[i][0]][coors[i][1]].unit == enemy) {
        return true;
      }
    }
    return false;
  };

  UnitClass.prototype.allEnemiesInRange = function() {
    var coors = [];
    var that = this;
    this.atkRangeCoors().forEach(function(coor) {
      var tileUnit = window.board.grid[coor[0]][coor[1]].unit;
      if (tileUnit && tileUnit.color !== that.color) {
        coors.push(coor);
      }
    })
    return coors.length === 0 ? false : coors;
  };

  UnitClass.prototype.enemiesInRange = function() { // array of enemies, if none - empty array
    var coors = this.allEnemiesInRange();
    if (coors) {
      return coors.map(function(coor) {
        return window.board.grid[coor[0]][coor[1]].unit;
      })
    } else {
      return [];
    }
  };

  UnitClass.prototype.atkRangeCoors = function() {
    // this function will get complicated with longer range
    var coor = this.currentGridCoor();
    return [[coor.i - 1, coor.j], [coor.i, coor.j + 1], [coor.i + 1, coor.j], [coor.i, coor.j - 1]].filter(function (a) {
      if (window.board.grid[a[0]] && window.board.grid[a[0]][a[1]]) {
        return a;
      }
    })
  };

  UnitClass.prototype.movementCoors = function() {
    return window.utils.movementCoors(window.board.grid, this);
  };

  UnitClass.prototype.animateFrames = function(stepTime, steps, pathXArr) {
    var that = this;
    if (pathXArr[1] > pathXArr[0]) {
      that.model.frame = 2;
    } else if (pathXArr[1] < pathXArr[0]) {
      that.model.frame = 1;
    }
    // that.model.frame < 2 ? that.model.animations.play('1') : that.model.animations.play('2');

    var idx = 1;
    var currentX = pathXArr[idx];
    var interval = setInterval(function() {
      idx ++;
      if (idx >= pathXArr.length) {
        clearInterval(interval);
      }
      if (pathXArr[idx] > currentX) {
        that.model.frame = 2;
      } else if (pathXArr[idx] < currentX) {
        that.model.frame = 1;
      }
      that.model.frame < 2 ? that.model.animations.play('1') : that.model.animations.play('2');
      that.model.animations.play(that.model.frame)
      currentX = pathXArr[idx];
    }, stepTime);
  };

  UnitClass.prototype.attack = function(unit) {
    var attacker = this;
    var defender = unit;
    attacker.attacked = true;
    battle.resolveDamage(attacker, defender);

    if (defender.hp === 0) {
      defender.destroy(); // defender dies
    } else if (defender.isEnemyInRange(attacker)) {
      // defender strikes back
      battle.resolveDamage(defender, attacker);
      if (attacker.hp === 0) {
        attacker.destroy(); // attacker dies
      } else {
        window.AI.findUnitToTakeTurn();
      }
    } else {
      window.AI.findUnitToTakeTurn();
    }
  };

  UnitClass.prototype.destroy = function() {
    var coor = this.currentGridCoor();
    var that = this;
    window.board.explode(this.model.position.x, this.model.position.y);
    window.board.grid[coor.i][coor.j].unit = undefined; // remove from board
    setTimeout(function() {
      that.model.kill(); // destroy phaser sprite
      window.battle.deleteUnit(that); // remove from team from battle
      window.AI.findUnitToTakeTurn();
    }, 500)
  };

  UnitClass.prototype.currentDamage = function() {
    var percentHp = this.hp / this.maxHp;
    return Math.max(Math.floor(this.maxDamage * percentHp), 1);
  };

  // ########### COORDINATES ###############
  UnitClass.prototype.currentGridCoor = function() {
    return { "i": this.model.position.y/64, "j": this.model.position.x/64 };
  };

  UnitClass.prototype.currentCoor = function() {
    return [this.model.position.y/64, this.model.position.x/64];
  };

  UnitClass.prototype.bestVsArmorTypes = function() {
    if (this.damageType == "light") {
      return ["light"];
    } else if (this.damageType == "medium") {
      return ["light", "medium", "heavy"];
    } else if (this.damageType == "heavy") {
      return ["heavy"];
    }
  };

  UnitClass.prototype.bestTargetFromArr = function(enemies) {
    var bestTarget, damageArmorRatio;
    for (var i = 0; i < enemies.length; i++) {
      if (!damageArmorRatio || window.Rumble.DamageVsArmor[this.damageType + '-' + enemies[i].armorType] > damageArmorRatio) {
        bestTarget = enemies[i];
        damageArmorRatio = window.Rumble.DamageVsArmor[this.damageType + '-' + enemies[i].armorType];
      }
    }
    return bestTarget;
  };

  UnitClass.prototype.canMoveThroughCoor = function (coor) {
    var tile = window.board.grid[coor[0]][coor[1]];
    return (window.Rumble.TerrainMovementReduction[this.movementType + "-" + tile.land.type] != undefined) && (!tile.unit || tile.unit.color == this.color)
  };
})();
