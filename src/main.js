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

// ─── DOM ELEMENTS ─────────────────────────────────────────────
const appEl = document.getElementById('app');
appEl.classList.add('hidden');

// ─── UI COMPONENTS ─────────────────────────────────────────────
const header = new Header(document.getElementById('header'));
const sidebar = new Sidebar(document.getElementById('sidebar'));
const ribbon = new Ribbon(document.getElementById('ribbon'));

let sceneManager, gridManager, snapManager, gizmoManager;
let sectionDrawer, propsPanel;
let selectTool, measureTool, weldTool;
let activeTool = 'select';
let darkTheme = true;
let visualMode = 'clay';
let gizmoSpace = 'world';
let _undoStack = [];
let _undoPointer = -1;

// ─── LOGIN ────────────────────────────────────────────────────
new LoginScreen((userName) => {
  appEl.classList.remove('hidden');
  header.setUser(userName);
  // Wait for browser to do layout pass before Three.js reads clientWidth
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initApp();
    });
  });
});

// ─── INIT ─────────────────────────────────────────────────────
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
    updateMiniTransform(bimObj);
    if (bimObj) sceneManager.attachGizmo(bimObj.mesh);
    else sceneManager.detachGizmo();
  });

  measureTool = new MeasureTool(sceneManager, snapManager);
  weldTool = new WeldTool(sceneManager, snapManager, (weld) => selectAndShow(weld));

  propsPanel.onDelete = (el) => {
    sceneManager.removeObject(el);
    selectTool.selected = null;
    propsPanel.update(null);
    updateMiniTransform(null);
    updateStatusBar();
  };
  propsPanel.onDuplicate = (el) => duplicateSelected();
  propsPanel.onColorChange = (el, color) => updateStatusBar();

  wireRibbon();
  wireSidebar();
  wireHeader();
  wireCanvas();
  wireKeyboard();
  wireCommandPalette();
  wireContextMenu();
  wireViewCube();
  wireMiniTransform();
  wireSnapIndicator();

  // Gizmo coord sync
  sceneManager.transformControls?.addEventListener('objectChange', () => {
    if (selectTool.selected) {
      propsPanel.updateCoords(selectTool.selected);
      updateCoordReadout(selectTool.selected.getPosition());
    }
    updateStatusBar();
  });

  // Force resize to get correct canvas dimensions after app is shown
  setTimeout(() => { sceneManager._onResize(); }, 50);
  setTimeout(() => { sceneManager._onResize(); }, 200);
  setTimeout(() => { sceneManager._onResize(); }, 500);

  // Set default visual mode
  setVisualMode('clay');

  // Status bar loop
  setInterval(updateStatusBar, 500);

  // Toast container
  const toastEl = document.createElement('div');
  toastEl.id = 'toast-container';
  document.body.appendChild(toastEl);

  console.log('✦ COMETV Structural v3.0 PRO — Initialized');
  showToast('COMETV Structural v3.0 listo', 2500);
}

// ─── HELPERS ──────────────────────────────────────────────────
function selectAndShow(bimObj) {
  if (selectTool.selected && selectTool.selected !== bimObj) {
    selectTool.selected.setSelected(false);
  }
  selectTool.selected = bimObj;
  if (bimObj) bimObj.setSelected(true);
  propsPanel.update(bimObj);
  updateMiniTransform(bimObj);
  if (bimObj) sceneManager.attachGizmo(bimObj.mesh);
  else sceneManager.detachGizmo();
  updateStatusBar();
}

function createProfile(series, size, length, orientation) {
  const p = new Profile(series, size, length, orientation);
  sceneManager.addObject(p);
  selectAndShow(p);
  pushUndo();
}

function createPlate(subtype, w = 0.3, h = 0.3, t = 0.02) {
  const p = new Plate(subtype, w, h, t);
  sceneManager.addObject(p);
  selectAndShow(p);
  pushUndo();
}

function createFastener(subtype, metric = 'M16') {
  const metric_ = document.getElementById('global-metric-select')?.value || metric;
  const f = new Fastener(subtype, metric_);
  sceneManager.addObject(f);
  selectAndShow(f);
  pushUndo();
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
  dup.steelGrade = sel.steelGrade;
  sceneManager.addObject(dup);
  dup.setPosition(pos.x + 0.3, pos.y, pos.z + 0.3);
  selectAndShow(dup);
  pushUndo();
  showToast(`Duplicado: ${dup.designation}`);
}

