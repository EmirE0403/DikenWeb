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
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
      
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