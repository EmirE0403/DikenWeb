
// DikenWeb Engine v1.0.0 - Built 2025-08-01T19:58:17.863Z
// @author EmirE
// Global namespace olarak DikenWeb tanımlanıyor
var DikenWeb = DikenWeb || {};
(function(global) {

// --- engine/core.js ---
// DikenWeb Core Engine - @author EmirE

// DikenWeb namespace'i oluştur
window.DikenWeb = window.DikenWeb || {};

// Hata sınıflarını namespace içine al
window.DikenWeb.DikenWebError = class DikenWebError extends Error {
  constructor(message, code = 'DIKENWEB_ERROR') {
    super(message);
    this.name = 'DikenWebError';
    this.code = code;
  }
};

window.DikenWeb.WebGLNotSupportedError = class WebGLNotSupportedError extends window.DikenWeb.DikenWebError {
  constructor() {
    super('WebGL tarayıcınız tarafından desteklenmiyor', 'WEBGL_NOT_SUPPORTED');
  }
};

window.DikenWeb.Core = class Core {
  constructor(canvas) {
    if (!canvas) {
      throw new window.DikenWeb.DikenWebError("Canvas elementi gereklidir", "CANVAS_REQUIRED");
    }

    this.canvas = canvas;
    this.gl = null;

    try {
      this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!this.gl) {
        throw new window.DikenWeb.WebGLNotSupportedError();
      }
    } catch (err) {
      const message = "DikenWeb: WebGL başlatılamadı.\nSebep: " + err.message;
      console.error(message, err);
      window.DikenWeb.Core.showErrorMessage(message);
      throw new window.DikenWeb.DikenWebError(message, "WEBGL_INIT_FAILED");
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
      this.renderer = new window.DikenWeb.Renderer(this.gl);
      this.renderer.init();
      console.log('✅ DikenWeb başlatıldı');
    } catch (error) {
      const message = "DikenWeb: Renderer başlatılamadı.\nSebep: " + error.message;
      console.error(message, error);
      window.DikenWeb.Core.showErrorMessage(message);
      throw new window.DikenWeb.DikenWebError(message, "RENDERER_INIT_FAILED");
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
        window.DikenWeb.Core.showErrorMessage(message);
        this.isRunning = false;
        throw new window.DikenWeb.DikenWebError(message, "ENGINE_START_FAILED");
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
        throw new window.DikenWeb.DikenWebError("Render işlemi başarısız: " + error.message, "RENDER_FAILED");
      }
    }
  }

  loadScene(scene) {
    if (!scene) {
      throw new window.DikenWeb.DikenWebError("Sahne nesnesi gereklidir", "SCENE_REQUIRED");
    }
    this.currentScene = scene;
    console.log('📂 Sahne yüklendi');
  }
};
// --- engine/renderer.js ---
// DikenWeb Renderer - @author EmirE

// Namespace kontrolü
window.DikenWeb = window.DikenWeb || {};

// Hata sınıfları
window.DikenWeb.RendererError = class RendererError extends window.DikenWeb.DikenWebError {
  constructor(message, code = 'RENDERER_ERROR') {
    super(message, code);
    this.name = 'RendererError';
  }
};

window.DikenWeb.ShaderCompileError = class ShaderCompileError extends window.DikenWeb.RendererError {
  constructor(shaderType, info) {
    super(`${shaderType} shader derleme hatası: ${info}`, 'SHADER_COMPILE_ERROR');
    this.shaderType = shaderType;
    this.info = info;
  }
};

window.DikenWeb.ShaderLinkError = class ShaderLinkError extends window.DikenWeb.RendererError {
  constructor(info) {
    super(`Shader program bağlama hatası: ${info}`, 'SHADER_LINK_ERROR');
    this.info = info;
  }
};