function deleteSelected() {
  if (!selectTool.selected) return;
  sceneManager.removeObject(selectTool.selected);
  selectTool.selected = null;
  propsPanel.update(null);
  updateMiniTransform(null);
  pushUndo();
}

function isolateSelected() {
  const sel = selectTool.selected;
  if (!sel) return;
  sceneManager.objects.forEach(o => {
    if (o !== sel && o.mesh) o.mesh.visible = false;
  });
  showToast('Aislado. Pulsa Alt+I para mostrar todo.');
}

function showAll() {
  sceneManager.objects.forEach(o => {
    if (o.mesh) o.mesh.visible = true;
  });
  showToast('Todos los elementos visibles.');
}

function setTool(toolName) {
  activeTool = toolName;
  measureTool.setActive(false);
  weldTool.setActive(false);

  const toolLabels = {
    select: 'Seleccionar',
    move: 'Mover',
    rotate: 'Rotar',
    scale: 'Escalar',
    measure: 'Medir',
    weld: 'Soldadura',
  };

  if (toolName === 'measure') { measureTool.setActive(true); }
  else if (toolName === 'weld') { weldTool.setActive(true); }
  else if (toolName === 'move') { sceneManager.setGizmoMode('translate'); }
  else if (toolName === 'rotate') { sceneManager.setGizmoMode('rotate'); }
  else if (toolName === 'scale') { sceneManager.setGizmoMode('scale'); }

  ribbon.setActiveButton('tool-' + toolName);
  sidebar.setActiveTool(toolName);

  const sb = document.getElementById('sb-tool');
  if (sb) sb.textContent = toolLabels[toolName] || toolName;
}

function setVisualMode(mode) {
  visualMode = mode;
  sceneManager.setVisualMode(mode);
  ribbon.setActiveModeButton(mode);
  const badge = document.getElementById('viewport-mode-badge');
  const labels = { clay:'TECHNICAL CLAY', pbr:'PBR REALISTIC', wire:'WIREFRAME', xray:'X-RAY' };
  if (badge) badge.textContent = labels[mode] || mode.toUpperCase();
  showToast(`Modo: ${labels[mode] || mode}`);
}

// ─── STATUS BAR ───────────────────────────────────────────────
function updateStatusBar() {
  const sbObjs = document.getElementById('sb-objects');
  const sbSel  = document.getElementById('sb-selection');
  if (sbObjs) sbObjs.textContent = `${sceneManager?.objects?.length || 0} objetos`;
  if (sbSel) {
    if (selectTool?.selected) {
      sbSel.textContent = selectTool.selected.designation;
    } else {
      sbSel.textContent = 'Sin selección';
    }
  }
}

// ─── COORD READOUT ─────────────────────────────────────────────
function updateCoordReadout(pos) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val.toFixed(3); };
  set('cr-x', pos?.x || 0);
  set('cr-y', pos?.y || 0);
  set('cr-z', pos?.z || 0);
  const sbC = document.getElementById('sb-coords');
  if (sbC && pos) sbC.textContent = `${pos.x.toFixed(3)} · ${pos.y.toFixed(3)} · ${pos.z.toFixed(3)}`;
}

// ─── MINI TRANSFORM ────────────────────────────────────────────
function updateMiniTransform(bimObj) {
  const mt = document.getElementById('mini-transform');
  if (!mt) return;
  mt.classList.toggle('hidden', !bimObj);
}

function wireMiniTransform() {
  document.querySelectorAll('.mt-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      setTool(mode === 'translate' ? 'move' : mode);
      document.querySelectorAll('.mt-btn[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('mt-local-global')?.addEventListener('click', (e) => {
    gizmoSpace = gizmoSpace === 'world' ? 'local' : 'world';
    sceneManager.setGizmoSpace(gizmoSpace);
    e.currentTarget.querySelector('.mt-coord-label').textContent = gizmoSpace === 'world' ? 'GLB' : 'LCL';
    showToast(`Espacio: ${gizmoSpace === 'world' ? 'Global' : 'Local'}`);
  });
}

