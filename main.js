const { app, BrowserWindow, ipcMain, dialog, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settingsWindow = null;

// 获取保存的窗口大小
function getSavedWindowSize() {
  try {
    const dataFilePath = path.join(app.getPath('userData'), 'app-data.json');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      const allData = JSON.parse(content);
      if (allData.windowSize) {
        return allData.windowSize;
      }
    }
  } catch (error) {
    console.error('读取窗口大小失败:', error);
  }
  return null;
}

function createWindow(show = true) {
  const isMac = process.platform === 'darwin';
  const savedSize = getSavedWindowSize();

  mainWindow = new BrowserWindow({
    width: savedSize?.width || 1200,
    height: savedSize?.height || 800,
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    trafficLightPosition: isMac ? { x: 12, y: 16 } : undefined,
    transparent: false,
    backgroundColor: '#f3f4f6',
    resizable: true,
    minWidth: 300,
    minHeight: 50,
    show: show,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    if (show) {
      mainWindow.show();
    }
  });

  // 监听窗口状态变化
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });

  mainWindow.on('resize', () => {
    mainWindow.webContents.send('window-resized');
  });

  mainWindow.on('moved', () => {
    mainWindow.webContents.send('window-moved');
  });
}

app.whenReady().then(() => {
  // 设置 Dock 栏图标
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    app.dock.setIcon(iconPath);
  }

  createWindow(false);  // 启动时不显示窗口
});

// macOS 上点击 Dock 图标时显示窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(false);
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理打开文件对话框
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// 读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 窗口控制
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});

// 调整窗口尺寸
ipcMain.handle('resize-window', async (event, { width, height }) => {
  const [currentWidth, currentHeight] = mainWindow.getSize();
  const useWidth = width || currentWidth;
  const useHeight = height || currentHeight;

  // 获取屏幕工作区尺寸
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // 限制不超过屏幕尺寸
  const finalWidth = Math.min(useWidth, screenWidth);
  const finalHeight = Math.min(useHeight, screenHeight - 40);

  mainWindow.setSize(finalWidth, finalHeight, true);
  mainWindow.center();

  return { width: finalWidth, height: finalHeight };
});

// 获取屏幕信息
ipcMain.handle('get-screen-size', async () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

// 获取当前显示器尺寸
ipcMain.handle('get-current-display-size', async () => {
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });

  return {
    width: display.workAreaSize.width,
    height: display.workAreaSize.height
  };
});

// 获取当前窗口大小
ipcMain.handle('get-window-size', async () => {
  const [width, height] = mainWindow.getSize();
  return { width, height };
});

// 本地数据存储
const dataFilePath = path.join(app.getPath('userData'), 'app-data.json');

// 保存数据
ipcMain.handle('save-data', async (event, key, data) => {
  try {
    let allData = {};
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      allData = JSON.parse(content);
    }

    allData[key] = data;
    fs.writeFileSync(dataFilePath, JSON.stringify(allData, null, 2), 'utf-8');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 读取数据
ipcMain.handle('load-data', async (event, key) => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return { success: true, data: null };
    }

    const content = fs.readFileSync(dataFilePath, 'utf-8');
    const allData = JSON.parse(content);

    return { success: true, data: allData[key] || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 创建设置窗口
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const isMac = process.platform === 'darwin';

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 600,
    parent: mainWindow,
    modal: false,
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    resizable: false,
    minimizable: false,
    maximizable: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    // 通知主窗口设置窗口已关闭
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('settings-window-closed');
    }
  });
}

// 打开设置窗口
ipcMain.on('open-settings-window', () => {
  createSettingsWindow();
});

// 关闭设置窗口
ipcMain.on('close-settings-window', () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

// 通知主窗口设置已更新
ipcMain.on('settings-updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated');
  }
});

// 设置窗口透明度
ipcMain.on('set-window-opacity', (event, opacity) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(opacity);
  }
});
