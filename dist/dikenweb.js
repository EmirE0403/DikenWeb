
// DikenWeb Engine v1.0.0 - Built 2025-08-01T20:25:39.139Z
// @author EmirE

// --- engine/core.js ---
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

// --- engine/renderer.js ---
// DikenWeb Renderer - @author EmirE

(function(global) {
  // Namespace kontrolü
  global.DikenWeb = global.DikenWeb || {};

  // Hata sınıfları (sadece tanımlanmamışsa)
  if (!global.DikenWeb.DikenWebError) {
    global.DikenWeb.DikenWebError = class DikenWebError extends Error {
      constructor(message, code = 'DIKENWEB_ERROR') {
        super(message);
        this.name = 'DikenWebError';
        this.code = code;
      }
    };
  }

  global.DikenWeb.RendererError = class RendererError extends global.DikenWeb.DikenWebError {
    constructor(message, code = 'RENDERER_ERROR') {
      super(message, code);
      this.name = 'RendererError';
    }
  };

  global.DikenWeb.ShaderCompileError = class ShaderCompileError extends global.DikenWeb.RendererError {
    constructor(shaderType, info) {
      super(`${shaderType} shader derleme hatası: ${info}`, 'SHADER_COMPILE_ERROR');
      this.shaderType = shaderType;
      this.info = info;
    }
  };

  global.DikenWeb.ShaderLinkError = class ShaderLinkError extends global.DikenWeb.RendererError {
    constructor(info) {
      super(`Shader program bağlama hatası: ${info}`, 'SHADER_LINK_ERROR');
      this.info = info;
    }
  };

  global.DikenWeb.Renderer = class Renderer {
    constructor(gl) {
      if (!gl) {
        throw new global.DikenWeb.RendererError('WebGL context gereklidir', 'GL_CONTEXT_REQUIRED');
      }
      this.gl = gl;
      this.defaultShader = null;
      this.currentShader = null;
    }

    init() {
      try {
        const vertexShaderSource = `
          attribute vec3 a_position;
          uniform mat4 u_mvpMatrix;
          void main() {
            gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
          }
        `;

        const fragmentShaderSource = `
          precision mediump float;
          uniform vec3 u_color;
          void main() {
            gl_FragColor = vec4(u_color, 1.0);
          }
        `;

        this.defaultShader = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.currentShader = this.defaultShader;
        
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        
        console.log('✅ Renderer başlatıldı');
      } catch (error) {
        throw new global.DikenWeb.RendererError(`Renderer başlatma hatası: ${error.message}`, 'RENDERER_INIT_FAILED');
      }
    }

    createShaderProgram(vertexSource, fragmentSource) {
      if (typeof vertexSource !== 'string' || typeof fragmentSource !== 'string') {
        throw new global.DikenWeb.RendererError('Shader kaynak kodları string olmalıdır', 'INVALID_SHADER_SOURCE');
      }

      try {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
          const info = this.gl.getProgramInfoLog(program);
          throw new global.DikenWeb.ShaderLinkError(info);
        }
        
        return program;
      } catch (error) {
        if (error instanceof global.DikenWeb.ShaderLinkError || error instanceof global.DikenWeb.ShaderCompileError) {
          throw error;
        }
        throw new global.DikenWeb.RendererError(`Shader program oluşturma hatası: ${error.message}`, 'SHADER_PROGRAM_FAILED');
      }
    }

    compileShader(type, source) {
      if (typeof source !== 'string') {
        throw new global.DikenWeb.RendererError('Shader kaynak kodu string olmalıdır', 'INVALID_SHADER_SOURCE');
      }

      try {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          const info = this.gl.getShaderInfoLog(shader);
          const shaderType = type === this.gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
          throw new global.DikenWeb.ShaderCompileError(shaderType, info);
        }
        
        return shader;
      } catch (error) {
        if (error instanceof global.DikenWeb.ShaderCompileError) {
          throw error;
        }
        throw new global.DikenWeb.RendererError(`Shader derleme hatası: ${error.message}`, 'SHADER_COMPILE_FAILED');
      }
    }

    useShader(program) {
      if (!program) {
        throw new global.DikenWeb.RendererError('Shader programı gereklidir', 'SHADER_PROGRAM_REQUIRED');
      }
      this.currentShader = program;
      this.gl.useProgram(program);
    }

    clear(r = 0.1, g = 0.1, b = 0.1, a = 1) {
      if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') {
        throw new global.DikenWeb.RendererError('Renk parametreleri sayı olmalıdır', 'INVALID_COLOR_PARAMS');
      }
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setViewport(width, height) {
      if (typeof width !== 'number' || typeof height !== 'number') {
        throw new global.DikenWeb.RendererError('Viewport boyutları sayı olmalıdır', 'INVALID_VIEWPORT_SIZE');
      }
      this.gl.viewport(0, 0, width, height);
    }

    enableDepthTest(enable = true) {
      if (enable) {
        this.gl.enable(this.gl.DEPTH_TEST);
      } else {
        this.gl.disable(this.gl.DEPTH_TEST);
      }
    }

    enableCulling(enable = true) {
      if (enable) {
        this.gl.enable(this.gl.CULL_FACE);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
    }
  };

})(typeof window !== 'undefined' ? window : global);