// ─── SNAP INDICATOR ────────────────────────────────────────────
function wireSnapIndicator() {
  // Updated via mousemove
}

function updateSnapIndicator(snapType) {
  const si = document.getElementById('snap-indicator');
  const sl = document.getElementById('snap-type-label');
  if (!si || !sl) return;
  if (snapType) {
    si.classList.remove('hidden');
    sl.textContent = snapType.toUpperCase();
    const colors = { vertex:'var(--snap-vertex)', edge:'var(--snap-edge)', face:'var(--snap-face)', grid:'var(--snap-grid)' };
    si.style.color = colors[snapType] || 'var(--snap-grid)';
    si.style.borderColor = colors[snapType] || 'var(--border-2)';
  } else {
    si.classList.add('hidden');
  }
}

// ─── VIEW CUBE ─────────────────────────────────────────────────
function wireViewCube() {
  document.querySelectorAll('.vc-label').forEach(lbl => {
    lbl.addEventListener('click', () => {
      sceneManager.setCameraView(lbl.dataset.view);
    });
  });
}

// ─── RIBBON ────────────────────────────────────────────────────
function wireRibbon() {
  // Estructura
  ribbon.on('add-heb-col',  () => createProfile('HEB', '200', 3.0, 'column'));
  ribbon.on('add-hea-col',  () => createProfile('HEA', '200', 3.0, 'column'));
  ribbon.on('add-ipe',      () => createProfile('IPE', '200', 4.0, 'beam'));
  ribbon.on('add-ipn',      () => createProfile('IPN', '200', 4.0, 'beam'));
  ribbon.on('add-upn',      () => createProfile('UPN', '200', 3.0, 'beam'));
  ribbon.on('add-chs',      () => createProfile('CHS', '114.3x5.0', 3.0, 'column'));
  ribbon.on('add-shs',      () => createProfile('SHS', '100x100x5', 3.0, 'column'));
  ribbon.on('add-angle',    () => createProfile('L', '80x8', 2.0, 'beam'));
  ribbon.on('add-heb-beam', () => createProfile('HEB', '200', 4.0, 'beam'));

  // Conexiones
  ribbon.on('add-plate',       () => createPlate('base', 0.3, 0.3, 0.02));
  ribbon.on('add-gusset-sq',   () => createPlate('gusset-square', 0.2, 0.2, 0.012));
  ribbon.on('add-gusset-tri',  () => createPlate('gusset-triangle', 0.2, 0.2, 0.012));
  ribbon.on('tool-weld',       () => setTool('weld'));

  // Tornillería
  ribbon.on('add-bolt',    () => createFastener('bolt', 'M16'));
  ribbon.on('add-nut',     () => createFastener('nut', 'M16'));
  ribbon.on('add-washer',  () => createFastener('washer', 'M16'));
  ribbon.on('add-anchor',  () => createFastener('anchor', 'M20'));
  ribbon.on('add-bolt-set', () => {
    const metric = document.getElementById('global-metric-select')?.value || 'M16';
    createFastener('bolt', metric);
    const boltPos = selectTool.selected?.getPosition();
    if (boltPos) {
      const nut = new Fastener('nut', metric);
      const washer = new Fastener('washer', metric);
      sceneManager.addObject(nut);
      sceneManager.addObject(washer);
      nut.setPosition(boltPos.x, boltPos.y - 0.07, boltPos.z);
      washer.setPosition(boltPos.x, boltPos.y - 0.075, boltPos.z);
    }
  });
  ribbon.on('array-linear', () => arrayLinearSelected());

  // Edición
  ribbon.on('tool-select',  () => setTool('select'));
  ribbon.on('tool-move',    () => setTool('move'));
  ribbon.on('tool-rotate',  () => setTool('rotate'));
  ribbon.on('tool-scale',   () => setTool('scale'));
  ribbon.on('tool-measure', () => setTool('measure'));
  ribbon.on('duplicate',    () => duplicateSelected());
  ribbon.on('delete-selected', () => deleteSelected());

  // Coord space
  ribbon.on('coord-space-world', () => {
    gizmoSpace = 'world';
    sceneManager.setGizmoSpace('world');
  });
  ribbon.on('coord-space-local', () => {
    gizmoSpace = 'local';
    sceneManager.setGizmoSpace('local');
  });

  // Visualización — cámara
  ribbon.on('view-iso',   () => sceneManager.setCameraView('iso'));
  ribbon.on('view-top',   () => sceneManager.setCameraView('top'));
  ribbon.on('view-front', () => sceneManager.setCameraView('front'));
  ribbon.on('view-left',  () => sceneManager.setCameraView('left'));
  ribbon.on('view-right', () => sceneManager.setCameraView('right'));

  // Modos visuales
  ribbon.on('mode-clay',  () => setVisualMode('clay'));
  ribbon.on('mode-pbr',   () => setVisualMode('pbr'));
  ribbon.on('mode-wire',  () => setVisualMode('wire'));
  ribbon.on('mode-xray',  () => setVisualMode('xray'));

  // Grid / Snap
  ribbon.on('toggle-snap', () => {
    snapManager.setEnabled(!snapManager.enabled);
    const btn = document.getElementById('btn-snap');
    btn?.classList.toggle('active', snapManager.enabled);
    const sbSnap = document.getElementById('sb-snap-status');
    sbSnap?.classList.toggle('active', snapManager.enabled);
    showToast(`Snap: ${snapManager.enabled ? 'activo' : 'desactivado'}`);
  });
  [8, 16, 24, 32].forEach(s => ribbon.on('grid-size-' + s, () => gridManager.setSize(s)));
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function wireSidebar() {
  sidebar.on('select',    () => setTool('select'));
  sidebar.on('move',      () => setTool('move'));
  sidebar.on('rotate',    () => setTool('rotate'));
  sidebar.on('scale',     () => setTool('scale'));
  sidebar.on('measure',   () => setTool('measure'));
  sidebar.on('weld',      () => setTool('weld'));
  sidebar.on('view-iso',  () => sceneManager.setCameraView('iso'));
  sidebar.on('view-top',  () => sceneManager.setCameraView('top'));
  sidebar.on('view-front',() => sceneManager.setCameraView('front'));
}

// ─── HEADER ───────────────────────────────────────────────────
function wireHeader() {
  header.onThemeToggle = (dark) => {
    darkTheme = dark;
    document.body.setAttribute('data-theme', dark ? '' : 'light');
    sceneManager.setTheme(dark);
  };
  header.onSave = saveProject;
  header.onLoad = loadProject;
  header.onNew = () => {
    if (!confirm('¿Crear nuevo proyecto? Se perderán los cambios no guardados.')) return;
    sceneManager.objects.slice().forEach(o => sceneManager.removeObject(o));
    selectTool.selected = null;
    propsPanel.update(null);
    updateMiniTransform(null);
    updateStatusBar();
    showToast('Nuevo proyecto creado.');
  };
  header.onExport = exportProject;
}

// ─── CANVAS ───────────────────────────────────────────────────
function wireCanvas() {
  const canvasEl = sceneManager.renderer.domElement;

  canvasEl.addEventListener('mousemove', (e) => {
    const snapResult = snapManager.update(e);
    if (snapResult) {
      updateCoordReadout(snapResult);
      updateSnapIndicator(snapManager.snapType);
    } else {
      updateSnapIndicator(null);
    }

    measureTool.handleMouseMove(e);
    weldTool.handleMouseMove(e);

    // Hover detection (only in select mode)
    if (activeTool === 'select') {
      const hovered = sceneManager.getBIMObjectAtMouse(e);
      if (hovered !== sceneManager._hoveredObj) {
        if (hovered && !hovered._isSelected) {
          sceneManager.setHovered(hovered);
          showHoverTooltip(e, hovered);
        } else {
          sceneManager.clearHover();
          hideHoverTooltip();
        }
      }
    }
  });

  canvasEl.addEventListener('mouseleave', () => {
    sceneManager.clearHover();
    hideHoverTooltip();
    updateSnapIndicator(null);
  });

  canvasEl.addEventListener('click', (e) => {
    if (e.button !== 0) return;
    if (activeTool === 'measure') measureTool.handleClick(e);
    else if (activeTool === 'weld') weldTool.handleClick(e);
    else selectTool.handleClick(e);
  });

  canvasEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (selectTool.selected) showContextMenu(e.clientX, e.clientY);
  });
}

