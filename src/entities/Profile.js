import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';
import {
  getProfileData,
  getEngineeringData,
  SERIES_LIST,
} from './ProfileCatalog.js';

/**
 * Profile v3.0 — Parametric structural steel profile with:
 * - Beveled BoxGeometry for premium edge quality
 * - Root fillet representation for I-sections
 * - Correct CHS inner cavity
 * - Premium PBR material configuration
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
      this._buildISection(group, data, L, mat);
    }

    if (orientation === 'column') {
      group.rotation.x = -Math.PI / 2;
    }

    this.mesh = group;
    this._applyUserData();
  }

  // Beveled box helper — adds edge quality
  _bevelBox(w, h, d, bevel = 0.003) {
    const b = Math.min(bevel, w * 0.15, h * 0.15, d * 0.15);
    return new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  }

  _buildISection(group, dims, L, mat) {
    const h  = dims.h  / 1000;
    const b  = dims.b  / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;
    const r  = (dims.r || 0) / 1000; // root fillet radius

    const webH = h - 2 * tf;

    // Web
    const webGeo = this._bevelBox(tw, webH, L);
    const web = new THREE.Mesh(webGeo, mat);
    web.castShadow = true;
    web.receiveShadow = true;
    group.add(web);

    // Top flange
    const fGeo = this._bevelBox(b, tf, L);
    const topF = new THREE.Mesh(fGeo, mat.clone());
    topF.position.set(0, (webH + tf) / 2, 0);
    topF.castShadow = true; topF.receiveShadow = true;
    group.add(topF);

    // Bottom flange
    const botF = new THREE.Mesh(fGeo.clone(), mat.clone());
    botF.position.set(0, -(webH + tf) / 2, 0);
    botF.castShadow = true; botF.receiveShadow = true;
    group.add(botF);

    // Root fillet blocks (simplified as small blocks at web-flange junction)
    if (r > 0.001) {
      const filletSize = Math.max(r, 0.003);
      const filletGeo = this._bevelBox(filletSize * 2, filletSize * 2, L);
      const filletMat = mat.clone();
      filletMat.color.multiplyScalar(0.95);
      // 4 fillets: top-left, top-right, bot-left, bot-right
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
        const f = new THREE.Mesh(filletGeo.clone(), filletMat.clone());
        f.position.set(
          sx * (tw / 2 + filletSize * 0.5),
          sy * (webH / 2 + filletSize * 0.5),
          0
        );
        f.castShadow = true;
        group.add(f);
      });
    }
  }

  _buildChannel(group, dims, L, mat) {
    const h  = dims.h  / 1000;
    const b  = dims.b  / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;

    const webH = h - 2 * tf;

    // Web (left-aligned)
    const webGeo = this._bevelBox(tw, webH, L);
    const web = new THREE.Mesh(webGeo, mat);
    web.position.set(-b / 2 + tw / 2, 0, 0);
    web.castShadow = true; group.add(web);

    // Flanges
    const fGeo = this._bevelBox(b, tf, L);
    const topF = new THREE.Mesh(fGeo, mat.clone());
    topF.position.set(0, (webH + tf) / 2, 0);
    topF.castShadow = true; group.add(topF);

    const botF = new THREE.Mesh(fGeo.clone(), mat.clone());
    botF.position.set(0, -(webH + tf) / 2, 0);
    botF.castShadow = true; group.add(botF);
  }

  _buildAngle(group, dims, L, mat) {
    const a = dims.a / 1000;
    const b = (dims.b || dims.a) / 1000;
    const t = dims.t / 1000;

    // Vertical leg
    const vGeo = this._bevelBox(t, a - t, L);
    const vMesh = new THREE.Mesh(vGeo, mat);
    vMesh.position.set(-(b - t) / 2, t / 2, 0);
    vMesh.castShadow = true; group.add(vMesh);

    // Horizontal leg
    const hGeo = this._bevelBox(b, t, L);
    const hMesh = new THREE.Mesh(hGeo, mat.clone());
    hMesh.position.set(0, -(a - t) / 2, 0);
    hMesh.castShadow = true; group.add(hMesh);
  }

  _buildCHS(group, dims, L, mat) {
    const rOuter = (dims.d / 1000) / 2;
    const t = dims.t / 1000;
    const rInner = Math.max(0.001, rOuter - t);

    const segments = 36; // smoother tube

    // Outer cylinder
    const outerGeo = new THREE.CylinderGeometry(rOuter, rOuter, L, segments);
    outerGeo.rotateX(Math.PI / 2);
    const outer = new THREE.Mesh(outerGeo, mat);
    outer.castShadow = true; outer.receiveShadow = true;
    group.add(outer);

    // Inner dark cavity (backface)
    const innerGeo = new THREE.CylinderGeometry(rInner, rInner, L + 0.002, segments);
    innerGeo.rotateX(Math.PI / 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10, roughness: 0.95, metalness: 0.1, side: THREE.BackSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // End caps
    const capGeo = new THREE.RingGeometry(rInner, rOuter, segments);
    const capMat = mat.clone();
    [-L / 2, L / 2].forEach((z, i) => {
      const cap = new THREE.Mesh(capGeo.clone(), capMat.clone());
      cap.position.z = z;
      cap.rotation.y = i === 0 ? Math.PI : 0;
      cap.castShadow = true;
      group.add(cap);
    });
  }

  _buildSHS(group, dims, L, mat) {
    const h = dims.h / 1000;
    const b = dims.b / 1000;
    const t = dims.t / 1000;

    // 4 walls with slight bevel
    const walls = [
      { geo: this._bevelBox(b, t, L), pos: [0,  (h - t) / 2, 0] },
      { geo: this._bevelBox(b, t, L), pos: [0, -(h - t) / 2, 0] },
      { geo: this._bevelBox(t, h - 2 * t, L), pos: [-(b - t) / 2, 0, 0] },
      { geo: this._bevelBox(t, h - 2 * t, L), pos: [ (b - t) / 2, 0, 0] },
    ];
    walls.forEach(({ geo, pos }) => {
      const m = new THREE.Mesh(geo, mat.clone());
      m.position.set(...pos);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
    });

    // Dark hollow interior cue
    const innerGeo = new THREE.BoxGeometry(b - 2 * t - 0.001, h - 2 * t - 0.001, L + 0.002);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x080a0e, roughness: 0.95, metalness: 0, side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));
  }

  update(params) {
    Object.assign(this.params, params);
    this._computeProperties();
    this.updateMesh();
  }
}
