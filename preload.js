window.addEventListener('DOMContentLoaded', () => {
  const { versions } = process
  document.getElementById('electron-version').innerText = versions.electron
  document.getElementById('node-version').innerText = versions.node
})
