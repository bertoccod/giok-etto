export function playerClass(x, y, w, h, jS, speed, doubleJump,skin) {
  const smile = new Image();
  switch (skin){
    case 0: smile.src = "assets/players/player_etto.png";break;
    case 1: smile.src = "assets/players/player_potter.png";break;
    case 2: smile.src = "assets/players/player_albert.png";break;
    case 3: smile.src = "assets/players/player_homer.png";break;
    case 4: smile.src = "assets/players/player_mine.png";break;
  }
  //smile.src = "assets/player_potter.png";
  let player = {
    x: x,
    y: y,
    width: w,
    height: h,
    velocityY: 0,
    velocityX: 0,
    gravity: 2300,
    jumpStrength: jS,
    speed: speed,
    grounded: false,
    starterX: x,
    doubleJump: 0,

    update(canvas, deltaTime, base, keys,ostacoli) {
      const dt = deltaTime / 1000; // converti in secondi
      this.velocityY += this.gravity * dt; // ✅ gravità scalata
      this.y += this.velocityY * dt;       // ✅ movimento scalato
      //CHECK LANDING SU OGGETTO      
      const pl = this.getBounds();
      for (let ostacolo of ostacoli){
        if (ostacolo.tipo!=1 && ostacolo.tipo!=3 && ostacolo.tipo!=6 && ostacolo.tipo!=7){ //ESCLUDO IL LANDING SU PUNTA, DOPPIA PUNTA, STONEBALL
          const ob = ostacolo.getBounds();
          if (
            pl.bottom >= ob.top-2 &&
            pl.top < ob.top &&
            player.velocityY > 0 &&
            pl.left < ob.right &&
            pl.right > ob.left
          ){
            player.velocityY = 0;
            player.grounded = true;
            player.y = ostacolo.y-player.height;
          }
        }
      }

      // Collisione con il terreno
      if (this.y + this.height >= canvas.height-base-10) {
        this.y = canvas.height - this.height-base;
        this.velocityY = 0;
        this.grounded = true;
        this.doubleJump=0;
      }

      if (keys.right) {
        this.velocityX = this.speed;
      } else if (keys.left) {
        this.velocityX = -this.speed;
      } else {
        this.velocityX = 0;
      }
      let potentialX = this.x + this.velocityX * dt;
      const limitRight = this.starterX + 150;
      const limitLeft = this.starterX - 90;
      this.x = Math.max(limitLeft, Math.min(limitRight, potentialX));
      if (this.x === limitRight && keys.right) {
        this.velocityX = 0;
      }
      if (this.x === limitLeft && keys.left) {
        this.velocityX = 0;
      }
    },

    draw(ctx) {
      ctx.drawImage(smile, this.x, this.y, this.width, this.height);
    },
    getBounds(){
      let playerBounds = {
      top: this.y,
      bottom: this.y+this.height,
      left: this.x,
      right: this.x+this.width
      };
      return playerBounds;
    }
  };
  return player;
}
