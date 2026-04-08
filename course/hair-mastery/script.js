/* ===========================================
   Matrix Rain Effect — Brown Tint
   For Hair Mastery inner page
   =========================================== */

(function () {
  const canvas = document.getElementById("pageMatrixCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height, columns, drops;
  const fontSize = 14;
  const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * -100);
  }

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Brown / amber tones
      const r = 160 + Math.floor(Math.random() * 60);   // 160–220
      const g = 100 + Math.floor(Math.random() * 50);    // 100–150
      const b = 20 + Math.floor(Math.random() * 30);     // 20–50
      const a = 0.25 + Math.random() * 0.35;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.font = `${fontSize}px monospace`;
      ctx.fillText(char, x, y);

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
})();