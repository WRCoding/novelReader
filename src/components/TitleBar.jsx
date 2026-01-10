import React, { useState, useEffect } from 'react';

const TitleBar = ({ fileName, hasContent, onOpenFile, onBackToBookshelf, onToggleSettings, onToggleImmersive, isImmersive }) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // 检测是否是 macOS
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  if (isImmersive) {
    return null; // 沉浸式模式下隐藏标题栏
  }

  return (
    <div
      className="flex items-center justify-between h-12 bg-gray-100 border-b border-gray-200 px-4 no-select"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* 左侧：返回按钮和标题（macOS需要留出交通灯空间） */}
      <div className={`flex items-center space-x-3 ${isMac ? 'ml-16' : ''}`}>
        {hasContent && (
          <button
            onClick={onBackToBookshelf}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' }}
            title="返回书架"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="text-sm font-medium text-gray-700">
          {hasContent ? fileName : '小说阅读器'}
        </div>
      </div>

      {/* 中间：操作按钮 */}
      <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {hasContent ? (
          <>
            <button
              onClick={onToggleSettings}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Ctrl/⌘+,"
            >
              设置
            </button>
            <button
              onClick={onToggleImmersive}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Ctrl/⌘+Enter"
            >
              沉浸模式
            </button>
          </>
        ) : (
          <button
            onClick={onToggleSettings}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="Ctrl/⌘+,"
          >
            设置
          </button>
        )}
      </div>

      {/* 右侧：窗口控制按钮（仅Windows显示） */}
      {!isMac && (
        <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
            title="最小化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
            title="最大化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" strokeWidth={2} rx="2" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* macOS右侧占位，保持布局平衡 */}
      {isMac && <div className="w-16" />}
    </div>
  );
};

export default TitleBar;
