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
      className="flex items-center justify-between h-14 px-4 select-none glass z-50 relative"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* 左侧：返回按钮和标题（macOS需要留出交通灯空间） */}
      <div className={`flex items-center gap-4 ${isMac ? 'ml-20' : ''}`}>
        {hasContent && (
          <button
            onClick={onBackToBookshelf}
            className="flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-800 hover:bg-black/5 rounded-md transition-all"
            style={{ WebkitAppRegion: 'no-drag' }}
            title="返回书架"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-700 leading-tight">
             {hasContent ? fileName : 'Novel Reader'}
          </div>
          {hasContent && <div className="text-[10px] text-gray-400 font-medium">阅读中</div>}
        </div>
      </div>

      {/* 中间：操作按钮 */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {hasContent ? (
          <>
            <button
              onClick={onToggleSettings}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-black/5 rounded-md transition-colors"
              title="设置 (Ctrl/⌘+,)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onToggleImmersive}
              className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors font-medium flex items-center gap-1.5"
              title="沉浸模式 (Ctrl/⌘+Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>沉浸</span>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleSettings}
             className="p-2 text-gray-500 hover:text-gray-800 hover:bg-black/5 rounded-md transition-colors"
            title="设置 (Ctrl/⌘+,)"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>
        )}
      </div>

      {/* 右侧：窗口控制按钮（仅Windows显示） */}
      {!isMac && (
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={handleMinimize}
            className="w-10 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded transition-colors"
            title="最小化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-10 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded transition-colors"
            title="最大化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={1.5} />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-8 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white rounded transition-colors"
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* macOS右侧占位（如果需要平衡布局） */}
      {isMac && <div className="w-16" />}
    </div>
  );
};

export default TitleBar;