// --- engine/math.js ---
// DikenWeb Math Library - @author EmirE

// Namespace kontrolü
window.DikenWeb = window.DikenWeb || {};

// Hata sınıfı
window.DikenWeb.MathError = class MathError extends window.DikenWeb.DikenWebError {
  constructor(message, code = 'MATH_ERROR') {
    super(message, code);
    this.name = 'MathError';
  }
};

window.DikenWeb.Vector2 = class Vector2 {
  constructor(x = 0, y = 0) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new window.DikenWeb.MathError('Vector2 parametreleri sayı olmalıdır', 'INVALID_VECTOR2_PARAMS');
    }
    this.x = x;
    this.y = y;
  }

  static get zero() { return new window.DikenWeb.Vector2(0, 0); }
  static get one() { return new window.DikenWeb.Vector2(1, 1); }
  static get up() { return new window.DikenWeb.Vector2(0, 1); }
  static get down() { return new window.DikenWeb.Vector2(0, -1); }
  static get left() { return new window.DikenWeb.Vector2(-1, 0); }
  static get right() { return new window.DikenWeb.Vector2(1, 0); }

  add(v) {
    if (!(v instanceof window.DikenWeb.Vector2)) {
      throw new window.DikenWeb.MathError('Parametre Vector2 tipinde olmalıdır', 'INVALID_VECTOR2_PARAM');
    }
    return new window.DikenWeb.Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    if (!(v instanceof window.DikenWeb.Vector2)) {
      throw new window.DikenWeb.MathError('Parametre Vector2 tipinde olmalıdır', 'INVALID_VECTOR2_PARAM');
    }
    return new window.DikenWeb.Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    if (typeof scalar !== 'number') {
      throw new window.DikenWeb.MathError('Skalar parametresi sayı olmalıdır', 'INVALID_SCALAR_PARAM');
    }
    return new window.DikenWeb.Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar) {
    if (typeof scalar !== 'number') {
      throw new window.DikenWeb.MathError('Skalar parametresi sayı olmalıdır', 'INVALID_SCALAR_PARAM');
    }
    if (scalar === 0) {
      throw new window.DikenWeb.MathError('Sıfıra bölme hatası', 'DIVISION_BY_ZERO');
    }
    return new window.DikenWeb.Vector2(this.x / scalar, this.y / scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const len = this.length();
    if (len === 0) {
      console.warn('Sıfır vektörü normalize edilemez');
      return new window.DikenWeb.Vector2(0, 0);
    }
    return new window.DikenWeb.Vector2(this.x / len, this.y / len);
  }

  dot(v) {
    if (!(v instanceof window.DikenWeb.Vector2)) {
      throw new window.DikenWeb.MathError('Parametre Vector2 tipinde olmalıdır', 'INVALID_VECTOR2_PARAM');
    }
    return this.x * v.x + this.y * v.y;
  }

  distance(v) {
    if (!(v instanceof window.DikenWeb.Vector2)) {
      throw new window.DikenWeb.MathError('Parametre Vector2 tipinde olmalıdır', 'INVALID_VECTOR2_PARAM');
    }
    return this.subtract(v).length();
  }

  clone() {
    return new window.DikenWeb.Vector2(this.x, this.y);
  }

  toString() {
    return `Vector2(${this.x}, ${this.y})`;
  }
};

