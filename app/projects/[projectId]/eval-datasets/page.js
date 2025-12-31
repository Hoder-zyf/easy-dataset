'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Masonry } from '@mui/lab';
import { useTranslation } from 'react-i18next';

import useEvalDatasets from './hooks/useEvalDatasets';
import EvalStatsBar from './components/EvalStatsBar';
import EvalToolbar from './components/EvalToolbar';
import EvalDatasetCard from './components/EvalDatasetCard';
import EvalDatasetList from './components/EvalDatasetList';

export default function EvalDatasetsPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    items,
    total,
    stats,
    totalPages,
    loading,
    error,
    page,
    setPage,
    questionType,
    setQuestionType,
    keyword,
    setKeyword,
    viewMode,
    setViewMode,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    fetchData,
    deleteItems
  } = useEvalDatasets(projectId);

  // 删除确认对话框
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ids: [] });

  // 处理删除
  const handleDelete = async ids => {
    setDeleteDialog({ open: true, ids: Array.isArray(ids) ? ids : [ids] });
  };

  const confirmDelete = async () => {
    try {
      await deleteItems(deleteDialog.ids);
      setDeleteDialog({ open: false, ids: [] });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // 处理编辑
  const handleEdit = item => {
    router.push(`/projects/${projectId}/eval-datasets/${item.id}`);
  };

  // 处理查看
  const handleView = item => {
    router.push(`/projects/${projectId}/eval-datasets/${item.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 统计栏 */}
      <EvalStatsBar stats={stats} questionType={questionType} onTypeChange={setQuestionType} />

      {/* 工具栏 */}
      <EvalToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedIds.length}
        onDeleteSelected={() => handleDelete(selectedIds)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* 加载状态 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 内容区域 */}
      {!loading && (
        <>
          {viewMode === 'card' ? (
            <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
              {items.map(item => (
                <EvalDatasetCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onSelect={toggleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  projectId={projectId}
                />
              ))}
            </Masonry>
          ) : (
            <EvalDatasetList
              items={items}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
              onSelectAll={toggleSelectAll}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}

          {/* 空状态 */}
          {items.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8
              }}
            >
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {t('eval.noData')}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {t('eval.noDataHint')}
              </Typography>
            </Box>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, ids: [] })}>
        <DialogTitle>{t('eval.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('eval.deleteConfirmMessage', { count: deleteDialog.ids.length })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, ids: [] })}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
