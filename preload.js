const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  onFileImported: (callback) => ipcRenderer.on('file-imported', (_, data) => callback(data)),

  // 窗口控制/
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  resizeWindow: (size) => ipcRenderer.invoke('resize-window', size),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  getCurrentDisplaySize: () => ipcRenderer.invoke('get-current-display-size'),
  getWindowSize: () => ipcRenderer.invoke('get-window-size'),

  // 监听窗口事件
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', (_, isMaximized) => callback(isMaximized)),
  onWindowResized: (callback) => ipcRenderer.on('window-resized', () => callback()),
  onWindowMoved: (callback) => ipcRenderer.on('window-moved', () => callback()),

  // 本地存储 API
  saveData: (key, data) => ipcRenderer.invoke('save-data', key, data),
  loadData: (key) => ipcRenderer.invoke('load-data', key),

  // 设置窗口
  openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),
  hideSettingsWindow: () => ipcRenderer.send('hide-settings-window'),
  showSettingsWindow: () => ipcRenderer.send('show-settings-window'),
  notifySettingsUpdated: () => ipcRenderer.send('settings-updated'),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', () => callback()),
  onSettingsWindowClosed: (callback) => ipcRenderer.on('settings-window-closed', () => callback()),

  // 窗口透明度
  setWindowOpacity: (opacity) => ipcRenderer.send('set-window-opacity', opacity),

  // 取色器
  openColorPicker: () => ipcRenderer.invoke('open-color-picker'),
  onColorPickerResult: (callback) => ipcRenderer.on('color-picker-result', (_, result) => callback(result)),
  removeColorPickerListener: () => ipcRenderer.removeAllListeners('color-picker-result'),

  // 鼠标位置追踪（用于沉浸模式自动隐藏）
  startMouseTracking: () => ipcRenderer.send('start-mouse-tracking'),
  stopMouseTracking: () => ipcRenderer.send('stop-mouse-tracking'),
  onMousePositionChanged: (callback) => ipcRenderer.on('mouse-position-changed', (_, isInside) => callback(isInside)),
  removeMousePositionListener: () => ipcRenderer.removeAllListeners('mouse-position-changed'),
});
