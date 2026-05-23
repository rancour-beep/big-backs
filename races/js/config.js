// ─── Characters ──────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:'mj',      name:'MJ',           from:'Stoke',      car:'MUSCLE', hex:'#FF2D2D', color:0xFF2D2D, quote:'"Let\'s gooo!"',         stats:{speed:8,drift:5,accel:7,handling:6} },
  { id:'ringan',  name:'Ringan',       from:'Coventry',   car:'SPORTS', hex:'#2D8BFF', color:0x2D8BFF, quote:'"Precise as always."',    stats:{speed:7,drift:7,accel:8,handling:9} },
  { id:'shad',    name:'Shad',         from:'Manchester', car:'DRIFT',  hex:'#B040FF', color:0xB040FF, quote:'"Sideways is the only way."', stats:{speed:6,drift:10,accel:6,handling:7} },
  { id:'ed',      name:'Ed',           from:'Birmingham', car:'STREET', hex:'#FF8C00', color:0xFF8C00, quote:'"Streets raised me."',    stats:{speed:7,drift:7,accel:7,handling:7} },
  { id:'erika',   name:'Erika',        from:'Stoke',      car:'SPORTS', hex:'#FF2D8B', color:0xFF2D8B, quote:'"Don\'t blink."',         stats:{speed:7,drift:6,accel:8,handling:7} },
  { id:'rhianon', name:'Rhianon',      from:'Coventry',   car:'MUSCLE', hex:'#00B5B5', color:0x00B5B5, quote:'"Raw power wins."',       stats:{speed:8,drift:4,accel:7,handling:5} },
  { id:'liane',   name:'Liane',        from:'Coventry',   car:'DRIFT',  hex:'#48C774', color:0x48C774, quote:'"Smoke \'em out."',       stats:{speed:6,drift:9,accel:6,handling:8} },
  { id:'evi',     name:'Evi',          from:'Coventry',   car:'SPORTS', hex:'#9B7FFF', color:0x9B7FFF, quote:'"Smooth operator."',      stats:{speed:7,drift:7,accel:7,handling:8} },
  { id:'friend',  name:'Friend',       from:'Stoke',      car:'STREET', hex:'#FFB347', color:0xFFB347, quote:'"Everyone\'s underestimating me."', stats:{speed:7,drift:6,accel:7,handling:7} },
  { id:'birat',   name:'Birat',        from:'Sheffield',  car:'MUSCLE', hex:'#C0392B', color:0xC0392B, quote:'"Yorkshire steel."',      stats:{speed:9,drift:4,accel:6,handling:5} },
  { id:'ishant',  name:'Ishant',       from:'Liverpool',  car:'DRIFT',  hex:'#F1C40F', color:0xF1C40F, quote:'"Watch the master."',     stats:{speed:6,drift:9,accel:7,handling:8} },
  { id:'leila',   name:'Leila (maybe)',from:'Cardiff',    car:'SPORTS', hex:'#8E44AD', color:0x8E44AD, quote:'"Maybe I\'ll win. Maybe."',stats:{speed:7,drift:7,accel:7,handling:8} },
];

// ─── Car type display info ────────────────────────────────────────────────────
export const CAR_TYPES = {
  MUSCLE: { name:'MUSCLE CAR',     icon:'💪', desc:'Brute force. Zero subtlety.' },
  SPORTS: { name:'SPORTS CAR',     icon:'🏎️', desc:'Balanced. Deadly.' },
  DRIFT:  { name:'DRIFT MACHINE',  icon:'🌀', desc:'Sideways by design.' },
  STREET: { name:'STREET RACER',   icon:'🛣️', desc:'Born on the block.' },
};

// ─── Car physics configs ──────────────────────────────────────────────────────
// topSpeed: m/s  |  accel: m/s²  |  brake: m/s²  |  steer: rad/s
// normalGrip/driftGrip: lateral friction [0=ice, 1=glue]
export const CAR_CONFIGS = {
  MUSCLE: {
    topSpeed:52, reverseMax:12, accel:18, brake:30,
    steerSpeed:1.8, normalGrip:0.88, driftGrip:0.38, drag:0.015,
    nosBoost:22, nosCapacity:100,
    // Mesh dimensions
    bL:5.0, bW:2.1, bH:0.7, rL:2.2, rW:1.8, rH:0.72,
    wheelR:0.38, wheelW:0.32,
  },
  SPORTS: {
    topSpeed:50, reverseMax:12, accel:22, brake:28,
    steerSpeed:2.2, normalGrip:0.92, driftGrip:0.52, drag:0.014,
    nosBoost:18, nosCapacity:100,
    bL:4.5, bW:2.0, bH:0.65, rL:2.0, rW:1.7, rH:0.68,
    wheelR:0.35, wheelW:0.28,
  },
  DRIFT: {
    topSpeed:46, reverseMax:12, accel:16, brake:24,
    steerSpeed:2.8, normalGrip:0.70, driftGrip:0.22, drag:0.013,
    nosBoost:16, nosCapacity:100,
    bL:4.3, bW:1.95, bH:0.68, rL:1.9, rW:1.6, rH:0.65,
    wheelR:0.33, wheelW:0.26,
  },
  STREET: {
    topSpeed:48, reverseMax:12, accel:17, brake:26,
    steerSpeed:2.0, normalGrip:0.82, driftGrip:0.42, drag:0.014,
    nosBoost:19, nosCapacity:100,
    bL:4.6, bW:2.0, bH:0.70, rL:2.1, rW:1.72, rH:0.70,
    wheelR:0.36, wheelW:0.30,
  },
};

// ─── Track config ─────────────────────────────────────────────────────────────
export const TRACK = {
  innerR: 68,
  outerR: 100,
  centerR: 84,
  roadW: 32,
  totalLaps: 3,
};
