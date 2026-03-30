import { getSizes, getEngineeringData, STEEL_GRADES, SERIES_LIST } from '../entities/ProfileCatalog.js';
import * as THREE from 'three';

/**
 * PropertiesPanel v3.0 — Premium inspector panel.
 * Full engineering data, radii of gyration, section viewer, color palette.
 */
export class PropertiesPanel {
  constructor(panelElement, sectionDrawer) {
    this.panel = panelElement;
    this.sectionDrawer = sectionDrawer;
    this.currentElement = null;
    this.onPropertyChange = null;
    this.onDelete = null;
    this.onColorChange = null;
    this._render();
  }

  _render() {
    this.panel.innerHTML = `
      <div class="panel-header-bar"><i class="fa-solid fa-sliders"></i> INSPECTOR</div>
      <div class="panel-section">
        <canvas id="section-canvas" width="274" height="160" style="height:120px"></canvas>
        <div class="mini-prop-row" id="mini-props"></div>
      </div>
      <div id="props-content" class="panel-content">
        <div class="no-selection">
          <i class="fa-solid fa-arrow-pointer no-sel-icon"></i>
          <span>Seleccione un elemento</span>
          <span class="no-sel-hint">Haga clic sobre un perfil, placa o tornillo para ver sus propiedades técnicas completas.</span>
        </div>
      </div>
    `;
    if (this.sectionDrawer) {
      this.sectionDrawer.canvas = document.getElementById('section-canvas');
      if (this.sectionDrawer.canvas) {
        this.sectionDrawer.ctx = this.sectionDrawer.canvas.getContext('2d');
        this.sectionDrawer.clear();
      }
    }
  }