window.DikenWeb.Vector3 = class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      throw new window.DikenWeb.MathError('Vector3 parametreleri sayı olmalıdır', 'INVALID_VECTOR3_PARAMS');
    }
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static get zero() { return new window.DikenWeb.Vector3(0, 0, 0); }
  static get one() { return new window.DikenWeb.Vector3(1, 1, 1); }
  static get up() { return new window.DikenWeb.Vector3(0, 1, 0); }
  static get down() { return new window.DikenWeb.Vector3(0, -1, 0); }
  static get left() { return new window.DikenWeb.Vector3(-1, 0, 0); }
  static get right() { return new window.DikenWeb.Vector3(1, 0, 0); }
  static get forward() { return new window.DikenWeb.Vector3(0, 0, 1); }
  static get back() { return new window.DikenWeb.Vector3(0, 0, -1); }

  add(v) {
    if (!(v instanceof window.DikenWeb.Vector3)) {
      throw new window.DikenWeb.MathError('Parametre Vector3 tipinde olmalıdır', 'INVALID_VECTOR3_PARAM');
    }
    return new window.DikenWeb.Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v) {
    if (!(v instanceof window.DikenWeb.Vector3)) {
      throw new window.DikenWeb.MathError('Parametre Vector3 tipinde olmalıdır', 'INVALID_VECTOR3_PARAM');
    }
    return new window.DikenWeb.Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar) {
    if (typeof scalar !== 'number') {
      throw new window.DikenWeb.MathError('Skalar parametresi sayı olmalıdır', 'INVALID_SCALAR_PARAM');
    }
    return new window.DikenWeb.Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar) {
    if (typeof scalar !== 'number') {
      throw new window.DikenWeb.MathError('Skalar parametresi sayı olmalıdır', 'INVALID_SCALAR_PARAM');
    }
    if (scalar === 0) {
      throw new window.DikenWeb.MathError('Sıfıra bölme hatası', 'DIVISION_BY_ZERO');
    }
    return new window.DikenWeb.Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize() {
    const len = this.length();
    if (len === 0) {
      console.warn('Sıfır vektörü normalize edilemez');
      return new window.DikenWeb.Vector3(0, 0, 0);
    }
    return new window.DikenWeb.Vector3(this.x / len, this.y / len, this.z / len);
  }

  dot(v) {
    if (!(v instanceof window.DikenWeb.Vector3)) {
      throw new window.DikenWeb.MathError('Parametre Vector3 tipinde olmalıdır', 'INVALID_VECTOR3_PARAM');
    }
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    if (!(v instanceof window.DikenWeb.Vector3)) {
      throw new window.DikenWeb.MathError('Parametre Vector3 tipinde olmalıdır', 'INVALID_VECTOR3_PARAM');
    }
    return new window.DikenWeb.Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  distance(v) {
    if (!(v instanceof window.DikenWeb.Vector3)) {
      throw new window.DikenWeb.MathError('Parametre Vector3 tipinde olmalıdır', 'INVALID_VECTOR3_PARAM');
    }
    return this.subtract(v).length();
  }

  clone() {
    return new window.DikenWeb.Vector3(this.x, this.y, this.z);
  }

  toString() {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }
};

window.DikenWeb.Matrix4 = class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  identity() {
    const e = this.elements;
    e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
    e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    return this;
  }

  static perspective(fov, aspect, near, far) {
    const matrix = new window.DikenWeb.Matrix4();
    const f = 1.0 / Math.tan(fov / 2);
    
    const e = matrix.elements;
    e[0] = f / aspect;
    e[5] = f;
    e[10] = (far + near) / (near - far);
    e[11] = -1;
    e[14] = (2 * far * near) / (near - far);
    e[15] = 0;
    
    return matrix;
  }

  static orthographic(left, right, bottom, top, near, far) {
    const matrix = new window.DikenWeb.Matrix4();
    
    const e = matrix.elements;
    e[0] = 2 / (right - left);
    e[5] = 2 / (top - bottom);
    e[10] = -2 / (far - near);
    e[12] = -(right + left) / (right - left);
    e[13] = -(top + bottom) / (top - bottom);
    e[14] = -(far + near) / (far - near);
    e[15] = 1;
    
    return matrix;
  }

  static lookAt(eye, target, up) {
    const matrix = new window.DikenWeb.Matrix4();
    
    const zAxis = eye.subtract(target).normalize();
    const xAxis = up.cross(zAxis).normalize();
    const yAxis = zAxis.cross(xAxis);
    
    const e = matrix.elements;
    e[0] = xAxis.x; e[4] = xAxis.y; e[8] = xAxis.z; e[12] = -xAxis.dot(eye);
    e[1] = yAxis.x; e[5] = yAxis.y; e[9] = yAxis.z; e[13] = -yAxis.dot(eye);
    e[2] = zAxis.x; e[6] = zAxis.y; e[10] = zAxis.z; e[14] = -zAxis.dot(eye);
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    
    return matrix;
  }

  multiply(matrix) {
    if (!(matrix instanceof window.DikenWeb.Matrix4)) {
      throw new window.DikenWeb.MathError('Parametre Matrix4 tipinde olmalıdır', 'INVALID_MATRIX_PARAM');
    }
    
    const result = new window.DikenWeb.Matrix4();
    const a = this.elements;
    const b = matrix.elements;
    const c = result.elements;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        c[i * 4 + j] = 
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    
    return result;
  }

  translate(x, y, z) {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      throw new window.DikenWeb.MathError('Öteleme parametreleri sayı olmalıdır', 'INVALID_TRANSLATE_PARAMS');
    }
    const e = this.elements;
    e[12] = e[0] * x + e[4] * y + e[8] * z + e[12];
    e[13] = e[1] * x + e[5] * y + e[9] * z + e[13];
    e[14] = e[2] * x + e[6] * y + e[10] * z + e[14];
    e[15] = e[3] * x + e[7] * y + e[11] * z + e[15];
    return this;
  }

  scale(x, y, z) {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      throw new window.DikenWeb.MathError('Ölçek parametreleri sayı olmalıdır', 'INVALID_SCALE_PARAMS');
    }
    const e = this.elements;
    e[0] *= x; e[4] *= y; e[8] *= z;
    e[1] *= x; e[5] *= y; e[9] *= z;
    e[2] *= x; e[6] *= y; e[10] *= z;
    e[3] *= x; e[7] *= y; e[11] *= z;
    return this;
  }

  rotateX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const e = this.elements;
    
    const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
    const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
    
    e[4] = a10 * c + a20 * s;
    e[5] = a11 * c + a21 * s;
    e[6] = a12 * c + a22 * s;
    e[7] = a13 * c + a23 * s;
    
    e[8] = a20 * c - a10 * s;
    e[9] = a21 * c - a11 * s;
    e[10] = a22 * c - a12 * s;
    e[11] = a23 * c - a13 * s;
    
    return this;
  }

  rotateY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const e = this.elements;
    
    const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
    const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
    
    e[0] = a00 * c - a20 * s;
    e[1] = a01 * c - a21 * s;
    e[2] = a02 * c - a22 * s;
    e[3] = a03 * c - a23 * s;
    
    e[8] = a00 * s + a20 * c;
    e[9] = a01 * s + a21 * c;
    e[10] = a02 * s + a22 * c;
    e[11] = a03 * s + a23 * c;
    
    return this;
  }

  rotateZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const e = this.elements;
    
    const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
    const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
    
    e[0] = a00 * c + a10 * s;
    e[1] = a01 * c + a11 * s;
    e[2] = a02 * c + a12 * s;
    e[3] = a03 * c + a13 * s;
    
    e[4] = a10 * c - a00 * s;
    e[5] = a11 * c - a01 * s;
    e[6] = a12 * c - a02 * s;
    e[7] = a13 * c - a03 * s;
    
    return this;
  }

  clone() {
    const matrix = new window.DikenWeb.Matrix4();
    matrix.elements.set(this.elements);
    return matrix;
  }

  toString() {
    const e = this.elements;
    return `Matrix4[\n  ${e[0].toFixed(2)}, ${e[4].toFixed(2)}, ${e[8].toFixed(2)}, ${e[12].toFixed(2)}\n  ${e[1].toFixed(2)}, ${e[5].toFixed(2)}, ${e[9].toFixed(2)}, ${e[13].toFixed(2)}\n  ${e[2].toFixed(2)}, ${e[6].toFixed(2)}, ${e[10].toFixed(2)}, ${e[14].toFixed(2)}\n  ${e[3].toFixed(2)}, ${e[7].toFixed(2)}, ${e[11].toFixed(2)}, ${e[15].toFixed(2)}\n]`;
  }
};

