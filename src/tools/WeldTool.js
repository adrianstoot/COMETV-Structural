import * as THREE from 'three';
import { Weld } from '../entities/Weld.js';

/**
 * WeldTool — Professional weld bead tool.
 * Detects surface points precisely via raycasting.
 * Creates thin red weld beads perfectly aligned to piece surfaces.
 */
export class WeldTool {
  constructor(sceneManager, snapManager, onWeldCreated) {
    this.sceneManager = sceneManager;
    this.snapManager = snapManager;
    this.onWeldCreated = onWeldCreated;
    this.active = false;
    this.pointA = null;
    this.normalA = null;
    this._tempMarker = null;
    this._tempLine = null;
  }

  setActive(active) {
    this.active = active;
    if (!active) {
      this.pointA = null;
      this.normalA = null;
      this.snapManager.setReferencePoint(null);
      this._removeTempMarker();
      this._removeTempLine();
    }
  }

  handleClick(event) {
    if (!this.active) return;

    // Raycast directly to find the exact surface point
    const hit = this._raycastSurface(event);
    
    if (!hit) {
      // Fall back to snap point
      const snapPt = this.snapManager.getSnapPoint();
      if (!snapPt) return;
      
      if (!this.pointA) {
        this.pointA = snapPt.clone();
        this.snapManager.setReferencePoint(this.pointA);
        this._showTempMarker(this.pointA);
      } else {
        const pointB = snapPt.clone();
        this._createWeld(this.pointA, pointB);
      }
      return;
    }

    if (!this.pointA) {
      this.pointA = hit.point.clone();
      this.normalA = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      this.snapManager.setReferencePoint(this.pointA);
      this._showTempMarker(this.pointA);
    } else {
      const pointB = hit.point.clone();
      this._createWeld(this.pointA, pointB);
    }
  }

  handleMouseMove(event) {
    if (!this.active || !this.pointA) return;

    // Show temp line from pointA to current position
    const hit = this._raycastSurface(event);
    let target = null;
    
    if (hit) {
      target = hit.point;
    } else {
      const snapPt = this.snapManager.getSnapPoint();
      if (snapPt) target = snapPt;
    }

    if (!target) return;

    this._removeTempLine();
    const points = [this.pointA, target];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0xff3333, dashSize: 0.03, gapSize: 0.02, depthTest: false,
    });
    this._tempLine = new THREE.Line(geo, mat);
    this._tempLine.computeLineDistances();
    this._tempLine.renderOrder = 900;
    this.sceneManager.scene.add(this._tempLine);
  }

  _createWeld(a, b) {
    const weld = new Weld(a, b, 0.005); // Thin 5mm radius weld bead
    this.sceneManager.addObject(weld);
    if (this.onWeldCreated) this.onWeldCreated(weld);
    this.pointA = null;
    this.normalA = null;
    this.snapManager.setReferencePoint(null);
    this._removeTempMarker();
    this._removeTempLine();
  }

  _raycastSurface(event) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.sceneManager.raycaster.setFromCamera(mouse, this.sceneManager.camera);
    
    const selectables = this.sceneManager.getSelectableObjects();
    const hits = this.sceneManager.raycaster.intersectObjects(selectables, true);
    
    // Return closest hit on a real object (not grid/ground)
    for (const hit of hits) {
      if (hit.object.name === 'GroundPlane') continue;
      if (hit.object.name === 'GridSystem') continue;
      if (hit.object.name?.startsWith('__')) continue;
      return hit;
    }
    return null;
  }

  _showTempMarker(point) {
    this._removeTempMarker();
    const geo = new THREE.SphereGeometry(0.012, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff3333, depthTest: false });
    this._tempMarker = new THREE.Mesh(geo, mat);
    this._tempMarker.position.copy(point);
    this._tempMarker.renderOrder = 950;
    this.sceneManager.scene.add(this._tempMarker);
  }

  _removeTempMarker() {
    if (this._tempMarker) {
      this.sceneManager.scene.remove(this._tempMarker);
      this._tempMarker.geometry?.dispose();
      this._tempMarker.material?.dispose();
      this._tempMarker = null;
    }
  }

  _removeTempLine() {
    if (this._tempLine) {
      this.sceneManager.scene.remove(this._tempLine);
      this._tempLine.geometry?.dispose();
      this._tempLine.material?.dispose();
      this._tempLine = null;
    }
  }
}
