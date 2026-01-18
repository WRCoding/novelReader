import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

const SettingsWindow = () => {
  const [settings, setSettings] = useState({
    backgroundColor: '#ffffff',
    fontColor: '#333333',
    autoFontColor: true,
    fontSize: 18,
    lineHeight: 1.8,
    linesPerScreen: 20,
    padding: 16,
    autoHideInImmersive: true,
    scrollSpeed: 1,
    showScrollbarInImmersive: false,
  });
  const [shortcuts, setShortcuts] = useState({});
  const [recordingShortcut, setRecordingShortcut] = useState(null);
  const [savingWindowSize, setSavingWindowSize] = useState(false);
  const [windowSizeSaved, setWindowSizeSaved] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [pickingColorType, setPickingColorType] = useState(null);
  const [isLoadingColorPicker, setIsLoadingColorPicker] = useState(false);
  const colorInputRef = useRef(null);
  const fontColorInputRef = useRef(null);

  const presetColors = [
    { name: '纯白', value: '#ffffff' },
    { name: '米黄', value: '#f4ecd8' },
    { name: '护眼绿', value: '#c7edcc' },
    { name: '深色', value: '#1e1e1e' },
  ];

  const presetFontColors = [
    { name: '深灰', value: '#333333' },
    { name: '纯黑', value: '#000000' },
    { name: '浅灰', value: '#e0e0e0' },
    { name: '米白', value: '#f5f5dc' },
  ];

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    loadSettings();
  }, []);

  // 监听取色器结果
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleColorPickerResult = (result) => {
      if (result.success && result.color && pickingColorType) {
        if (pickingColorType === 'bg') {
          handleBackgroundColorChange(result.color);
        } else if (pickingColorType === 'font') {
          handleFontColorChange(result.color);
        }
      }
      setPickingColorType(null);
    };

    window.electronAPI.onColorPickerResult(handleColorPickerResult);

    return () => {
      window.electronAPI.removeColorPickerListener();
    };
  }, [pickingColorType, settings]);

  const loadSettings = async () => {
    if (!window.electronAPI) return;

    const settingsResult = await window.electronAPI.loadData('settings');
    if (settingsResult.success && settingsResult.data) {
      setSettings(settingsResult.data);
    }

    const shortcutsResult = await window.electronAPI.loadData('shortcuts');
    if (shortcutsResult.success && shortcutsResult.data) {
      setShortcuts(shortcutsResult.data);
    } else {
      // 默认快捷键
      setShortcuts({
        openFile: { key: 'o', ctrl: true, description: '打开文件' },
        toggleSettings: { key: ',', ctrl: true, description: '打开设置' },
        toggleImmersive: { key: 'Enter', ctrl: true, description: '切换沉浸模式' },
        backToBookshelf: { key: 'b', ctrl: true, description: '返回书架' },
        exitImmersive: { key: 'Escape', ctrl: false, description: '退出沉浸模式' },
        saveWindowSize: { key: 's', ctrl: true, description: '保存窗口大小' },
      });
    }
  };

  const saveSettings = async (newSettings) => {
    if (!window.electronAPI) return;
    await window.electronAPI.saveData('settings', newSettings);
    window.electronAPI.notifySettingsUpdated();
  };

  const saveShortcuts = async (newShortcuts) => {
    if (!window.electronAPI) return;
    await window.electronAPI.saveData('shortcuts', newShortcuts);
    window.electronAPI.notifySettingsUpdated();
  };

  const handleBackgroundColorChange = (color) => {
    const newSettings = { ...settings, backgroundColor: color };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleFontColorChange = (color) => {
    const newSettings = { ...settings, fontColor: color, autoFontColor: false };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAutoFontColorToggle = () => {
    const newSettings = { ...settings, autoFontColor: !settings.autoFontColor };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleCustomFontColorPicker = () => {
    if (fontColorInputRef.current) {
      fontColorInputRef.current.click();
    }
  };

  const handleCustomFontColorChange = (e) => {
    handleFontColorChange(e.target.value);
  };

  const handleCustomColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleCustomColorChange = (e) => {
    handleBackgroundColorChange(e.target.value);
  };

  const handleColorPicker = async (type) => {
    if (!window.electronAPI) return;
    setPickingColorType(type);
    setIsLoadingColorPicker(true);
    try {
      await window.electronAPI.openColorPicker();
    } catch (error) {
      console.error('Failed to open color picker:', error);
      setIsLoadingColorPicker(false);
      setPickingColorType(null);
    } finally {
      setIsLoadingColorPicker(false);
    }
  };

  const handleFontSizeChange = (e) => {
    const newSettings = { ...settings, fontSize: parseInt(e.target.value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLineHeightChange = (e) => {
    const newSettings = { ...settings, lineHeight: parseFloat(e.target.value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLinesPerScreenChange = (e) => {
    const newSettings = { ...settings, linesPerScreen: parseInt(e.target.value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handlePaddingChange = (e) => {
    const newSettings = { ...settings, padding: parseInt(e.target.value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAutoHideChange = (e) => {
    const newSettings = { ...settings, autoHideInImmersive: e.target.checked };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleScrollSpeedChange = (e) => {
    const newSettings = { ...settings, scrollSpeed: parseFloat(e.target.value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveWindowSize = async () => {
    if (!window.electronAPI) return;
    setSavingWindowSize(true);
    try {
      const size = await window.electronAPI.getWindowSize();
      await window.electronAPI.saveData('windowSize', size);
      setWindowSizeSaved(true);
      setTimeout(() => setWindowSizeSaved(false), 2000);
    } catch (error) {
      console.error('保存窗口大小失败:', error);
    }
    setSavingWindowSize(false);
  };

  const formatShortcut = (shortcut) => {
    const parts = [];
    if (shortcut.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    parts.push(shortcut.key === 'Enter' ? '↵' : shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  const startRecording = (action) => {
    setRecordingShortcut(action);
  };

  const handleKeyDown = (e, action) => {
    if (recordingShortcut !== action) return;

    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) return;

    const newShortcuts = {
      ...shortcuts,
      [action]: {
        ...shortcuts[action],
        key: key,
        ctrl: e.ctrlKey || e.metaKey,
      }
    };

    setShortcuts(newShortcuts);
    setRecordingShortcut(null);
    saveShortcuts(newShortcuts);
  };

  const cancelRecording = () => {
    setRecordingShortcut(null);
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeSettingsWindow();
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 标题栏 */}
      <div
        className={`flex items-center justify-between h-12 bg-gray-100 border-b border-gray-200 px-4 ${isMac ? 'pl-20' : ''}`}
        style={{ WebkitAppRegion: 'drag' }}
      >
        <h3 className="text-base font-semibold text-gray-800">设置</h3>
        {!isMac && (
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
            style={{ WebkitAppRegion: 'no-drag' }}
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* 背景颜色 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            背景颜色
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleBackgroundColorChange(color.value)}
                className={`h-10 rounded border-2 transition-all ${settings.backgroundColor === color.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          {/* 自定义颜色：颜色选择器 + 十六进制输入框 */}
          <div className="flex items-center gap-2">
            <input
              ref={colorInputRef}
              type="color"
              value={settings.backgroundColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              title="点击选择颜色"
            />
            <input
              type="text"
              value={settings.backgroundColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                  handleBackgroundColorChange(value || '#ffffff');
                }
              }}
              onBlur={(e) => {
                // 确保是有效的颜色值
                if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  handleBackgroundColorChange('#ffffff');
                }
              }}
              placeholder="#ffffff"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={() => handleColorPicker('bg')}
              disabled={pickingColorType !== null || isLoadingColorPicker}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap disabled:opacity-50"
              title="从屏幕取色"
            >
              {isLoadingColorPicker && pickingColorType === 'bg' ? '启动中...' : '取色'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            可直接输入十六进制颜色值（如 #f4ecd8）
          </p>
        </div>

        {/* 字体颜色 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            字体颜色
          </label>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="autoFontColor"
              checked={settings.autoFontColor}
              onChange={handleAutoFontColorToggle}
              className="mr-2"
            />
            <label htmlFor="autoFontColor" className="text-sm text-gray-600">
              自动适配背景色
            </label>
          </div>
          {!settings.autoFontColor && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {presetFontColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleFontColorChange(color.value)}
                    className={`h-10 rounded border-2 transition-all flex items-center justify-center ${settings.fontColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                    style={{ backgroundColor: '#f0f0f0' }}
                    title={color.name}
                  >
                    <span style={{ color: color.value, fontWeight: 'bold', fontSize: '18px' }}>A</span>
                  </button>
                ))}
              </div>
              {/* 自定义字体颜色：颜色选择器 + 十六进制输入框 */}
              <div className="flex items-center gap-2">
                <input
                  ref={fontColorInputRef}
                  type="color"
                  value={settings.fontColor}
                  onChange={handleCustomFontColorChange}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  title="点击选择颜色"
                />
                <input
                  type="text"
                  value={settings.fontColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                      handleFontColorChange(value || '#333333');
                    }
                  }}
                  onBlur={(e) => {
                    // 确保是有效的颜色值
                    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleFontColorChange('#333333');
                    }
                  }}
                  placeholder="#333333"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={() => handleColorPicker('font')}
                  disabled={pickingColorType !== null || isLoadingColorPicker}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap disabled:opacity-50"
                  title="从屏幕取色"
                >
                  {isLoadingColorPicker && pickingColorType === 'font' ? '启动中...' : '取色'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                可直接输入十六进制颜色值
              </p>
            </>
          )}
        </div>

        {/* 字体大小 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            字体大小: {settings.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="32"
            value={settings.fontSize}
            onChange={handleFontSizeChange}
            className="w-full"
          />
        </div>

        {/* 行高 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            行高: {settings.lineHeight}
          </label>
          <input
            type="range"
            min="1.2"
            max="3.0"
            step="0.1"
            value={settings.lineHeight}
            onChange={handleLineHeightChange}
            className="w-full"
          />
        </div>

        {/* 内边距 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            左右内边距: {settings.padding}px
          </label>
          <input
            type="range"
            min="0"
            max="64"
            step="4"
            value={settings.padding}
            onChange={handlePaddingChange}
            className="w-full"
          />
        </div>

        {/* 滚动速度 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            滚动速度: {settings.scrollSpeed}x
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={settings.scrollSpeed}
            onChange={handleScrollSpeedChange}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            调整鼠标滚轮和键盘滚动的速度
          </p>
        </div>

        {/* 沉浸模式行数 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            沉浸模式每屏行数: {settings.linesPerScreen}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={settings.linesPerScreen}
            onChange={handleLinesPerScreenChange}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            进入沉浸模式后窗口高度将自动调整
          </p>
        </div>

        {/* 沉浸模式自动隐藏 */}
        <div className="mb-5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">沉浸模式自动隐藏窗口</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.autoHideInImmersive}
                onChange={handleAutoHideChange}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${settings.autoHideInImmersive ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.autoHideInImmersive ? 'translate-x-5' : 'translate-x-1'
                  }`} />
              </div>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            开启后，阅读时鼠标移出窗口会自动隐藏
          </p>
        </div>

        {/* 沉浸模式显示滚动条 */}
        <div className="mb-5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">沉浸模式显示滚动条</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.showScrollbarInImmersive}
                onChange={(e) => {
                  const newSettings = { ...settings, showScrollbarInImmersive: e.target.checked };
                  setSettings(newSettings);
                  saveSettings(newSettings);
                }}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${settings.showScrollbarInImmersive ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showScrollbarInImmersive ? 'translate-x-5' : 'translate-x-1'
                  }`} />
              </div>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            开启后，沉浸模式下也会显示滚动条
          </p>
        </div>

        {/* 保存窗口大小 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            窗口设置
          </label>
          <button
            onClick={handleSaveWindowSize}
            disabled={savingWindowSize}
            className={`w-full px-3 py-2 text-sm rounded border transition-colors ${windowSizeSaved
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
          >
            {savingWindowSize ? '保存中...' : windowSizeSaved ? '已保存' : '保存当前窗口大小'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            下次打开时将恢复保存的窗口大小
          </p>
        </div>

        {/* 快捷键设置 */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            快捷键设置
          </label>
          <div className="space-y-2">
            {Object.entries(shortcuts).map(([action, shortcut]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{shortcut.description}</span>
                <button
                  onClick={() => startRecording(action)}
                  onKeyDown={(e) => handleKeyDown(e, action)}
                  onBlur={cancelRecording}
                  className={`px-3 py-1 text-sm rounded border transition-colors min-w-[100px] text-center ${recordingShortcut === action
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                    }`}
                >
                  {recordingShortcut === action ? '按下快捷键...' : formatShortcut(shortcut)}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            点击快捷键按钮后，按下新的组合键即可修改
          </p>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SettingsWindow />);
