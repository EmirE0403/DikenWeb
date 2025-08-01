# 🌵 DikenWeb - WebGL Oyun Motoru

Hafif, namespace tabanlı WebGL oyun motoru.

## 🚀 Hızlı Başlangıç

```html
<script src="dist/dikenweb.js"></script>
<script>
    const canvas = document.getElementById('gameCanvas');
    const engine = new DikenWeb.Core(canvas);
    engine.init();
    engine.start();
</script>