// ─── HOVER TOOLTIP ────────────────────────────────────────────
function showHoverTooltip(event, bimObj) {
  const tt = document.getElementById('hover-tooltip');
  if (!tt || !bimObj) return;
  tt.textContent = bimObj.designation || bimObj.type;
  tt.classList.remove('hidden');
  tt.style.left = (event.clientX + 14) + 'px';
  tt.style.top  = (event.clientY - 8) + 'px';
}
function hideHoverTooltip() {
  document.getElementById('hover-tooltip')?.classList.add('hidden');
}

// ─── CONTEXT MENU ─────────────────────────────────────────────
function showContextMenu(x, y) {
  const cm = document.getElementById('context-menu');
  if (!cm) return;
  cm.classList.remove('hidden');
  cm.style.left = x + 'px';
  cm.style.top  = y + 'px';
}

function wireContextMenu() {
  const cm = document.getElementById('context-menu');
  if (!cm) return;

  cm.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'duplicate') duplicateSelected();
      else if (action === 'isolate') isolateSelected();
      else if (action === 'focus') {
        if (selectTool.selected) sceneManager.focusOnObject(selectTool.selected);
      }
      else if (action === 'delete') deleteSelected();
      cm.classList.add('hidden');
    });
  });

  document.addEventListener('click', (e) => {
    if (!cm.contains(e.target)) cm.classList.add('hidden');
  });
}

