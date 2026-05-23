import { CHARACTERS, CAR_TYPES } from './config.js';

export class Lobby {
  constructor(characters, onRaceStart, onCharSelect) {
    this.characters   = characters || CHARACTERS;
    this.onRaceStart  = onRaceStart;
    this.onCharSelect = onCharSelect || (() => {});
    this.selected     = null;
    this._render();
  }

  _render() {
    const grid    = document.getElementById('char-grid');
    const raceBtnWrap = document.getElementById('race-btn-wrap');
    grid.innerHTML = '';

    this.characters.forEach((char) => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.dataset.id = char.id;
      card.style.setProperty('--car-color', char.hex);

      const typeInfo = CAR_TYPES[char.car];
      card.innerHTML = `
        <div class="cc-icon">${typeInfo.icon}</div>
        <div class="cc-name">${char.name}</div>
        <div class="cc-city">${char.from}</div>
        <div class="cc-type">${typeInfo.name}</div>
      `;
      card.addEventListener('click', () => this._selectChar(char));
      grid.appendChild(card);
    });

    // Build stats panel
    document.getElementById('sel-name').textContent    = 'CHOOSE YOUR DRIVER';
    document.getElementById('sel-quote').textContent   = '';
    document.getElementById('sel-type').textContent    = '';
    document.getElementById('race-btn').disabled       = true;
    document.getElementById('race-btn').addEventListener('click', () => {
      if (this.selected) this.onRaceStart(this.selected);
    });
  }

  _selectChar(char) {
    // Deselect previous
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    // Select new
    const card = document.querySelector(`.char-card[data-id="${char.id}"]`);
    if (card) {
      card.classList.add('selected');
      card.style.setProperty('--car-color', char.hex);
    }

    this.selected = char;
    this._updatePanel(char);
    this.onCharSelect(char);
  }

  _updatePanel(char) {
    const typeInfo = CAR_TYPES[char.car];
    document.getElementById('sel-name').textContent     = char.name;
    document.getElementById('sel-quote').textContent    = char.quote;
    document.getElementById('sel-city').textContent     = `📍 ${char.from}`;
    document.getElementById('sel-type').textContent     = `${typeInfo.icon} ${typeInfo.name}`;
    document.getElementById('sel-desc').textContent     = typeInfo.desc;
    document.getElementById('sel-car-icon').textContent = typeInfo.icon;
    document.getElementById('race-btn').disabled        = false;
    document.getElementById('race-btn').style.setProperty('--btn-color', char.hex);

    const stats = [
      { label:'SPEED',    val:char.stats.speed },
      { label:'DRIFT',    val:char.stats.drift },
      { label:'ACCEL',    val:char.stats.accel },
      { label:'HANDLING', val:char.stats.handling },
    ];
    document.getElementById('sel-stats').innerHTML = stats.map(s => `
      <div class="stat-row">
        <div class="stat-label">${s.label}</div>
        <div class="stat-track">
          <div class="stat-fill" style="width:${s.val * 10}%;background:${char.hex}"></div>
        </div>
        <div class="stat-num">${s.val}</div>
      </div>
    `).join('');
  }
}
