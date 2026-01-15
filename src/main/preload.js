
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
contextBridge.exposeInMainWorld('kiosk', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (updates) => ipcRenderer.invoke('config:set', updates),
  addEvent: (payload) => ipcRenderer.invoke('events:add', payload),
  undoLast: (args) => ipcRenderer.invoke('events:undoLast', args),
  lookupByToken: (token) => ipcRenderer.invoke('students:lookupByToken', token),
  importRosterCsv: (csv) => ipcRenderer.invoke('students:importCsv', csv),
  markExceptionToday: (payload) => ipcRenderer.invoke('admin:exceptionToday', payload),
  manualCheckout: (payload) => ipcRenderer.invoke('admin:manualCheckout', payload),
  asset: (name) => { const base = process.resourcesPath || process.cwd(); return 'file://' + path.join(base, 'assets', name); },
  assetFromPath: (absolute) => { if (!absolute) return null; return 'file://' + absolute; }
});
