import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import useStore from '../store/useStore';

const Reader = () => {
  const content = useStore((state) => state.content);
  const filePath = useStore((state) => state.filePath);
  const scrollPosition = useStore((state) => state.scrollPosition);
  const setScrollPosition = useStore((state) => state.setScrollPosition);
  const saveToLocal = useStore((state) => state.saveToLocal);
  const updateBookProgress = useStore((state) => state.updateBookProgress);
  const isImmersiveMode = useStore((state) => state.isImmersiveMode);
  const settings = useStore((state) => state.settings);
  const hasStartedReading = useStore((state) => state.hasStartedReading);
  const setHasStartedReading = useStore((state) => state.setHasStartedReading);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const measureRef = useRef(null);
  const initialScrollRef = useRef(true); // 标记是否是初始滚动恢复
  const [listHeight, setListHeight] = useState(window.innerHeight - 48);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  // 将文本内容按段落分割，去除多余空行
  const paragraphs = useMemo(() => {
    return content
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [content]);

  // 计算每个段落的高度
  const getItemSize = useCallback((index) => {
    const paragraph = paragraphs[index];
    if (!paragraph) return settings.fontSize * settings.lineHeight;

    // 可用宽度（减去左右padding）
    const padding = settings.padding || 16;
    const availableWidth = containerWidth - (padding * 2);

    // 每个字符的大致宽度（中文字符约等于fontSize）
    const charWidth = settings.fontSize;

    // 计算一行能放多少个字符
    const charsPerLine = Math.floor(availableWidth / charWidth);

    // 计算需要多少行
    const lines = Math.ceil(paragraph.length / charsPerLine);

    // 每行高度 = 字体大小 * 行高
    const lineHeightPx = settings.fontSize * settings.lineHeight;

    // 总高度 = 行数 * 行高 + 段落间距
    return Math.max(lines * lineHeightPx, lineHeightPx) + 8; // 8px段落间距
  }, [paragraphs, settings.fontSize, settings.lineHeight, settings.padding, containerWidth]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      height += getItemSize(i);
    }
    return height;
  }, [paragraphs, getItemSize]);

  // 处理滚动
  const handleScroll = useCallback((e) => {
    const position = e.scrollOffset;
    setScrollPosition(position);

    // 首次用户滚动时激活"已开始阅读"状态（排除初始恢复滚动）
    if (!hasStartedReading && !initialScrollRef.current) {
      setHasStartedReading(true);
    }

    // 更新书架进度
    if (filePath && totalHeight > 0) {
      updateBookProgress(filePath, position, totalHeight);
    }

    // 防抖保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToLocal();
    }, 1000);
  }, [setScrollPosition, saveToLocal, filePath, totalHeight, updateBookProgress, hasStartedReading, setHasStartedReading]);

  // 当内容改变时：先重置缓存，再恢复滚动位置
  useEffect(() => {
    if (listRef.current) {
      // 标记为初始滚动恢复状态
      initialScrollRef.current = true;
      // 先重置缓存
      listRef.current.resetAfterIndex(0);
      // 再恢复滚动位置（需要延迟以确保缓存已更新）
      if (scrollPosition > 0) {
        setTimeout(() => {
          listRef.current?.scrollTo(scrollPosition);
          // 延迟后标记初始滚动恢复完成
          setTimeout(() => {
            initialScrollRef.current = false;
          }, 200);
        }, 100);
      } else {
        // 如果没有需要恢复的位置，直接标记完成
        setTimeout(() => {
          initialScrollRef.current = false;
        }, 200);
      }
    }
  }, [content]);

  // 当设置改变时重置列表缓存
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [settings.fontSize, settings.lineHeight, settings.padding, containerWidth]);

  // 应用样式
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--line-height', settings.lineHeight);

    // 根据背景颜色自动调整文字颜色
    const isDark = isColorDark(settings.backgroundColor);
    root.style.setProperty('--text-color', isDark ? '#e0e0e0' : '#333333');
  }, [settings]);

  // 更新列表高度和宽度
  useEffect(() => {
    const updateDimensions = () => {
      const height = window.innerHeight - (isImmersiveMode ? 0 : 48);
      setListHeight(height);
      setContainerWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isImmersiveMode]);

  const isColorDark = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // 渲染每一行
  const Row = ({ index, style }) => {
    const paragraph = paragraphs[index];
    const isChapterTitle = paragraph && paragraph.match(/^第.+章/);
    const padding = settings.padding || 16;

    return (
      <div style={style} className="reader-text">
        <p
          className={`${isChapterTitle ? 'font-semibold text-center' : 'indent-8'}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            wordBreak: 'break-all',
            paddingLeft: `${padding}px`,
            paddingRight: `${padding}px`,
          }}
        >
          {paragraph}
        </p>
      </div>
    );
  };

  if (!content) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
    >
      <List
        ref={listRef}
        height={listHeight}
        itemCount={paragraphs.length}
        itemSize={getItemSize}
        width="100%"
        onScroll={handleScroll}
        className={isImmersiveMode ? 'immersive-reader' : ''}
        style={{ overflow: 'auto' }}
      >
        {Row}
      </List>
    </div>
  );
};

export default Reader;
