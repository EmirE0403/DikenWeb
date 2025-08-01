// DikenWeb Scene System - @author EmirE

export class SceneError extends Error {
  constructor(message, code = 'SCENE_ERROR') {
    super(message);
    this.name = 'SceneError';
    this.code = code;
  }
}

export class Scene {
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