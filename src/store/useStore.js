import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 书架 - 存储所有导入的书籍
  bookshelf: [],

  // 当前阅读的文件
  filePath: null,
  content: '',
  fileName: '',

  // 阅读进度
  scrollPosition: 0,

  // 阅读样式设置
  settings: {
    backgroundColor: '#ffffff',
    fontColor: '#333333', // 字体颜色
    autoFontColor: true, // 是否自动根据背景色调整字体颜色
    fontSize: 18,
    lineHeight: 1.8,
    padding: 16, // 左右内边距
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    linesPerScreen: 20, // 沉浸式模式每屏显示行数
    autoHideInImmersive: true, // 沉浸模式下自动隐藏窗口
    scrollSpeed: 1, // 滚动速度倍率 (0.5-3)
    showScrollbarInImmersive: false, // 沉浸模式下是否显示滚动条
  },

  // 沉浸式模式
  isImmersiveMode: false,

  // 是否已开始阅读（用于自动隐藏功能）
  hasStartedReading: false,

  // 设置面板显示状态
  showSettings: false,

  // 快捷键配置
  shortcuts: {
    openFile: { key: 'o', ctrl: true, description: '打开文件' },
    toggleSettings: { key: ',', ctrl: true, description: '打开设置' },
    toggleImmersive: { key: 'Enter', ctrl: true, description: '切换沉浸模式' },
    backToBookshelf: { key: 'b', ctrl: true, description: '返回书架' },
    exitImmersive: { key: 'Escape', ctrl: false, description: '退出沉浸模式' },
    saveWindowSize: { key: 's', ctrl: true, description: '保存窗口大小' },
  },

  // Actions

  // 添加书籍到书架
  addToBookshelf: (filePath, fileName, content) => {
    const { bookshelf } = get();
    const existingIndex = bookshelf.findIndex(book => book.filePath === filePath);

    if (existingIndex === -1) {
      // 新书籍，添加到书架
      const newBook = {
        filePath,
        fileName,
        totalLength: content.length,
        scrollPosition: 0,
        progress: 0,
        lastRead: Date.now(),
      };
      set({ bookshelf: [newBook, ...bookshelf] });
    } else {
      // 已存在，更新最后阅读时间并移到最前
      const updatedBookshelf = [...bookshelf];
      const book = { ...updatedBookshelf[existingIndex], lastRead: Date.now() };
      updatedBookshelf.splice(existingIndex, 1);
      set({ bookshelf: [book, ...updatedBookshelf] });
    }
  },

  // 更新书架中某本书的进度
  updateBookProgress: (filePath, scrollPosition, totalHeight) => {
    const { bookshelf } = get();
    const updatedBookshelf = bookshelf.map(book => {
      if (book.filePath === filePath) {
        const progress = totalHeight > 0 ? Math.min(scrollPosition / totalHeight, 1) : 0;
        return { ...book, scrollPosition, progress, lastRead: Date.now() };
      }
      return book;
    });
    set({ bookshelf: updatedBookshelf });
  },

  // 从书架删除书籍
  removeFromBookshelf: (filePath) => {
    const { bookshelf, filePath: currentFilePath } = get();
    const updatedBookshelf = bookshelf.filter(book => book.filePath !== filePath);
    set({ bookshelf: updatedBookshelf });

    // 如果删除的是当前正在阅读的书，清空当前阅读状态
    if (currentFilePath === filePath) {
      set({ filePath: null, content: '', fileName: '', scrollPosition: 0 });
    }
  },

  // 打开书架中的书籍
  openBook: async (book) => {
    if (!window.electronAPI) return false;

    const result = await window.electronAPI.readFile(book.filePath);
    if (result.success) {
      set({
        filePath: book.filePath,
        content: result.content,
        fileName: book.fileName,
        scrollPosition: book.scrollPosition || 0,
      });
      // 更新最后阅读时间
      get().addToBookshelf(book.filePath, book.fileName, result.content);
      return true;
    }
    return false;
  },

  // 设置当前文件（新导入时使用）
  setFile: (filePath, content, fileName) => {
    const { bookshelf } = get();
    // 检查书籍是否已存在，如果存在则使用保存的进度
    const existingBook = bookshelf.find(book => book.filePath === filePath);
    const scrollPosition = existingBook ? existingBook.scrollPosition : 0;

    // 添加到书架
    get().addToBookshelf(filePath, fileName, content);
    // 设置为当前阅读（保留已有进度）
    set({ filePath, content, fileName, scrollPosition });
  },

  // 返回书架
  backToBookshelf: () => {
    const { filePath, scrollPosition, bookshelf } = get();

    // 保存当前进度到书架
    if (filePath) {
      const updatedBookshelf = bookshelf.map(book => {
        if (book.filePath === filePath) {
          return { ...book, scrollPosition, lastRead: Date.now() };
        }
        return book;
      });
      set({ bookshelf: updatedBookshelf });
    }

    // 清空当前阅读
    set({ filePath: null, content: '', fileName: '', scrollPosition: 0, hasStartedReading: false });
  },

  setScrollPosition: (position) => set({ scrollPosition: position }),

  setHasStartedReading: (value) => set({ hasStartedReading: value }),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  toggleImmersiveMode: async () => {
    const { isImmersiveMode, settings } = get();
    const newMode = !isImmersiveMode;

    set({ isImmersiveMode: newMode, showSettings: false });

    if (window.electronAPI) {
      if (newMode) {
        // 进入沉浸模式，根据行数调整窗口高度
        const lineHeight = settings.fontSize * settings.lineHeight;
        const height = Math.ceil(lineHeight * settings.linesPerScreen) + 40;
        await window.electronAPI.resizeWindow({ height });
      } else {
        // 退出沉浸模式，恢复正常高度
        await window.electronAPI.resizeWindow({ height: 600 });
      }
    }
  },

  exitImmersiveMode: async () => {
    set({ isImmersiveMode: false });
    if (window.electronAPI) {
      await window.electronAPI.resizeWindow({ height: 600 });
    }
  },

  toggleSettings: () => set((state) => ({
    showSettings: !state.showSettings
  })),

  // 更新快捷键配置
  updateShortcut: (action, shortcut) => set((state) => ({
    shortcuts: {
      ...state.shortcuts,
      [action]: { ...state.shortcuts[action], ...shortcut }
    }
  })),

  // 保存当前窗口大小
  saveWindowSize: async () => {
    if (!window.electronAPI) return;
    try {
      const size = await window.electronAPI.getWindowSize();
      await window.electronAPI.saveData('windowSize', size);
      return true;
    } catch (error) {
      console.error('保存窗口大小失败:', error);
      return false;
    }
  },

  // 保存数据到本地
  saveToLocal: async () => {
    const { filePath, scrollPosition, settings, bookshelf, shortcuts } = get();

    if (window.electronAPI) {
      // 保存当前阅读进度到书架
      let updatedBookshelf = bookshelf;
      if (filePath) {
        updatedBookshelf = bookshelf.map(book => {
          if (book.filePath === filePath) {
            return { ...book, scrollPosition, lastRead: Date.now() };
          }
          return book;
        });
      }

      // 保存书架
      await window.electronAPI.saveData('bookshelf', updatedBookshelf);

      // 保存当前阅读的文件路径
      await window.electronAPI.saveData('currentBook', filePath);

      // 保存设置
      await window.electronAPI.saveData('settings', settings);

      // 保存快捷键配置
      await window.electronAPI.saveData('shortcuts', shortcuts);
    }
  },

  // 仅重新加载设置（不影响沉浸模式状态）
  reloadSettings: async () => {
    if (!window.electronAPI) return;

    try {
      // 加载设置
      const settingsResult = await window.electronAPI.loadData('settings');
      if (settingsResult.success && settingsResult.data) {
        set({ settings: settingsResult.data });
      }

      // 加载快捷键配置
      const shortcutsResult = await window.electronAPI.loadData('shortcuts');
      if (shortcutsResult.success && shortcutsResult.data) {
        set((state) => ({
          shortcuts: { ...state.shortcuts, ...shortcutsResult.data }
        }));
      }
    } catch (error) {
      console.error('重新加载设置失败:', error);
    }
  },

  // 从本地加载数据
  loadFromLocal: async () => {
    if (!window.electronAPI) return;

    try {
      // 加载设置
      const settingsResult = await window.electronAPI.loadData('settings');
      if (settingsResult.success && settingsResult.data) {
        set({ settings: settingsResult.data });
      }

      // 加载快捷键配置
      const shortcutsResult = await window.electronAPI.loadData('shortcuts');
      if (shortcutsResult.success && shortcutsResult.data) {
        set((state) => ({
          shortcuts: { ...state.shortcuts, ...shortcutsResult.data }
        }));
      }

      // 加载书架
      const bookshelfResult = await window.electronAPI.loadData('bookshelf');
      if (bookshelfResult.success && bookshelfResult.data) {
        set({ bookshelf: bookshelfResult.data });
      }

      // 加载上次阅读的书籍
      const currentBookResult = await window.electronAPI.loadData('currentBook');
      if (currentBookResult.success && currentBookResult.data) {
        const filePath = currentBookResult.data;
        const { bookshelf } = get();
        const book = bookshelf.find(b => b.filePath === filePath);

        if (book) {
          const fileResult = await window.electronAPI.readFile(filePath);
          if (fileResult.success) {
            set({
              filePath: book.filePath,
              content: fileResult.content,
              fileName: book.fileName,
              scrollPosition: book.scrollPosition || 0,
            });

            // 有书籍时自动进入沉浸模式
            setTimeout(() => {
              get().toggleImmersiveMode();
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('加载本地数据失败:', error);
    }
  },
}));

export default useStore;
