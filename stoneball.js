export function stoneballClass(x, y, w, h, speed, tipo, pattern, textureMap) {
    let obstacle = {
        x: x,
        y: y,
        width: w,
        height: h,
        speed: speed,
        rotation: 20,
        color: "gray",
        tipo: tipo,
        pattern: pattern,
    update(deltaTime) {
        this.x -= this.speed * (deltaTime / 1000);
        this.rotation += this.speed * (deltaTime / 1000) / this.width;
    },

    draw(ctx) {
        const img = textureMap[this.pattern];
        if (img?.complete) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(-this.rotation);
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
   getBounds() {
    const main = {
        top: this.y,
        bottom: this.y + this.height,
        left: this.x,
        right: this.x + this.width
    };
    return main;
    }


  };
  return obstacle;
}