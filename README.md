# 桌面端小说阅读器

一款基于 Electron + React + Tailwind CSS 的轻量级、专注、可沉浸的桌面端小说阅读器。

## 功能特性

- ✅ 本地 TXT 文件导入（支持拖拽和选择）
- ✅ 纯粹的阅读体验，界面简洁
- ✅ 高度可定制的阅读环境
  - 背景颜色（预设 + 自定义取色器）
  - 字体大小
  - 行高
  - 沉浸模式行数配置
- ✅ 沉浸式阅读模式（核心功能）
  - 隐藏所有 UI 元素
  - 仅显示正文内容
  - 自动调整窗口高度
- ✅ 阅读进度自动保存
- ✅ 键盘快捷键支持
- ✅ 虚拟滚动优化，支持大文件流畅阅读
- ✅ 本地存储，保护隐私

## 技术栈

- **桌面框架**: Electron
- **前端框架**: React 18
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **虚拟滚动**: react-window
- **构建工具**: Webpack

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run build  # 先构建前端代码
npm start      # 启动 Electron 应用
```

### 生产构建

```bash
npm run build
```

## 使用说明

### 导入小说

1. **选择文件**: 点击"打开文件"按钮，选择 TXT 格式的小说文件
2. **拖拽导入**: 将 TXT 文件直接拖拽到窗口中

### 阅读操作

- **滚动阅读**: 使用鼠标滚轮、触控板或键盘方向键
- **翻页**: PageUp / PageDown
- **调整设置**: 点击"设置"按钮，可以调整背景颜色、字体大小、行高等

### 沉浸式阅读模式

进入沉浸式模式：
- 点击"沉浸模式"按钮
- 按 `Ctrl+Enter` (Windows/Linux)
- 按 `⌘+Enter` (macOS)

退出沉浸式模式：
- 按 `Esc` 键

### 键盘快捷键

- `Ctrl/⌘+Enter`: 切换沉浸式模式
- `Esc`: 退出沉浸式模式
- `Ctrl/⌘+O`: 打开文件
- `Ctrl/⌘+,`: 打开设置
- `↑ / ↓`: 逐行滚动
- `PageUp / PageDown`: 分页滚动

## 功能说明

### 背景颜色设置

提供 4 种预设颜色：
- 纯白 (#ffffff)
- 米黄 (#f4ecd8)
- 护眼绿 (#c7edcc)
- 深色 (#1e1e1e)

同时支持自定义颜色选择器，可以吸取屏幕任意颜色。

### 沉浸式阅读模式

- 隐藏标题栏、工具栏、滚动条
- 仅显示小说正文
- 根据设置的"每屏行数"自动调整窗口高度
- 提供极致专注的阅读体验

### 阅读进度保存

- 自动保存阅读进度（滚动位置）
- 自动保存阅读设置（背景、字体等）
- 重新打开文件时自动恢复上次阅读位置
- 数据存储在本地，不上传云端

### 性能优化

- 使用 react-window 实现虚拟滚动
- 仅渲染可视区域内容
- 支持 1MB ~ 5MB TXT 文件流畅加载
- 滚动无卡顿

## 项目结构

```
novelReader/
├── main.js                 # Electron 主进程
├── preload.js             # 预加载脚本（进程间通信）
├── index.html             # 主页面
├── package.json           # 项目配置
├── webpack.config.js      # Webpack 配置
├── tailwind.config.js     # Tailwind 配置
├── postcss.config.js      # PostCSS 配置
├── .babelrc              # Babel 配置
├── src/
│   ├── index.jsx         # React 入口文件
│   ├── App.jsx           # 主应用组件
│   ├── components/
│   │   ├── TitleBar.jsx      # 标题栏组件
│   │   ├── FileImport.jsx    # 文件导入组件
│   │   ├── Reader.jsx        # 阅读器组件
│   │   └── SettingsPanel.jsx # 设置面板组件
│   ├── store/
│   │   └── useStore.js       # Zustand 状态管理
│   └── styles/
│       └── index.css         # 全局样式
└── dist/
    └── bundle.js         # 构建输出
```

## 开发说明

### 添加新功能

1. 在 `src/components/` 中创建新组件
2. 在 `src/store/useStore.js` 中添加状态和方法
3. 在 `main.js` 中添加主进程逻辑（如需要）
4. 在 `preload.js` 中暴露 API（如需要）

### 样式自定义

- 使用 Tailwind CSS 工具类
- 通过 CSS 变量动态调整样式
- 在 `src/styles/index.css` 中添加全局样式

## 测试

项目包含一个测试文件 `test-novel.txt`，可以用于测试阅读功能。

## 许可证

ISC

## 作者

桌面端小说阅读器