// --- engine/camera.js ---
// DikenWeb Camera System - @author EmirE

// Namespace kontrolü
window.DikenWeb = window.DikenWeb || {};

// Hata sınıfı
window.DikenWeb.CameraError = class CameraError extends window.DikenWeb.DikenWebError {
  constructor(message, code = 'CAMERA_ERROR') {
    super(message, code);
    this.name = 'CameraError';
  }
};

window.DikenWeb.Camera = class Camera extends window.DikenWeb.Component {
  constructor() {
    super();
    this.fov = 45; // Derece cinsinden
    this.aspect = 1;
    this.near = 0.1;
    this.far = 1000;
    this.projectionMatrix = new window.DikenWeb.Matrix4();
    this.viewMatrix = new window.DikenWeb.Matrix4();
    this._dirty = true;
  }

  awake() {
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const fovRad = this.fov * Math.PI / 180;
    this.projectionMatrix = window.DikenWeb.Matrix4.perspective(fovRad, this.aspect, this.near, this.far);
    this._dirty = false;
  }

  updateViewMatrix() {
    if (this.gameObject) {
      const position = this.gameObject.transform.position;
      const target = position.add(new window.DikenWeb.Vector3(0, 0, -1)); // Basit forward
      const up = new window.DikenWeb.Vector3(0, 1, 0);
      this.viewMatrix = window.DikenWeb.Matrix4.lookAt(position, target, up);
    }
  }

  setPerspective(fov, aspect, near, far) {
    if (typeof fov !== 'number' || typeof aspect !== 'number' || 
        typeof near !== 'number' || typeof far !== 'number') {
      throw new window.DikenWeb.CameraError('Kamera parametreleri sayı olmalıdır', 'INVALID_CAMERA_PARAMS');
    }
    
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjectionMatrix();
  }

  getMVPMatrix(modelMatrix) {
    if (!(modelMatrix instanceof window.DikenWeb.Matrix4)) {
      throw new window.DikenWeb.CameraError('Model matrix Matrix4 tipinde olmalıdır', 'INVALID_MATRIX_PARAM');
    }
    
    this.updateViewMatrix();
    return this.projectionMatrix.multiply(this.viewMatrix).multiply(modelMatrix);
  }

  render(renderer) {
    // Camera component'i genellikle render yapmaz
    // Ancak viewport ayarlaması yapabilir
  }
};

