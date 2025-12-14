// === namehelper.js ===

// --- Prefixes: NATO Phonetic Alphabet ---
const PREFIXES = [
  "Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India",
  "Juliet","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo",
  "Sierra","Tango","Uniform","Victor","Whiskey","X-ray","Yankee","Zulu"
];

// --- Numbers 01-99 ---
const NUMBERS = Array.from({ length: 99 }, (_, i) => String(i + 1).padStart(2, '0'));

// --- Call Signs / Nicknames (50 examples) ---
const NICKNAMES = [
  "Defenders","Annihilators","Guardians","Sentinels","Rangers","Phantoms","Vipers",
  "Hawks","Wolves","Falcons","Titans","Predators","Shadows","Storm","Reapers",
  "Dragons","Blazers","Crusaders","Raiders","Paladins","Warriors","Lions","Panthers",
  "Eagles","Tigers","Berserkers","Avengers","Juggernauts","Snipers","Nomads","Ravens",
  "Corsairs","Vanguards","Outlaws","Stormbreakers","Ironclads","Griffins","Dreadnoughts",
  "Thunder","Hurricanes","Scorpions","Cyclones","Ghosts","Fangs","Nightmares","Specters",
  "Sabers","Jugglers","Marauders"
];

// --- Generator function ---
function generateSquadName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const number = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
  return `${prefix}-${number} '${nickname}'`;
}

// --- Export ---
module.exports = { generateSquadName };