window.DikenWeb.Renderer = class Renderer {
  constructor(gl) {
    if (!gl) {
      throw new window.DikenWeb.RendererError('WebGL context gereklidir', 'GL_CONTEXT_REQUIRED');
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
      throw new window.DikenWeb.RendererError(`Renderer başlatma hatası: ${error.message}`, 'RENDERER_INIT_FAILED');
    }
  }

  createShaderProgram(vertexSource, fragmentSource) {
    if (typeof vertexSource !== 'string' || typeof fragmentSource !== 'string') {
      throw new window.DikenWeb.RendererError('Shader kaynak kodları string olmalıdır', 'INVALID_SHADER_SOURCE');
    }

    try {
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        const info = this.gl.getProgramInfoLog(program);
        throw new window.DikenWeb.ShaderLinkError(info);
      }
      
      return program;
    } catch (error) {
      if (error instanceof window.DikenWeb.ShaderLinkError || error instanceof window.DikenWeb.ShaderCompileError) {
        throw error;
      }
      throw new window.DikenWeb.RendererError(`Shader program oluşturma hatası: ${error.message}`, 'SHADER_PROGRAM_FAILED');
    }
  }

  compileShader(type, source) {
    if (typeof source !== 'string') {
      throw new window.DikenWeb.RendererError('Shader kaynak kodu string olmalıdır', 'INVALID_SHADER_SOURCE');
    }

    try {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        const info = this.gl.getShaderInfoLog(shader);
        const shaderType = type === this.gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
        throw new window.DikenWeb.ShaderCompileError(shaderType, info);
      }
      
      return shader;
    } catch (error) {
      if (error instanceof window.DikenWeb.ShaderCompileError) {
        throw error;
      }
      throw new window.DikenWeb.RendererError(`Shader derleme hatası: ${error.message}`, 'SHADER_COMPILE_FAILED');
    }
  }

  useShader(program) {
    if (!program) {
      throw new window.DikenWeb.RendererError('Shader programı gereklidir', 'SHADER_PROGRAM_REQUIRED');
    }
    this.currentShader = program;
    this.gl.useProgram(program);
  }

  clear(r = 0.1, g = 0.1, b = 0.1, a = 1) {
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') {
      throw new window.DikenWeb.RendererError('Renk parametreleri sayı olmalıdır', 'INVALID_COLOR_PARAMS');
    }
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  setViewport(width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new window.DikenWeb.RendererError('Viewport boyutları sayı olmalıdır', 'INVALID_VIEWPORT_SIZE');
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
// --- engine/math.js ---
global.DikenWeb.toRadians = function toRadians(deg) {
    return deg * (Math.PI / 180);
}

// --- engine/camera.js ---
// DikenWeb Camera System - @author EmirEglobal.DikenWeb.CameraError = class CameraError extends Error {
  constructor(message, code = 'CAMERA_ERROR') {
    super(message);
    this.name = 'CameraError';
    this.code = code;
  }
}global.DikenWeb.Camera = class Camera extends Component {
  constructor() {
    super();
    this.fov = 45; // Derece cinsinden
    this.aspect = 1;
    this.near = 0.1;
    this.far = 1000;
    this.projectionMatrix = new Matrix4();
    this.viewMatrix = new Matrix4();
    this._dirty = true;
  }

  awake() {
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const fovRad = this.fov * Math.PI / 180;
    this.projectionMatrix = Matrix4.perspective(fovRad, this.aspect, this.near, this.far);
    this._dirty = false;
  }

  updateViewMatrix() {
    if (this.gameObject) {
      const position = this.gameObject.transform.position;
      const target = position.add(new Vector3(0, 0, -1)); // Basit forward
      const up = new Vector3(0, 1, 0);
      this.viewMatrix = Matrix4.lookAt(position, target, up);
    }
  }

  setPerspective(fov, aspect, near, far) {
    if (typeof fov !== 'number' || typeof aspect !== 'number' || 
        typeof near !== 'number' || typeof far !== 'number') {
      throw new CameraError('Kamera parametreleri sayı olmalıdır', 'INVALID_CAMERA_PARAMS');
    }
    
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjectionMatrix();
  }

  getMVPMatrix(modelMatrix) {
    if (!(modelMatrix instanceof Matrix4)) {
      throw new CameraError('Model matrix Matrix4 tipinde olmalıdır', 'INVALID_MATRIX_PARAM');
    }
    
    this.updateViewMatrix();
    return this.projectionMatrix.multiply(this.viewMatrix).multiply(modelMatrix);
  }

  render(renderer) {
    // Camera component'i genellikle render yapmaz
    // Ancak viewport ayarlaması yapabilir
  }
}
// --- engine/object.js ---
global.DikenWeb.Object = class Object {
    constructor() {
        this.position = [0, 0, 0];
    }
}

// --- engine/components.js ---
// DikenWeb Built-in Components - @author EmirEglobal.DikenWeb.ComponentError = class ComponentError extends Error {
  constructor(message, code = 'COMPONENT_ERROR') {
    super(message);
    this.name = 'ComponentError';
    this.code = code;
  }
}global.DikenWeb.MeshRenderer = class MeshRenderer extends Component {
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
      throw new ComponentError('WebGL context gereklidir', 'GL_CONTEXT_REQUIRED');
    }
    if (!Array.isArray(this.vertices)) {
      throw new ComponentError('Vertices array olmalıdır', 'INVALID_VERTICES_TYPE');
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
      throw new ComponentError('Renk parametreleri sayı olmalıdır', 'INVALID_COLOR_PARAMS');
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
}global.DikenWeb.CubeRenderer = class CubeRenderer extends MeshRenderer {
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
}global.DikenWeb.Script = class Script extends Component {
  constructor() {
    super();
    this.properties = {};
  }

  // Kullanıcı bu sınıfı extend ederek kendi script'ini yazacak
  // update ve render metodlarını override edebilir
}
// --- engine/scene.js ---
// DikenWeb Scene System - @author EmirEglobal.DikenWeb.SceneError = class SceneError extends Error {
  constructor(message, code = 'SCENE_ERROR') {
    super(message);
    this.name = 'SceneError';
    this.code = code;
  }
}global.DikenWeb.Scene = class Scene {
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
})(typeof window !== "undefined" ? window : this);
