import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';

/**
 * BOLT METRIC DATA — Based on DIN 931 / EN ISO 4014
 * d=nominal diameter, s=wrench size, e=head height, dk=head width across flats
 */
const BOLT_DATA = {
  M12: { d: 12, s: 19, e: 7.5,  dk: 18.0 },
  M16: { d: 16, s: 24, e: 10.0, dk: 23.0 },
  M20: { d: 20, s: 30, e: 12.5, dk: 29.0 },
  M24: { d: 24, s: 36, e: 15.0, dk: 35.0 },
  M27: { d: 27, s: 41, e: 17.0, dk: 40.0 },
  M30: { d: 30, s: 46, e: 18.7, dk: 44.0 },
};

/**
 * Fastener — Parametric structural bolt, nut, washer, or anchor.
 * Subtypes: 'bolt', 'nut', 'washer', 'anchor'
 */
export class Fastener extends BIMElement {
  constructor(subtype = 'bolt', metric = 'M16', shankLength = 60) {
    super('fastener', { subtype, metric, shankLength });
    this.color = '#a0a0a8';
    this._computeProperties();
    this.buildMesh();
  }

  _computeProperties() {
    const { subtype, metric, shankLength } = this.params;
    const data = BOLT_DATA[metric] || BOLT_DATA.M16;
    this.designation = `${subtype === 'bolt' ? 'Tornillo' : subtype === 'nut' ? 'Tuerca' : subtype === 'washer' ? 'Arandela' : 'Anclaje'} ${metric}`;
    this.area = Math.PI * (data.d / 2) ** 2 / 100;
    this.mass = this.area * (shankLength / 1000) * 7850 / 10000;
    this.tw = data.d;
    this.tf = data.e;
  }

  buildMesh() {
    const { subtype, metric, shankLength } = this.params;
    const data = BOLT_DATA[metric] || BOLT_DATA.M16;
    const mat = this.createMaterial(this.color);

    const group = new THREE.Group();
    group.name = this.designation;

    const d = data.d / 1000;
    const s = data.s / 1000;
    const e = data.e / 1000;
    const sl = (shankLength || 60) / 1000;

    if (subtype === 'bolt') {
      // Hex head
      const headGeo = new THREE.CylinderGeometry(s / 2, s / 2, e, 6);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = sl + e / 2;
      head.castShadow = true;
      group.add(head);

      // Shank
      const shankGeo = new THREE.CylinderGeometry(d / 2, d / 2, sl, 16);
      const shank = new THREE.Mesh(shankGeo, mat.clone());
      shank.position.y = sl / 2;
      shank.castShadow = true;
      group.add(shank);
    } else if (subtype === 'nut') {
      const nutGeo = new THREE.CylinderGeometry(s / 2, s / 2, e * 0.6, 6);
      const nut = new THREE.Mesh(nutGeo, mat);
      nut.castShadow = true;
      group.add(nut);

      // Hole
      const holeGeo = new THREE.CylinderGeometry(d / 2, d / 2, e * 0.62, 16);
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      group.add(hole);
    } else if (subtype === 'washer') {
      const outer = s / 2;
      const inner = d / 2 * 1.1;
      const wt = 0.003;
      const washerGeo = new THREE.CylinderGeometry(outer, outer, wt, 32);
      const washer = new THREE.Mesh(washerGeo, mat);
      washer.castShadow = true;
      group.add(washer);

      const holeGeo = new THREE.CylinderGeometry(inner, inner, wt + 0.001, 16);
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      group.add(hole);
    } else if (subtype === 'anchor') {
      // J-bolt anchor
      const shankGeo = new THREE.CylinderGeometry(d / 2, d / 2, sl, 16);
      const shank = new THREE.Mesh(shankGeo, mat);
      shank.position.y = sl / 2;
      shank.castShadow = true;
      group.add(shank);

      // Curved hook at bottom
      const hookCurve = new THREE.TorusGeometry(d * 1.5 / 1000 * 1000 * 0.015, d / 2, 8, 12, Math.PI);
      const hook = new THREE.Mesh(hookCurve, mat.clone());
      hook.rotation.x = Math.PI / 2;
      hook.rotation.z = Math.PI;
      hook.position.set(d * 0.015, 0, 0);
      hook.castShadow = true;
      group.add(hook);
    }

    this.mesh = group;
    this._applyUserData();
  }

  update(params) {
    Object.assign(this.params, params);
    this._computeProperties();
    this.updateMesh();
  }
}
