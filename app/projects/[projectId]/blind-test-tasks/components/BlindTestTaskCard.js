'use client';

import { Box, Card, CardContent, Typography, Chip, IconButton, Menu, MenuItem, LinearProgress } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_MAP = {
  0: { label: 'blindTest.statusProcessing', color: 'primary' },
  1: { label: 'blindTest.statusCompleted', color: 'success' },
  2: { label: 'blindTest.statusFailed', color: 'error' },
  3: { label: 'blindTest.statusInterrupted', color: 'warning' }
};

export default function BlindTestTaskCard({ task, onView, onDelete, onInterrupt, onContinue }) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = e => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    handleMenuClose();
    onView?.(task);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(task);
  };

  const handleInterrupt = () => {
    handleMenuClose();
    onInterrupt?.(task);
  };

  const handleContinue = () => {
    handleMenuClose();
    onContinue?.(task);
  };

  const statusConfig = STATUS_MAP[task.status] || STATUS_MAP[0];
  const progress = task.totalCount > 0 ? (task.completedCount / task.totalCount) * 100 : 0;
  const isProcessing = task.status === 0;

  // 计算模型得分
  const results = task.detail?.results || [];
  const modelAScore = results.reduce((sum, r) => sum + (r.modelAScore || 0), 0);
  const modelBScore = results.reduce((sum, r) => sum + (r.modelBScore || 0), 0);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={handleView}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 头部 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrowsIcon color="primary" />
            <Chip label={t(statusConfig.label)} color={statusConfig.color} size="small" />
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 模型对比 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('blindTest.modelComparison', '模型对比')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={task.modelInfo?.modelA?.modelName || 'Model A'}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Typography variant="body2" color="text.secondary">
              VS
            </Typography>
            <Chip
              label={task.modelInfo?.modelB?.modelName || 'Model B'}
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Box>
        </Box>

        {/* 进度 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {t('blindTest.progress', '进度')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {task.completedCount} / {task.totalCount}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>

        {/* 得分（已完成或有结果时显示） */}
        {results.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="h6" color="primary.main">
                {modelAScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {task.modelInfo?.modelA?.modelName || 'Model A'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'secondary.50', borderRadius: 1 }}>
              <Typography variant="h6" color="secondary.main">
                {modelBScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {task.modelInfo?.modelB?.modelName || 'Model B'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* 创建时间 */}
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="caption" color="text.disabled">
            {new Date(task.createAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      {/* 菜单 */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          {t('blindTest.viewDetails', '查看详情')}
        </MenuItem>
        {isProcessing && (
          <MenuItem onClick={handleContinue}>
            <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
            {t('blindTest.continue', '继续盲测')}
          </MenuItem>
        )}
        {isProcessing && (
          <MenuItem onClick={handleInterrupt}>
            <StopIcon fontSize="small" sx={{ mr: 1 }} />
            {t('blindTest.interrupt', '中断任务')}
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete', '删除')}
        </MenuItem>
      </Menu>
    </Card>
  );
}
