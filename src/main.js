import './ui/layout.css';
import { LoginScreen } from './ui/LoginScreen.js';
import { SceneManager } from './core/SceneManager.js';
import { GridManager } from './core/GridManager.js';
import { SnapManager } from './core/SnapManager.js';
import { Profile } from './entities/Profile.js';
import { Plate } from './entities/Plate.js';
import { Fastener } from './entities/Fastener.js';
import { Weld } from './entities/Weld.js';
import { SelectTool } from './tools/SelectTool.js';
import { MeasureTool } from './tools/MeasureTool.js';
import { WeldTool } from './tools/WeldTool.js';
import { GizmoManager } from './tools/GizmoManager.js';
import { Header } from './ui/Header.js';
import { Sidebar } from './ui/Sidebar.js';
import { Ribbon } from './ui/Ribbon.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { SectionDrawer } from './ui/SectionDrawer.js';

// ═══════════ LOGIN SCREEN ═══════════
const appEl = document.getElementById('app');
appEl.classList.add('hidden');

new LoginScreen((userName) => {
  appEl.classList.remove('hidden');
  header.setUser(userName);
  initApp();
});

// ═══════════ UI COMPONENTS (created but not initialized yet) ═══════════
const header = new Header(document.getElementById('header'));
const sidebar = new Sidebar(document.getElementById('sidebar'));
const ribbon = new Ribbon(document.getElementById('ribbon'));

let sceneManager, gridManager, snapManager, gizmoManager;
let sectionDrawer, propsPanel;
let selectTool, measureTool, weldTool;
let activeTool = 'select';
let darkTheme = true;

function initApp() {
  const canvas = document.getElementById('canvas-container');

  sceneManager = new SceneManager(canvas);
  gridManager = new GridManager(sceneManager.scene, 16);
  snapManager = new SnapManager(sceneManager, gridManager);
  gizmoManager = new GizmoManager(sceneManager);

  sectionDrawer = new SectionDrawer();
  propsPanel = new PropertiesPanel(document.getElementById('properties-panel'), sectionDrawer);

  // Tools
  selectTool = new SelectTool(sceneManager, snapManager, (bimObj) => {
    propsPanel.update(bimObj);
    if (bimObj) sceneManager.attachGizmo(bimObj.mesh);
    else sceneManager.detachGizmo();
  });
  measureTool = new MeasureTool(sceneManager, snapManager);
  weldTool = new WeldTool(sceneManager, snapManager, (weld) => selectAndShow(weld));

  // ═══════════ WIRING ═══════════
  wireRibbon();
  wireSidebar();
  wireHeader();
  wireProperties();
  wireCanvas();
  wireKeyboard();
  addStatusBar(canvas);

  // Gizmo coord sync
  sceneManager.transformControls?.addEventListener('objectChange', () => {
    if (selectTool.selected) propsPanel.updateCoords(selectTool.selected);
  });

  console.log('✦ COMETV Structural v2.1 — Initialized');
}

// ═══════════ HELPERS ═══════════

function selectAndShow(bimObj) {
  if (selectTool.selected) selectTool.selected.setSelected(false);
  selectTool.selected = bimObj;
  bimObj.setSelected(true);
  propsPanel.update(bimObj);
  sceneManager.attachGizmo(bimObj.mesh);
}

function createProfile(series, size, length, orientation) {
  const p = new Profile(series, size, length, orientation);
  sceneManager.addObject(p);
  selectAndShow(p);
}

function createPlate(subtype, w = 0.3, h = 0.3, t = 0.02) {
  const p = new Plate(subtype, w, h, t);
  sceneManager.addObject(p);
  selectAndShow(p);
}

function createFastener(subtype, metric = 'M16') {
  const f = new Fastener(subtype, metric);
  sceneManager.addObject(f);
  selectAndShow(f);
}

function duplicateSelected() {
  const sel = selectTool.selected;
  if (!sel) return;
  let dup;
  if (sel.type === 'profile') {
    dup = new Profile(sel.params.series, sel.params.size, sel.params.length, sel.params.orientation);
  } else if (sel.type === 'plate') {
    dup = new Plate(sel.params.subtype, sel.params.width, sel.params.height, sel.params.thickness);
  } else if (sel.type === 'fastener') {
    dup = new Fastener(sel.params.subtype, sel.params.metric, sel.params.shankLength);
  } else return;

  const pos = sel.getPosition();
  dup.setColor(sel.color);
  sceneManager.addObject(dup);
  dup.setPosition(pos.x + 0.5, pos.y, pos.z + 0.5);
  selectAndShow(dup);
}

