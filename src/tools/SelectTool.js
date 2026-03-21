/**
 * SelectTool — Click to select/deselect BIM objects in the scene.
 * Finds the parent BIMElement of any clicked mesh child.
 */
export class SelectTool {
  constructor(sceneManager, snapManager, onSelect) {
    this.sceneManager = sceneManager;
    this.snapManager = snapManager;
    this.onSelect = onSelect;
    this.selected = null;
  }

  handleClick(event) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    const mouse = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    };

    this.sceneManager.raycaster.setFromCamera(mouse, this.sceneManager.camera);
    const selectables = this.sceneManager.getSelectableObjects();
    const hits = this.sceneManager.raycaster.intersectObjects(selectables, true);

    // Find the BIMElement that owns the clicked mesh
    let clickedObj = null;
    if (hits.length > 0) {
      let target = hits[0].object;
      // Walk up to find the root with bimId
      while (target && !target.userData?.bimId) {
        target = target.parent;
      }
      if (target && target.userData?.bimId) {
        clickedObj = this.sceneManager.objects.find(o => o.id === target.userData.bimId);
      }
    }

    // Deselect previous
    if (this.selected && this.selected !== clickedObj) {
      this.selected.setSelected(false);
    }

    if (clickedObj) {
      clickedObj.setSelected(true);
      this.selected = clickedObj;
    } else {
      this.selected = null;
      this.sceneManager.detachGizmo();
    }

    if (this.onSelect) this.onSelect(this.selected);
  }
}
