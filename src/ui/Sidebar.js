/**
 * Sidebar — Quick-access toolbar (left side).
 */
export class Sidebar {
  constructor(sidebarElement) {
    this.sidebar = sidebarElement;
    this.callbacks = {};
    this._render();
  }

  on(action, callback) {
    this.callbacks[action] = callback;
  }

  _render() {
    const buttons = [
      { icon: 'fa-file',           action: 'new',       title: 'Nuevo Proyecto' },
      { icon: 'fa-folder-open',    action: 'open',      title: 'Abrir Proyecto' },
      { icon: 'fa-floppy-disk',    action: 'save',      title: 'Guardar' },
      { divider: true },
      { icon: 'fa-arrow-pointer',  action: 'select',    title: 'Seleccionar' },
      { icon: 'fa-ruler-combined', action: 'measure',   title: 'Medir' },
      { divider: true },
      { icon: 'fa-cube',           action: 'view-3d',   title: 'Vista ISO' },
      { icon: 'fa-border-all',     action: 'view-top',  title: 'Vista Planta' },
      { divider: true },
      { icon: 'fa-info-circle',    action: 'info',      title: 'Información' },
      { icon: 'fa-gear',           action: 'settings',  title: 'Ajustes' },
    ];

    let html = '';
    buttons.forEach(b => {
      if (b.divider) {
        html += '<div class="sidebar-divider"></div>';
      } else {
        html += `<button class="sidebar-btn" data-action="${b.action}" title="${b.title}"><i class="fa-solid ${b.icon}"></i></button>`;
      }
    });
    this.sidebar.innerHTML = html;

    this.sidebar.querySelectorAll('.sidebar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (this.callbacks[action]) this.callbacks[action]();
      });
    });
  }
}
