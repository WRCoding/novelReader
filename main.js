const { app, BrowserWindow, ipcMain, dialog, screen, nativeImage, Tray, Menu, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const chardet = require('chardet');
const iconv = require('iconv-lite');

let mainWindow;
let settingsWindow = null;
let colorPickerWindow = null;
let tray = null;
let mouseCheckInterval = null;

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
    // minWidth: 300,
    // minHeight: 50,
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

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  // 根据平台调整托盘图标大小
  let trayIcon;
  if (process.platform === 'win32') {
    // Windows 托盘图标建议 16x16 或 32x32
    trayIcon = icon.resize({ width: 16, height: 16 });
  } else if (process.platform === 'darwin') {
    // macOS 菜单栏图标建议 16x16 或 22x22
    trayIcon = icon.resize({ width: 16, height: 16 });
    // 设置为模板图像，这样可以适应深色/浅色模式
    trayIcon.setTemplateImage(true);
  } else {
    // Linux
    trayIcon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '设置',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('小说阅读器');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Windows 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  // 设置 Dock 栏图标
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    app.dock.setIcon(iconPath);
  }

  createWindow(false);  // 启动时不显示窗口
  createTray();  // 创建系统托盘
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

// 读取文件内容（自动检测编码）
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    // 读取原始二进制数据
    const buffer = fs.readFileSync(filePath);

    // 检测文件编码
    const detectedEncoding = chardet.detect(buffer);
    const encoding = detectedEncoding || 'utf-8';

    // 使用检测到的编码解码文件内容
    let content;
    if (encoding.toLowerCase() === 'utf-8' || encoding.toLowerCase() === 'utf8') {
      content = buffer.toString('utf-8');
    } else {
      content = iconv.decode(buffer, encoding);
    }

    return { success: true, content, encoding };
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

// 隐藏设置窗口（用于取色）
ipcMain.on('hide-settings-window', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.hide();
  }
});

// 显示设置窗口（取色完成后恢复）
ipcMain.on('show-settings-window', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
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

// 启动鼠标位置检测（用于沉浸模式自动隐藏，解决 Windows 兼容性问题）
ipcMain.on('start-mouse-tracking', () => {
  if (mouseCheckInterval) return;

  mouseCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const mousePos = screen.getCursorScreenPoint();
    const winBounds = mainWindow.getBounds();

    const isInsideWindow =
      mousePos.x >= winBounds.x &&
      mousePos.x <= winBounds.x + winBounds.width &&
      mousePos.y >= winBounds.y &&
      mousePos.y <= winBounds.y + winBounds.height;

    mainWindow.webContents.send('mouse-position-changed', isInsideWindow);
  }, 100);
});

// 停止鼠标位置检测
ipcMain.on('stop-mouse-tracking', () => {
  if (mouseCheckInterval) {
    clearInterval(mouseCheckInterval);
    mouseCheckInterval = null;
  }
  // 确保窗口可见
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(1);
  }
});

// 取色器功能
let screenshotTempPath = null;

// 打开取色器
ipcMain.handle('open-color-picker', async () => {
  try {
    // 先隐藏设置窗口
    // if (settingsWindow && !settingsWindow.isDestroyed()) {
    //   settingsWindow.hide();
    // }

    // 等待窗口完全隐藏
    await new Promise(resolve => setTimeout(resolve, 200));

    // 获取主显示器
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor;

    // 截取屏幕
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.floor(width * scaleFactor),
        height: Math.floor(height * scaleFactor)
      }
    });

    if (sources.length === 0) {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.show();
      }
      return { success: false, error: '无法获取屏幕截图' };
    }

    // 获取第一个屏幕源
    const source = sources[0];
    const screenshot = source.thumbnail;

    // 转换为 Buffer (避免 Base64 开销)
    const pngBuffer = screenshot.toPNG();

    // 创建全屏取色窗口
    colorPickerWindow = new BrowserWindow({
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width: width,
      height: height,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      fullscreen: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
    // colorPickerWindow.webContents.openDevTools({ mode: 'detach' });
    colorPickerWindow.loadFile('colorpicker.html');

    colorPickerWindow.webContents.once('did-finish-load', () => {
      colorPickerWindow.webContents.send('screenshot-ready', {
        buffer: pngBuffer,
        scaleFactor: scaleFactor
      });
    });

    colorPickerWindow.on('closed', () => {
      colorPickerWindow = null;
    });

    return { success: true };
  } catch (error) {
    console.error('打开取色器失败:', error);
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.show();
    }
    return { success: false, error: error.message };
  }
});

// 取色完成
ipcMain.on('color-picked', (event, color) => {
  if (colorPickerWindow && !colorPickerWindow.isDestroyed()) {
    colorPickerWindow.close();
  }
  // 通知设置窗口颜色已选择
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    // settingsWindow.show();
    settingsWindow.webContents.send('color-picker-result', { success: true, color });
    settingsWindow.focus();
  }
});

// 取色取消
ipcMain.on('color-picker-cancelled', () => {
  if (colorPickerWindow && !colorPickerWindow.isDestroyed()) {
    colorPickerWindow.close();
  }
  // 通知设置窗口取色已取消
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    // settingsWindow.show();
    settingsWindow.webContents.send('color-picker-result', { success: false, cancelled: true });
    settingsWindow.focus();
  }
});
