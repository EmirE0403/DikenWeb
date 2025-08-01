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