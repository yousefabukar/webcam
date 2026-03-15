const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (dataUrl) => ipcRenderer.invoke('save-image', dataUrl),
  saveVideo: (base64) => ipcRenderer.invoke('save-video', base64),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
})
