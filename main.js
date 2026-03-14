const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    frame: false,
    backgroundColor: '#08080f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  win.maximize()
  win.loadFile('index.html')
}



ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender).minimize())
ipcMain.on('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window-close', (e) => BrowserWindow.fromWebContents(e.sender).close())

ipcMain.handle('save-image', (_event, dataUrl) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const uint8 = new Uint8Array(Buffer.from(base64, 'base64'))
  console.log(uint8)
  return uint8
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
