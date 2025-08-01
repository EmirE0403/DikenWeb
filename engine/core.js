// DikenWeb Core Engine - @author EmirE

(function(global) {
  // DikenWeb namespace'i oluştur
  global.DikenWeb = global.DikenWeb || {};

  // Hata sınıflarını namespace içine al
  global.DikenWeb.DikenWebError = class DikenWebError extends Error {
    constructor(message, code = 'DIKENWEB_ERROR') {
      super(message);
      this.name = 'DikenWebError';
      this.code = code;
    }
  };

  global.DikenWeb.WebGLNotSupportedError = class WebGLNotSupportedError extends global.DikenWeb.DikenWebError {
    constructor() {
      super('WebGL tarayıcınız tarafından desteklenmiyor', 'WEBGL_NOT_SUPPORTED');
    }
  };

  global.DikenWeb.Core = class Core {
    constructor(canvas) {
      if (!canvas) {
        throw new global.DikenWeb.DikenWebError("Canvas elementi gereklidir", "CANVAS_REQUIRED");
      }

      this.canvas = canvas;
      this.gl = null;

      try {
        this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!this.gl) {
          throw new global.DikenWeb.WebGLNotSupportedError();
        }
      } catch (err) {
        const message = "DikenWeb: WebGL başlatılamadı.\nSebep: " + err.message;
        console.error(message, err);
        global.DikenWeb.Core.showErrorMessage(message);
        throw new global.DikenWeb.DikenWebError(message, "WEBGL_INIT_FAILED");
      }

      this.renderer = null;
      this.currentScene = null;
      this.isRunning = false;
      this.lastTime = 0;
    }

    static showErrorMessage(msg) {
      const existingError = document.querySelector('.dikenweb-error');
      if (existingError) {
        existingError.innerText = msg;
        return;
      }

      const div = document.createElement("div");
      div.className = 'dikenweb-error';
      div.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 9999;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        max-width: 80%;
        word-break: break-word;
        border-left: 4px solid #ff0000;
      `;
      div.innerHTML = `
        <strong>🌵 DikenWeb Hatası</strong><br>
        <small>${msg}</small>
      `;
      document.body.appendChild(div);
    }

    init() {
      try {
        this.renderer = new global.DikenWeb.Renderer(this.gl);
        this.renderer.init();
        console.log('✅ DikenWeb başlatıldı');
      } catch (error) {
        const message = "DikenWeb: Renderer başlatılamadı.\nSebep: " + error.message;
        console.error(message, error);
        global.DikenWeb.Core.showErrorMessage(message);
        throw new global.DikenWeb.DikenWebError(message, "RENDERER_INIT_FAILED");
      }
    }

    start() {
      if (!this.isRunning) {
        try {
          this.isRunning = true;
          this.lastTime = performance.now();
          this.loop();
          console.log('▶️ DikenWeb çalışıyor');
        } catch (error) {
          const message = "DikenWeb: Motor başlatılamadı.\nSebep: " + error.message;
          console.error(message, error);
          global.DikenWeb.Core.showErrorMessage(message);
          this.isRunning = false;
          throw new global.DikenWeb.DikenWebError(message, "ENGINE_START_FAILED");
        }
      }
    }

    stop() {
      this.isRunning = false;
      console.log('⏹️ DikenWeb durduruldu');
    }

    loop() {
      if (!this.isRunning) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      if (deltaTime > 0.1) {
        console.warn(`Büyük delta time: ${deltaTime.toFixed(3)}s`);
      }

      try {
        this.update(deltaTime);
        this.render();
      } catch (error) {
        console.error('DikenWeb loop hatası:', error);
      }

      requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
      if (typeof deltaTime !== 'number') {
        console.warn('Geçersiz deltaTime:', deltaTime);
        return;
      }
      
      if (this.currentScene) {
        this.currentScene.update(deltaTime);
      }
    }

    render() {
      if (this.renderer && this.currentScene) {
        try {
          this.renderer.clear();
          this.currentScene.render(this.renderer);
        } catch (error) {
          console.error('Render hatası:', error);
          throw new global.DikenWeb.DikenWebError("Render işlemi başarısız: " + error.message, "RENDER_FAILED");
        }
      }
    }

    loadScene(scene) {
      if (!scene) {
        throw new global.DikenWeb.DikenWebError("Sahne nesnesi gereklidir", "SCENE_REQUIRED");
      }
      this.currentScene = scene;
      console.log('📂 Sahne yüklendi');
    }
  };

})(typeof window !== 'undefined' ? window : global);