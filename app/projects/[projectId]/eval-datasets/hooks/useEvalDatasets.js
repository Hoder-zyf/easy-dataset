'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 评估数据集列表 Hook
 * @param {string} projectId - 项目ID
 */
export default function useEvalDatasets(projectId) {
  const [data, setData] = useState({ items: [], total: 0, stats: null });
  const [loading, setLoading] = useState(true); // 初始加载时为 true
  const [searching, setSearching] = useState(false); // 筛选/搜索时的加载状态
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 筛选状态
  const [questionType, setQuestionType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [chunkId, setChunkId] = useState('');
  const [tags, setTags] = useState([]); // 改为数组

  // 包装 setter 函数，筛选条件变化时重置到第一页
  const setQuestionTypeWithReset = useCallback(value => {
    setQuestionType(value);
    setPage(1);
  }, []);

  const setKeywordWithReset = useCallback(value => {
    setKeyword(value);
    // keyword 会通过 debounce，所以不在这里重置页码
  }, []);

  const setChunkIdWithReset = useCallback(value => {
    setChunkId(value);
    setPage(1);
  }, []);

  const setTagsWithReset = useCallback(value => {
    setTags(value);
    setPage(1);
  }, []);

  // 视图模式
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'

  // 选中状态
  const [selectedIds, setSelectedIds] = useState([]);

  // 防抖处理关键词搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      // 关键词变化时重置到第一页
      if (keyword !== debouncedKeyword) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  // 获取数据 - 使用 ref 避免作为 useEffect 依赖
  const fetchDataRef = useRef(null);
  fetchDataRef.current = async (showLoading = true) => {
    if (!projectId) return;

    if (showLoading) {
      setLoading(true);
    } else {
      setSearching(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        includeStats: 'true'
      });

      if (questionType) params.append('questionType', questionType);
      if (debouncedKeyword) params.append('keyword', debouncedKeyword);
      if (chunkId) params.append('chunkId', chunkId);
      if (tags.length > 0) {
        tags.forEach(t => params.append('tags', t));
      }

      const response = await fetch(`/api/projects/${projectId}/eval-datasets?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch eval datasets');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setSearching(false);
      }
    }
  };

  // 提供给外部调用的 fetchData
  const fetchData = useCallback((showLoading = true) => {
    return fetchDataRef.current?.(showLoading);
  }, []);

  // 监听筛选条件变化，只触发一次数据获取
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchDataRef.current?.(true);
    } else {
      fetchDataRef.current?.(false);
    }
  }, [projectId, page, pageSize, questionType, debouncedKeyword, chunkId, tags]);

  // 删除数据
  const deleteItems = useCallback(
    async ids => {
      if (!ids || ids.length === 0) return;

      try {
        const response = await fetch(`/api/projects/${projectId}/eval-datasets`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });

        if (!response.ok) {
          throw new Error('Failed to delete items');
        }

        // 刷新数据
        await fetchData();
        setSelectedIds([]);

        return await response.json();
      } catch (err) {
        throw err;
      }
    },
    [projectId, fetchData]
  );

  // 重置筛选
  const resetFilters = useCallback(() => {
    setQuestionType('');
    setKeyword('');
    setChunkId('');
    setTags([]);
    setPage(1);
  }, []);

  // 切换选中状态
  const toggleSelect = useCallback(id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map(item => item.id));
    }
  }, [selectedIds, data.items]);

  return {
    // 数据
    items: data.items,
    total: data.total,
    stats: data.stats,
    totalPages: data.totalPages || 1,

    // 状态
    loading,
    searching,
    error,

    // 分页
    page,
    pageSize,
    setPage,
    setPageSize,

    // 筛选
    questionType,
    keyword,
    chunkId,
    tags,
    setQuestionType: setQuestionTypeWithReset,
    setKeyword: setKeywordWithReset,
    setChunkId: setChunkIdWithReset,
    setTags: setTagsWithReset,
    resetFilters,

    // 视图
    viewMode,
    setViewMode,

    // 选择
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    setSelectedIds,

    // 操作
    fetchData,
    deleteItems
  };
}
