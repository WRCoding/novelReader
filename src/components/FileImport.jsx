import React, { useState } from 'react';
import useStore from '../store/useStore';

const FileImport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const setFile = useStore((state) => state.setFile);
  const content = useStore((state) => state.content);
  const bookshelf = useStore((state) => state.bookshelf);
  const openBook = useStore((state) => state.openBook);
  const removeFromBookshelf = useStore((state) => state.removeFromBookshelf);

  const handleFileSelect = async () => {
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

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.txt')) {
        const filePath = file.path;
        if (window.electronAPI) {
          const result = await window.electronAPI.readFile(filePath);
          if (result.success) {
            setFile(filePath, result.content, file.name);
          }
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleOpenBook = async (book) => {
    const success = await openBook(book);
    if (!success) {
      // 文件不存在，询问是否删除
      if (confirm(`文件不存在或无法读取：\n${book.fileName}\n\n是否从书架移除？`)) {
        removeFromBookshelf(book.filePath);
      }
    }
  };

  const handleRemoveBook = (e, filePath) => {
    e.stopPropagation();
    if (confirm('确定要从书架移除这本书吗？')) {
      removeFromBookshelf(filePath);
    }
  };

  const formatProgress = (progress) => {
    return `${Math.round(progress * 100)}%`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return date.toLocaleDateString();
  };

  // 如果已经有内容，不显示导入界面
  if (content) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full transition-colors ${
        isDragging ? 'bg-blue-50' : 'bg-gray-50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* 书架标题和导入按钮 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-700">我的书架</h2>
        <button
          onClick={handleFileSelect}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          导入书籍
        </button>
      </div>

      {/* 书架内容 */}
      <div className="flex-1 overflow-auto p-6">
        {bookshelf.length === 0 ? (
          /* 空书架提示 */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="h-24 w-24 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-500 mb-2">书架空空如也</h3>
            <p className="text-gray-400 mb-6">
              点击上方按钮导入书籍，或将 TXT 文件拖放至此处
            </p>
          </div>
        ) : (
          /* 书籍列表 */
          <div className="grid gap-3">
            {bookshelf.map((book) => (
              <div
                key={book.filePath}
                onClick={() => handleOpenBook(book)}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
              >
                {/* 书籍图标 */}
                <div className="flex-shrink-0 w-12 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V4H6zm2 2h8v2H8V6zm0 4h8v2H8v-2z" />
                  </svg>
                </div>

                {/* 书籍信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{book.fileName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>阅读进度: {formatProgress(book.progress)}</span>
                    <span>·</span>
                    <span>{formatDate(book.lastRead)}</span>
                  </div>
                  {/* 进度条 */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${book.progress * 100}%` }}
                    />
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleRemoveBook(e, book.filePath)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="从书架移除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拖拽提示覆盖层 */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-400 flex items-center justify-center z-10">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xl font-medium text-blue-600">释放以导入文件</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileImport;
