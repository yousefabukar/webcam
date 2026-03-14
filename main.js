const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  win.loadFile('index.html')
}

ipcMain.handle('save-image', async (_event, dataUrl) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Save Photo',
    defaultPath: `photo-${Date.now()}.png`,
    filters: [
      { name: 'Images', extensions: ['png', 'jpeg', 'jpg'] }
    ]
  })

  if (canceled || !filePath) return { success: false }

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
  return { success: true, filePath }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
