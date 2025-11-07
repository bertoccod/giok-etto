export function puntaClass(x, y, width, height, speed, tipo, pattern, textureMap) {
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
      ctx.save();
      ctx.beginPath();

      if (this.tipo === 3) {
        // Doppia punta: due triangoli affiancati
        const half = this.width / 2;

        // Prima punta
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + half / 2, this.y);
        ctx.lineTo(this.x + half, this.y + this.height);

        // Seconda punta
        ctx.moveTo(this.x + half, this.y + this.height);
        ctx.lineTo(this.x + half + half / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
      } else {
        // Punta singola
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
      }

      ctx.closePath();
      ctx.clip();

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
