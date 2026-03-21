import { getSizes, getEngineeringData, STEEL_GRADES, SERIES_LIST } from '../entities/ProfileCatalog.js';
import * as THREE from 'three';

/**
 * PropertiesPanel — Inspector with full color picker, engineering data, sub-tools.
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
      <div class="panel-section"><canvas id="section-canvas" width="210" height="160"></canvas></div>
      <div id="props-content" class="panel-content">
        <div class="no-selection">
          <i class="fa-solid fa-arrow-pointer" style="font-size:20px;opacity:0.3;margin-bottom:6px;display:block"></i>
          Seleccione un elemento
        </div>
      </div>
    `;
    this.sectionDrawer.canvas = document.getElementById('section-canvas');
    this.sectionDrawer.ctx = this.sectionDrawer.canvas.getContext('2d');
    this.sectionDrawer.clear();
  }

  update(bimElement) {
    this.currentElement = bimElement;
    this.sectionDrawer.draw(bimElement);
    const content = document.getElementById('props-content');
    if (!bimElement) {
      content.innerHTML = `<div class="no-selection"><i class="fa-solid fa-arrow-pointer" style="font-size:20px;opacity:0.3;margin-bottom:6px;display:block"></i>Seleccione un elemento</div>`;
      return;
    }

    let html = `<div class="prop-designation">${bimElement.designation}</div>`;

    // ─── MATERIAL ─────
    const grades = Object.keys(STEEL_GRADES);
    const grade = STEEL_GRADES[bimElement.steelGrade] || STEEL_GRADES['S275 JR'];
    html += this._acc('fa-layer-group', 'Material y Acero', `
      <div class="prop-row"><label>Calidad</label>
        <select id="prop-steel-grade" class="prop-input">${grades.map(g => `<option value="${g}" ${bimElement.steelGrade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
      </div>
      <div class="prop-row"><label>fy (MPa)</label><span class="prop-value">${grade.fy}</span></div>
      <div class="prop-row"><label>fu (MPa)</label><span class="prop-value">${grade.fu}</span></div>
      <div class="prop-row"><label>E (MPa)</label><span class="prop-value">${grade.E.toLocaleString()}</span></div>
      <div class="prop-row"><label>Densidad</label><span class="prop-value">${grade.density} kg/m³</span></div>
    `, true);

    // ─── ENGINEERING DATA ─────
    let engH = `
      <div class="prop-row"><label>Área</label><span class="prop-value eng-val">${bimElement.area.toFixed(2)} cm²</span></div>
      <div class="prop-row"><label>Masa</label><span class="prop-value eng-val">${bimElement.mass.toFixed(2)} kg</span></div>
      <div class="prop-row"><label>tw</label><span class="prop-value">${bimElement.tw.toFixed(1)} mm</span></div>
      <div class="prop-row"><label>tf</label><span class="prop-value">${bimElement.tf.toFixed(1)} mm</span></div>
    `;
    if (bimElement.engineeringData) {
      const eng = bimElement.engineeringData;
      if (eng.h) engH += `<div class="prop-row"><label>h</label><span class="prop-value">${eng.h} mm</span></div>`;
      if (eng.b) engH += `<div class="prop-row"><label>b</label><span class="prop-value">${eng.b} mm</span></div>`;
      if (eng.Iy) engH += `<div class="prop-row"><label>Iy</label><span class="prop-value">${eng.Iy.toLocaleString()} cm⁴</span></div>`;
      if (eng.Iz) engH += `<div class="prop-row"><label>Iz</label><span class="prop-value">${eng.Iz.toLocaleString()} cm⁴</span></div>`;
      if (eng.Wely) engH += `<div class="prop-row"><label>Wel,y</label><span class="prop-value">${eng.Wely.toLocaleString()} cm³</span></div>`;
      if (eng.Welz) engH += `<div class="prop-row"><label>Wel,z</label><span class="prop-value">${eng.Welz.toLocaleString()} cm³</span></div>`;
      if (eng.linearWeight) engH += `<div class="prop-row"><label>Peso lin.</label><span class="prop-value">${eng.linearWeight.toFixed(1)} kg/m</span></div>`;
    }
    html += this._acc('fa-calculator', 'Datos de Ingeniería', engH, true);

    // ─── TYPE-SPECIFIC ─────
    if (bimElement.type === 'profile') {
      const series = bimElement.params.series;
      const sizes = getSizes(series);
      html += this._acc('fa-bars-staggered', 'Dimensiones', `
        <div class="prop-row"><label>Serie</label>
          <select id="prop-series" class="prop-input">${SERIES_LIST.map(s => `<option value="${s}" ${series === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
        <div class="prop-row"><label>Tamaño</label>
          <select id="prop-size" class="prop-input">${sizes.map(s => `<option value="${s}" ${bimElement.params.size === String(s) ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
        <div class="prop-row"><label>Longitud (m)</label>
          <input type="number" id="prop-length" class="prop-input" value="${bimElement.params.length}" step="0.1" min="0.1">
        </div>
        <div class="prop-row"><label>Orientación</label>
          <select id="prop-orientation" class="prop-input">
            <option value="column" ${bimElement.params.orientation === 'column' ? 'selected' : ''}>Columna (Vertical)</option>
            <option value="beam" ${bimElement.params.orientation === 'beam' ? 'selected' : ''}>Viga (Horizontal)</option>
          </select>
        </div>
      `, true);
    } else if (bimElement.type === 'plate') {
      html += this._acc('fa-square', 'Dimensiones de Placa', `
        <div class="prop-row"><label>Ancho X</label><input type="number" id="prop-width" class="prop-input" value="${bimElement.params.width}" step="0.01" min="0.01"> m</div>
        <div class="prop-row"><label>Alto Y</label><input type="number" id="prop-height" class="prop-input" value="${bimElement.params.height}" step="0.01" min="0.01"> m</div>
        <div class="prop-row"><label>Espesor</label><input type="number" id="prop-thickness" class="prop-input" value="${bimElement.params.thickness}" step="0.001" min="0.001"> m</div>
      `, true);
    } else if (bimElement.type === 'fastener') {
      html += this._acc('fa-gears', 'Tornillería', `
        <div class="prop-row"><label>Métrica</label>
          <select id="prop-metric" class="prop-input">${['M12','M16','M20','M24','M27','M30'].map(m => `<option value="${m}" ${bimElement.params.metric === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </div>
        ${bimElement.params.subtype === 'bolt' || bimElement.params.subtype === 'anchor' ? `
        <div class="prop-row"><label>Vástago</label><input type="number" id="prop-shank" class="prop-input" value="${bimElement.params.shankLength}" step="5" min="20"> mm</div>` : ''}
      `, true);
    }

    // ─── COLOR — INFINITE PALETTE ─────
    const presetColors = [
      '#7a8090', '#b0b8c0', '#c8cdd0',     // Metals
      '#1a1a1a', '#505050',                  // Dark
      '#8B2500', '#ab2524', '#ef4444',       // Reds
      '#2271b3', '#3b82f6', '#60a5fa',       // Blues
      '#114232', '#22c55e', '#4ade80',       // Greens
      '#f0ca00', '#f59e0b', '#fbbf24',       // Yellows
      '#7c3aed', '#a78bfa',                  // Purples
      '#f0f0f0', '#ffffff',                  // Whites
    ];
    html += this._acc('fa-palette', 'Color y Acabado', `
      <div class="color-section">
        <div class="color-preset-row">
          ${presetColors.map(c => `<button class="color-swatch" style="background:${c}" data-color="${c}" title="${c}"></button>`).join('')}
        </div>
        <div class="color-full-picker">
          <label>Custom:</label>
          <input type="color" id="prop-color-picker" class="color-full-input" value="${bimElement.color}">
          <input type="text" id="prop-color-hex" class="color-hex-input" value="${bimElement.color}" maxlength="7" placeholder="#RRGGBB">
        </div>
      </div>
    `, true);

    // ─── POSITION / ROTATION ─────
    const pos = bimElement.getPosition();
    const rot = bimElement.getRotation();
    html += this._acc('fa-arrows-up-down-left-right', 'Transformación', `
      <div class="coord-group">
        <label class="coord-label">Posición (m)</label>
        <div class="coord-row">
          <span class="coord-axis x">X</span><input type="number" id="prop-px" class="prop-input coord" value="${pos.x.toFixed(3)}" step="0.1">
          <span class="coord-axis y">Y</span><input type="number" id="prop-py" class="prop-input coord" value="${pos.y.toFixed(3)}" step="0.1">
          <span class="coord-axis z">Z</span><input type="number" id="prop-pz" class="prop-input coord" value="${pos.z.toFixed(3)}" step="0.1">
        </div>
      </div>
      <div class="coord-group">
        <label class="coord-label">Rotación (°)</label>
        <div class="coord-row">
          <span class="coord-axis x">RX</span><input type="number" id="prop-rx" class="prop-input coord" value="${THREE.MathUtils.radToDeg(rot.x).toFixed(1)}" step="5">
          <span class="coord-axis y">RY</span><input type="number" id="prop-ry" class="prop-input coord" value="${THREE.MathUtils.radToDeg(rot.y).toFixed(1)}" step="5">
          <span class="coord-axis z">RZ</span><input type="number" id="prop-rz" class="prop-input coord" value="${THREE.MathUtils.radToDeg(rot.z).toFixed(1)}" step="5">
        </div>
      </div>
    `, true);

    html += `<button id="btn-delete" class="btn-delete"><i class="fa-solid fa-trash-can"></i> Eliminar</button>`;
    content.innerHTML = html;
    this._bindEvents();
  }

  _acc(icon, title, body, open = false) {
    return `<details class="accordion" ${open ? 'open' : ''}><summary class="accordion-header"><i class="fa-solid ${icon}"></i> ${title}</summary><div class="accordion-body">${body}</div></details>`;
  }

  _bindEvents() {
    const el = this.currentElement;
    if (!el) return;

    this._on('prop-steel-grade', 'change', (e) => {
      el.steelGrade = e.target.value;
      if (el.type === 'profile') { el._computeProperties(); this.update(el); }
    });

    if (el.type === 'profile') {
      this._on('prop-series', 'change', (e) => { const sz = getSizes(e.target.value); el.update({ series: e.target.value, size: sz[0] }); this.update(el); this.onPropertyChange?.(el); });
      this._on('prop-size', 'change', (e) => { el.update({ size: e.target.value }); this.update(el); this.onPropertyChange?.(el); });
      this._on('prop-length', 'change', (e) => { el.update({ length: parseFloat(e.target.value) || 1 }); this.update(el); this.onPropertyChange?.(el); });
      this._on('prop-orientation', 'change', (e) => { el.update({ orientation: e.target.value }); this.update(el); this.onPropertyChange?.(el); });
    }
    if (el.type === 'plate') {
      ['width', 'height', 'thickness'].forEach(p => {
        this._on(`prop-${p}`, 'change', (e) => { el.update({ [p]: parseFloat(e.target.value) || 0.01 }); this.update(el); this.onPropertyChange?.(el); });
      });
    }
    if (el.type === 'fastener') {
      this._on('prop-metric', 'change', (e) => { el.update({ metric: e.target.value }); this.update(el); this.onPropertyChange?.(el); });
      this._on('prop-shank', 'change', (e) => { el.update({ shankLength: parseFloat(e.target.value) || 40 }); this.update(el); this.onPropertyChange?.(el); });
    }

    // ─── COLORS — infinite palette ─────
    document.querySelectorAll('.color-swatch[data-color]').forEach(sw => {
      sw.addEventListener('click', () => {
        el.setColor(sw.dataset.color);
        const pickerEl = document.getElementById('prop-color-picker');
        const hexEl = document.getElementById('prop-color-hex');
        if (pickerEl) pickerEl.value = sw.dataset.color;
        if (hexEl) hexEl.value = sw.dataset.color;
        this.onColorChange?.(el);
      });
    });
    this._on('prop-color-picker', 'input', (e) => {
      el.setColor(e.target.value);
      const hexEl = document.getElementById('prop-color-hex');
      if (hexEl) hexEl.value = e.target.value;
      this.onColorChange?.(el);
    });
    this._on('prop-color-hex', 'change', (e) => {
      let hex = e.target.value.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        el.setColor(hex);
        const pickerEl = document.getElementById('prop-color-picker');
        if (pickerEl) pickerEl.value = hex;
        this.onColorChange?.(el);
      }
    });

    // Position
    ['px', 'py', 'pz'].forEach((id, i) => {
      this._on(`prop-${id}`, 'change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        const p = el.getPosition();
        if (i === 0) p.x = val; if (i === 1) p.y = val; if (i === 2) p.z = val;
        el.setPosition(p.x, p.y, p.z);
      });
    });
    // Rotation
    ['rx', 'ry', 'rz'].forEach((id, i) => {
      this._on(`prop-${id}`, 'change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        const r = el.getRotation();
        const d = [THREE.MathUtils.radToDeg(r.x), THREE.MathUtils.radToDeg(r.y), THREE.MathUtils.radToDeg(r.z)];
        d[i] = val;
        el.setRotation(d[0], d[1], d[2]);
      });
    });

    this._on('btn-delete', 'click', () => { this.onDelete?.(el); });
  }

  _on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  updateCoords(bimElement) {
    if (!bimElement) return;
    const pos = bimElement.getPosition();
    const rot = bimElement.getRotation();
    const set = (id, val) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = val; };
    set('prop-px', pos.x.toFixed(3)); set('prop-py', pos.y.toFixed(3)); set('prop-pz', pos.z.toFixed(3));
    set('prop-rx', THREE.MathUtils.radToDeg(rot.x).toFixed(1));
    set('prop-ry', THREE.MathUtils.radToDeg(rot.y).toFixed(1));
    set('prop-rz', THREE.MathUtils.radToDeg(rot.z).toFixed(1));
  }
}
