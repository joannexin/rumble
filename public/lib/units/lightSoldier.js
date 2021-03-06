(function () {
  if (typeof Rumble === "undefined") {
    window.Rumble = {};
  }

  var LightSoldier = window.Rumble.LightSoldier = function (args) {
    this.type = "lightSoldier";
    this.maxHp = 50;
    this.maxDamage = 22;
    this.movementRange = 3;
    this.armorType = "light";
    this.damageType = "light";
    this.hp = this.maxHp;
    this.movementType = "foot";

    var newArgs = {
      x: args.x,
      y: args.y,
      color: args.color
    }
    window.Rumble.UnitClass.call(this, newArgs);
  };
  window.utils.inherits(LightSoldier, window.Rumble.UnitClass);


})();