// --- engine/object.js ---
// DikenWeb Object System - @author EmirE

// Namespace kontrolü
window.DikenWeb = window.DikenWeb || {};

// Hata sınıfı
window.DikenWeb.ObjectError = class ObjectError extends window.DikenWeb.DikenWebError {
  constructor(message, code = 'OBJECT_ERROR') {
    super(message, code);
    this.name = 'ObjectError';
  }
};

window.DikenWeb.Component = class Component {
  constructor() {
    this.enabled = true;
    this.gameObject = null;
  }

  awake() {}
  
  start() {}
  
  update(deltaTime) {
    if (typeof deltaTime !== 'number') {
      console.warn('Component.update: deltaTime parametresi sayı olmalıdır');
    }
  }
  
  render(renderer) {
    if (!renderer) {
      console.warn('Component.render: renderer parametresi gereklidir');
    }
  }
  
  onDestroy() {}
};

window.DikenWeb.Transform = class Transform {
  constructor() {
    this.position = new window.DikenWeb.Vector3(0, 0, 0);
    this.rotation = new window.DikenWeb.Vector3(0, 0, 0);
    this.scale = new window.DikenWeb.Vector3(1, 1, 1);
    this.parent = null;
    this._localMatrix = new window.DikenWeb.Matrix4();
    this._worldMatrix = new window.DikenWeb.Matrix4();
    this._dirty = true;
  }

  get localMatrix() {
    if (this._dirty) {
      this._localMatrix.identity();
      this._localMatrix
        .translate(this.position.x, this.position.y, this.position.z)
        .rotateX(this.rotation.x)
        .rotateY(this.rotation.y)
        .rotateZ(this.rotation.z)
        .scale(this.scale.x, this.scale.y, this.scale.z);
      this._dirty = false;
    }
    return this._localMatrix;
  }

  get worldMatrix() {
    if (this.parent) {
      return this.parent.worldMatrix.multiply(this.localMatrix);
    }
    return this.localMatrix;
  }

  translate(x, y, z) {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      throw new window.DikenWeb.ObjectError('Öteleme parametreleri sayı olmalıdır', 'INVALID_TRANSLATE_PARAMS');
    }
    this.position.x += x;
    this.position.y += y;
    this.position.z += z;
    this._dirty = true;
  }

  rotate(x, y, z) {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      throw new window.DikenWeb.ObjectError('Rotasyon parametreleri sayı olmalıdır', 'INVALID_ROTATE_PARAMS');
    }
    this.rotation.x += x;
    this.rotation.y += y;
    this.rotation.z += z;
    this._dirty = true;
  }

  setParent(parent) {
    if (parent && !(parent instanceof window.DikenWeb.GameObject)) {
      throw new window.DikenWeb.ObjectError('Parent GameObject tipinde olmalıdır', 'INVALID_PARENT_TYPE');
    }
    this.parent = parent;
  }
};

