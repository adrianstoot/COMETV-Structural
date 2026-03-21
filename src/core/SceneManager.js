import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2d3a);

    // Renderer — high quality
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.01,
      2000
    );
    this.camera.position.set(8, 6, 10);
    this.camera.lookAt(0, 0, 0);

    // Lights — MUCH brighter for visible pieces
    this._setupLights();

    // Environment map for reflections
    this._setupEnvironment();

    // Controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 200;

    // TransformControls
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('dragging-changed', (e) => {
      this.orbitControls.enabled = !e.value;
    });
    this.transformControls.setSize(0.8);
    try {
      if (this.transformControls.getHelper) {
        this.scene.add(this.transformControls.getHelper());
      } else {
        this.scene.add(this.transformControls);
      }
    } catch (e) {
      this.scene.add(this.transformControls);
    }

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Objects list
    this.objects = [];

    // Resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    new ResizeObserver(() => this._onResize()).observe(container);

    // Animation loop
    this._animate = this._animate.bind(this);
    this._animate();
  }

  _setupLights() {
    // Strong ambient so nothing is ever black
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Main directional (sun-like)
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    dirLight.position.set(12, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xc4d4ff, 1.2);
    fillLight.position.set(-8, 10, -6);
    this.scene.add(fillLight);

    // Bottom rim for metallic feel
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.6);
    rimLight.position.set(0, -5, 10);
    this.scene.add(rimLight);

    // Hemisphere
    const hemiLight = new THREE.HemisphereLight(0xb0c4ff, 0x444466, 0.8);
    this.scene.add(hemiLight);
  }

  _setupEnvironment() {
    // Create a simple environment cubemap for reflections
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x556688);

    // Add gradient via hemisphere
    const envGen = new THREE.PMREMGenerator(this.renderer);
    envGen.compileCubemapShader();
    const envMap = envGen.fromScene(envScene, 0.01).texture;
    this.scene.environment = envMap;
    envGen.dispose();
  }

  addObject(obj) {
    this.scene.add(obj.mesh);
    this.objects.push(obj);
  }

  removeObject(obj) {
    this.scene.remove(obj.mesh);
    this.transformControls.detach();
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) this.objects.splice(idx, 1);
  }

  getSelectableObjects() {
    const meshes = [];
    this.objects.forEach(o => {
      if (o.mesh) {
        meshes.push(o.mesh);
        o.mesh.traverse(child => {
          if (child.isMesh) meshes.push(child);
        });
      }
    });
    return meshes;
  }

  attachGizmo(mesh) {
    if (mesh) this.transformControls.attach(mesh);
  }

  detachGizmo() {
    this.transformControls.detach();
  }

  setGizmoMode(mode) {
    this.transformControls.setMode(mode);
  }

  setZoom(factor) {
    this.camera.zoom = factor;
    this.camera.updateProjectionMatrix();
  }

  setCameraView(view) {
    const d = 15;
    switch (view) {
      case 'top':
        this.camera.position.set(0, d, 0.01);
        break;
      case 'front':
        this.camera.position.set(0, d * 0.3, d);
        break;
      case 'left':
        this.camera.position.set(-d, d * 0.3, 0);
        break;
      case 'right':
        this.camera.position.set(d, d * 0.3, 0);
        break;
      case 'iso':
      default:
        this.camera.position.set(8, 6, 10);
        break;
    }
    this.camera.lookAt(0, 0, 0);
    this.orbitControls.target.set(0, 0, 0);
    this.orbitControls.update();
  }

  setTheme(dark) {
    this.scene.background = new THREE.Color(dark ? 0x2a2d3a : 0xdde0e8);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
