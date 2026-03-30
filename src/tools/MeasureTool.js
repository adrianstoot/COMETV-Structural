import * as THREE from 'three';

/**
 * MeasureTool — Professional 2-click CAD measurement.
 * Uses snap system with orthogonal constraint support.
 * Draws a clean dimension line with arrows and a floating label.
 */
export class MeasureTool {
  constructor(sceneManager, snapManager) {
    this.sceneManager = sceneManager;
    this.snapManager = snapManager;
    this.active = false;
    this.pointA = null;
    this.measurements = [];
    this._tempLine = null;
    this._tempLabel = null;
  }

  setActive(active) {
    this.active = active;
    if (!active) {
      this.pointA = null;
      this.snapManager.setReferencePoint(null);
      this.snapManager.orthoLock = false;
      this._removeTempLine();
      this._removeTempLabel();
    } else {
      this.snapManager.orthoLock = false;  // mide en cualquier dirección
    }
  }

  handleClick(event) {
    if (!this.active) return;

    const snapPt = this.snapManager.getSnapPoint();
    if (!snapPt) return;

    if (!this.pointA) {
      this.pointA = snapPt.clone();
      this.snapManager.setReferencePoint(this.pointA);
    } else {
      const pointB = snapPt.clone();
      this._createMeasurement(this.pointA, pointB);
      this.pointA = null;
      this.snapManager.setReferencePoint(null);
      this._removeTempLine();
      this._removeTempLabel();
    }
  }

  handleMouseMove(event) {
    if (!this.active || !this.pointA) return;

    const snapPt = this.snapManager.getSnapPoint();
    if (!snapPt) return;

    this._removeTempLine();
    this._removeTempLabel();

    // Draw temp line
    const points = [this.pointA, snapPt];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0xeab308,
      dashSize: 0.05,
      gapSize: 0.03,
      depthTest: false,
    });
    this._tempLine = new THREE.Line(geo, mat);
    this._tempLine.computeLineDistances();
    this._tempLine.renderOrder = 900;
    this._tempLine.name = '__tempMeasure';
    this.sceneManager.scene.add(this._tempLine);

    // Temp label
    const distance = this.pointA.distanceTo(snapPt);
    const mid = new THREE.Vector3().addVectors(this.pointA, snapPt).multiplyScalar(0.5);
    this._tempLabel = this._createLabelDiv(`${(distance * 100).toFixed(1)} cm`, mid, true);
  }

  _createMeasurement(a, b) {
    const dist = a.distanceTo(b);
    const distCm = (dist * 100).toFixed(1);
    const distM = dist.toFixed(3);

    // Solid line
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({ color: 0xeab308, depthTest: false });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 900;
    line.name = 'MeasureLine';
    this.sceneManager.scene.add(line);

    // Endpoint markers (small spheres)
    const markerGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xeab308, depthTest: false });
    const ma = new THREE.Mesh(markerGeo, markerMat);
    ma.position.copy(a);
    ma.renderOrder = 901;
    this.sceneManager.scene.add(ma);
    const mb = new THREE.Mesh(markerGeo.clone(), markerMat.clone());
    mb.position.copy(b);
    mb.renderOrder = 901;
    this.sceneManager.scene.add(mb);

    // Label
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const label = this._createLabelDiv(`${distCm} cm (${distM} m)`, mid, false);

    this.measurements.push({ line, ma, mb, label, a: a.clone(), b: b.clone(), dist });
  }

  _createLabelDiv(text, position, isTemp) {
    const div = document.createElement('div');
    div.className = 'measure-label';
    div.textContent = text;
    div.style.cssText = `
      position: absolute;
      background: rgba(234, 179, 8, 0.92);
      color: #000;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'Inter', monospace;
      pointer-events: none;
      z-index: 100;
      white-space: nowrap;
      letter-spacing: 0.3px;
      border: 1px solid rgba(0,0,0,0.2);
    `;
    if (isTemp) div.style.opacity = '0.75';
    const container = document.getElementById('canvas-container');
    container.appendChild(div);

    const cam = this.sceneManager.camera;
    const renderer = this.sceneManager.renderer;

    const updatePos = () => {
      if (!div.parentElement) return;
      const projected = position.clone().project(cam);
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (projected.x + 1) / 2 * rect.width;
      const y = (-projected.y + 1) / 2 * rect.height;
      div.style.left = (x + rect.left) + 'px';
      div.style.top = (y + rect.top - 20) + 'px';
      requestAnimationFrame(updatePos);
    };
    updatePos();
    return div;
  }

  _removeTempLine() {
    if (this._tempLine) {
      this.sceneManager.scene.remove(this._tempLine);
      this._tempLine.geometry?.dispose();
      this._tempLine.material?.dispose();
      this._tempLine = null;
    }
  }

  _removeTempLabel() {
    if (this._tempLabel && this._tempLabel.parentElement) {
      this._tempLabel.remove();
      this._tempLabel = null;
    }
  }
}
