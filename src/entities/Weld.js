import * as THREE from 'three';
import { BIMElement } from './BIMElement.js';

/**
 * Weld — Physical weld bead (oriented cylinder) between two points.
 */
export class Weld extends BIMElement {
  constructor(pointA, pointB, radius = 0.008) {
    super('weld', { radius });
    this.pointA = pointA.clone();
    this.pointB = pointB.clone();
    this.params.radius = radius;
    this._computeProperties();
    this.buildMesh();
  }

  _computeProperties() {
    const dist = this.pointA.distanceTo(this.pointB);
    this.designation = `Soldadura L=${(dist * 100).toFixed(1)}cm`;
    const r = this.params.radius;
    this.area = Math.PI * r * r * 10000; // cm²
    this.mass = this.area / 10000 * dist * 7850;
    this.tw = r * 2 * 1000;
    this.tf = 0;
  }

  buildMesh() {
    const dist = this.pointA.distanceTo(this.pointB);
    const r = this.params.radius;

    const geo = new THREE.CylinderGeometry(r, r, dist, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0x551100,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.name = this.designation;
    this.mesh.castShadow = true;

    // Position at midpoint, orient along A→B
    const mid = new THREE.Vector3().addVectors(this.pointA, this.pointB).multiplyScalar(0.5);
    this.mesh.position.copy(mid);

    // Orient cylinder (default Y-axis) to match A→B direction
    const dir = new THREE.Vector3().subVectors(this.pointB, this.pointA).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    this.mesh.quaternion.copy(quat);

    this._applyUserData();
  }
}
