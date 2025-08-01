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