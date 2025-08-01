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