// ─── KEYBOARD ─────────────────────────────────────────────────
function wireKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') { e.preventDefault(); saveProject(); return; }
      if (e.key === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (e.key === 'z') { e.preventDefault(); undoAction(); return; }
      if (e.key === 'y') { e.preventDefault(); redoAction(); return; }
    }

    if (e.altKey) {
      if (e.key === 'i') { e.preventDefault(); showAll(); return; }
    }

    switch (e.key.toLowerCase()) {
      case 'v': case 'escape': setTool('select'); closeCommandPalette(); break;
      case 'g': setTool('move'); break;
      case 'r': setTool('rotate'); break;
      case 'w': setTool('weld'); break;
      case 'm': setTool('measure'); break;
      case 's': if (!e.ctrlKey) setTool('scale'); break;
      case 'delete': case 'backspace': deleteSelected(); break;
      case 'f': if (selectTool.selected) sceneManager.focusOnObject(selectTool.selected); break;
      case '1': sceneManager.setCameraView('iso'); break;
      case '3': sceneManager.setCameraView('front'); break;
      case '5': sceneManager.setCameraView('left'); break;
      case '7': sceneManager.setCameraView('top'); break;
    }
  });
}

// ─── COMMAND PALETTE ──────────────────────────────────────────
const COMMANDS = [
  { label: 'Añadir Columna HEB 200',   icon: 'fa-building',       action: () => createProfile('HEB','200',3,'column'),  group: 'Estructura' },
  { label: 'Añadir Viga IPE 200',       icon: 'fa-building',       action: () => createProfile('IPE','200',4,'beam'),     group: 'Estructura' },
  { label: 'Añadir Viga HEB 200',       icon: 'fa-building',       action: () => createProfile('HEB','200',4,'beam'),     group: 'Estructura' },
  { label: 'Añadir Columna HEA 200',    icon: 'fa-building',       action: () => createProfile('HEA','200',3,'column'),  group: 'Estructura' },
  { label: 'Añadir Canal UPN 200',      icon: 'fa-building',       action: () => createProfile('UPN','200',3,'beam'),    group: 'Estructura' },
  { label: 'Añadir Tubo CHS',           icon: 'fa-circle',         action: () => createProfile('CHS','114.3x5.0',3,'column'), group: 'Estructura' },
  { label: 'Añadir Tubo SHS',           icon: 'fa-square',         action: () => createProfile('SHS','100x100x5',3,'column'), group: 'Estructura' },
  { label: 'Añadir Angular L 80×8',     icon: 'fa-building',       action: () => createProfile('L','80x8',2,'beam'),    group: 'Estructura' },
  { label: 'Añadir Placa Base',         icon: 'fa-square',         action: () => createPlate('base'),                    group: 'Conexiones' },
  { label: 'Añadir Tornillo M16',       icon: 'fa-gears',          action: () => createFastener('bolt','M16'),           group: 'Tornillería' },
  { label: 'Duplicar selección',        icon: 'fa-clone',          action: duplicateSelected,   kbd: 'Ctrl+D',           group: 'Edición' },
  { label: 'Eliminar selección',        icon: 'fa-trash-can',      action: deleteSelected,      kbd: 'Del',              group: 'Edición' },
  { label: 'Aislar selección',          icon: 'fa-eye',            action: isolateSelected,                              group: 'Edición' },
  { label: 'Mostrar todo',              icon: 'fa-eye',            action: showAll,             kbd: 'Alt+I',            group: 'Edición' },
  { label: 'Vista isométrica',          icon: 'fa-cube',           action: () => sceneManager.setCameraView('iso'),  kbd:'1', group:'Cámara' },
  { label: 'Vista planta',              icon: 'fa-border-all',     action: () => sceneManager.setCameraView('top'),  kbd:'7', group:'Cámara' },
  { label: 'Vista frontal',             icon: 'fa-square',         action: () => sceneManager.setCameraView('front'),kbd:'3', group:'Cámara' },
  { label: 'Modo Technical Clay',       icon: 'fa-circle',         action: () => setVisualMode('clay'),                  group: 'Visualización' },
  { label: 'Modo PBR Realista',         icon: 'fa-circle',         action: () => setVisualMode('pbr'),                   group: 'Visualización' },
  { label: 'Modo Wireframe',            icon: 'fa-circle',         action: () => setVisualMode('wire'),                  group: 'Visualización' },
  { label: 'Modo X-Ray',                icon: 'fa-circle',         action: () => setVisualMode('xray'),                  group: 'Visualización' },
  { label: 'Guardar proyecto',          icon: 'fa-floppy-disk',    action: saveProject,         kbd: 'Ctrl+S',           group: 'Archivo' },
  { label: 'Exportar proyecto',         icon: 'fa-arrow-up-from-bracket', action: exportProject, group: 'Archivo' },
  { label: 'Centrar cámara en selección', icon: 'fa-crosshairs',  action: () => { if(selectTool.selected) sceneManager.focusOnObject(selectTool.selected); }, kbd: 'F', group: 'Cámara' },
];

