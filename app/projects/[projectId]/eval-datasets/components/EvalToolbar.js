'use client';

import {
  Box,
  Paper,
  InputBase,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Tooltip,
  Divider,
  Chip,
  Autocomplete,
  TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ShortTextIcon from '@mui/icons-material/ShortText';
import NotesIcon from '@mui/icons-material/Notes';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';

const STATS_CONFIG = [
  { key: 'true_false', icon: CheckCircleIcon, color: 'success' },
  { key: 'single_choice', icon: RadioButtonCheckedIcon, color: 'primary' },
  { key: 'multiple_choice', icon: CheckBoxIcon, color: 'secondary' },
  { key: 'short_answer', icon: ShortTextIcon, color: 'warning' },
  { key: 'open_ended', icon: NotesIcon, color: 'info' }
];

export default function EvalToolbar({
  keyword,
  onKeywordChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  onDeleteSelected,
  stats,
  questionType,
  onTypeChange,
  tags,
  onTagsChange
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const tagOptions = stats?.byTag
    ? Object.keys(stats.byTag).map(tag => ({
        label: tag,
        count: stats.byTag[tag]
      }))
    : [];

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      {/* 顶部：题型统计筛选 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {stats &&
          STATS_CONFIG.map(({ key, icon: Icon, color }) => {
            const count = stats.byType?.[key] || 0;
            const isActive = questionType === key;

            return (
              <Chip
                key={key}
                icon={<Icon sx={{ fontSize: 16 }} />}
                label={`${t(`eval.questionTypes.${key}`)} (${count})`}
                color={isActive ? color : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => onTypeChange(isActive ? '' : key)}
                size="small"
                sx={{
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  height: 28,
                  '&:hover': { opacity: 0.85 }
                }}
              />
            );
          })}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* 底部：筛选和操作 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap'
        }}
      >
        {/* 左侧：筛选器组 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
          {/* 搜索框 */}
          <Paper
            component="form"
            elevation={0}
            variant="outlined"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: 240,
              height: 40, // 统一高度
              borderRadius: 1.5,
              backgroundColor: 'background.paper',
              transition: 'box-shadow 0.2s',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
              }
            }}
            onSubmit={e => e.preventDefault()}
          >
            <IconButton sx={{ p: '6px' }} aria-label="search" size="small">
              <SearchIcon sx={{ fontSize: 18 }} color="action" />
            </IconButton>
            <InputBase
              sx={{ ml: 0.5, flex: 1, fontSize: '0.875rem' }}
              placeholder={t('eval.searchPlaceholder')}
              value={keyword}
              onChange={e => onKeywordChange(e.target.value)}
            />
          </Paper>

          {/* 标签筛选 */}
          <Autocomplete
            multiple
            size="small"
            options={tagOptions}
            getOptionLabel={option => `${option.label} (${option.count})`}
            value={tagOptions.filter(o => tags.includes(o.label))}
            onChange={(e, newValue) => onTagsChange(newValue.map(v => v.label))}
            renderInput={params => (
              <TextField
                {...params}
                placeholder={tags.length === 0 ? t('eval.tags') : ''}
                size="small"
                sx={{
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    minHeight: 40 // 允许高度根据内容撑开，但最小高度保持一致
                  }
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{ height: 24 }}
                />
              ))
            }
            sx={{
              '& .MuiOutlinedInput-root': { padding: '2px 9px' }
            }}
          />
        </Box>

        {/* 右侧：操作按钮组 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={onDeleteSelected}
              sx={{ borderRadius: 1.5, minWidth: 'auto', px: 1.5, height: 32 }}
            >
              {t('eval.deleteSelected', { count: selectedCount })}
            </Button>
          )}

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && onViewModeChange(value)}
            size="small"
            sx={{
              height: 32,
              '& .MuiToggleButton-root': {
                border: '1px solid',
                borderColor: 'divider',
                px: 1,
                py: 0.5,
                minWidth: 32
              },
              '& .MuiToggleButton-root:first-of-type': {
                borderRadius: '6px 0 0 6px'
              },
              '& .MuiToggleButton-root:last-of-type': {
                borderRadius: '0 6px 6px 0'
              }
            }}
          >
            <ToggleButton value="card">
              <Tooltip title={t('eval.cardView')}>
                <ViewModuleIcon sx={{ fontSize: 16 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list">
              <Tooltip title={t('eval.listView')}>
                <ViewListIcon sx={{ fontSize: 16 }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Paper>
  );
}
