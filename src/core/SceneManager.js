import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/**
 * SceneManager v3.0 — Premium 3D engine with:
 *  - PBR metallic steel materials
 *  - Hover/preselection feedback system
 *  - 3 visual modes: Technical Clay, PBR Realistic, Wireframe+Solid
 *  - Post-quality-aware lighting: main+fill+rim+hemi
 *  - Ambient occlusion-like shadow setup
 *  - Edge highlight via emissive boost (no post-process dep)
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.objects = [];
    this._visualMode = 'clay'; // clay | pbr | wire | xray
    this._dark = true;
    this._hoveredObj = null;
    this._hoveredOriginals = new Map();

    // ── Renderer ─────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ── Scene ────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1016);

    // ── Camera ───────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.01, 2000
    );
    this.camera.position.set(8, 6, 10);
    this.camera.lookAt(0, 0, 0);

    // ── Lights ───────────────────────────────────────────────
    this._setupLights();

    // ── Environment (for PBR reflections) ────────────────────
    this._setupEnvironment();

    // ── Controls ─────────────────────────────────────────────
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.07;
    this.orbitControls.minDistance = 0.3;
    this.orbitControls.maxDistance = 300;
    this.orbitControls.screenSpacePanning = true;

    // ── Transform Controls ────────────────────────────────────
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.setSize(0.75);
    this.transformControls.addEventListener('dragging-changed', (e) => {
      this.orbitControls.enabled = !e.value;
    });
    try {
      const helper = this.transformControls.getHelper
        ? this.transformControls.getHelper()
        : this.transformControls;
      this.scene.add(helper);
    } catch {
      this.scene.add(this.transformControls);
    }

    // ── Raycaster ────────────────────────────────────────────
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = 0.04;
    this.mouse = new THREE.Vector2();

    // ── Resize ───────────────────────────────────────────────
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    new ResizeObserver(() => this._onResize()).observe(container);

    // ── Animation ─────────────────────────────────────────────
    this._animate = this._animate.bind(this);
    this._animate();
  }

  // ─── LIGHTS ──────────────────────────────────────────────────
  _setupLights() {
    // Hemisphere — sky/ground
    this.hemiLight = new THREE.HemisphereLight(0xb0c4dd, 0x404858, 0.9);
    this.scene.add(this.hemiLight);

    // Ambient — garantiza que nada quede negro
    this.ambientLight = new THREE.AmbientLight(0xc0c8d8, 0.7);
    this.scene.add(this.ambientLight);

    // Main directional — angled, casts shadows
    this.dirLight = new THREE.DirectionalLight(0xfff8f0, 2.2);
    this.dirLight.position.set(10, 18, 12);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Fill light — cool, opposite side
    this.fillLight = new THREE.DirectionalLight(0xd0e0ff, 1.0);
    this.fillLight.position.set(-8, 8, -6);
    this.scene.add(this.fillLight);

    // Rim light — separa bordes del fondo
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.rimLight.position.set(0, -4, 8);
    this.scene.add(this.rimLight);
  }

  _setupEnvironment() {
    const envScene = new THREE.Scene();
    const envGen = new THREE.PMREMGenerator(this.renderer);
    envGen.compileCubemapShader();

    // Rich industrial environment map
    const envMesh = new THREE.Mesh(
      new THREE.SphereGeometry(50, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x445566,
        side: THREE.BackSide,
      })
    );
    envScene.add(envMesh);
    envScene.add(new THREE.AmbientLight(0x8899aa, 1));

    const envMap = envGen.fromScene(envScene, 0.01).texture;
    this.scene.environment = envMap;
    this.envMap = envMap;
    envGen.dispose();
  }

  // ─── VISUAL MODES ────────────────────────────────────────────
  setVisualMode(mode) {
    this._visualMode = mode;
    const badge = document.getElementById('viewport-mode-badge');
    const labels = {
      clay: 'TECHNICAL CLAY',
      pbr:  'PBR REALISTIC',
      wire: 'WIREFRAME',
      xray: 'X-RAY',
    };
    if (badge) badge.textContent = labels[mode] || mode.toUpperCase();

    this.objects.forEach(obj => this._applyVisualModeToObject(obj));
  }

  _applyVisualModeToObject(obj) {
    if (!obj.mesh) return;
    const mode = this._visualMode;
    obj.mesh.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const mat = child.material;

      switch(mode) {
        case 'clay':
          mat.wireframe = false;
          mat.transparent = false; mat.opacity = 1;
          mat.roughness = 0.82;
          mat.metalness = 0.15;
          mat.color.set(obj._isSelected ? 0x4a5580 : 0x48505e);
          mat.envMapIntensity = 0.2;
          break;
        case 'pbr':
          mat.wireframe = false;
          mat.transparent = false; mat.opacity = 1;
          mat.roughness = 0.42;
          mat.metalness = 0.78;
          mat.color.set(new THREE.Color(obj.color));
          mat.envMapIntensity = 1.0;
          break;
        case 'wire':
          mat.wireframe = true;
          mat.transparent = false; mat.opacity = 1;
          mat.color.set(obj._isSelected ? 0x6b93ff : 0x4a7acc);
          break;
        case 'xray':
          mat.wireframe = false;
          mat.transparent = true; mat.opacity = 0.35;
          mat.roughness = 0.5; mat.metalness = 0.3;
          mat.color.set(new THREE.Color(obj.color));
          mat.side = THREE.DoubleSide;
          mat.depthWrite = false;
          break;
      }
      mat.needsUpdate = true;
    });
  }

  // ─── HOVER SYSTEM ────────────────────────────────────────────
  setHovered(bimObj) {
    // Clear previous hover
    if (this._hoveredObj && this._hoveredObj !== bimObj) {
      this._clearHover(this._hoveredObj);
    }
    if (!bimObj || bimObj === this._hoveredObj) return;
    if (bimObj._isSelected) return; // don't hover-tint selected

    this._hoveredObj = bimObj;
    if (!bimObj.mesh) return;
    bimObj.mesh.traverse(child => {
      if (!child.isMesh || !child.material) return;
      if (!this._hoveredOriginals.has(child.uuid)) {
        this._hoveredOriginals.set(child.uuid, {
          emissive: child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0),
          emissiveIntensity: child.material.emissiveIntensity || 0,
          roughness: child.material.roughness,
        });
      }
      // Soft teal-blue hover tint
      child.material.emissive = new THREE.Color(0x2255aa);
      child.material.emissiveIntensity = 0.12;
      child.material.roughness = Math.max(0.3, child.material.roughness - 0.08);
      child.material.needsUpdate = true;
    });
  }

  _clearHover(bimObj) {
    if (!bimObj || !bimObj.mesh) return;
    bimObj.mesh.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const orig = this._hoveredOriginals.get(child.uuid);
      if (orig) {
        child.material.emissive.copy(orig.emissive);
        child.material.emissiveIntensity = orig.emissiveIntensity;
        child.material.roughness = orig.roughness;
        child.material.needsUpdate = true;
      }
      this._hoveredOriginals.delete(child.uuid);
    });
    this._hoveredObj = null;
  }

  clearHover() {
    if (this._hoveredObj) this._clearHover(this._hoveredObj);
  }

  // ─── OBJECT MANAGEMENT ───────────────────────────────────────
  addObject(obj) {
    this.scene.add(obj.mesh);
    this.objects.push(obj);
    // Apply current visual mode immediately
    this._applyVisualModeToObject(obj);
  }

  removeObject(obj) {
    this.scene.remove(obj.mesh);
    this.transformControls.detach();
    if (this._hoveredObj === obj) this._hoveredObj = null;
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) this.objects.splice(idx, 1);
  }

  getSelectableObjects() {
    const meshes = [];
    this.objects.forEach(o => {
      if (o.mesh) {
        o.mesh.traverse(child => { if (child.isMesh) meshes.push(child); });
      }
    });
    return meshes;
  }

  getBIMObjectAtMouse(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.getSelectableObjects(), true);
    if (!hits.length) return null;
    let target = hits[0].object;
    while (target && !target.userData?.bimId) target = target.parent;
    if (!target?.userData?.bimId) return null;
    return this.objects.find(o => o.id === target.userData.bimId) || null;
  }

  // ─── GIZMO ───────────────────────────────────────────────────
  attachGizmo(mesh) { if (mesh) this.transformControls.attach(mesh); }
  detachGizmo() { this.transformControls.detach(); }
  setGizmoMode(mode) { this.transformControls.setMode(mode); }
  setGizmoSpace(space) { this.transformControls.setSpace(space); }

  // ─── CAMERA ──────────────────────────────────────────────────
  setCameraView(view) {
    const d = 16;
    const positions = {
      iso:   [8, 6, 10],
      top:   [0, d, 0.01],
      front: [0, d * 0.25, d],
      left:  [-d, d * 0.25, 0],
      right: [d, d * 0.25, 0],
      back:  [0, d * 0.25, -d],
    };
    const pos = positions[view] || positions.iso;
    this.camera.position.set(...pos);
    this.camera.lookAt(0, 0, 0);
    this.orbitControls.target.set(0, 0, 0);
    this.orbitControls.update();
  }

  focusOnObject(bimObj) {
    if (!bimObj?.mesh) return;
    const box = new THREE.Box3().setFromObject(bimObj.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    this.orbitControls.target.copy(center);
    this.camera.position.copy(center).add(new THREE.Vector3(size, size * 0.7, size));
    this.orbitControls.update();
  }

  setZoom(factor) {
    this.camera.zoom = factor;
    this.camera.updateProjectionMatrix();
  }

  // ─── THEME ───────────────────────────────────────────────────
  setTheme(dark) {
    this._dark = dark;
    if (dark) {
      this.scene.background = new THREE.Color(0x0e1016);
      this.hemiLight.color.set(0x8899bb);
      this.hemiLight.groundColor.set(0x2a2e3a);
    } else {
      this.scene.background = new THREE.Color(0xd8dce6);
      this.hemiLight.color.set(0xc8d0e8);
      this.hemiLight.groundColor.set(0x8899aa);
    }
  }

  // ─── RESIZE ──────────────────────────────────────────────────
  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ─── LOOP ────────────────────────────────────────────────────
  _animate() {
    requestAnimationFrame(this._animate);
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