function openCommandPalette() {
  const overlay = document.getElementById('command-palette-overlay');
  overlay?.classList.remove('hidden');
  const input = document.getElementById('cp-input');
  if (input) { input.value = ''; input.focus(); renderCommandResults(''); }
}

function closeCommandPalette() {
  document.getElementById('command-palette-overlay')?.classList.add('hidden');
}

function renderCommandResults(query) {
  const results = document.getElementById('cp-results');
  if (!results) return;

  const filtered = COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.group.toLowerCase().includes(query.toLowerCase())
  );

  if (!filtered.length) {
    results.innerHTML = `<div class="cp-empty">Sin resultados para "${query}"</div>`;
    return;
  }

  const groups = {};
  filtered.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });

  let html = '';
  for (const [group, cmds] of Object.entries(groups)) {
    html += `<div class="cp-section-header">${group}</div>`;
    html += cmds.map((c, i) => `
      <div class="cp-result" data-idx="${COMMANDS.indexOf(c)}">
        <i class="fa-solid ${c.icon} cp-result-icon"></i>
        <span class="cp-result-label">${c.label}</span>
        ${c.kbd ? `<kbd class="cp-result-kbd">${c.kbd}</kbd>` : ''}
      </div>
    `).join('');
  }
  results.innerHTML = html;

  results.querySelectorAll('.cp-result').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (COMMANDS[idx]) COMMANDS[idx].action();
      closeCommandPalette();
    });
  });
}

