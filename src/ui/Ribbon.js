/**
 * Ribbon v3.0 — Professional tabbed toolbar.
 * Tabs: Estructura, Conexiones, Tornillería, Edición, Visualización, Análisis
 */
export class Ribbon {
  constructor(ribbonElement) {
    this.ribbon = ribbonElement;
    this.callbacks = {};
    this._render();
  }

  on(action, callback) { this.callbacks[action] = callback; }
  _emit(action) { if (this.callbacks[action]) this.callbacks[action](); }

  _render() {
    this.ribbon.innerHTML = `
      <div class="ribbon-tabs">
        <button class="ribbon-tab active" data-tab="estructura"><i class="fa-solid fa-building"></i> Estructura</button>
        <button class="ribbon-tab" data-tab="conexiones"><i class="fa-solid fa-link"></i> Conexiones</button>
        <button class="ribbon-tab" data-tab="tornilleria"><i class="fa-solid fa-gears"></i> Tornillería</button>
        <button class="ribbon-tab" data-tab="edicion"><i class="fa-solid fa-pen-ruler"></i> Edición</button>
        <button class="ribbon-tab" data-tab="visualizacion"><i class="fa-solid fa-eye"></i> Visualización</button>
      </div>
      <div class="ribbon-content">

        <!-- ESTRUCTURA -->
        <div class="ribbon-panel" data-panel="estructura">
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('add-heb-col', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="10" y="2" width="4" height="20" fill="currentColor" rx="1"/><rect x="6" y="2" width="12" height="3" fill="currentColor" rx="1"/><rect x="6" y="19" width="12" height="3" fill="currentColor" rx="1"/></svg>`, 'Col. HEB', 'Columna HEB 200')}
              ${this._rbtn('add-hea-col', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="10" y="3" width="4" height="18" fill="currentColor" rx="1" opacity="0.8"/><rect x="7" y="3" width="10" height="2.5" fill="currentColor" rx="1"/><rect x="7" y="18.5" width="10" height="2.5" fill="currentColor" rx="1"/></svg>`, 'Col. HEA', 'Columna HEA 200')}
              ${this._rbtn('add-ipe', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="10" width="20" height="4" fill="currentColor" rx="1"/><rect x="2" y="7" width="3" height="10" fill="currentColor" rx="1"/><rect x="19" y="7" width="3" height="10" fill="currentColor" rx="1"/></svg>`, 'Viga IPE', 'Viga IPE 200')}
              ${this._rbtn('add-ipn', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="10.5" width="20" height="3" fill="currentColor" rx="1"/><rect x="2" y="7.5" width="3" height="9" fill="currentColor" rx="1" opacity="0.75"/><rect x="19" y="7.5" width="3" height="9" fill="currentColor" rx="1" opacity="0.75"/></svg>`, 'Viga IPN', 'Viga IPN 200')}
              ${this._rbtn('add-heb-beam', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="10" width="20" height="4" fill="currentColor" rx="1"/><rect x="2" y="6" width="3" height="12" fill="currentColor" rx="1"/><rect x="19" y="6" width="3" height="12" fill="currentColor" rx="1"/></svg>`, 'Viga HEB', 'Viga HEB horizontal')}
            </div>
            <div class="ribbon-group-title">Perfiles I/H</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('add-upn', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="4" width="3" height="16" fill="currentColor" rx="1"/><rect x="5" y="4" width="14" height="3" fill="currentColor" rx="1"/><rect x="5" y="17" width="14" height="3" fill="currentColor" rx="1"/></svg>`, 'Canal UPN', 'Canal UPN 200')}
              ${this._rbtn('add-chs', `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/></svg>`, 'Tubo CHS', 'Tubo circular CHS')}
              ${this._rbtn('add-shs', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" rx="1"/></svg>`, 'Tubo SHS', 'Tubo cuadrado SHS')}
              ${this._rbtn('add-angle', `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 4 L5 20 L20 20 L20 17 L8 17 L8 4 Z" fill="currentColor"/></svg>`, 'Angular L', 'Angular L 80×8')}
            </div>
            <div class="ribbon-group-title">Otros Perfiles</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('duplicate', '<i class="fa-solid fa-clone"></i>', 'Duplicar', 'Duplicar selección (Ctrl+D)')}
              ${this._rbtn('array-linear', '<i class="fa-solid fa-ellipsis"></i>', 'Array Lin.', 'Duplicar en línea')}
            </div>
            <div class="ribbon-group-title">Composición</div>
          </div>
        </div>

        <!-- CONEXIONES -->
        <div class="ribbon-panel hidden" data-panel="conexiones">
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('add-plate', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="8" width="18" height="8" fill="currentColor" rx="1"/></svg>`, 'Placa Base', 'Placa base 300×300×20mm')}
              ${this._rbtn('add-gusset-sq', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="5" width="14" height="14" fill="currentColor" rx="1"/></svg>`, 'Cartela □', 'Cartela cuadrada')}
              ${this._rbtn('add-gusset-tri', `<svg viewBox="0 0 24 24" width="18" height="18"><polygon points="4,20 20,20 4,4" fill="currentColor"/></svg>`, 'Cartela △', 'Cartela triangular')}
            </div>
            <div class="ribbon-group-title">Placas</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn weld-btn" data-action="tool-weld" title="Cordón de soldadura (W)">
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 18 L8 6 L12 18 L16 6 L20 18" fill="none" stroke="var(--weld)" stroke-width="2.5" stroke-linecap="round"/></svg>
                <span>Soldadura</span>
              </button>
            </div>
            <div class="ribbon-group-title">Soldadura</div>
          </div>
        </div>

        <!-- TORNILLERÍA -->
        <div class="ribbon-panel hidden" data-panel="tornilleria">
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('add-bolt', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="10" y="2" width="4" height="16" fill="currentColor" rx="1"/><polygon points="7,2 17,2 15,6 9,6" fill="currentColor"/></svg>`, 'Tornillo', 'Tornillo M16 DIN 931')}
              ${this._rbtn('add-nut', `<svg viewBox="0 0 24 24" width="18" height="18"><polygon points="12,3 20,7 20,17 12,21 4,17 4,7" fill="none" stroke="currentColor" stroke-width="2"/></svg>`, 'Tuerca', 'Tuerca hexagonal M16')}
              ${this._rbtn('add-washer', `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>`, 'Arandela', 'Arandela M16')}
              ${this._rbtn('add-anchor', `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="10" y="2" width="4" height="14" fill="currentColor" rx="1"/><path d="M12 16 Q6 16 6 20 Q6 22 10 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`, 'Anclaje', 'Perno de anclaje M20')}
              ${this._rbtn('add-bolt-set', '<i class="fa-solid fa-layer-group"></i>', 'Conj. M16', 'Conjunto tornillo+tuerca+arandela M16')}
            </div>
            <div class="ribbon-group-title">Elementos de Fijación</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              <div class="ribbon-inline">
                <label class="ribbon-label">Métrica</label>
                <select id="global-metric-select" class="ribbon-select">
                  ${['M12','M16','M20','M24','M27','M30'].map(m=>`<option value="${m}" ${m==='M16'?'selected':''}>${m}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="ribbon-group-title">Configuración</div>
          </div>
        </div>

        <!-- EDICIÓN -->
        <div class="ribbon-panel hidden" data-panel="edicion">
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('tool-select', '<i class="fa-solid fa-arrow-pointer"></i>', 'Selec.', 'Seleccionar (V)')}
            </div>
            <div class="ribbon-group-title">Selección</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('tool-move', '<i class="fa-solid fa-up-down-left-right"></i>', 'Mover', 'Mover (G)')}
              ${this._rbtn('tool-rotate', '<i class="fa-solid fa-rotate"></i>', 'Rotar', 'Rotar (R)')}
              ${this._rbtn('tool-scale', '<i class="fa-solid fa-expand"></i>', 'Escalar', 'Escalar (S)')}
            </div>
            <div class="ribbon-group-title">Transformar</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('tool-measure', '<i class="fa-solid fa-ruler-combined"></i>', 'Medir', 'Medir distancia (M)')}
            </div>
            <div class="ribbon-group-title">Medición</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('duplicate', '<i class="fa-solid fa-clone"></i>', 'Duplicar', 'Duplicar (Ctrl+D)')}
              ${this._rbtn('delete-selected', '<i class="fa-solid fa-trash-can" style="color:var(--danger)"></i>', 'Eliminar', 'Eliminar (Del)', 'danger-btn')}
            </div>
            <div class="ribbon-group-title">Acciones</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              <div class="ribbon-inline">
                <label class="ribbon-label">Espacio</label>
                <select id="coord-space-select" class="ribbon-select">
                  <option value="world">Global</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>
            <div class="ribbon-group-title">Coordenadas</div>
          </div>
        </div>

        <!-- VISUALIZACIÓN -->
        <div class="ribbon-panel hidden" data-panel="visualizacion">
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('view-iso',   '<i class="fa-solid fa-cube"></i>',        'ISO 3D',    'Vista isométrica 3D (1)')}
              ${this._rbtn('view-top',   '<i class="fa-solid fa-border-all"></i>',  'Planta',    'Vista de planta (7)')}
              ${this._rbtn('view-front', '<i class="fa-solid fa-square"></i>',      'Frontal',   'Vista frontal (3)')}
              ${this._rbtn('view-left',  '<i class="fa-solid fa-caret-left"></i>',  'Izquierda', 'Vista izquierda (5)')}
              ${this._rbtn('view-right', '<i class="fa-solid fa-caret-right"></i>', 'Derecha',   'Vista derecha')}
            </div>
            <div class="ribbon-group-title">Cámara</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              ${this._rbtn('mode-clay', '<i class="fa-solid fa-circle" style="color:#aabac8"></i>',  'Clay',    'Modo Clay técnico')}
              ${this._rbtn('mode-pbr',  '<i class="fa-solid fa-circle" style="color:#6b93ff"></i>',  'PBR',     'Modo PBR realista')}
              ${this._rbtn('mode-wire', '<i class="fa-regular fa-circle" style="color:#4a7acc"></i>','Wire',    'Modo alámbrico')}
              ${this._rbtn('mode-xray', '<i class="fa-solid fa-circle" style="color:#a855f7;opacity:0.5"></i>', 'X-Ray', 'Modo transparente')}
            </div>
            <div class="ribbon-group-title">Modo Visual</div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-buttons">
              <div class="ribbon-inline">
                <label class="ribbon-label">Grid</label>
                <select id="grid-size-select" class="ribbon-select">
                  <option value="8">8×8</option>
                  <option value="16" selected>16×16</option>
                  <option value="24">24×24</option>
                  <option value="32">32×32</option>
                </select>
              </div>
              <button class="ribbon-btn active" id="btn-snap" data-action="toggle-snap" title="Snap (activar/desactivar)">
                <i class="fa-solid fa-magnet"></i><span>Snap</span>
              </button>
            </div>
            <div class="ribbon-group-title">Grid / Snap</div>
          </div>
        </div>

      </div>
    `;

    // Tab switching
    this.ribbon.querySelectorAll('.ribbon-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.ribbon.querySelectorAll('.ribbon-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.ribbon.querySelectorAll('.ribbon-panel').forEach(p => p.classList.add('hidden'));
        const panel = this.ribbon.querySelector(`[data-panel="${tab.dataset.tab}"]`);
        if (panel) panel.classList.remove('hidden');
      });
    });

    // Button clicks
    this.ribbon.querySelectorAll('.ribbon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action) this._emit(action);
      });
    });

    // Grid size
    const gs = document.getElementById('grid-size-select');
    if (gs) gs.addEventListener('change', () => this._emit('grid-size-' + gs.value));

    // Coord space
    const cs = document.getElementById('coord-space-select');
    if (cs) cs.addEventListener('change', () => this._emit('coord-space-' + cs.value));
  }

  _rbtn(action, iconHtml, label, title = '', extra = '') {
    return `<button class="ribbon-btn ${extra}" data-action="${action}" title="${title || label}">
      ${iconHtml}<span>${label}</span>
    </button>`;
  }

  setActiveButton(action) {
    // Clear edit panel only
    const editPanel = this.ribbon.querySelector('[data-panel="edicion"]');
    if (editPanel) {
      editPanel.querySelectorAll('.ribbon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.action === action);
      });
    }
    // Also highlight sidebar
    document.querySelectorAll('.sb-tool').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === action);
    });
  }

  setActiveModeButton(mode) {
    const vizPanel = this.ribbon.querySelector('[data-panel="visualizacion"]');
    if (!vizPanel) return;
    vizPanel.querySelectorAll('.ribbon-btn[data-action^="mode-"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === 'mode-' + mode);
    });
  }
}
