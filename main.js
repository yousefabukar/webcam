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

ipcMain.handle('save-image', async (_event, dataUrl) => {
  try {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64, 'base64')

    const FormData = require('form-data')
    const fetch = require('node-fetch')

    const form = new FormData()
    form.append('image', imageBuffer, { filename: 'capture.jpg', contentType: 'image/jpeg' })

    const res = await (await fetch('http://localhost:3001/pixels', { method: 'POST', body: form, headers: form.getHeaders() })).json()
    return { success: true, ...res }
  } catch (err) {
    console.error('save-image error:', err)
    return { success: false, error: err.message }
  }
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
