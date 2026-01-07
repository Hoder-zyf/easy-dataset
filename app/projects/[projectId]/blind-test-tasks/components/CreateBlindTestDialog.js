'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  TextField,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useTranslation } from 'react-i18next';

export default function CreateBlindTestDialog({ open, onClose, projectId, onCreate }) {
  const { t } = useTranslation();

  // 模型选择
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelA, setModelA] = useState(null);
  const [modelB, setModelB] = useState(null);

  // 题目选择
  const [questionTypes, setQuestionTypes] = useState(['short_answer', 'open_ended']);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 加载模型列表
  useEffect(() => {
    if (!open || !projectId) return;

    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/model-config`);
        const result = await response.json();

        if (result.data) {
          setModels(result.data);
        }
      } catch (err) {
        console.error('加载模型失败:', err);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [open, projectId]);

  // 加载标签和题目数量
  useEffect(() => {
    if (!open || !projectId) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/eval-datasets?page=1&pageSize=1&includeStats=true`);
        const result = await response.json();

        if (result.stats?.byTag) {
          setAvailableTags(Object.keys(result.stats.byTag).sort());
        }
      } catch (err) {
        console.error('加载统计失败:', err);
      }
    };

    fetchStats();
  }, [open, projectId]);

  // 获取符合条件的题目数量
  const fetchFilteredCount = useCallback(async () => {
    if (!projectId) return;

    try {
      setCountLoading(true);
      const params = new URLSearchParams();

      // 只查询主观题
      questionTypes.forEach(t => params.append('questionTypes', t));
      selectedTags.forEach(t => params.append('tags', t));

      const response = await fetch(`/api/projects/${projectId}/eval-datasets/count?${params.toString()}`);
      const result = await response.json();

      if (result.code === 0) {
        setFilteredCount(result.data?.total || 0);
      }
    } catch (err) {
      console.error('获取题目数量失败:', err);
    } finally {
      setCountLoading(false);
    }
  }, [projectId, questionTypes, selectedTags]);

  useEffect(() => {
    if (open) {
      fetchFilteredCount();
    }
  }, [open, fetchFilteredCount]);

  // 重置表单
  const resetForm = () => {
    setModelA(null);
    setModelB(null);
    setQuestionTypes(['short_answer', 'open_ended']);
    setSelectedTags([]);
    setQuestionCount(0);
    setError('');
  };

  // 关闭对话框
  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  // 提交创建
  const handleSubmit = async () => {
    // 验证
    if (!modelA) {
      setError(t('blindTest.errorSelectModelA', '请选择模型A'));
      return;
    }
    if (!modelB) {
      setError(t('blindTest.errorSelectModelB', '请选择模型B'));
      return;
    }
    if (modelA.id === modelB.id) {
      setError(t('blindTest.errorSameModel', '两个模型不能相同'));
      return;
    }
    if (filteredCount === 0) {
      setError(t('blindTest.errorNoQuestions', '没有符合条件的题目'));
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 获取题目ID列表
      const params = new URLSearchParams();
      questionTypes.forEach(t => params.append('questionTypes', t));
      selectedTags.forEach(t => params.append('tags', t));

      const pageSize = questionCount > 0 ? questionCount : filteredCount;
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/projects/${projectId}/eval-datasets?${params.toString()}`);
      const result = await response.json();

      if (!result.items || result.items.length === 0) {
        setError(t('blindTest.errorNoQuestions', '没有符合条件的题目'));
        return;
      }

      // 随机选择题目（如果指定了数量）
      let selectedIds = result.items.map(item => item.id);
      if (questionCount > 0 && questionCount < selectedIds.length) {
        // 随机抽取
        selectedIds = selectedIds.sort(() => Math.random() - 0.5).slice(0, questionCount);
      }

      // 创建任务
      const createResult = await onCreate({
        modelA: { modelId: modelA.modelId, providerId: modelA.id },
        modelB: { modelId: modelB.modelId, providerId: modelB.id },
        evalDatasetIds: selectedIds
      });

      if (createResult.success) {
        handleClose();
      } else {
        setError(createResult.error || '创建失败');
      }
    } catch (err) {
      console.error('创建任务失败:', err);
      setError('创建任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const QUESTION_TYPES = [
    { value: 'short_answer', labelKey: 'eval.questionTypes.short_answer' },
    { value: 'open_ended', labelKey: 'eval.questionTypes.open_ended' }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareArrowsIcon color="primary" />
        <Typography variant="h6">{t('blindTest.createTitle', '创建盲测任务')}</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 模型选择 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('blindTest.selectModels', '选择对比模型')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* 模型A */}
            <FormControl fullWidth size="small">
              <InputLabel>{t('blindTest.modelA', '模型 A')}</InputLabel>
              <Select
                value={modelA?.id || ''}
                onChange={e => {
                  const selected = models.find(m => m.id === e.target.value);
                  setModelA(selected || null);
                }}
                label={t('blindTest.modelA', '模型 A')}
                disabled={modelsLoading}
              >
                {models.map(model => (
                  <MenuItem key={model.id} value={model.id} disabled={model.id === modelB?.id}>
                    {model.providerName} / {model.modelName || model.modelId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography sx={{ alignSelf: 'center', color: 'text.secondary' }}>VS</Typography>

            {/* 模型B */}
            <FormControl fullWidth size="small">
              <InputLabel>{t('blindTest.modelB', '模型 B')}</InputLabel>
              <Select
                value={modelB?.id || ''}
                onChange={e => {
                  const selected = models.find(m => m.id === e.target.value);
                  setModelB(selected || null);
                }}
                label={t('blindTest.modelB', '模型 B')}
                disabled={modelsLoading}
              >
                {models.map(model => (
                  <MenuItem key={model.id} value={model.id} disabled={model.id === modelA?.id}>
                    {model.providerName} / {model.modelName || model.modelId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {models.length === 0 && !modelsLoading && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {t('blindTest.noModelsAvailable', '暂无可用模型，请先在设置中配置模型')}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 题目筛选 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('blindTest.selectQuestions', '选择测试题目')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('blindTest.questionTypeHint', '盲测任务仅支持简答题和开放题')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 题型筛选 */}
            <FormControl fullWidth size="small">
              <InputLabel>{t('blindTest.questionType', '题型')}</InputLabel>
              <Select
                multiple
                value={questionTypes}
                onChange={e => setQuestionTypes(e.target.value)}
                input={<OutlinedInput label={t('blindTest.questionType', '题型')} />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => (
                      <Chip key={value} label={t(`eval.questionTypes.${value}`)} size="small" />
                    ))}
                  </Box>
                )}
              >
                {QUESTION_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Checkbox checked={questionTypes.includes(type.value)} />
                    <ListItemText primary={t(type.labelKey)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 标签筛选 */}
            {availableTags.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>{t('blindTest.filterByTag', '按标签筛选')}</InputLabel>
                <Select
                  multiple
                  value={selectedTags}
                  onChange={e => setSelectedTags(e.target.value)}
                  input={<OutlinedInput label={t('blindTest.filterByTag', '按标签筛选')} />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableTags.map(tag => (
                    <MenuItem key={tag} value={tag}>
                      <Checkbox checked={selectedTags.includes(tag)} />
                      <ListItemText primary={tag} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* 题目数量 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label={t('blindTest.questionCount', '题目数量')}
                  value={questionCount}
                  onChange={e => setQuestionCount(Math.max(0, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 0, max: filteredCount }}
                  sx={{ width: 150 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {countLoading ? (
                    <CircularProgress size={14} />
                  ) : (
                    t('blindTest.availableQuestions', '可用题目：{{count}} 道', { count: filteredCount })
                  )}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {questionCount === 0
                  ? t('blindTest.useAllQuestions', '使用全部筛选结果')
                  : t('blindTest.randomSample', '将随机抽取 {{count}} 道题目', { count: questionCount })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting} color="inherit">
          {t('common.cancel', '取消')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !modelA || !modelB || filteredCount === 0}
          startIcon={submitting ? <CircularProgress size={16} /> : <CompareArrowsIcon />}
        >
          {submitting ? t('blindTest.creating', '创建中...') : t('blindTest.startBlindTest', '开始盲测')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
