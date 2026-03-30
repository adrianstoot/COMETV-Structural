/**
 * Header — Premium top bar with project name, actions, user info.
 */
export class Header {
  constructor(el) {
    this.el = el;
    this.userName = '';
    this.onThemeToggle = null;
    this.onSave = null;
    this.onExport = null;
    this.onLoad = null;
    this._dark = true;
    this._render();
  }

  _render() {
    this.el.innerHTML = `
      <div class="header-brand">
        <div class="header-logo">CS</div>
        <div>
          <div class="header-title">COMETV</div>
          <div class="header-subtitle">STRUCTURAL</div>
        </div>
      </div>

      <div class="header-project-area">
        <span class="header-project-label">PROYECTO</span>
        <input type="text" id="project-name-input" value="Sin título" placeholder="Nombre del proyecto…" spellcheck="false">
      </div>

      <div class="header-actions">
        <button class="header-btn" id="btn-new" title="Nuevo proyecto">
          <i class="fa-solid fa-file-circle-plus"></i> Nuevo
        </button>
        <button class="header-btn" id="btn-load" title="Cargar proyecto">
          <i class="fa-solid fa-folder-open"></i> Abrir
        </button>
        <button class="header-btn primary" id="btn-save" title="Guardar (Ctrl+S)">
          <i class="fa-solid fa-floppy-disk"></i> Guardar
        </button>
        <button class="header-btn" id="btn-export" title="Exportar OBJ / JSON">
          <i class="fa-solid fa-arrow-up-from-bracket"></i> Exportar
        </button>

        <div style="width:1px;height:18px;background:var(--border-1);margin:0 3px"></div>

        <button class="header-btn" id="btn-cmd" title="Paleta de comandos (Ctrl+K)">
          <i class="fa-solid fa-terminal"></i>
        </button>
        <button class="header-btn" id="btn-theme" title="Alternar tema">
          <i class="fa-solid fa-circle-half-stroke"></i>
        </button>

        <div style="width:1px;height:18px;background:var(--border-1);margin:0 3px"></div>

        <div class="header-user-badge" id="user-badge">
          <div class="header-user-dot"></div>
          <span id="header-user-name">—</span>
        </div>
      </div>
    `;

    this.el.querySelector('#btn-theme').addEventListener('click', () => {
      this._dark = !this._dark;
      if (this.onThemeToggle) this.onThemeToggle(this._dark);
    });
    this.el.querySelector('#btn-save').addEventListener('click', () => {
      if (this.onSave) this.onSave();
    });
    this.el.querySelector('#btn-export').addEventListener('click', () => {
      if (this.onExport) this.onExport();
    });
    this.el.querySelector('#btn-load').addEventListener('click', () => {
      if (this.onLoad) this.onLoad();
    });
    this.el.querySelector('#btn-new').addEventListener('click', () => {
      if (this.onNew) this.onNew();
    });
    this.el.querySelector('#btn-cmd').addEventListener('click', () => {
      document.getElementById('command-palette-overlay')?.classList.remove('hidden');
      document.getElementById('cp-input')?.focus();
    });
  }

  setUser(name) {
    this.userName = name;
    const el = document.getElementById('header-user-name');
    if (el) el.textContent = name || '—';
  }
}
