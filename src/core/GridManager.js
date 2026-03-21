import * as THREE from 'three';

export class GridManager {
  constructor(scene, initialSize = 16) {
    this.scene = scene;
    this.gridGroup = new THREE.Group();
    this.gridGroup.name = 'GridSystem';
    this.scene.add(this.gridGroup);
    this.currentSize = initialSize;
    this.buildGrid(initialSize);
  }

  buildGrid(size) {
    // Remove old
    while (this.gridGroup.children.length) {
      const c = this.gridGroup.children[0];
      c.geometry?.dispose();
      c.material?.dispose();
      this.gridGroup.remove(c);
    }
    this.currentSize = size;
    const half = size / 2;

    // Main grid
    const gridHelper = new THREE.GridHelper(size, size, 0x444466, 0x2a2a3e);
    gridHelper.position.y = 0;
    this.gridGroup.add(gridHelper);

    // Ground plane (invisible, for raycasting)
    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide
    });
    this.groundPlane = new THREE.Mesh(planeGeo, planeMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.name = 'GroundPlane';
    this.gridGroup.add(this.groundPlane);

    // Axes
    const axisLen = half + 1;
    // X - Red
    const xGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(axisLen, 0.01, 0)
    ]);
    const xLine = new THREE.Line(xGeo, new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 2 }));

    // Z - Blue
    const zGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, axisLen)
    ]);
    const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0x4444ff, linewidth: 2 }));

    // Y - Green
    const yGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLen, 0)
    ]);
    const yLine = new THREE.Line(yGeo, new THREE.LineBasicMaterial({ color: 0x44ff44, linewidth: 2 }));

    this.gridGroup.add(xLine, yLine, zLine);
  }

  setSize(size) {
    this.buildGrid(size);
  }

  getGroundPlane() {
    return this.groundPlane;
  }
}
