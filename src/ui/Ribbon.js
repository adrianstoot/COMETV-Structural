/**
 * Ribbon — Tabbed toolbar with sub-tools.
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
            <div class="ribbon-group-title">Perfiles I / H</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-heb-col" title="Columna HEB">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="10" y="2" width="4" height="20" fill="currentColor" rx="1"/><rect x="6" y="2" width="12" height="3" fill="currentColor" rx="1"/><rect x="6" y="19" width="12" height="3" fill="currentColor" rx="1"/></svg>
                <span>Col. HEB</span>
              </button>
              <button class="ribbon-btn" data-action="add-hea-col" title="Columna HEA">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="10" y="3" width="4" height="18" fill="currentColor" rx="1" opacity="0.7"/><rect x="7" y="3" width="10" height="2.5" fill="currentColor" rx="1"/><rect x="7" y="18.5" width="10" height="2.5" fill="currentColor" rx="1"/></svg>
                <span>Col. HEA</span>
              </button>
              <button class="ribbon-btn" data-action="add-ipe" title="Viga IPE">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="10" width="20" height="4" fill="currentColor" rx="1"/><rect x="2" y="7" width="3" height="10" fill="currentColor" rx="1"/><rect x="19" y="7" width="3" height="10" fill="currentColor" rx="1"/></svg>
                <span>Viga IPE</span>
              </button>
              <button class="ribbon-btn" data-action="add-ipn" title="Viga IPN">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="10.5" width="20" height="3" fill="currentColor" rx="1"/><rect x="2" y="7.5" width="3" height="9" fill="currentColor" rx="1" opacity="0.7"/><rect x="19" y="7.5" width="3" height="9" fill="currentColor" rx="1" opacity="0.7"/></svg>
                <span>Viga IPN</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Otros perfiles</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-upn" title="Canal UPN">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="3" height="16" fill="currentColor" rx="1"/><rect x="5" y="4" width="14" height="3" fill="currentColor" rx="1"/><rect x="5" y="17" width="14" height="3" fill="currentColor" rx="1"/></svg>
                <span>UPN</span>
              </button>
              <button class="ribbon-btn" data-action="add-chs" title="Tubo CHS">
                <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/></svg>
                <span>CHS</span>
              </button>
              <button class="ribbon-btn" data-action="add-shs" title="Tubo SHS">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" rx="1"/></svg>
                <span>SHS</span>
              </button>
              <button class="ribbon-btn" data-action="add-angle" title="Angular L">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 4 L5 20 L20 20 L20 17 L8 17 L8 4 Z" fill="currentColor"/></svg>
                <span>L</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Composición</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-heb-beam" title="Viga HEB horizontal">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="10" width="20" height="4" fill="currentColor" rx="1"/><rect x="2" y="6" width="3" height="12" fill="currentColor" rx="1"/><rect x="19" y="6" width="3" height="12" fill="currentColor" rx="1"/></svg>
                <span>Viga HEB</span>
              </button>
              <button class="ribbon-btn" data-action="duplicate" title="Duplicar elemento seleccionado">
                <i class="fa-solid fa-clone"></i>
                <span>Duplicar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CONEXIONES -->
        <div class="ribbon-panel hidden" data-panel="conexiones">
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Placas y Cartelas</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-plate" title="Placa Base">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="8" width="18" height="8" fill="currentColor" rx="1"/></svg>
                <span>Placa Base</span>
              </button>
              <button class="ribbon-btn" data-action="add-gusset-sq" title="Cartela Cuadrada">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="5" width="14" height="14" fill="currentColor" rx="1"/></svg>
                <span>Cartela □</span>
              </button>
              <button class="ribbon-btn" data-action="add-gusset-tri" title="Cartela Triangular">
                <svg viewBox="0 0 24 24" width="20" height="20"><polygon points="4,20 20,20 4,4" fill="currentColor"/></svg>
                <span>Cartela △</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Soldadura</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn weld-btn" data-action="tool-weld" title="Cordón de Soldadura — 2 puntos">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 18 L8 6 L12 18 L16 6 L20 18" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>
                <span>Soldadura</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TORNILLERÍA -->
        <div class="ribbon-panel hidden" data-panel="tornilleria">
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Fijación</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-bolt" title="Tornillo DIN 931">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="10" y="2" width="4" height="16" fill="currentColor" rx="1"/><polygon points="7,2 17,2 15,6 9,6" fill="currentColor"/></svg>
                <span>Tornillo</span>
              </button>
              <button class="ribbon-btn" data-action="add-nut" title="Tuerca hexagonal">
                <svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,3 20,7 20,17 12,21 4,17 4,7" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                <span>Tuerca</span>
              </button>
              <button class="ribbon-btn" data-action="add-washer" title="Arandela">
                <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                <span>Arandela</span>
              </button>
              <button class="ribbon-btn" data-action="add-anchor" title="Anclaje J-Bolt">
                <svg viewBox="0 0 24 24" width="20" height="20"><rect x="10" y="2" width="4" height="14" fill="currentColor" rx="1"/><path d="M12 16 Q6 16 6 20 Q6 22 10 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                <span>Anclaje</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Conjuntos</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="add-bolt-set" title="Conjunto Tornillo+Tuerca+Arandela">
                <i class="fa-solid fa-layer-group"></i>
                <span>Conj. Completo</span>
              </button>
            </div>
          </div>
        </div>

        <!-- EDICIÓN -->
        <div class="ribbon-panel hidden" data-panel="edicion">
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Selección</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn active" data-action="tool-select" title="Seleccionar (V)">
                <i class="fa-solid fa-arrow-pointer"></i><span>Seleccionar</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Transformar</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="tool-move" title="Mover (G)">
                <i class="fa-solid fa-up-down-left-right"></i><span>Mover</span>
              </button>
              <button class="ribbon-btn" data-action="tool-rotate" title="Rotar (R)">
                <i class="fa-solid fa-rotate"></i><span>Rotar</span>
              </button>
              <button class="ribbon-btn" data-action="tool-scale" title="Escalar (S)">
                <i class="fa-solid fa-expand"></i><span>Escalar</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Medición</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="tool-measure" title="Medir distancia (M)">
                <i class="fa-solid fa-ruler-combined"></i><span>Medir</span>
              </button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Acciones</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="duplicate" title="Duplicar (Ctrl+D)">
                <i class="fa-solid fa-clone"></i><span>Duplicar</span>
              </button>
              <button class="ribbon-btn" data-action="delete-selected" title="Eliminar (Del)">
                <i class="fa-solid fa-trash-can" style="color:var(--danger)"></i><span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- VISUALIZACIÓN -->
        <div class="ribbon-panel hidden" data-panel="visualizacion">
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Cámara</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="view-iso" title="Isométrica 3D (1)"><i class="fa-solid fa-cube"></i><span>ISO 3D</span></button>
              <button class="ribbon-btn" data-action="view-top" title="Planta (7)"><i class="fa-solid fa-border-all"></i><span>Planta</span></button>
              <button class="ribbon-btn" data-action="view-front" title="Frontal (3)"><i class="fa-solid fa-square"></i><span>Frontal</span></button>
              <button class="ribbon-btn" data-action="view-left" title="Izquierda (5)"><i class="fa-solid fa-caret-left"></i><span>Izquierda</span></button>
              <button class="ribbon-btn" data-action="view-right" title="Derecha"><i class="fa-solid fa-caret-right"></i><span>Derecha</span></button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Gizmo</div>
            <div class="ribbon-group-buttons">
              <button class="ribbon-btn" data-action="gizmo-translate" title="Gizmo Traslación"><i class="fa-solid fa-arrows-up-down-left-right" style="color:#22c55e"></i><span>Trasladar</span></button>
              <button class="ribbon-btn" data-action="gizmo-rotate" title="Gizmo Rotación"><i class="fa-solid fa-rotate" style="color:#3b82f6"></i><span>Rotar</span></button>
              <button class="ribbon-btn" data-action="gizmo-scale" title="Gizmo Escala"><i class="fa-solid fa-expand" style="color:#f59e0b"></i><span>Escalar</span></button>
            </div>
          </div>
          <div class="ribbon-vsep"></div>
          <div class="ribbon-group-box">
            <div class="ribbon-group-title">Grid / Snap</div>
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
              <button class="ribbon-btn active" data-action="toggle-snap" title="Snap" id="btn-snap">
                <i class="fa-solid fa-magnet"></i><span>Snap</span>
              </button>
            </div>
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
  }

  setActiveButton(action) {
    // Only toggle within the Edición panel
    const editPanel = this.ribbon.querySelector('[data-panel="edicion"]');
    if (editPanel) {
      editPanel.querySelectorAll('.ribbon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.action === action);
      });
    }
  }
}
