import React, { useRef, useState } from 'react';
import useStore from '../store/useStore';

const SettingsPanel = ({ isOpen, onClose }) => {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const isImmersiveMode = useStore((state) => state.isImmersiveMode);
  const saveWindowSize = useStore((state) => state.saveWindowSize);
  const shortcuts = useStore((state) => state.shortcuts);
  const updateShortcut = useStore((state) => state.updateShortcut);
  const saveToLocal = useStore((state) => state.saveToLocal);
  const colorInputRef = useRef(null);
  const fontColorInputRef = useRef(null);
  const [savingWindowSize, setSavingWindowSize] = useState(false);
  const [windowSizeSaved, setWindowSizeSaved] = useState(false);
  const [recordingShortcut, setRecordingShortcut] = useState(null);

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

  const handleBackgroundColorChange = (color) => {
    updateSettings({ backgroundColor: color });
    applyStyles({ backgroundColor: color });
  };

  const handleFontColorChange = (color) => {
    updateSettings({ fontColor: color, autoFontColor: false });
    applyStyles({ fontColor: color, autoFontColor: false });
  };

  const handleAutoFontColorToggle = () => {
    const newAutoFontColor = !settings.autoFontColor;
    updateSettings({ autoFontColor: newAutoFontColor });
    applyStyles({ autoFontColor: newAutoFontColor });
  };

  const handleCustomFontColorPicker = () => {
    if (fontColorInputRef.current) {
      fontColorInputRef.current.click();
    }
  };

  const handleCustomFontColorChange = (e) => {
    const color = e.target.value;
    handleFontColorChange(color);
  };

  const handleCustomColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    handleBackgroundColorChange(color);
  };

  const handleFontSizeChange = async (e) => {
    const fontSize = parseInt(e.target.value);
    updateSettings({ fontSize });
    applyStyles({ fontSize });

    // 沉浸模式下调整窗口高度
    if (isImmersiveMode && window.electronAPI) {
      const lineHeight = fontSize * settings.lineHeight;
      const height = Math.ceil(lineHeight * settings.linesPerScreen) + 40;
      await window.electronAPI.resizeWindow({ height });
    }
  };

  const handleLineHeightChange = async (e) => {
    const lineHeight = parseFloat(e.target.value);
    updateSettings({ lineHeight });
    applyStyles({ lineHeight });

    // 沉浸模式下调整窗口高度
    if (isImmersiveMode && window.electronAPI) {
      const lineHeightPx = settings.fontSize * lineHeight;
      const height = Math.ceil(lineHeightPx * settings.linesPerScreen) + 40;
      await window.electronAPI.resizeWindow({ height });
    }
  };

  const handleLinesPerScreenChange = async (e) => {
    const linesPerScreen = parseInt(e.target.value);
    updateSettings({ linesPerScreen });

    // 如果当前在沉浸模式，立即调整窗口高度
    if (isImmersiveMode && window.electronAPI) {
      const lineHeight = settings.fontSize * settings.lineHeight;
      const height = Math.ceil(lineHeight * linesPerScreen) + 40;
      await window.electronAPI.resizeWindow({ height });
    }
  };

  const applyStyles = (newSettings = {}) => {
    const mergedSettings = { ...settings, ...newSettings };
    const root = document.documentElement;

    root.style.setProperty('--bg-color', mergedSettings.backgroundColor);
    root.style.setProperty('--font-size', `${mergedSettings.fontSize}px`);
    root.style.setProperty('--line-height', mergedSettings.lineHeight);

    // 根据设置决定文字颜色
    if (mergedSettings.autoFontColor) {
      const isDark = isColorDark(mergedSettings.backgroundColor);
      root.style.setProperty('--text-color', isDark ? '#e0e0e0' : '#333333');
    } else {
      root.style.setProperty('--text-color', mergedSettings.fontColor);
    }
  };

  const isColorDark = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const handleSaveWindowSize = async () => {
    setSavingWindowSize(true);
    const success = await saveWindowSize();
    setSavingWindowSize(false);
    if (success) {
      setWindowSizeSaved(true);
      setTimeout(() => setWindowSizeSaved(false), 2000);
    }
  };

  // 格式化快捷键显示
  const formatShortcut = (shortcut) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const parts = [];
    if (shortcut.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    parts.push(shortcut.key === 'Enter' ? '↵' : shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  // 开始录制快捷键
  const startRecording = (action) => {
    setRecordingShortcut(action);
  };

  // 处理快捷键录入
  const handleKeyDown = (e, action) => {
    if (recordingShortcut !== action) return;

    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    // 忽略单独的修饰键
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) return;

    const newShortcut = {
      key: key,
      ctrl: e.ctrlKey || e.metaKey,
    };

    updateShortcut(action, newShortcut);
    setRecordingShortcut(null);
    saveToLocal();
  };

  // 取消录制
  const cancelRecording = () => {
    setRecordingShortcut(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* 设置面板 - 固定尺寸，不受窗口大小影响 */}
      <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 p-5 z-10 w-[360px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">阅读设置</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
              className={`h-10 rounded border-2 transition-all ${
                settings.backgroundColor === color.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <button
          onClick={handleCustomColorPicker}
          className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
        >
          自定义颜色
        </button>
        <input
          ref={colorInputRef}
          type="color"
          value={settings.backgroundColor}
          onChange={handleCustomColorChange}
          className="hidden"
        />
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
                  className={`h-10 rounded border-2 transition-all flex items-center justify-center ${
                    settings.fontColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: '#f0f0f0' }}
                  title={color.name}
                >
                  <span style={{ color: color.value, fontWeight: 'bold' }}>A</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleCustomFontColorPicker}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
            >
              自定义颜色
            </button>
            <input
              ref={fontColorInputRef}
              type="color"
              value={settings.fontColor}
              onChange={handleCustomFontColorChange}
              className="hidden"
            />
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

      {/* 保存窗口大小 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          窗口设置
        </label>
        <button
          onClick={handleSaveWindowSize}
          disabled={savingWindowSize}
          className={`w-full px-3 py-2 text-sm rounded border transition-colors ${
            windowSizeSaved
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
                className={`px-3 py-1 text-sm rounded border transition-colors min-w-[100px] text-center ${
                  recordingShortcut === action
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

export default SettingsPanel;
