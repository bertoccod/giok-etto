export function cuboClass(x, y, w, h, speed, tipo, pattern, textureMap, firstPlatform=false) {
    let obstacle = {
        x: x,
        baseX:x,
        y: y,
        width: w,
        height: h,
        speed: speed,
        tipo: tipo,
        color: "rgba(20, 209, 105, 1)",
        pattern: pattern,
        firstPlatform: firstPlatform,
    update(deltaTime) {
        this.x -= this.speed * (deltaTime / 1000);
    },

    draw(ctx) {
        const img = textureMap[this.pattern];
        if (img?.complete) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
            if (this.firstPlatform){
                const skin = this.pattern.at(-1);
                const img2 = textureMap[`stone_${skin}`];
                if (img2?.complete){
                    const bloccoY = this.y + this.height+10;
                    const bloccoH = 50; // altezza del blocco sotto
                    ctx.drawImage(textureMap[`stone_${skin}`], this.x+40, bloccoY, 50, bloccoH);
                }
            }
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

    if (!this.firstPlatform) return main;

    const blocco = {
        top: this.y + this.height+10,
        bottom: this.y + this.height + 50,
        left: this.x + 40,
        right: this.x + 90
    };

    return {
        top: Math.min(main.top, blocco.top),
        bottom: Math.max(main.bottom, blocco.bottom),
        left: Math.min(main.left, blocco.left),
        right: Math.max(main.right, blocco.right)
    };
    }


  };
  return obstacle;
}