function wireCommandPalette() {
  const input = document.getElementById('cp-input');
  input?.addEventListener('input', (e) => renderCommandResults(e.target.value));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCommandPalette();
    if (e.key === 'Enter') {
      const first = document.querySelector('.cp-result');
      first?.click();
    }
  });

  document.getElementById('command-palette-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'command-palette-overlay') closeCommandPalette();
  });
}

// ─── UNDO / REDO ──────────────────────────────────────────────
function pushUndo() {
  // Simple object count snapshot (could be expanded to full state)
  _undoStack.splice(_undoPointer + 1);
  _undoStack.push(sceneManager.objects.length);
  _undoPointer = _undoStack.length - 1;
}

function undoAction() {
  showToast('Deshacer — función en desarrollo', 1500);
}

function redoAction() {
  showToast('Rehacer — función en desarrollo', 1500);
}

// ─── ARRAY LINEAR ─────────────────────────────────────────────
function arrayLinearSelected() {
  const sel = selectTool.selected;
  if (!sel) { showToast('Seleccione un elemento primero.', 2000); return; }
  const count = parseInt(prompt('¿Cuántas copias? (2-20)', '4') || '0');
  const spacing = parseFloat(prompt('Separación en X (m):', '1.0') || '0');
  if (isNaN(count) || count < 1 || isNaN(spacing)) return;

  const pos = sel.getPosition();
  for (let i = 1; i <= count; i++) {
    let dup;
    if (sel.type === 'profile') dup = new Profile(sel.params.series, sel.params.size, sel.params.length, sel.params.orientation);
    else if (sel.type === 'plate') dup = new Plate(sel.params.subtype, sel.params.width, sel.params.height, sel.params.thickness);
    else if (sel.type === 'fastener') dup = new Fastener(sel.params.subtype, sel.params.metric, sel.params.shankLength);
    else continue;
    dup.setColor(sel.color);
    dup.steelGrade = sel.steelGrade;
    sceneManager.addObject(dup);
    dup.setPosition(pos.x + spacing * i, pos.y, pos.z);
  }
  showToast(`${count} copias creadas en X con separación ${spacing}m`);
  pushUndo();
}

// ─── SAVE / LOAD / EXPORT ─────────────────────────────────────
function saveProject() {
  const projectName = document.getElementById('project-name-input')?.value || 'Sin título';
  const data = sceneManager.objects.map(o => ({
    type: o.type, params: o.params,
    position: o.getPosition().toArray(),
    rotation: [o.getRotation().x, o.getRotation().y, o.getRotation().z],
    color: o.color, steelGrade: o.steelGrade,
  }));
  const json = JSON.stringify({ version: '3.0', project: projectName, objects: data }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${projectName.replace(/\s+/g,'-')}.cometv.json`; a.click();
  URL.revokeObjectURL(url);
  showToast(`Guardado: ${projectName}.cometv.json`);
}

function loadProject() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,.cometv.json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.project) {
        const nameInput = document.getElementById('project-name-input');
        if (nameInput) nameInput.value = data.project;
      }
      // Clear scene
      sceneManager.objects.slice().forEach(o => sceneManager.removeObject(o));
      // Restore objects
      (data.objects || []).forEach(item => {
        let obj;
        if (item.type === 'profile') {
          obj = new Profile(item.params.series, item.params.size, item.params.length, item.params.orientation);
        } else if (item.type === 'plate') {
          obj = new Plate(item.params.subtype, item.params.width, item.params.height, item.params.thickness);
        } else if (item.type === 'fastener') {
          obj = new Fastener(item.params.subtype, item.params.metric, item.params.shankLength);
        }
        if (obj) {
          if (item.color) obj.setColor(item.color);
          if (item.steelGrade) obj.steelGrade = item.steelGrade;
          sceneManager.addObject(obj);
          if (item.position) obj.setPosition(...item.position);
          if (item.rotation) obj.mesh.rotation.set(...item.rotation);
        }
      });
      showToast(`Proyecto cargado: ${data.project || file.name}`);
      updateStatusBar();
    } catch(err) {
      console.error(err);
      showToast('Error al cargar el proyecto.', 3000);
    }
  });
  input.click();
}

function exportProject() {
  saveProject(); // For now just JSON export
  showToast('Exportado como JSON. OBJ/IFC próximamente.');
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message, duration = 2000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}
