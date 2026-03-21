import * as THREE from 'three';

/**
 * SnapManager — Professional CAD-grade snapping system.
 * Renders a crosshair cursor (like ArchiCAD) instead of a cube.
 * Supports: vertex, edge midpoint, face center, grid, orthogonal constraint.
 */
export class SnapManager {
  constructor(sceneManager, gridManager) {
    this.sceneManager = sceneManager;
    this.gridManager = gridManager;
    this.enabled = true;
    this.orthoLock = false;
    this.snapToVertex = true;
    this.snapToEdge = true;
    this.snapToFace = true;
    this.snapToGrid = true;
    this.gridSnap = 0.25; // 25cm grid snap resolution

    // Crosshair marker group
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'SnapCrosshair';
    this.markerGroup.visible = false;

    // Small dot at center
    const dotGeo = new THREE.SphereGeometry(0.015, 8, 8);
    this.dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, depthTest: false });
    this.dot = new THREE.Mesh(dotGeo, this.dotMat);
    this.dot.renderOrder = 999;
    this.markerGroup.add(this.dot);

    // Crosshair lines (X, Y, Z)
    const lineLen = 0.12;
    this.crosshairLines = [];
    const dirs = [
      { dir: new THREE.Vector3(1, 0, 0), color: 0xff4444 },
      { dir: new THREE.Vector3(0, 1, 0), color: 0x44ff44 },
      { dir: new THREE.Vector3(0, 0, 1), color: 0x4488ff },
    ];
    dirs.forEach(({ dir, color }) => {
      const points = [
        dir.clone().multiplyScalar(-lineLen),
        dir.clone().multiplyScalar(lineLen),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color,
        depthTest: false,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 999;
      this.crosshairLines.push(line);
      this.markerGroup.add(line);
    });

    // Ring indicator
    const ringGeo = new THREE.RingGeometry(0.04, 0.055, 24);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.6,
    });
    this.ring = new THREE.Mesh(ringGeo, this.ringMat);
    this.ring.renderOrder = 998;
    this.markerGroup.add(this.ring);

    this.sceneManager.scene.add(this.markerGroup);

    this.lastSnap = null;
    this.snapType = null;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._referencePoint = null; // For orthogonal constraining
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) {
      this.markerGroup.visible = false;
      this.lastSnap = null;
    }
  }

  setReferencePoint(point) {
    this._referencePoint = point ? point.clone() : null;
  }

  update(event) {
    if (!this.enabled) return null;

    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this.sceneManager.camera);

    let snapPoint = null;

    // Priority 1: Vertex snap (closest vertex within screen threshold)
    if (this.snapToVertex) {
      snapPoint = this._findVertexSnap();
      if (snapPoint) {
        this._setMarker(snapPoint, 0x00ff88, 'vertex');
        return this._applyOrthoConstraint(snapPoint);
      }
    }

    // Priority 2: Edge midpoint snap
    if (this.snapToEdge) {
      snapPoint = this._findEdgeMidpointSnap();
      if (snapPoint) {
        this._setMarker(snapPoint, 0xffaa00, 'edge');
        return this._applyOrthoConstraint(snapPoint);
      }
    }

    // Priority 3: Face snap on objects
    if (this.snapToFace) {
      const selectables = this.sceneManager.getSelectableObjects();
      const hits = this._raycaster.intersectObjects(selectables, true);
      if (hits.length > 0) {
        const pt = hits[0].point;
        this._setMarker(pt, 0xff6644, 'face');
        return this._applyOrthoConstraint(pt);
      }
    }

    // Priority 4: Grid snap
    if (this.snapToGrid) {
      const ground = this.gridManager.getGroundPlane();
      if (ground) {
        const groundHits = this._raycaster.intersectObject(ground);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          pt.x = Math.round(pt.x / this.gridSnap) * this.gridSnap;
          pt.y = 0;
          pt.z = Math.round(pt.z / this.gridSnap) * this.gridSnap;
          this._setMarker(pt, 0x4488ff, 'grid');
          return this._applyOrthoConstraint(pt);
        }
      }
    }

    this.markerGroup.visible = false;
    this.lastSnap = null;
    this.snapType = null;
    return null;
  }

  _findVertexSnap() {
    const selectables = this.sceneManager.getSelectableObjects();
    let closest = null;
    let minScreenDist = 0.035; // screen-space threshold (tight like pro CAD)

    const cam = this.sceneManager.camera;
    const tempV = new THREE.Vector3();

    for (const obj of selectables) {
      if (!obj.geometry || !obj.geometry.attributes.position) continue;
      const pos = obj.geometry.attributes.position;
      const matWorld = obj.matrixWorld;

      // Sample vertices (limit for performance)
      const step = Math.max(1, Math.floor(pos.count / 200));
      for (let i = 0; i < pos.count; i += step) {
        tempV.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        tempV.applyMatrix4(matWorld);

        const projected = tempV.clone().project(cam);
        if (projected.z > 1) continue; // behind camera

        const dx = projected.x - this._mouse.x;
        const dy = projected.y - this._mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < minScreenDist) {
          minScreenDist = d;
          closest = tempV.clone();
        }
      }
    }
    return closest;
  }

  _findEdgeMidpointSnap() {
    const selectables = this.sceneManager.getSelectableObjects();
    let closest = null;
    let minScreenDist = 0.04;
    const cam = this.sceneManager.camera;
    const tempA = new THREE.Vector3();
    const tempB = new THREE.Vector3();
    const tempMid = new THREE.Vector3();

    for (const obj of selectables) {
      if (!obj.geometry) continue;
      const index = obj.geometry.index;
      const pos = obj.geometry.attributes.position;
      if (!pos) continue;
      const matWorld = obj.matrixWorld;

      if (index) {
        const step = Math.max(1, Math.floor(index.count / 100));
        for (let i = 0; i < index.count - 1; i += step) {
          const iA = index.getX(i);
          const iB = index.getX(i + 1);
          tempA.set(pos.getX(iA), pos.getY(iA), pos.getZ(iA)).applyMatrix4(matWorld);
          tempB.set(pos.getX(iB), pos.getY(iB), pos.getZ(iB)).applyMatrix4(matWorld);
          tempMid.addVectors(tempA, tempB).multiplyScalar(0.5);

          const projected = tempMid.clone().project(cam);
          if (projected.z > 1) continue;
          const dx = projected.x - this._mouse.x;
          const dy = projected.y - this._mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minScreenDist) {
            minScreenDist = d;
            closest = tempMid.clone();
          }
        }
      }
    }
    return closest;
  }

  _applyOrthoConstraint(point) {
    if (!point) return null;

    if (this.orthoLock && this._referencePoint) {
      const ref = this._referencePoint;
      const dx = Math.abs(point.x - ref.x);
      const dy = Math.abs(point.y - ref.y);
      const dz = Math.abs(point.z - ref.z);

      // Lock to the dominant axis
      if (dx >= dy && dx >= dz) {
        point.y = ref.y;
        point.z = ref.z;
      } else if (dy >= dx && dy >= dz) {
        point.x = ref.x;
        point.z = ref.z;
      } else {
        point.x = ref.x;
        point.y = ref.y;
      }

      this._setMarker(point, this.dotMat.color.getHex(), this.snapType);
    }

    this.lastSnap = point.clone();
    return this.lastSnap;
  }

  _setMarker(position, color, type) {
    this.markerGroup.position.copy(position);
    this.markerGroup.visible = true;
    this.dotMat.color.setHex(color);
    this.ringMat.color.setHex(color);
    this.snapType = type;
    this.lastSnap = position.clone();

    // Orient ring to face camera
    this.ring.lookAt(this.sceneManager.camera.position);
  }

  getSnapPoint() {
    return this.lastSnap;
  }
}