  update(bimElement) {
    this.currentElement = bimElement;
    if (this.sectionDrawer) this.sectionDrawer.draw(bimElement);

    const content = document.getElementById('props-content');
    const miniProps = document.getElementById('mini-props');

    if (!bimElement) {
      if (miniProps) miniProps.innerHTML = '';
      content.innerHTML = `<div class="no-selection">
        <i class="fa-solid fa-arrow-pointer no-sel-icon"></i>
        <span>Seleccione un elemento</span>
        <span class="no-sel-hint">Haga clic sobre un perfil, placa o tornillo para ver sus propiedades.</span>
      </div>`;
      return;
    }

    // Mini props strip under canvas
    if (miniProps) {
      miniProps.innerHTML = `
        <span class="mini-prop-chip"><b>${bimElement.type}</b></span>
        <span class="mini-prop-chip">${bimElement.steelGrade}</span>
        ${bimElement.mass ? `<span class="mini-prop-chip"><b>${bimElement.mass.toFixed(1)}</b> kg</span>` : ''}
        ${bimElement.area ? `<span class="mini-prop-chip"><b>${bimElement.area.toFixed(2)}</b> cm²</span>` : ''}
      `;
    }

    const grades = Object.keys(STEEL_GRADES);
    const grade = STEEL_GRADES[bimElement.steelGrade] || STEEL_GRADES['S275 JR'];
    const eng = bimElement.engineeringData;

    // Radii of gyration
    let iy = '—', iz = '—';
    if (eng?.Iy && eng?.area) {
      iy = Math.sqrt(eng.Iy / eng.area).toFixed(2);
    }
    if (eng?.Iz && eng?.area) {
      iz = Math.sqrt(eng.Iz / eng.area).toFixed(2);
    }

    let html = `<div class="prop-designation">${bimElement.designation}</div>`;
    if (bimElement.mass) {
      html += `<div class="prop-mass-badge">Peso lineal: <b>${(eng?.linearWeight || 0).toFixed(1)} kg/m</b> · Total: <b>${bimElement.mass.toFixed(1)} kg</b></div>`;
    }

    // ─── MATERIAL ─────────────────────────────────────────────
    html += this._acc('fa-layer-group', 'Material / Acero', `
      <div class="prop-row">
        <label>Calidad</label>
        <select id="prop-steel-grade" class="prop-input" style="font-size:10px;">
          ${grades.map(g => `<option value="${g}" ${bimElement.steelGrade === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="prop-row"><label>fy</label><span class="prop-value eng-val">${grade.fy} MPa</span></div>
      <div class="prop-row"><label>fu</label><span class="prop-value">${grade.fu} MPa</span></div>
      <div class="prop-row"><label>E</label><span class="prop-value">${grade.E.toLocaleString()} MPa</span></div>
      <div class="prop-row"><label>G</label><span class="prop-value">${grade.G.toLocaleString()} MPa</span></div>
      <div class="prop-row"><label>Densidad</label><span class="prop-value">${grade.density} kg/m³</span></div>
    `, true);

    // ─── GEOMETRÍA / DIMENSIONES ──────────────────────────────
    if (bimElement.type === 'profile') {
      const series = bimElement.params.series;
      const sizes = getSizes(series);
      html += this._acc('fa-bars-staggered', 'Dimensiones del Perfil', `
        <div class="prop-row">
          <label>Serie</label>
          <select id="prop-series" class="prop-input" style="font-size:10px">
            ${SERIES_LIST.map(s => `<option value="${s}" ${series === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="prop-row">
          <label>Tamaño</label>
          <select id="prop-size" class="prop-input" style="font-size:10px">
            ${sizes.map(s => `<option value="${s}" ${bimElement.params.size === String(s) ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="prop-row">
          <label>Longitud</label>
          <input type="number" id="prop-length" class="prop-input" value="${bimElement.params.length}" step="0.1" min="0.1"> m
        </div>
        <div class="prop-row">
          <label>Orientación</label>
          <select id="prop-orientation" class="prop-input" style="font-size:10px">
            <option value="column" ${bimElement.params.orientation === 'column' ? 'selected' : ''}>Columna (↑)</option>
            <option value="beam" ${bimElement.params.orientation === 'beam' ? 'selected' : ''}>Viga (→)</option>
          </select>
        </div>
        ${eng?.h ? `<div class="prop-row"><label>h</label><span class="prop-value">${eng.h} mm</span></div>` : ''}
        ${eng?.b ? `<div class="prop-row"><label>b</label><span class="prop-value">${eng.b} mm</span></div>` : ''}
        ${bimElement.tw ? `<div class="prop-row"><label>tw</label><span class="prop-value">${bimElement.tw.toFixed(1)} mm</span></div>` : ''}
        ${bimElement.tf ? `<div class="prop-row"><label>tf</label><span class="prop-value">${bimElement.tf.toFixed(1)} mm</span></div>` : ''}
        ${eng?.r ? `<div class="prop-row"><label>r (acuerdo)</label><span class="prop-value">${eng.r} mm</span></div>` : ''}
        <button class="prop-apply-btn" id="btn-apply-profile">Aplicar cambios</button>
      `, true);

    } else if (bimElement.type === 'plate') {
      html += this._acc('fa-square', 'Dimensiones de Placa', `
        <div class="prop-row"><label>Ancho X</label><input type="number" id="prop-width" class="prop-input" value="${bimElement.params.width}" step="0.01" min="0.01"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
        <div class="prop-row"><label>Alto Y</label><input type="number" id="prop-height" class="prop-input" value="${bimElement.params.height}" step="0.01" min="0.01"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
        <div class="prop-row"><label>Espesor</label><input type="number" id="prop-thickness" class="prop-input" value="${bimElement.params.thickness}" step="0.001" min="0.001"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
        <button class="prop-apply-btn" id="btn-apply-plate">Aplicar cambios</button>
      `, true);

    } else if (bimElement.type === 'fastener') {
      html += this._acc('fa-gears', 'Tornillería', `
        <div class="prop-row">
          <label>Métrica</label>
          <select id="prop-metric" class="prop-input" style="font-size:10px">
            ${['M12','M16','M20','M24','M27','M30'].map(m => `<option value="${m}" ${bimElement.params.metric === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        ${(bimElement.params.subtype === 'bolt' || bimElement.params.subtype === 'anchor') ? `
        <div class="prop-row"><label>Vástago</label><input type="number" id="prop-shank" class="prop-input" value="${bimElement.params.shankLength}" step="5" min="20"><span class="muted" style="font-size:9px;margin-left:3px">mm</span></div>` : ''}
        <button class="prop-apply-btn" id="btn-apply-fastener">Aplicar cambios</button>
      `, true);
    }

    // ─── PROPIEDADES DE SECCIÓN ───────────────────────────────
    if (bimElement.type === 'profile' && eng) {
      html += this._acc('fa-calculator', 'Propiedades de Sección', `
        <div class="prop-row"><label>A</label><span class="prop-value eng-val">${bimElement.area.toFixed(2)} cm²</span></div>
        ${eng.Iy ? `<div class="prop-row"><label>Iy</label><span class="prop-value">${eng.Iy.toLocaleString()} cm⁴</span></div>` : ''}
        ${eng.Iz ? `<div class="prop-row"><label>Iz</label><span class="prop-value">${eng.Iz.toLocaleString()} cm⁴</span></div>` : ''}
        ${eng.Wely ? `<div class="prop-row"><label>Wel,y</label><span class="prop-value">${eng.Wely.toLocaleString()} cm³</span></div>` : ''}
        ${eng.Welz ? `<div class="prop-row"><label>Wel,z</label><span class="prop-value">${eng.Welz.toLocaleString()} cm³</span></div>` : ''}
        ${iy !== '—' ? `<div class="prop-row"><label>iy</label><span class="prop-value accent">${iy} cm</span></div>` : ''}
        ${iz !== '—' ? `<div class="prop-row"><label>iz</label><span class="prop-value accent">${iz} cm</span></div>` : ''}
        <div class="prop-row"><label>Masa</label><span class="prop-value success">${bimElement.mass.toFixed(2)} kg</span></div>
        <div class="prop-row"><label>Peso lin.</label><span class="prop-value">${(eng.linearWeight || 0).toFixed(1)} kg/m</span></div>
      `, true);
    }

    // ─── POSICIÓN ─────────────────────────────────────────────
    const pos = bimElement.getPosition();
    html += this._acc('fa-location-dot', 'Posición', `
      <div class="prop-row"><label>X</label><input type="number" id="prop-px" class="prop-input" value="${pos.x.toFixed(3)}" step="0.1"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
      <div class="prop-row"><label>Y</label><input type="number" id="prop-py" class="prop-input" value="${pos.y.toFixed(3)}" step="0.1"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
      <div class="prop-row"><label>Z</label><input type="number" id="prop-pz" class="prop-input" value="${pos.z.toFixed(3)}" step="0.1"><span class="muted" style="font-size:9px;margin-left:3px">m</span></div>
      <button class="prop-apply-btn" id="btn-apply-pos">Aplicar posición</button>
    `, false);

    // ─── COLOR ────────────────────────────────────────────────
    const steelColors = [
      { hex:'#7a8494', label:'Acero laminado' },
      { hex:'#9ca8b4', label:'Galvanizado' },
      { hex:'#c8cdd2', label:'Pulido' },
      { hex:'#4a5568', label:'Pintado oscuro' },
      { hex:'#b8c0cc', label:'Inoxidable' },
      { hex:'#606874', label:'Acero gris' },
      { hex:'#2d3748', label:'Negro mate' },
      { hex:'#8B4513', label:'Corten' },
      { hex:'#a0522d', label:'Óxido' },
      { hex:'#6b7280', label:'Grafito' },
      { hex:'#1e3a5f', label:'Azul industrial' },
      { hex:'#2d5a27', label:'Verde seguridad' },
      { hex:'#7f1d1d', label:'Rojo señalización' },
      { hex:'#fbbf24', label:'Amarillo aviso' },
    ];

    html += this._acc('fa-palette', 'Material / Color', `
      <p class="prop-color-label">Acabado metálico</p>
      <div class="color-palette">
        ${steelColors.map(c => `
          <div class="color-swatch${bimElement.color === c.hex ? ' active' : ''}"
            style="background:${c.hex}" data-color="${c.hex}" title="${c.label}"></div>
        `).join('')}
      </div>
      <div class="color-picker-row">
        <input type="color" id="color-picker-custom" value="${bimElement.color}" title="Color personalizado">
        <span>Color personalizado</span>
      </div>
    `, false);

    // ─── ACCIONES ─────────────────────────────────────────────
    html += `<div style="padding:8px 10px;display:flex;gap:6px;">
      <button class="prop-apply-btn" id="btn-delete-element" style="background:rgba(242,87,87,0.15);color:var(--danger);border:1px solid rgba(242,87,87,0.2);flex:1;">
        <i class="fa-solid fa-trash-can" style="margin-right:4px;font-size:9px;"></i> Eliminar
      </button>
      <button class="prop-apply-btn" id="btn-duplicate-element" style="background:var(--bg-3);color:var(--tx-2);border:1px solid var(--border-2);flex:1;">
        <i class="fa-solid fa-clone" style="margin-right:4px;font-size:9px;"></i> Duplicar
      </button>
    </div>`;

    content.innerHTML = html;
    this._wireEvents(bimElement);
  }

  _wireEvents(bimElement) {
    // Profile apply
    document.getElementById('btn-apply-profile')?.addEventListener('click', () => {
      const series = document.getElementById('prop-series')?.value;
      const size = document.getElementById('prop-size')?.value;
      const length = parseFloat(document.getElementById('prop-length')?.value);
      const orientation = document.getElementById('prop-orientation')?.value;
      const gradeVal = document.getElementById('prop-steel-grade')?.value;
      if (series) bimElement.params.series = series;
      if (size) bimElement.params.size = size;
      if (!isNaN(length) && length > 0) bimElement.params.length = length;
      if (orientation) bimElement.params.orientation = orientation;
      if (gradeVal) bimElement.steelGrade = gradeVal;
      bimElement.update(bimElement.params);
      this.update(bimElement);
      if (this.onPropertyChange) this.onPropertyChange(bimElement);
    });

    // Update size options when series changes
    document.getElementById('prop-series')?.addEventListener('change', (e) => {
      const sizes = getSizes(e.target.value);
      const sel = document.getElementById('prop-size');
      if (sel) sel.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
    });

    // Plate apply
    document.getElementById('btn-apply-plate')?.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('prop-width')?.value);
      const h = parseFloat(document.getElementById('prop-height')?.value);
      const t = parseFloat(document.getElementById('prop-thickness')?.value);
      if (!isNaN(w) && !isNaN(h) && !isNaN(t)) {
        bimElement.update({ ...bimElement.params, width: w, height: h, thickness: t });
      }
      this.update(bimElement);
    });

    // Fastener apply
    document.getElementById('btn-apply-fastener')?.addEventListener('click', () => {
      const metric = document.getElementById('prop-metric')?.value;
      const shank = parseFloat(document.getElementById('prop-shank')?.value);
      if (metric) {
        bimElement.params.metric = metric;
        if (!isNaN(shank)) bimElement.params.shankLength = shank;
        bimElement.update(bimElement.params);
        this.update(bimElement);
      }
    });

    // Position apply
    document.getElementById('btn-apply-pos')?.addEventListener('click', () => {
      const x = parseFloat(document.getElementById('prop-px')?.value);
      const y = parseFloat(document.getElementById('prop-py')?.value);
      const z = parseFloat(document.getElementById('prop-pz')?.value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        bimElement.setPosition(x, y, z);
      }
    });

    // Steel grade (immediate visual update label only)
    document.getElementById('prop-steel-grade')?.addEventListener('change', (e) => {
      bimElement.steelGrade = e.target.value;
      this.update(bimElement);
    });

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const color = sw.dataset.color;
        bimElement.setColor(color);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        if (this.onColorChange) this.onColorChange(bimElement, color);
      });
    });

    // Custom color picker
    document.getElementById('color-picker-custom')?.addEventListener('input', (e) => {
      bimElement.setColor(e.target.value);
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      if (this.onColorChange) this.onColorChange(bimElement, e.target.value);
    });

    // Delete
    document.getElementById('btn-delete-element')?.addEventListener('click', () => {
      if (this.onDelete) this.onDelete(bimElement);
    });

    // Duplicate
    document.getElementById('btn-duplicate-element')?.addEventListener('click', () => {
      if (this.onDuplicate) this.onDuplicate(bimElement);
    });
  }

  updateCoords(bimElement) {
    if (!bimElement) return;
    const pos = bimElement.getPosition();
    ['px','py','pz'].forEach((id, i) => {
      const el = document.getElementById(`prop-${id}`);
      if (el) el.value = [pos.x, pos.y, pos.z][i].toFixed(3);
    });
  }

  _acc(icon, label, bodyHtml, open = false) {
    const id = 'acc_' + Math.random().toString(36).slice(2, 7);
    return `<div class="prop-accordion">
      <div class="prop-acc-header${open ? ' open' : ''}" data-acc="${id}">
        <i class="fa-solid ${icon} acc-icon"></i>
        ${label}
        <i class="fa-solid fa-chevron-down acc-toggle"></i>
      </div>
      <div class="prop-acc-body${open ? ' open' : ''}" id="${id}">
        <div class="prop-rows">${bodyHtml}</div>
      </div>
    </div>`;
  }
}

// Wire accordion toggle globally (delegated)
document.addEventListener('click', (e) => {
  const header = e.target.closest('.prop-acc-header');
  if (!header) return;
  const id = header.dataset.acc;
  const body = document.getElementById(id);
  if (!body) return;
  header.classList.toggle('open');
  body.classList.toggle('open');
});
