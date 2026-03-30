import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';
import {
  getProfileData,
  getEngineeringData,
  SERIES_LIST,
} from './ProfileCatalog.js';

/**
 * Profile v3.1 — Geometría correcta mediante ExtrudeGeometry.
 * Cada sección se define como un Shape 2D (sección transversal real)
 * extruído a lo largo del eje longitudinal.
 * - Radios de acuerdo en esquinas (filetes)
 * - Bordes biselados mediante bevelEnabled
 * - Sin artefactos de solapamiento entre piezas
 * - Orientación correcta: columna=vertical, viga=horizontal
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
    group.name = this.designation || `${series} ${size}`;

    const mat = this.createMaterial(this.color);

    if (series === 'CHS') {
      this._buildCHS(group, data, length, mat);
    } else if (series === 'SHS') {
      this._buildSHS(group, data, length, mat);
    } else if (series === 'L') {
      this._buildAngle(group, data, length, mat);
    } else if (series === 'UPN') {
      this._buildChannel(group, data, length, mat);
    } else {
      // IPE, HEB, HEA, IPN — sección en I
      this._buildISection(group, data, length, mat);
    }

    // Orientación:
    // beam  → extruído en Z, sin rotación
    // column → girar para que quede vertical (a lo largo de Y)
    if (orientation === 'column') {
      group.rotation.x = -Math.PI / 2;
    }

    this.mesh = group;
    this._applyUserData();
  }

  // ── EXTRUSIÓN HELPER ────────────────────────────────────────
  _extrude(shape, length, mat, bevel = true) {
    const bevelSize = bevel ? 0.0008 : 0;
    const settings = {
      depth: length,
      bevelEnabled: bevel,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelOffset: 0,
      bevelSegments: 2,
    };
    const geo = new THREE.ExtrudeGeometry(shape, settings);
    // Centrar en Z
    geo.translate(0, 0, -length / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ── RADIO DE ACUERDO HELPER ─────────────────────────────────
  // Añade un arco de cuarto de círculo a un shape en la esquina (cx,cy)
  // desde ángulo startAngle en sentido indicado
  _arcCorner(shape, cx, cy, r, startAngle, clockwise = false) {
    shape.absarc(cx, cy, r, startAngle, startAngle + (clockwise ? -Math.PI/2 : Math.PI/2), clockwise);
  }

  // ── SECCIÓN I (IPE, HEB, HEA, IPN) ─────────────────────────
  _buildISection(group, dims, L, mat) {
    const h  = dims.h  / 1000;
    const b  = dims.b  / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;
    const r  = Math.min((dims.r || 5) / 1000, tw * 0.45); // radio acuerdo

    const hw = h / 2;   // semialtura total
    const hf = tf;      // espesor ala
    const ww = tw / 2;  // semiancho alma
    const wb = b / 2;   // semiancho ala

    // Definir shape de la sección I completa (sin huecos — perfil sólido extruído)
    // Sentido antihorario desde esquina inferior-izquierda
    const shape = new THREE.Shape();

    // Ala inferior izquierda → derecha
    shape.moveTo(-wb, -hw);
    shape.lineTo( wb, -hw);
    shape.lineTo( wb, -hw + hf);
    // Radio acuerdo ala inferior derecha → alma
    shape.lineTo(ww + r, -hw + hf);
    shape.absarc(ww + r, -hw + hf + r, r, -Math.PI/2, Math.PI, true);
    // Alma derecha subiendo
    shape.lineTo(ww, hw - hf - r);
    // Radio acuerdo alma → ala superior derecha
    shape.absarc(ww + r, hw - hf - r, r, Math.PI, Math.PI/2, true);
    shape.lineTo(wb, hw - hf);
    // Ala superior derecha → izquierda
    shape.lineTo(wb, hw);
    shape.lineTo(-wb, hw);
    shape.lineTo(-wb, hw - hf);
    // Radio acuerdo ala superior izquierda → alma
    shape.lineTo(-ww - r, hw - hf);
    shape.absarc(-ww - r, hw - hf - r, r, Math.PI/2, 0, true);
    // Alma izquierda bajando
    shape.lineTo(-ww, -hw + hf + r);
    // Radio acuerdo alma → ala inferior izquierda
    shape.absarc(-ww - r, -hw + hf + r, r, 0, -Math.PI/2, true);
    shape.lineTo(-wb, -hw + hf);
    shape.lineTo(-wb, -hw);

    const mesh = this._extrude(shape, L, mat, true);
    group.add(mesh);
  }

  // ── CANAL UPN ───────────────────────────────────────────────
  _buildChannel(group, dims, L, mat) {
    const h  = dims.h  / 1000;
    const b  = dims.b  / 1000;
    const tw = dims.tw / 1000;
    const tf = dims.tf / 1000;
    const r  = Math.min((dims.r || 5) / 1000, tw * 0.45);

    const hw = h / 2;
    const wb = b;      // ancho total ala
    const ww = tw;     // espesor alma

    const shape = new THREE.Shape();
    // Contorno UPN: alma a la izquierda, alas hacia la derecha
    // Ala inferior
    shape.moveTo(0, -hw);
    shape.lineTo(wb, -hw);
    shape.lineTo(wb, -hw + tf);
    // Radio acuerdo ala inferior → alma
    shape.lineTo(ww + r, -hw + tf);
    shape.absarc(ww + r, -hw + tf + r, r, -Math.PI/2, Math.PI, true);
    // Alma subiendo
    shape.lineTo(ww, hw - tf - r);
    // Radio acuerdo alma → ala superior
    shape.absarc(ww + r, hw - tf - r, r, Math.PI, Math.PI/2, true);
    shape.lineTo(wb, hw - tf);
    // Ala superior
    shape.lineTo(wb, hw);
    shape.lineTo(0, hw);
    shape.lineTo(0, -hw);

    // Centrar en X
    const centerX = wb / 2;
    shape.curves.forEach(() => {});

    const mesh = this._extrude(shape, L, mat, true);
    // Centrar en X
    mesh.position.x = -wb / 2;
    group.add(mesh);
  }

  // ── ANGULAR L ───────────────────────────────────────────────
  _buildAngle(group, dims, L, mat) {
    const a = dims.a / 1000;           // pata vertical
    const b = (dims.b || dims.a) / 1000; // pata horizontal
    const t = dims.t / 1000;
    const r = Math.min(t * 0.6, 0.006); // radio acuerdo interior

    const shape = new THREE.Shape();

    // Pata horizontal desde el origen
    shape.moveTo(0, 0);
    shape.lineTo(b, 0);
    shape.lineTo(b, t);
    shape.lineTo(t + r, t);
    // Radio acuerdo interior (esquina del ángulo)
    shape.absarc(t + r, t + r, r, -Math.PI/2, Math.PI, true);
    // Pata vertical
    shape.lineTo(t, a);
    shape.lineTo(0, a);
    shape.lineTo(0, 0);

    const mesh = this._extrude(shape, L, mat, true);
    // Centrar en XY
    mesh.position.set(-b / 2, -a / 2, 0);
    group.add(mesh);
  }

  // ── TUBO CHS ────────────────────────────────────────────────
  _buildCHS(group, dims, L, mat) {
    const rOuter = (dims.d / 1000) / 2;
    const t = dims.t / 1000;
    const rInner = Math.max(0.002, rOuter - t);

    // Shape anular (exterior menos interior)
    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, rInner, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const settings = {
      depth: L,
      bevelEnabled: false,
      curveSegments: 32,
    };
    const geo = new THREE.ExtrudeGeometry(shape, settings);
    geo.translate(0, 0, -L / 2);
    // Rotar para que el eje sea Z
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // ── TUBO SHS ────────────────────────────────────────────────
  _buildSHS(group, dims, L, mat) {
    const h = dims.h / 1000;
    const b = dims.b / 1000;
    const t = dims.t / 1000;
    const r = Math.min(t * 0.5, 0.004); // radio exterior de esquina

    // Shape exterior con esquinas redondeadas
    const shape = new THREE.Shape();
    const x = b / 2, y = h / 2;
    shape.moveTo(-x + r, -y);
    shape.lineTo( x - r, -y);
    shape.absarc( x - r, -y + r, r, -Math.PI/2, 0, false);
    shape.lineTo( x,  y - r);
    shape.absarc( x - r,  y - r, r, 0, Math.PI/2, false);
    shape.lineTo(-x + r,  y);
    shape.absarc(-x + r,  y - r, r, Math.PI/2, Math.PI, false);
    shape.lineTo(-x, -y + r);
    shape.absarc(-x + r, -y + r, r, Math.PI, -Math.PI/2, false);

    // Hueco interior con esquinas redondeadas
    const ri = Math.max(r - t * 0.3, 0.001);
    const xi = x - t, yi = y - t;
    const hole = new THREE.Path();
    hole.moveTo(-xi + ri, -yi);
    hole.lineTo( xi - ri, -yi);
    hole.absarc( xi - ri, -yi + ri, ri, -Math.PI/2, 0, false);
    hole.lineTo( xi,  yi - ri);
    hole.absarc( xi - ri,  yi - ri, ri, 0, Math.PI/2, false);
    hole.lineTo(-xi + ri,  yi);
    hole.absarc(-xi + ri,  yi - ri, ri, Math.PI/2, Math.PI, false);
    hole.lineTo(-xi, -yi + ri);
    hole.absarc(-xi + ri, -yi + ri, ri, Math.PI, -Math.PI/2, false);
    shape.holes.push(hole);

    const settings = { depth: L, bevelEnabled: false, curveSegments: 8 };
    const geo = new THREE.ExtrudeGeometry(shape, settings);
    geo.translate(0, 0, -L / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  update(params) {
    Object.assign(this.params, params);
    this._computeProperties();
    this.updateMesh();
  }
}