function deleteSelected() {
  if (!selectTool.selected) return;
  sceneManager.removeObject(selectTool.selected);
  selectTool.selected = null;
  propsPanel.update(null);
}

function setTool(toolName) {
  activeTool = toolName;
  measureTool.setActive(false);
  weldTool.setActive(false);
  if (toolName === 'measure') { measureTool.setActive(true); ribbon.setActiveButton('tool-measure'); }
  else if (toolName === 'weld') { weldTool.setActive(true); ribbon.setActiveButton('tool-weld'); }
  else if (toolName === 'select') { ribbon.setActiveButton('tool-select'); }
  else if (toolName === 'move') { sceneManager.setGizmoMode('translate'); ribbon.setActiveButton('tool-move'); }
  else if (toolName === 'rotate') { sceneManager.setGizmoMode('rotate'); ribbon.setActiveButton('tool-rotate'); }
  else if (toolName === 'scale') { sceneManager.setGizmoMode('scale'); ribbon.setActiveButton('tool-scale'); }
}

// ═══════════ RIBBON WIRING ═══════════

function wireRibbon() {
  // Estructura
  ribbon.on('add-heb-col', () => createProfile('HEB', '200', 3.0, 'column'));
  ribbon.on('add-hea-col', () => createProfile('HEA', '200', 3.0, 'column'));
  ribbon.on('add-ipe', () => createProfile('IPE', '200', 4.0, 'beam'));
  ribbon.on('add-ipn', () => createProfile('IPN', '200', 4.0, 'beam'));
  ribbon.on('add-upn', () => createProfile('UPN', '200', 3.0, 'beam'));
  ribbon.on('add-chs', () => createProfile('CHS', '114.3x5.0', 3.0, 'column'));
  ribbon.on('add-shs', () => createProfile('SHS', '100x100x5', 3.0, 'column'));
  ribbon.on('add-angle', () => createProfile('L', '80x8', 2.0, 'beam'));
  ribbon.on('add-heb-beam', () => createProfile('HEB', '200', 4.0, 'beam'));

  // Conexiones
  ribbon.on('add-plate', () => createPlate('base', 0.3, 0.3, 0.02));
  ribbon.on('add-gusset-sq', () => createPlate('gusset-square', 0.2, 0.2, 0.012));
  ribbon.on('add-gusset-tri', () => createPlate('gusset-triangle', 0.2, 0.2, 0.012));
  ribbon.on('tool-weld', () => setTool('weld'));

  // Tornillería
  ribbon.on('add-bolt', () => createFastener('bolt', 'M16'));
  ribbon.on('add-nut', () => createFastener('nut', 'M16'));
  ribbon.on('add-washer', () => createFastener('washer', 'M16'));
  ribbon.on('add-anchor', () => createFastener('anchor', 'M20'));
  ribbon.on('add-bolt-set', () => {
    createFastener('bolt', 'M16');
    const boltPos = selectTool.selected.getPosition();
    const nut = new Fastener('nut', 'M16');
    const washer = new Fastener('washer', 'M16');
    sceneManager.addObject(nut);
    sceneManager.addObject(washer);
    nut.setPosition(boltPos.x, boltPos.y - 0.06, boltPos.z);
    washer.setPosition(boltPos.x, boltPos.y - 0.065, boltPos.z);
  });

  // Edición
  ribbon.on('tool-select', () => setTool('select'));
  ribbon.on('tool-move', () => setTool('move'));
  ribbon.on('tool-rotate', () => setTool('rotate'));
  ribbon.on('tool-scale', () => setTool('scale'));
  ribbon.on('tool-measure', () => setTool('measure'));
  ribbon.on('duplicate', () => duplicateSelected());
  ribbon.on('delete-selected', () => deleteSelected());

  // Visualización
  ribbon.on('view-iso', () => sceneManager.setCameraView('iso'));
  ribbon.on('view-top', () => sceneManager.setCameraView('top'));
  ribbon.on('view-front', () => sceneManager.setCameraView('front'));
  ribbon.on('view-left', () => sceneManager.setCameraView('left'));
  ribbon.on('view-right', () => sceneManager.setCameraView('right'));
  ribbon.on('gizmo-translate', () => sceneManager.setGizmoMode('translate'));
  ribbon.on('gizmo-rotate', () => sceneManager.setGizmoMode('rotate'));
  ribbon.on('gizmo-scale', () => sceneManager.setGizmoMode('scale'));
  ribbon.on('toggle-snap', () => {
    snapManager.setEnabled(!snapManager.enabled);
    document.getElementById('btn-snap')?.classList.toggle('active', snapManager.enabled);
  });
  [8, 16, 24, 32].forEach(s => ribbon.on(`grid-size-${s}`, () => gridManager.setSize(s)));
}

