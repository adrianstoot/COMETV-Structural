/**
 * Header — Branding, project name, user display, theme toggle, save.
 */
export class Header {
  constructor(headerElement) {
    this.header = headerElement;
    this.onThemeToggle = null;
    this.onSave = null;
    this.userName = 'Ingeniero';
    this._render();
  }

  setUser(name) {
    this.userName = name;
    const nameEl = document.getElementById('header-user-name');
    const iconEl = document.getElementById('header-user-icon');
    if (nameEl) nameEl.textContent = name;
    if (iconEl) iconEl.textContent = name.charAt(0).toUpperCase();
  }

  _render() {
    this.header.innerHTML = `
      <div class="header-brand">
        <div class="brand-icon">C</div>
        <div>
          <span class="brand-name">COMETV</span>
          <span class="brand-edition">STRUCTURAL</span>
        </div>
      </div>
      <div class="header-project">
        <input type="text" class="project-name" value="Proyecto Sin Título" spellcheck="false" id="project-name-input">
      </div>
      <div class="header-user">
        <div class="header-user-icon" id="header-user-icon">I</div>
        <span class="header-user-name" id="header-user-name">${this.userName}</span>
      </div>
      <div class="header-actions">
        <button class="header-btn" id="btn-theme" title="Cambiar tema"><i class="fa-solid fa-circle-half-stroke"></i></button>
        <button class="header-btn" id="btn-save" title="Guardar"><i class="fa-solid fa-floppy-disk"></i></button>
        <button class="header-btn" id="btn-export" title="Exportar JSON"><i class="fa-solid fa-file-export"></i></button>
      </div>
    `;
    document.getElementById('btn-theme').addEventListener('click', () => { if (this.onThemeToggle) this.onThemeToggle(); });
    document.getElementById('btn-save').addEventListener('click', () => { if (this.onSave) this.onSave(); });
    document.getElementById('btn-export').addEventListener('click', () => { if (this.onSave) this.onSave(); });
  }
}
