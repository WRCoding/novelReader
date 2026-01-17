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

  // 生成根据文件名的随机渐变色
  const getBookGradient = (name) => {
    const gradients = [
      'from-blue-400 to-indigo-600',
      'from-emerald-400 to-cyan-600',
      'from-rose-400 to-red-600',
      'from-amber-400 to-orange-600',
      'from-violet-400 to-purple-600',
      'from-pink-400 to-rose-600'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  // 如果已经有内容，不显示导入界面
  if (content) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 relative ${isDragging ? 'bg-blue-50/50' : 'bg-transparent'
        }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* 头部区域 */}
      <div className="flex items-center justify-between px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">我的书架</h2>
        <button
          onClick={handleFileSelect}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          导入书籍
        </button>
      </div>

      {/* 书架内容 */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {bookshelf.length === 0 ? (
          /* 空书架提示 */
          <div className="flex flex-col items-center justify-center h-[60vh] text-center fade-in">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-10 w-10 text-gray-400"
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
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">开始阅读之旅</h3>
            <p className="text-gray-500 max-w-sm">
              点击上方"导入书籍"按钮，或者直接将 TXT 文件拖放到这里即可开始阅读。
            </p>
          </div>
        ) : (
          /* 书籍列表 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
            {bookshelf.map((book) => (
              <div
                key={book.filePath}
                onClick={() => handleOpenBook(book)}
                className="group relative bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 overflow-hidden"
              >
                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                {/* 书籍封面（拟物化） */}
                <div className={`flex-shrink-0 w-14 h-20 bg-gradient-to-br ${getBookGradient(book.fileName)} rounded-md shadow-md flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300`}>
                  <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V4H6zm2 2h8v2H8V6zm0 4h8v2H8v-2z" />
                  </svg>
                </div>

                {/* 书籍信息 */}
                <div className="flex-1 min-w-0 z-10">
                  <h3 className="font-semibold text-gray-800 truncate mb-1" title={book.fileName}>{book.fileName}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>{formatProgress(book.progress)}</span>
                      <span>{formatDate(book.lastRead)}读过</span>
                    </div>
                    {/* 进度条 */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full bg-gradient-to-r ${getBookGradient(book.fileName)} opacity-80`}
                        style={{ width: `${book.progress * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleRemoveBook(e, book.filePath)}
                  className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                  title="从书架移除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="absolute inset-4 bg-white/90 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center z-50 fade-in">
          <div className="text-center transform scale-110 transition-transform">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">释放以导入</p>
            <p className="text-gray-500 mt-2">支持 .txt 格式文件</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileImport;
