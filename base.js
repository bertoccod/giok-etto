

export function baseClass(x, y, w, h, speed,skin) {
  const baseImg = new Image();
  switch (skin){
    case 0: baseImg.src = "assets/base/base_etto.png";break;
    case 1: baseImg.src = "assets/base/base_potter.png";break;
    case 2: baseImg.src = "assets/base/base_albert.png";break;
    case 3: baseImg.src = "assets/base/base_Homer.png";break;
    case 4: baseImg.src = "assets/base/base_mine.png";break;
  }
  return {
    x, y, width: w, height: h, speed,
    scrollOffset: 0,


    update(deltaTime) {
      this.scrollOffset += this.speed * (deltaTime / 1000);
    },

    draw(ctx) {
      if (!baseImg.complete || baseImg.width === 0) {
        ctx.fillStyle = "orange"; ctx.fillRect(this.x, this.y, this.width, this.height);
        return;
      }

      const tileW = baseImg.width;
      let startX = this.x - (this.scrollOffset % tileW);

      while (startX < this.x + this.width) {
        ctx.drawImage(baseImg, startX, this.y, tileW, this.height);
        startX += tileW;
      }
    }
  };
}