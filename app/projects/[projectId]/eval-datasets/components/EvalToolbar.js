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
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';

export default function EvalToolbar({
  keyword,
  onKeywordChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  onDeleteSelected,
  onRefresh,
  loading
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}
    >
      {/* 左侧：搜索框 */}
      <Paper
        component="form"
        elevation={0}
        variant="outlined"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: 400,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          transition: 'box-shadow 0.2s',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
        onSubmit={e => e.preventDefault()}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search">
          <SearchIcon color="action" />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder={t('eval.searchPlaceholder')}
          value={keyword}
          onChange={e => onKeywordChange(e.target.value)}
        />
      </Paper>

      {/* 右侧：操作区 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {selectedCount > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDeleteSelected}
            sx={{ borderRadius: 2 }}
          >
            {t('eval.deleteSelected', { count: selectedCount })}
          </Button>
        )}

        <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center' }} />

        <Tooltip title={t('common.refresh')}>
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, value) => value && onViewModeChange(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid',
              borderColor: 'divider',
              px: 1.5,
              py: 0.5
            },
            '& .MuiToggleButton-root:first-of-type': {
              borderRadius: '8px 0 0 8px'
            },
            '& .MuiToggleButton-root:last-of-type': {
              borderRadius: '0 8px 8px 0'
            }
          }}
        >
          <ToggleButton value="card">
            <Tooltip title={t('eval.cardView')}>
              <ViewModuleIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="list">
            <Tooltip title={t('eval.listView')}>
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