// ═══════════ SIDEBAR / HEADER / PROPERTIES ═══════════

function wireSidebar() {
  sidebar.on('select', () => setTool('select'));
  sidebar.on('measure', () => setTool('measure'));
  sidebar.on('view-3d', () => sceneManager.setCameraView('iso'));
  sidebar.on('view-top', () => sceneManager.setCameraView('top'));
}

function wireHeader() {
  header.onThemeToggle = () => {
    darkTheme = !darkTheme;
    document.body.setAttribute('data-theme', darkTheme ? '' : 'light');
    sceneManager.setTheme(darkTheme);
  };
  header.onSave = () => {
    const data = sceneManager.objects.map(o => ({
      type: o.type, params: o.params,
      position: o.getPosition().toArray(),
      rotation: [o.getRotation().x, o.getRotation().y, o.getRotation().z],
      color: o.color, steelGrade: o.steelGrade,
    }));
    const json = JSON.stringify({ version: '2.1', project: document.getElementById('project-name-input')?.value || '', objects: data }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cometv-project.json'; a.click();
    URL.revokeObjectURL(url);
  };
}

function wireProperties() {
  propsPanel.onPropertyChange = () => {};
  propsPanel.onDelete = (el) => { sceneManager.removeObject(el); selectTool.selected = null; propsPanel.update(null); };
  propsPanel.onColorChange = () => {};
}

// ═══════════ CANVAS EVENTS ═══════════

function wireCanvas() {
  const canvasEl = sceneManager.renderer.domElement;
  canvasEl.addEventListener('mousemove', (e) => {
    snapManager.update(e);
    measureTool.handleMouseMove(e);
    weldTool.handleMouseMove(e);
  });
  canvasEl.addEventListener('click', (e) => {
    if (activeTool === 'measure') measureTool.handleClick(e);
    else if (activeTool === 'weld') weldTool.handleClick(e);
    else selectTool.handleClick(e);
  });

  // Zoom slider
  const zs = document.getElementById('zoom-slider');
  const zl = document.getElementById('zoom-value');
  if (zs) zs.addEventListener('input', () => {
    const v = parseFloat(zs.value);
    sceneManager.setZoom(v);
    if (zl) zl.textContent = v.toFixed(1) + '×';
  });
}

// ═══════════ KEYBOARD ═══════════

function wireKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.key.toLowerCase()) {
      case 'v': case 'escape': setTool('select'); break;
      case 'g': setTool('move'); break;
      case 'r': setTool('rotate'); break;
      case 's': if (!e.ctrlKey) setTool('scale'); break;
      case 'm': setTool('measure'); break;
      case 'w': setTool('weld'); break;
      case 'd': if (e.ctrlKey) { e.preventDefault(); duplicateSelected(); } break;
      case 'delete': case 'backspace': deleteSelected(); break;
      case '1': sceneManager.setCameraView('iso'); break;
      case '3': sceneManager.setCameraView('front'); break;
      case '5': sceneManager.setCameraView('left'); break;
      case '7': sceneManager.setCameraView('top'); break;
    }
  });
}

// ═══════════ STATUS BAR ═══════════

function addStatusBar(canvas) {
  const sb = document.createElement('div');
  sb.className = 'status-bar';
  sb.innerHTML = `<span class="status-dot"></span><span>COMETV v2.1</span><span>|</span><span id="status-objects">Objetos: 0</span><span>|</span><span id="status-tool">Herramienta: Seleccionar</span>`;
  canvas.appendChild(sb);
  setInterval(() => {
    const o = document.getElementById('status-objects');
    const t = document.getElementById('status-tool');
    if (o) o.textContent = `Objetos: ${sceneManager.objects.length}`;
    if (t) {
      const n = { select:'Seleccionar',move:'Mover',rotate:'Rotar',scale:'Escalar',measure:'Medir',weld:'Soldadura' };
      t.textContent = `Herramienta: ${n[activeTool] || activeTool}`;
    }
  }, 500);
}
