import { TRACK } from './config.js';

export class HUD {
  constructor() {
    this.speedEl     = document.getElementById('speed-val');
    this.gearEl      = document.getElementById('gear-val');
    this.lapEl       = document.getElementById('lap-val');
    this.timerEl     = document.getElementById('time-val');
    this.posEl       = document.getElementById('pos-val');
    this.nosBar      = document.getElementById('nos-bar');
    this.driftEl     = document.getElementById('drift-indicator');
    this.countdownEl = document.getElementById('countdown');
    this.finishEl    = document.getElementById('finish-banner');
    this.canvas      = document.getElementById('minimap');
    this.ctx         = this.canvas ? this.canvas.getContext('2d') : null;
    this._driftTO    = null;
    this._lastGear   = 0;
  }

  update({ speedMPH, gear, lap, totalLaps, raceTime, nos, nosMax, isDrifting, position, carAngle, place, totalRacers }) {
    // Speed
    this.speedEl.textContent = Math.round(Math.max(0, speedMPH));

    // Gear
    if (gear !== this._lastGear) {
      this._lastGear = gear;
      this.gearEl.textContent = Math.max(1, gear);
      this.gearEl.classList.add('shift');
      setTimeout(() => this.gearEl.classList.remove('shift'), 180);
    }

    // Lap
    this.lapEl.textContent = `${Math.min(lap, totalLaps)} / ${totalLaps}`;

    // Timer
    this.timerEl.textContent = formatTime(raceTime);

    // NOS bar
    const nosPct = (nos / nosMax) * 100;
    this.nosBar.style.height = nosPct + '%';
    this.nosBar.classList.toggle('nos-low', nosPct < 25);
    document.getElementById('nos-screen').style.opacity = (nos > 0 && nosPct > 1) ? '0' : '0';

    // Drift indicator
    if (isDrifting) {
      this.driftEl.classList.add('visible');
      clearTimeout(this._driftTO);
    } else if (this.driftEl.classList.contains('visible')) {
      this._driftTO = setTimeout(() => this.driftEl.classList.remove('visible'), 600);
    }

    // Race position
    if (this.posEl && place != null) {
      const suffix = place === 1 ? 'ST' : place === 2 ? 'ND' : place === 3 ? 'RD' : 'TH';
      this.posEl.textContent = totalRacers > 1 ? `${place}${suffix}` : '1ST';
    }

    // Minimap
    if (this.ctx) this.drawMinimap(position, carAngle);
  }

  showCountdown(text) {
    this.countdownEl.textContent = text;
    if (text) {
      this.countdownEl.classList.add('visible');
      // Flash animation
      this.countdownEl.style.transform = 'translate(-50%,-50%) scale(1.4)';
      setTimeout(() => { this.countdownEl.style.transform = 'translate(-50%,-50%) scale(1)'; }, 80);
    } else {
      this.countdownEl.classList.remove('visible');
    }
  }

  showFinish(raceTime, place) {
    const medals  = ['🥇', '🥈', '🥉'];
    const labels  = ['1ST', '2ND', '3RD'];
    const medal   = medals[place - 1] || '🏁';
    const placeStr = labels[place - 1] || `${place}TH`;

    this.finishEl.innerHTML = `
      <div class="fin-medal">${medal}</div>
      <div class="fin-place">${placeStr} PLACE</div>
      <div class="fin-label">RACE TIME</div>
      <div class="fin-time">${formatTime(raceTime)}</div>
      <button class="fin-btn" onclick="location.reload()">↩ BACK TO LOBBY</button>
    `;
    this.finishEl.classList.add('visible');
  }

  drawMinimap(carPos, carAngle) {
    const { innerR, outerR } = TRACK;
    const S   = 160;
    const CX  = S / 2, CY = S / 2;
    const sc  = (S / 2 - 6) / outerR;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, S / 2 - 1, 0, Math.PI * 2);
    ctx.clip();

    // Dark bg
    ctx.fillStyle = 'rgba(5,5,18,0.88)';
    ctx.fillRect(0, 0, S, S);

    // Track ring
    ctx.beginPath();
    ctx.arc(CX, CY, outerR * sc, 0, Math.PI * 2);
    ctx.fillStyle = '#202020';
    ctx.fill();

    // Infield
    ctx.beginPath();
    ctx.arc(CX, CY, innerR * sc, 0, Math.PI * 2);
    ctx.fillStyle = '#0B160B';
    ctx.fill();

    // Start line
    ctx.beginPath();
    ctx.moveTo(CX, CY - innerR * sc);
    ctx.lineTo(CX, CY - outerR * sc);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Car arrow
    const mx = CX + carPos.x * sc;
    const my = CY - carPos.z * sc;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(-carAngle);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 1);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#FF4500';
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Rim
    ctx.beginPath();
    ctx.arc(CX, CY, S / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,100,0,0.45)';
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  show() {
    document.getElementById('hud').style.display    = 'block';
    document.getElementById('minimap').style.display = 'block';
    document.getElementById('boost-panel').style.display = 'flex';
    document.getElementById('nos-screen').style.display  = 'block';
  }

  hide() {
    document.getElementById('hud').style.display    = 'none';
    document.getElementById('minimap').style.display = 'none';
    document.getElementById('boost-panel').style.display = 'none';
    document.getElementById('nos-screen').style.display  = 'none';
  }
}

// Shared time formatter
export function formatTime(s) {
  const m   = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}