window.DikenWeb.GameObject = class GameObject {
  constructor(name = 'GameObject') {
    if (typeof name !== 'string') {
      throw new window.DikenWeb.ObjectError('GameObject adı string olmalıdır', 'INVALID_NAME_TYPE');
    }
    
    this.name = name;
    this.transform = new window.DikenWeb.Transform();
    this.components = [];
    this.children = [];
    this.parent = null;
    this.active = true;
    this.engine = null;
  }

  addComponent(component) {
    if (!(component instanceof window.DikenWeb.Component)) {
      throw new window.DikenWeb.ObjectError('Component tipinde olmayan nesne eklenemez', 'INVALID_COMPONENT_TYPE');
    }
    
    component.gameObject = this;
    this.components.push(component);
    
    try {
      if (component.awake) component.awake();
    } catch (error) {
      console.error(`Component.awake hatası (${this.name}):`, error);
    }
    
    return component;
  }

  getComponent(type) {
    if (typeof type !== 'function') {
      throw new window.DikenWeb.ObjectError('Component tipi fonksiyon olmalıdır', 'INVALID_COMPONENT_TYPE');
    }
    return this.components.find(c => c instanceof type);
  }

  getComponents(type) {
    if (typeof type !== 'function') {
      throw new window.DikenWeb.ObjectError('Component tipi fonksiyon olmalıdır', 'INVALID_COMPONENT_TYPE');
    }
    return this.components.filter(c => c instanceof type);
  }

  removeComponent(component) {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      try {
        if (component.onDestroy) component.onDestroy();
      } catch (error) {
        console.error(`Component.onDestroy hatası (${this.name}):`, error);
      }
      this.components.splice(index, 1);
      component.gameObject = null;
    }
  }

  addChild(child) {
    if (!(child instanceof window.DikenWeb.GameObject)) {
      throw new window.DikenWeb.ObjectError('Alt nesne GameObject tipinde olmalıdır', 'INVALID_CHILD_TYPE');
    }
    
    child.parent = this;
    child.transform.setParent(this);
    this.children.push(child);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child.transform.setParent(null);
    }
  }

  setActive(active) {
    if (typeof active !== 'boolean') {
      throw new window.DikenWeb.ObjectError('Active parametresi boolean olmalıdır', 'INVALID_ACTIVE_PARAM');
    }
    this.active = active;
  }

  update(deltaTime) {
    if (typeof deltaTime !== 'number') {
      console.warn('GameObject.update: deltaTime parametresi sayı olmalıdır');
      return;
    }
    
    if (!this.active) return;
    
    // Component'leri güncelle
    for (let component of this.components) {
      if (component.enabled && component.update) {
        try {
          component.update(deltaTime);
        } catch (error) {
          console.error(`Component update hatası (${this.name}.${component.constructor.name}):`, error);
        }
      }
    }

    // Çocuk nesneleri güncelle
    for (let child of this.children) {
      try {
        child.update(deltaTime);
      } catch (error) {
        console.error(`Child update hatası (${child.name}):`, error);
      }
    }
  }

  render(renderer) {
    if (!renderer) {
      console.warn('GameObject.render: renderer parametresi gereklidir');
      return;
    }
    
    if (!this.active) return;
    
    // Component'leri render et
    for (let component of this.components) {
      if (component.enabled && component.render) {
        try {
          component.render(renderer);
        } catch (error) {
          console.error(`Component render hatası (${this.name}.${component.constructor.name}):`, error);
        }
      }
    }

    // Çocuk nesneleri render et
    for (let child of this.children) {
      try {
        child.render(renderer);
      } catch (error) {
        console.error(`Child render hatası (${child.name}):`, error);
      }
    }
  }

  destroy() {
    // Component'leri temizle
    for (let component of this.components) {
      try {
        if (component.onDestroy) component.onDestroy();
      } catch (error) {
        console.error(`Component onDestroy hatası (${this.name}):`, error);
      }
    }
    
    // Çocuk nesneleri temizle
    for (let child of this.children) {
      try {
        child.destroy();
      } catch (error) {
        console.error(`Child destroy hatası (${child.name}):`, error);
      }
    }
    
    // Parent'tan kendini kaldır
    if (this.parent) {
      this.parent.removeChild(this);
    }
    
    this.components = [];
    this.children = [];
  }
};

