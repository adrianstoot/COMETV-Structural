/**
 * GizmoManager — Controls TransformControls gizmo mode.
 * Syncs spatial changes back to BIM element properties.
 */
export class GizmoManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
  }

  setMode(mode) {
    this.sceneManager.setGizmoMode(mode);
  }
}
