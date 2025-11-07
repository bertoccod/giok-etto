export function ffClass(x, y, width, height, speed, tipo, pattern, textureMap) {
  return {
    x,
    y,
    width,
    height,
    speed,
    tipo,
    pattern: pattern,
    color: "rgba(20, 209, 105, 1)",

    update(deltaTime, globalSpeed, superSpeed, compFactor = 1) {
        const dt = deltaTime / 1000;
        const effectiveSpeed = (globalSpeed + superSpeed) * compFactor;
        this.x -= effectiveSpeed * dt;
    },
    draw(ctx) {
      

      const img = textureMap[this.pattern];
      if (img?.complete) {
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }

      ctx.restore();
    },
    getBounds() {
      return {
        left: this.x,
        right: this.x + this.width,
        top: this.y,
        bottom: this.y + this.height
      };
    }
  };
}
