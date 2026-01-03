'use client';

import { useState, useEffect } from 'react';

export function useEvalTaskForm(projectId, open) {
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [judgeModel, setJudgeModel] = useState('');
  const [evalDatasets, setEvalDatasets] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // 筛选条件
  const [questionTypes, setQuestionTypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  // 筛选后的结果
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [finalDatasets, setFinalDatasets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否有主观题
  const hasSubjectiveQuestions = finalDatasets.some(
    d => d.questionType === 'short_answer' || d.questionType === 'open_ended'
  );

  // 加载数据
  useEffect(() => {
    if (open && projectId) {
      loadModels();
      loadEvalDatasets();
    }
  }, [open, projectId]);

  // 根据筛选条件过滤题目
  useEffect(() => {
    let filtered = evalDatasets;

    if (questionTypes.length > 0) {
      filtered = filtered.filter(d => questionTypes.includes(d.questionType));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(d => {
        const datasetTags = d.tags ? d.tags.split(',').map(t => t.trim()) : [];
        return selectedTags.some(tag => datasetTags.includes(tag));
      });
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        d => d.question?.toLowerCase().includes(keyword) || d.correctAnswer?.toLowerCase().includes(keyword)
      );
    }

    setFilteredDatasets(filtered);
  }, [questionTypes, selectedTags, searchKeyword, evalDatasets]);

  // 根据题目数量限制进行随机抽取
  useEffect(() => {
    if (questionCount > 0 && questionCount < filteredDatasets.length) {
      const shuffled = [...filteredDatasets].sort(() => Math.random() - 0.5);
      setFinalDatasets(shuffled.slice(0, questionCount));
    } else {
      setFinalDatasets(filteredDatasets);
    }
  }, [questionCount, filteredDatasets]);

  const loadModels = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/model-config`);
      if (response.ok) {
        const result = await response.json();
        const modelList = result?.data || [];
        const availableModels = modelList.filter(m => m.apiKey && m.apiKey.trim() !== '' && m.status === 1);
        setModels(availableModels);
      }
    } catch (err) {
      console.error('加载模型列表失败:', err);
      setModels([]);
    }
  };

  const loadEvalDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/eval-datasets?pageSize=1000`);
      if (response.ok) {
        const data = await response.json();
        const datasets = data.items || [];
        setEvalDatasets(datasets);

        const tagsSet = new Set();
        datasets.forEach(d => {
          if (d.tags) {
            d.tags.split(',').forEach(tag => {
              const trimmed = tag.trim();
              if (trimmed) tagsSet.add(trimmed);
            });
          }
        });
        setAvailableTags(Array.from(tagsSet).sort());
      }
    } catch (err) {
      console.error('加载评估题目失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setQuestionTypes([]);
    setSelectedTags([]);
    setSearchKeyword('');
    setQuestionCount(0);
  };

  const resetForm = () => {
    setSelectedModels([]);
    setJudgeModel('');
    resetFilters();
    setError('');
  };

  return {
    models,
    selectedModels,
    setSelectedModels,
    judgeModel,
    setJudgeModel,
    evalDatasets,
    availableTags,
    questionTypes,
    setQuestionTypes,
    selectedTags,
    setSelectedTags,
    searchKeyword,
    setSearchKeyword,
    questionCount,
    setQuestionCount,
    filteredDatasets,
    finalDatasets,
    hasSubjectiveQuestions,
    loading,
    error,
    setError,
    resetFilters,
    resetForm
  };
}