// --- engine/components.js ---
// DikenWeb Built-in Components - @author EmirE

// Namespace kontrolü
window.DikenWeb = window.DikenWeb || {};

// Hata sınıfı
window.DikenWeb.ComponentError = class ComponentError extends window.DikenWeb.DikenWebError {
  constructor(message, code = 'COMPONENT_ERROR') {
    super(message, code);
    this.name = 'ComponentError';
  }
};

window.DikenWeb.MeshRenderer = class MeshRenderer extends window.DikenWeb.Component {
  constructor() {
    super();
    this.vertices = [];
    this.color = [1, 1, 1]; // RGB formatında [r, g, b]
    this.vertexBuffer = null;
  }

  awake() {
    if (this.gameObject && this.gameObject.engine && this.gameObject.engine.gl) {
      try {
        this.createBuffer(this.gameObject.engine.gl);
      } catch (error) {
        console.error('MeshRenderer buffer oluşturma hatası:', error);
      }
    }
  }

  createBuffer(gl) {
    if (!gl) {
      throw new window.DikenWeb.ComponentError('WebGL context gereklidir', 'GL_CONTEXT_REQUIRED');
    }
    if (!Array.isArray(this.vertices)) {
      throw new window.DikenWeb.ComponentError('Vertices array olmalıdır', 'INVALID_VERTICES_TYPE');
    }
    
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
    }
    
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
  }

  setColor(r, g, b) {
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
      throw new window.DikenWeb.ComponentError('Renk parametreleri sayı olmalıdır', 'INVALID_COLOR_PARAMS');
    }
    this.color = [r, g, b];
  }

  render(renderer) {
    if (!renderer) {
      console.warn('MeshRenderer: renderer parametresi gereklidir');
      return;
    }
    if (!this.vertexBuffer || this.vertices.length === 0) return;

    try {
      const gl = renderer.gl;
      const program = renderer.currentShader || renderer.defaultShader;
      
      if (!program) {
        console.warn('MeshRenderer: Shader programı bulunamadı');
        return;
      }
      
      gl.useProgram(program);
      
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const colorLocation = gl.getUniformLocation(program, 'u_color');
      const mvpLocation = gl.getUniformLocation(program, 'u_mvpMatrix');
      
      if (positionLocation === -1) {
        console.warn('MeshRenderer: a_position attribute bulunamadı');
        return;
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      
      if (colorLocation) {
        gl.uniform3fv(colorLocation, this.color);
      }
      
      // MVP matrix hesapla
      const mvpMatrix = this.gameObject.transform.worldMatrix;
      if (mvpLocation) {
        gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix.elements);
      }
      
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    } catch (error) {
      console.error('MeshRenderer render hatası:', error);
    }
  }

  onDestroy() {
    if (this.vertexBuffer && this.gameObject && this.gameObject.engine && this.gameObject.engine.gl) {
      const gl = this.gameObject.engine.gl;
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
  }
};

