const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (dataUrl) => ipcRenderer.invoke('save-image', dataUrl)
})
