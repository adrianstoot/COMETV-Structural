/**
 * SectionDrawer — Renders 2D technical cross-section diagrams.
 * Supports: I-section, UPN, L, CHS, SHS, Plate, Fastener, Weld.
 */
export class SectionDrawer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  clear() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1d28';
    ctx.fillRect(0, 0, w, h);
  }

  draw(bimElement) {
    this.clear();
    if (!bimElement || !this.ctx) return;

    const { type, params } = bimElement;

    if (type === 'profile') {
      const series = params.series;
      if (['IPE', 'HEB', 'HEA', 'IPN'].includes(series)) {
        this._drawISection(bimElement);
      } else if (series === 'UPN') {
        this._drawChannel(bimElement);
      } else if (series === 'L') {
        this._drawAngle(bimElement);
      } else if (series === 'CHS') {
        this._drawCHS(bimElement);
      } else if (series === 'SHS') {
        this._drawSHS(bimElement);
      }
    } else if (type === 'plate') {
      this._drawPlate(bimElement);
    } else if (type === 'fastener') {
      this._drawFastener(bimElement);
    } else if (type === 'weld') {
      this._drawWeld(bimElement);
    }
  }

  _drawISection(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const eng = el.engineeringData;
    if (!eng) return;

    const hMM = eng.h;
    const bMM = eng.b;
    const twMM = eng.tw;
    const tfMM = eng.tf;

    // Scale to fit
    const maxDim = Math.max(hMM, bMM);
    const scale = Math.min((w - 50) / bMM, (h - 60) / hMM) * 0.7;
    const cx = w / 2;
    const cy = h / 2;

    const H = hMM * scale;
    const B = bMM * scale;
    const TW = Math.max(twMM * scale, 2);
    const TF = Math.max(tfMM * scale, 2);

    // Fill
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;

    // I-shape path
    ctx.beginPath();
    ctx.moveTo(cx - B / 2, cy - H / 2);
    ctx.lineTo(cx + B / 2, cy - H / 2);
    ctx.lineTo(cx + B / 2, cy - H / 2 + TF);
    ctx.lineTo(cx + TW / 2, cy - H / 2 + TF);
    ctx.lineTo(cx + TW / 2, cy + H / 2 - TF);
    ctx.lineTo(cx + B / 2, cy + H / 2 - TF);
    ctx.lineTo(cx + B / 2, cy + H / 2);
    ctx.lineTo(cx - B / 2, cy + H / 2);
    ctx.lineTo(cx - B / 2, cy + H / 2 - TF);
    ctx.lineTo(cx - TW / 2, cy + H / 2 - TF);
    ctx.lineTo(cx - TW / 2, cy - H / 2 + TF);
    ctx.lineTo(cx - B / 2, cy - H / 2 + TF);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Centroid marker
    this._drawCentroid(cx, cy);

    // Dimension lines
    this._dimV(cx + B / 2 + 14, cy - H / 2, cy + H / 2, `${hMM}`);
    this._dimH(cx - B / 2, cx + B / 2, cy + H / 2 + 14, `${bMM}`);

    // Label
    this._drawLabel(`${el.designation}`);
  }

  _drawChannel(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const eng = el.engineeringData;
    if (!eng) return;

    const hMM = eng.h, bMM = eng.b, twMM = eng.tw, tfMM = eng.tf;
    const scale = Math.min((w - 50) / bMM, (h - 60) / hMM) * 0.7;
    const cx = w / 2, cy = h / 2;
    const H = hMM * scale, B = bMM * scale;
    const TW = Math.max(twMM * scale, 2), TF = Math.max(tfMM * scale, 2);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;

    // U-shape (open right)
    ctx.beginPath();
    ctx.moveTo(cx - B / 2, cy - H / 2);
    ctx.lineTo(cx + B / 2, cy - H / 2);
    ctx.lineTo(cx + B / 2, cy - H / 2 + TF);
    ctx.lineTo(cx - B / 2 + TW, cy - H / 2 + TF);
    ctx.lineTo(cx - B / 2 + TW, cy + H / 2 - TF);
    ctx.lineTo(cx + B / 2, cy + H / 2 - TF);
    ctx.lineTo(cx + B / 2, cy + H / 2);
    ctx.lineTo(cx - B / 2, cy + H / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this._drawCentroid(cx, cy);
    this._dimV(cx + B / 2 + 14, cy - H / 2, cy + H / 2, `${hMM}`);
    this._dimH(cx - B / 2, cx + B / 2, cy + H / 2 + 14, `${bMM}`);
    this._drawLabel(`${el.designation}`);
  }

  _drawAngle(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const eng = el.engineeringData;
    if (!eng) return;

    const aMM = eng.h, bMM = eng.b || eng.h, tMM = eng.tw;
    const scale = Math.min((w - 50) / bMM, (h - 60) / aMM) * 0.65;
    const cx = w / 2, cy = h / 2;
    const A = aMM * scale, B = bMM * scale, T = Math.max(tMM * scale, 2);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - B / 2, cy + A / 2);
    ctx.lineTo(cx + B / 2, cy + A / 2);
    ctx.lineTo(cx + B / 2, cy + A / 2 - T);
    ctx.lineTo(cx - B / 2 + T, cy + A / 2 - T);
    ctx.lineTo(cx - B / 2 + T, cy - A / 2);
    ctx.lineTo(cx - B / 2, cy - A / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this._drawCentroid(cx, cy);
    this._drawLabel(`${el.designation}`);
  }

  _drawCHS(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const eng = el.engineeringData;
    if (!eng) return;

    const dMM = eng.h;
    const tMM = eng.tw;
    const scale = (Math.min(w, h) - 60) / dMM * 0.65;
    const cx = w / 2, cy = h / 2;
    const R = dMM / 2 * scale;
    const Ri = (dMM / 2 - tMM) * scale;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;

    // Outer circle
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Inner circle (cut out)
    ctx.fillStyle = '#1a1d28'; ctx.beginPath(); ctx.arc(cx, cy, Ri, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1; ctx.stroke();

    this._drawCentroid(cx, cy);
    this._dimH(cx - R, cx + R, cy + R + 14, `Ø${dMM}`);
    this._drawLabel(`${el.designation}`);
  }

  _drawSHS(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const eng = el.engineeringData;
    if (!eng) return;

    const hMM = eng.h, bMM = eng.b, tMM = eng.tw;
    const scale = Math.min((w - 50) / bMM, (h - 60) / hMM) * 0.65;
    const cx = w / 2, cy = h / 2;
    const H = hMM * scale, B = bMM * scale, T = Math.max(tMM * scale, 2);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;

    // Outer rect
    ctx.beginPath();
    ctx.rect(cx - B / 2, cy - H / 2, B, H);
    ctx.fill(); ctx.stroke();

    // Inner rect
    ctx.fillStyle = '#1a1d28';
    ctx.beginPath();
    ctx.rect(cx - B / 2 + T, cy - H / 2 + T, B - 2 * T, H - 2 * T);
    ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1; ctx.stroke();

    this._drawCentroid(cx, cy);
    this._dimV(cx + B / 2 + 14, cy - H / 2, cy + H / 2, `${hMM}`);
    this._dimH(cx - B / 2, cx + B / 2, cy + H / 2 + 14, `${bMM}`);
    this._drawLabel(`${el.designation}`);
  }

  _drawPlate(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const wMM = el.params.width * 1000;
    const hMM = el.params.height * 1000;

    const scale = Math.min((w - 50) / wMM, (h - 60) / hMM) * 0.6;
    const cx = w / 2, cy = h / 2;
    const W = wMM * scale, H = hMM * scale;

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5;
    ctx.fillRect(cx - W / 2, cy - H / 2, W, H);
    ctx.strokeRect(cx - W / 2, cy - H / 2, W, H);

    this._drawCentroid(cx, cy);
    this._drawLabel(el.designation || 'Placa Base');
  }

  _drawFastener(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2, cy = h / 2;

    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.5;

    // Hex head
    const R = 14;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + R * Math.cos(angle);
      const y = cy - 20 + R * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Shank
    ctx.fillRect(cx - 4, cy, 8, 30);
    ctx.strokeRect(cx - 4, cy, 8, 30);

    this._drawLabel(el.designation || el.params.metric);
  }

  _drawWeld(el) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2, cy = h / 2;

    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    const zigzag = [0, 10, -10, 10, -10, 10, 0];
    zigzag.forEach((dy, i) => {
      const x = cx - 30 + i * 10;
      const y = cy + dy;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    this._drawLabel('Cordón');
  }

  _drawCentroid(x, y) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 0.8;
    const s = 6;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.stroke();
  }

  _dimV(x, y1, y2, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4a4a66'; ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    ctx.setLineDash([]);
    const arrowLen = 4;
    // arrows
    ctx.beginPath(); ctx.moveTo(x - arrowLen, y1 + arrowLen); ctx.lineTo(x, y1); ctx.lineTo(x + arrowLen, y1 + arrowLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - arrowLen, y2 - arrowLen); ctx.lineTo(x, y2); ctx.lineTo(x + arrowLen, y2 - arrowLen); ctx.stroke();
    // text
    ctx.save();
    ctx.translate(x + 6, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#9898b4'; ctx.font = '600 9px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  _dimH(x1, x2, y, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4a4a66'; ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.setLineDash([]);
    const arrowLen = 4;
    ctx.beginPath(); ctx.moveTo(x1 + arrowLen, y - arrowLen); ctx.lineTo(x1, y); ctx.lineTo(x1 + arrowLen, y + arrowLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2 - arrowLen, y - arrowLen); ctx.lineTo(x2, y); ctx.lineTo(x2 - arrowLen, y + arrowLen); ctx.stroke();
    ctx.fillStyle = '#9898b4'; ctx.font = '600 9px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y + 12);
  }

  _drawLabel(text) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#6366f1'; ctx.font = '700 10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h - 8);
  }
}
