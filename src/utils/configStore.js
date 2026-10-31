const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

// Schreibt die übergebenen Keys sowohl in die config.json auf der Platte
// als auch ins bereits geladene config-Objekt (require() cached dieses
// Objekt, alle Module teilen sich dieselbe Referenz - Änderungen wirken
// also sofort, ohne Bot-Neustart).
function updateConfig(partial) {
  Object.assign(config, partial);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  return config;
}

module.exports = { updateConfig };
