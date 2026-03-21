import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';

/**
 * Plate — Structural plate element.
 * Types: 'base' (placa base), 'gusset-square', 'gusset-triangle'.
 */
export class Plate extends BIMElement {
  constructor(subtype = 'base', width = 0.3, height = 0.3, thickness = 0.02) {
    super('plate', { subtype, width, height, thickness });
    this.color = '#607d8b';
    this._computeProperties();
    this.buildMesh();
  }

  _computeProperties() {
    const { width, height, thickness, subtype } = this.params;
    let area;
    if (subtype === 'gusset-triangle') {
      area = 0.5 * width * height;
    } else {
      area = width * height;
    }
    this.designation = subtype === 'base' ? 'Placa Base' : (subtype === 'gusset-square' ? 'Cartela Cuadrada' : 'Cartela Triangular');
    this.area = area * 10000; // m² to cm²
    this.mass = area * thickness * 7850; // kg
    this.tw = thickness * 1000;
    this.tf = thickness * 1000;
  }

  buildMesh() {
    const { subtype, width, height, thickness } = this.params;
    const mat = this.createMaterial(this.color);
    let geo;

    if (subtype === 'gusset-triangle') {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(width, 0);
      shape.lineTo(0, height);
      shape.lineTo(0, 0);

      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.translate(-width / 2, -height / 2, -thickness / 2);
    } else {
      geo = new THREE.BoxGeometry(width, height, thickness);
    }

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.name = this.designation;
    this._applyUserData();
  }

  update(params) {
    Object.assign(this.params, params);
    this._computeProperties();
    this.updateMesh();
  }
}
