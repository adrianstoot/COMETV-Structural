import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';
import {
  getProfileData,
  getEngineeringData,
  SERIES_LIST,
} from './ProfileCatalog.js';

/**
 * Profile — Parametric structural steel profile.
 * Supports IPE, HEB, HEA, IPN, UPN, L, CHS, SHS.
 *
 * orientation: 'column' (vertical, along Y) or 'beam' (horizontal, along Z)
 */
export class Profile extends BIMElement {
  constructor(series = 'IPE', size = '200', length = 3.0, orientation = 'beam') {
    super('profile', { series, size, length, orientation });
    this._computeProperties();
    this.buildMesh();
  }

  _computeProperties() {
    const { series, size, length } = this.params;
    const eng = getEngineeringData(series, size, length, this.steelGrade);
    if (!eng) return;

    this.designation = eng.designation;
    this.area = eng.area;
    this.mass = eng.mass;
    this.tw = eng.tw;
    this.tf = eng.tf;
    this.engineeringData = eng;
  }

  buildMesh() {
    const { series, size, length, orientation } = this.params;
    const data = getProfileData(series, size);
    if (!data) return;

    const group = new THREE.Group();
    group.name = this.designation;

    const mat = this.createMaterial(this.color);
    const L = length;

    if (series === 'CHS') {
      this._buildCHS(group, data, L, mat);
    } else if (series === 'L') {
      this._buildAngle(group, data, L, mat);
    } else if (series === 'UPN') {
      this._buildChannel(group, data, L, mat);
    } else if (series === 'SHS') {
      this._buildSHS(group, data, L, mat);
    } else {
      // I-section (IPE, HEB, HEA, IPN)
      this._buildISection(group, data, L, mat);
    }

    // Apply orientation:
    // 'column' => profile stands vertical (length along Y)
    // 'beam'   => profile lies horizontal (length along Z)
    if (orientation === 'column') {
      // Rotate so length axis (Z) becomes Y
      group.rotation.x = -Math.PI / 2;
    }

    this.mesh = group;
    this._applyUserData();
  }

  _buildISection(group, dims, L, mat) {
    const h = dims.h / 1000;
    const b = dims.b / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;

    // Web (centered vertically)
    const webH = h - 2 * tf;
    const webGeo = new THREE.BoxGeometry(tw, webH, L);
    const webMesh = new THREE.Mesh(webGeo, mat);
    webMesh.position.set(0, 0, 0);
    webMesh.castShadow = true;
    webMesh.receiveShadow = true;
    group.add(webMesh);

    // Top flange
    const fGeo = new THREE.BoxGeometry(b, tf, L);
    const topFlange = new THREE.Mesh(fGeo, mat.clone());
    topFlange.position.set(0, (webH + tf) / 2, 0);
    topFlange.castShadow = true;
    topFlange.receiveShadow = true;
    group.add(topFlange);

    // Bottom flange
    const botFlange = new THREE.Mesh(fGeo.clone(), mat.clone());
    botFlange.position.set(0, -(webH + tf) / 2, 0);
    botFlange.castShadow = true;
    botFlange.receiveShadow = true;
    group.add(botFlange);
  }

  _buildChannel(group, dims, L, mat) {
    const h = dims.h / 1000;
    const b = dims.b / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;

    const webH = h - 2 * tf;
    // Web
    const webGeo = new THREE.BoxGeometry(tw, webH, L);
    const webMesh = new THREE.Mesh(webGeo, mat);
    webMesh.position.set(-b / 2 + tw / 2, 0, 0);
    webMesh.castShadow = true;
    group.add(webMesh);

    // Top flange
    const fGeo = new THREE.BoxGeometry(b, tf, L);
    const top = new THREE.Mesh(fGeo, mat.clone());
    top.position.set(0, (webH + tf) / 2, 0);
    top.castShadow = true;
    group.add(top);

    // Bottom flange
    const bot = new THREE.Mesh(fGeo.clone(), mat.clone());
    bot.position.set(0, -(webH + tf) / 2, 0);
    bot.castShadow = true;
    group.add(bot);
  }

  _buildAngle(group, dims, L, mat) {
    const a = dims.a / 1000;
    const b = (dims.b || dims.a) / 1000;
    const t = dims.t / 1000;

    // Vertical leg
    const vGeo = new THREE.BoxGeometry(t, a, L);
    const vMesh = new THREE.Mesh(vGeo, mat);
    vMesh.position.set(-b / 2 + t / 2, 0, 0);
    vMesh.castShadow = true;
    group.add(vMesh);

    // Horizontal leg
    const hGeo = new THREE.BoxGeometry(b, t, L);
    const hMesh = new THREE.Mesh(hGeo, mat.clone());
    hMesh.position.set(0, -a / 2 + t / 2, 0);
    hMesh.castShadow = true;
    group.add(hMesh);
  }

  _buildCHS(group, dims, L, mat) {
    const rOuter = (dims.d / 1000) / 2;
    const t = dims.t / 1000;
    const rInner = rOuter - t;

    // CHS along Z axis
    const outerGeo = new THREE.CylinderGeometry(rOuter, rOuter, L, 32);
    outerGeo.rotateX(Math.PI / 2); // align with Z
    const outerMesh = new THREE.Mesh(outerGeo, mat);
    outerMesh.castShadow = true;
    group.add(outerMesh);

    // Inner hole visualization
    const innerGeo = new THREE.CylinderGeometry(rInner, rInner, L + 0.002, 32);
    innerGeo.rotateX(Math.PI / 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x111122, roughness: 0.9, metalness: 0.1, side: THREE.BackSide
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);
  }

  _buildSHS(group, dims, L, mat) {
    const h = dims.h / 1000;
    const b = dims.b / 1000;
    const t = dims.t / 1000;

    // 4 walls
    // Front wall
    const wallGeoH = new THREE.BoxGeometry(b, t, L);
    const wallGeoV = new THREE.BoxGeometry(t, h - 2 * t, L);

    const top = new THREE.Mesh(wallGeoH, mat);
    top.position.set(0, (h - t) / 2, 0);
    top.castShadow = true;
    group.add(top);

    const bot = new THREE.Mesh(wallGeoH.clone(), mat.clone());
    bot.position.set(0, -(h - t) / 2, 0);
    bot.castShadow = true;
    group.add(bot);

    const left = new THREE.Mesh(wallGeoV, mat.clone());
    left.position.set(-(b - t) / 2, 0, 0);
    left.castShadow = true;
    group.add(left);

    const right = new THREE.Mesh(wallGeoV.clone(), mat.clone());
    right.position.set((b - t) / 2, 0, 0);
    right.castShadow = true;
    group.add(right);
  }

  update(params) {
    Object.assign(this.params, params);
    this._computeProperties();
    this.updateMesh();
  }
}
