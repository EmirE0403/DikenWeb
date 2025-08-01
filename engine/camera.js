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