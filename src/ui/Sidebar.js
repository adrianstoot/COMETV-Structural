/**
 * Sidebar — Left icon strip with tool/view shortcuts.
 */
export class Sidebar {
  constructor(el) {
    this.el = el;
    this.callbacks = {};
    this._activeTool = 'select';
    this._render();
  }

  on(action, cb) { this.callbacks[action] = cb; }
  _emit(a) { if (this.callbacks[a]) this.callbacks[a](); }

  setActiveTool(tool) {
    this._activeTool = tool;
    this.el.querySelectorAll('.sb-tool[data-action]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === tool);
    });
  }

  _render() {
    this.el.innerHTML = `
      ${this._tool('select', 'fa-arrow-pointer', 'Seleccionar', 'V')}
      ${this._tool('move', 'fa-up-down-left-right', 'Mover', 'G')}
      ${this._tool('rotate', 'fa-rotate', 'Rotar', 'R')}
      ${this._tool('scale', 'fa-expand', 'Escalar', 'S')}
      <div class="sb-divider"></div>
      ${this._tool('measure', 'fa-ruler-combined', 'Medir', 'M')}
      ${this._tool('weld', 'fa-bolt', 'Soldadura', 'W')}
      <div class="sb-divider"></div>
      ${this._tool('view-iso', 'fa-cube', 'Vista ISO', '1')}
      ${this._tool('view-top', 'fa-border-all', 'Planta', '7')}
      ${this._tool('view-front', 'fa-square', 'Frontal', '3')}
    `;

    this.el.querySelectorAll('.sb-tool[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        this._emit(a);
      });
    });
  }

  _tool(action, icon, label, key) {
    return `<button class="sb-tool" data-action="${action}" title="${label}">
      <i class="fa-solid ${icon}"></i>
      <span class="sb-tooltip">${label} <span class="shortcut-hint">${key}</span></span>
    </button>`;
  }
}
