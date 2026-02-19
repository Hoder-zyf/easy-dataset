'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  CircularProgress,
  Checkbox
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import RatingChip from './RatingChip';

/**
 * 对话表格组件
 * @param {Array} conversations - 对话数据
 * @param {boolean} loading - 加载状态
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {number} rowsPerPage - 每页行数
 * @param {function} onPageChange - 页面变化回调
 * @param {function} onRowsPerPageChange - 每页行数变化回调
 * @param {function} onView - 查看回调
 * @param {function} onDelete - 删除回调
 * @param {Array} selectedIds - 选中的对话ID数组
 * @param {function} onSelectionChange - 选择变化回调
 * @param {boolean} isAllSelected - 是否全选
 * @param {function} onSelectAll - 全选回调
 */
const ConversationTable = ({
  conversations,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onDelete,
  selectedIds = [],
  onSelectionChange,
  isAllSelected = false,
  onSelectAll
}) => {
  const { t } = useTranslation();

  // 处理单个选择
  const handleSelectOne = conversationId => {
    if (selectedIds.includes(conversationId)) {
      onSelectionChange(selectedIds.filter(id => id !== conversationId));
    } else {
      onSelectionChange([...selectedIds, conversationId]);
    }
  };

  // 处理全选
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
      onSelectAll(false);
    } else {
      // 选择当前页面的所有对话
      const currentPageIds = conversations.map(conv => conv.id);
      onSelectionChange(currentPageIds);
      onSelectAll(true);
    }
  };

  // 计算是否部分选中
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  return (
    <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
      <Table sx={{ tableLayout: 'fixed', minWidth: 1100 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell padding="checkbox" sx={{ width: 56 }}>
              <Checkbox indeterminate={isIndeterminate} checked={isAllSelected} onChange={handleSelectAll} />
            </TableCell>
            <TableCell sx={{ width: '30%', minWidth: 280 }}>{t('datasets.firstQuestion')}</TableCell>
            <TableCell sx={{ width: '38%', minWidth: 360 }}>{t('datasets.conversationScenario')}</TableCell>
            <TableCell sx={{ width: 110 }}>{t('datasets.conversationRounds')}</TableCell>
            <TableCell sx={{ width: 130 }}>{t('datasets.modelUsed')}</TableCell>
            <TableCell sx={{ width: 110 }}>{t('datasets.rating')}</TableCell>
            <TableCell sx={{ width: 130 }}>{t('datasets.createTime')}</TableCell>
            <TableCell align="center" sx={{ width: 110 }}>
              {t('common.actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
              </TableCell>
            </TableRow>
          ) : conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('datasets.noConversations')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            conversations.map(conversation => (
              <TableRow key={conversation.id} hover>
                <TableCell padding="checkbox" sx={{ verticalAlign: 'top' }}>
                  <Checkbox
                    checked={selectedIds.includes(conversation.id)}
                    onChange={() => handleSelectOne(conversation.id)}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Tooltip title={conversation.question || ''} placement="top-start">
                    <Typography
                      variant="body2"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        lineHeight: 1.5
                      }}
                    >
                      {conversation.question}
                    </Typography>
                  </Tooltip>
                  {conversation.confirmed && (
                    <Chip
                      label={t('datasets.confirmed')}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ mt: 0.5, fontSize: '0.7rem' }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Tooltip title={conversation.scenario || t('datasets.notSet')} placement="top-start">
                    <Paper
                      variant="outlined"
                      sx={{
                        px: 1,
                        py: 0.75,
                        maxWidth: '100%',
                        borderColor: conversation.scenario ? 'primary.main' : 'divider',
                        backgroundColor: conversation.scenario ? 'action.selected' : 'background.default'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          lineHeight: 1.45
                        }}
                      >
                        {conversation.scenario || t('datasets.notSet')}
                      </Typography>
                    </Paper>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {conversation.turnCount}/{conversation.maxTurns}
                  </Typography>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Chip
                    label={conversation.model}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <RatingChip score={conversation.score || 0} />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="caption">{new Date(conversation.createAt).toLocaleDateString()}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                  <Tooltip title={t('datasets.viewDetails')}>
                    <IconButton size="small" color="primary" onClick={() => onView(conversation.id)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => onDelete(conversation.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(event, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={event => {
          onRowsPerPageChange(parseInt(event.target.value, 10));
        }}
        labelRowsPerPage={t('datasets.rowsPerPage')}
      />
    </TableContainer>
  );
};

export default ConversationTable;
