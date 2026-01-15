
const fs = require('fs');
const path = require('path');
let cfg;
function cfgPath(){ const base = process.resourcesPath || process.cwd(); return path.join(base, 'config', 'app.config.json'); }
function getConfig(){ if(!cfg){ cfg = JSON.parse(fs.readFileSync(cfgPath(),'utf8')); } return cfg; }
function setConfig(updates){ cfg = { ...getConfig(), ...updates }; fs.writeFileSync(cfgPath(), JSON.stringify(cfg, null, 2), 'utf8'); return cfg; }
module.exports = { getConfig, setConfig };
