import * as THREE from 'three';

let _idCounter = 0;

/**
 * BIMElement v3.0 — Base class for all structural steel elements.
 * - Premium PBR material creation
 * - Improved selection highlight (emissive + edge enhancement)
 * - Bevel-ready geometry support
 */
export class BIMElement {
  constructor(type, params = {}) {
    this.id = `bim_${++_idCounter}`;
    this.type = type;
    this.params = { ...params };
    this.mesh = null;
    this.color = '#7a8494';       // default steel grey
    this.steelGrade = 'S275 JR';
    this.designation = '';
    this.label = '';              // user-editable label
    this.area = 0;
    this.mass = 0;
    this.tw = 0;
    this.tf = 0;
    this.engineeringData = null;
    this._isSelected = false;
    this._isHovered = false;
    this._originalMaterials = new Map();
  }

  /**
   * Create premium PBR steel material.
   * Supports clay / realistic modes via SceneManager.setVisualMode.
   */
  createMaterial(colorHex = '#7a8494') {
    const color = new THREE.Color(colorHex);
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.44,
      metalness: 0.76,
      envMapIntensity: 0.85,
      // Subtle bump from mesh normals only — no texture needed
    });
  }

  /**
   * Create a slightly darker variant (for web, inner surfaces).
   */
  createInnerMaterial(colorHex = '#555e6a') {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.7,
      metalness: 0.4,
      side: THREE.BackSide,
    });
  }

  buildMesh() { /* Override in subclasses */ }

  updateMesh() {
    if (!this.mesh) return;
    const parent = this.mesh.parent;
    const pos = this.mesh.position.clone();
    const rot = this.mesh.rotation.clone();
    if (parent) parent.remove(this.mesh);
    this._disposeMesh();
    this.buildMesh();
    if (this.mesh) {
      this.mesh.position.copy(pos);
      if (this.params.orientation !== 'column') {
        this.mesh.rotation.copy(rot);
      } else {
        this.mesh.rotation.y = rot.y;
        this.mesh.rotation.z = rot.z;
      }
      if (parent) parent.add(this.mesh);
    }
  }

  _disposeMesh() {
    if (!this.mesh) return;
    this.mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => m.dispose());
      }
    });
    this.mesh = null;
  }

  _applyUserData() {
    if (!this.mesh) return;
    const data = {
      bimId: this.id,
      type: this.type,
      designation: this.designation,
      steelGrade: this.steelGrade,
      params: { ...this.params },
    };
    this.mesh.userData = data;
    this.mesh.traverse(child => { child.userData = { ...child.userData, bimId: this.id }; });
  }

  setSelected(selected) {
    this._isSelected = selected;
    if (!this.mesh) return;
    this.mesh.traverse(child => {
      if (!child.isMesh || !child.material) return;
      if (selected) {
        if (!this._originalMaterials.has(child.uuid)) {
          this._originalMaterials.set(child.uuid, {
            emissive: child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0),
            emissiveIntensity: child.material.emissiveIntensity || 0,
            roughness: child.material.roughness,
            metalness: child.material.metalness,
          });
        }
        // Premium selection: bright blue-white emissive edge look
        child.material.emissive = new THREE.Color(0x3366dd);
        child.material.emissiveIntensity = 0.22;
        child.material.roughness = 0.35;
        child.material.needsUpdate = true;
      } else {
        const orig = this._originalMaterials.get(child.uuid);
        if (orig) {
          child.material.emissive.copy(orig.emissive);
          child.material.emissiveIntensity = orig.emissiveIntensity;
          child.material.roughness = orig.roughness;
          child.material.metalness = orig.metalness;
          child.material.needsUpdate = true;
        }
        this._originalMaterials.delete(child.uuid);
      }
    });
  }

  setColor(colorHex) {
    this.color = colorHex;
    if (!this.mesh) return;
    const col = new THREE.Color(colorHex);
    this.mesh.traverse(child => {
      if (child.isMesh && child.material?.color) {
        child.material.color.copy(col);
        child.material.needsUpdate = true;
        // Update originals
        if (this._originalMaterials.has(child.uuid)) {
          const orig = this._originalMaterials.get(child.uuid);
          this._originalMaterials.set(child.uuid, orig);
        }
      }
    });
  }

  getPosition() {
    return this.mesh ? this.mesh.position : new THREE.Vector3();
  }

  getRotation() {
    return this.mesh ? this.mesh.rotation : new THREE.Euler();
  }

  setPosition(x, y, z) {
    if (this.mesh) this.mesh.position.set(x, y, z);
  }

  setRotation(degX, degY, degZ) {
    if (this.mesh) {
      this.mesh.rotation.set(
        THREE.MathUtils.degToRad(degX),
        THREE.MathUtils.degToRad(degY),
        THREE.MathUtils.degToRad(degZ)
      );
    }
  }

  getBoundingBox() {
    if (!this.mesh) return null;
    return new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * Get summary data for inspector.
   */
  getSummary() {
    return {
      id: this.id,
      label: this.label || this.designation,
      type: this.type,
      designation: this.designation,
      steelGrade: this.steelGrade,
      color: this.color,
      area: this.area,
      mass: this.mass,
      position: this.getPosition(),
      engineeringData: this.engineeringData,
    };
  }
}
