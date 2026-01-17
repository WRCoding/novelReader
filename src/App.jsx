import React, { useEffect, useCallback, useRef, useState } from 'react';
import TitleBar from './components/TitleBar';
import FileImport from './components/FileImport';
import Reader from './components/Reader';
import useStore from './store/useStore';

function App() {
  const fileName = useStore((state) => state.fileName);
  const content = useStore((state) => state.content);
  const isImmersiveMode = useStore((state) => state.isImmersiveMode);
  const toggleImmersiveMode = useStore((state) => state.toggleImmersiveMode);
  const exitImmersiveMode = useStore((state) => state.exitImmersiveMode);
  const loadFromLocal = useStore((state) => state.loadFromLocal);
  const reloadSettings = useStore((state) => state.reloadSettings);
  const saveToLocal = useStore((state) => state.saveToLocal);
  const setFile = useStore((state) => state.setFile);
  const backToBookshelf = useStore((state) => state.backToBookshelf);
  const shortcuts = useStore((state) => state.shortcuts);
  const saveWindowSize = useStore((state) => state.saveWindowSize);
  const settings = useStore((state) => state.settings);
  const hasStartedReading = useStore((state) => state.hasStartedReading);

  const hideTimeoutRef = useRef(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);

  // 自动隐藏窗口逻辑（使用主进程鼠标位置检测，解决 Windows 兼容性问题）
  useEffect(() => {
    if (!window.electronAPI) return;

    // 只在沉浸模式 + 已开始阅读 + 开启自动隐藏时生效
    const shouldAutoHide = isImmersiveMode && hasStartedReading && settings.autoHideInImmersive;

    if (!shouldAutoHide) {
      // 停止追踪并确保窗口可见
      window.electronAPI.stopMouseTracking();
      window.electronAPI.setWindowOpacity(1);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      return;
    }

    // 使用主进程的鼠标位置检测
    const handleMousePosition = (isInside) => {
      if (isInside) {
        // 鼠标在窗口内，立即显示
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        window.electronAPI.setWindowOpacity(1);
      } else {
        // 鼠标离开窗口，立即隐藏
        window.electronAPI.setWindowOpacity(0);
      }
    };

    window.electronAPI.onMousePositionChanged(handleMousePosition);
    window.electronAPI.startMouseTracking();

    return () => {
      window.electronAPI.stopMouseTracking();
      window.electronAPI.removeMousePositionListener();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      // 清理时恢复窗口可见
      window.electronAPI.setWindowOpacity(1);
    };
  }, [isImmersiveMode, hasStartedReading, settings.autoHideInImmersive]);

  // 加载本地数据
  useEffect(() => {
    loadFromLocal();
  }, [loadFromLocal]);

  // 监听设置更新
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleSettingsUpdated = () => {
      reloadSettings();
    };

    window.electronAPI.onSettingsUpdated(handleSettingsUpdated);
  }, [reloadSettings]);

  // 保存数据当应用关闭时
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToLocal();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveToLocal]);

  // 打开文件
  const handleOpenFile = async () => {
    if (!window.electronAPI) return;

    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      const result = await window.electronAPI.readFile(filePath);
      if (result.success) {
        const fileName = filePath.split('/').pop();
        setFile(filePath, result.content, fileName);
      }
    }
  };

  // 返回书架
  const handleBackToBookshelf = () => {
    saveToLocal();
    backToBookshelf();
  };

  // 打开设置窗口
  const openSettings = () => {
    if (window.electronAPI) {
      window.electronAPI.openSettingsWindow();
    }
  };

  // 检查快捷键是否匹配
  const matchShortcut = (e, shortcut) => {
    const ctrlPressed = e.ctrlKey || e.metaKey;
    return e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlPressed === shortcut.ctrl;
  };

  // 键盘快捷键
  const handleKeyDown = useCallback((e) => {
    // 切换沉浸式模式
    if (matchShortcut(e, shortcuts.toggleImmersive) && content) {
      e.preventDefault();
      toggleImmersiveMode();
      return;
    }

    // 退出沉浸式模式
    if (matchShortcut(e, shortcuts.exitImmersive) && isImmersiveMode) {
      e.preventDefault();
      exitImmersiveMode();
      return;
    }

    // 打开文件（仅在书架时）
    if (matchShortcut(e, shortcuts.openFile) && !content) {
      e.preventDefault();
      handleOpenFile();
      return;
    }

    // 打开设置
    if (matchShortcut(e, shortcuts.toggleSettings)) {
      e.preventDefault();
      openSettings();
      return;
    }

    // 返回书架（仅在阅读时）
    if (matchShortcut(e, shortcuts.backToBookshelf) && content) {
      e.preventDefault();
      handleBackToBookshelf();
      return;
    }

    // 保存窗口大小
    if (matchShortcut(e, shortcuts.saveWindowSize)) {
      e.preventDefault();
      saveWindowSize();
      return;
    }
  }, [isImmersiveMode, toggleImmersiveMode, exitImmersiveMode, content, shortcuts, saveWindowSize]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TitleBar
        fileName={fileName}
        hasContent={!!content}
        onOpenFile={handleOpenFile}
        onBackToBookshelf={handleBackToBookshelf}
        onToggleSettings={openSettings}
        onToggleImmersive={toggleImmersiveMode}
        isImmersive={isImmersiveMode}
      />

      <div className={`flex-1 relative overflow-hidden ${isDraggingHandle ? 'pointer-events-none' : ''}`}>
        {!content ? (
          <FileImport />
        ) : (
          <Reader />
        )}
      </div>

      {/* 沉浸模式下的拖拽手柄 - 小巧的居中设计，不影响滚动 */}
      {isImmersiveMode && (
        <div
          className="fixed top-1 left-1/2 -translate-x-1/2 z-50 cursor-move px-4 py-1 rounded-full bg-gray-400/20 hover:bg-gray-400/40 transition-all opacity-30 hover:opacity-100"
          style={{ WebkitAppRegion: 'drag' }}
          title="拖动移动窗口"
          onMouseEnter={() => setIsDraggingHandle(true)}
          onMouseLeave={() => setIsDraggingHandle(false)}
        >
          <div className="w-8 h-1 bg-gray-500/50 rounded-full pointer-events-none"></div>
        </div>
      )}
    </div>
  );
}

export default App;
