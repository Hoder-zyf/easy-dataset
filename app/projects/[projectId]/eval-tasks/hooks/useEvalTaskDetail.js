'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 评估任务详情 Hook
 */
export default function useEvalTaskDetail(projectId, taskId) {
  const [task, setTask] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 加载任务详情
  const loadData = useCallback(async () => {
    if (!projectId || !taskId) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/projects/${projectId}/eval-tasks/${taskId}`);
      const result = await response.json();

      if (result.code === 0) {
        setTask(result.data.task);
        setResults(result.data.results || []);
        setStats(result.data.stats);
      } else {
        setError(result.error || '加载失败');
      }
    } catch (err) {
      console.error('加载任务详情失败:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 自动刷新进行中的任务
  useEffect(() => {
    if (task?.status !== 0) return;

    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [task?.status, loadData]);

  return {
    task,
    results,
    stats,
    loading,
    error,
    setError,
    loadData
  };
}