window.DikenWeb.CubeRenderer = class CubeRenderer extends window.DikenWeb.MeshRenderer {
  constructor() {
    super();
    // Basit küp vertices (24 vertices, 12 triangles, 36 indices)
    this.vertices = [
      // Front face
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
      
      // Back face
      -0.5, -0.5, -0.5,
      -0.5,  0.5, -0.5,
       0.5,  0.5, -0.5,
       0.5, -0.5, -0.5,
      
      // Top face
      -0.5,  0.5, -0.5,
      -0.5,  0.5,  0.5,
       0.5,  0.5,  0.5,
       0.5,  0.5, -0.5,
      
      // Bottom face
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5, -0.5,  0.5,
      -0.5, -0.5,  0.5,
      
      // Right face
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
       0.5,  0.5,  0.5,
       0.5, -0.5,  0.5,
      
      // Left face
      -0.5, -0.5, -0.5,
      -0.5, -0.5,  0.5,
      -0.5,  0.5,  0.5,
      -0.5,  0.5, -0.5
    ];
  }
};

window.DikenWeb.Script = class Script extends window.DikenWeb.Component {
  constructor() {
    super();
    this.properties = {};
  }

  // Kullanıcı bu sınıfı extend ederek kendi script'ini yazacak
  // update ve render metodlarını override edebilir
};

// --- engine/scene.js ---
// DikenWeb Scene System - @author EmirEclass SceneError extends Error {
  constructor(message, code = 'SCENE_ERROR') {
    super(message);
    this.name = 'SceneError';
    this.code = code;
  }
}class Scene {
  constructor(name = 'Scene') {
    if (typeof name !== 'string') {
      throw new SceneError('Sahne adı string olmalıdır', 'INVALID_SCENE_NAME');
    }
    
    this.name = name;
    this.root = new GameObject('SceneRoot');
    this.mainCamera = null;
  }

  update(deltaTime) {
    if (typeof deltaTime !== 'number') {
      console.warn('Scene.update: deltaTime parametresi sayı olmalıdır');
      return;
    }
    
    try {
      this.root.update(deltaTime);
    } catch (error) {
      console.error(`Scene update hatası (${this.name}):`, error);
    }
  }

  render(renderer) {
    if (!renderer) {
      console.warn('Scene.render: renderer parametresi gereklidir');
      return;
    }
    
    try {
      this.root.render(renderer);
    } catch (error) {
      console.error(`Scene render hatası (${this.name}):`, error);
    }
  }

  addGameObject(gameObject) {
    if (!(gameObject instanceof GameObject)) {
      throw new SceneError('GameObject tipinde olmayan nesne eklenemez', 'INVALID_GAMEOBJECT_TYPE');
    }
    
    this.root.addChild(gameObject);
  }

  removeGameObject(gameObject) {
    if (!(gameObject instanceof GameObject)) {
      throw new SceneError('GameObject tipinde olmayan nesne kaldırılamaz', 'INVALID_GAMEOBJECT_TYPE');
    }
    
    this.root.removeChild(gameObject);
  }

  findGameObjectWithTag(tag) {
    // Basit bir find implementasyonu
    const findInObject = (obj) => {
      if (obj.tag === tag) return obj;
      for (let child of obj.children) {
        const found = findInObject(child);
        if (found) return found;
      }
      return null;
    };
    
    return findInObject(this.root);
  }

  findGameObjectsWithTag(tag) {
    const results = [];
    
    const findInObject = (obj) => {
      if (obj.tag === tag) results.push(obj);
      for (let child of obj.children) {
        findInObject(child);
      }
    };
    
    findInObject(this.root);
    return results;
  }

  setMainCamera(camera) {
    if (!(camera instanceof Camera)) {
      throw new SceneError('Kamera Camera tipinde olmalıdır', 'INVALID_CAMERA_TYPE');
    }
    this.mainCamera = camera;
  }

  destroy() {
    try {
      this.root.destroy();
    } catch (error) {
      console.error(`Scene destroy hatası (${this.name}):`, error);
    }
  }
}

