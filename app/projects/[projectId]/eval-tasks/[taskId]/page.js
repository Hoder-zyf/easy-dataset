'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  LinearProgress,
  Divider,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'react-i18next';

import useEvalTaskDetail from '../hooks/useEvalTaskDetail';
import styles from '../styles';

const STATUS_CONFIG = {
  0: { label: 'evalTasks.statusProcessing', color: 'info' },
  1: { label: 'evalTasks.statusCompleted', color: 'success' },
  2: { label: 'evalTasks.statusFailed', color: 'error' },
  3: { label: 'evalTasks.statusInterrupted', color: 'warning' }
};

const QUESTION_TYPE_LABELS = {
  true_false: 'eval.questionTypes.true_false',
  single_choice: 'eval.questionTypes.single_choice',
  multiple_choice: 'eval.questionTypes.multiple_choice',
  short_answer: 'eval.questionTypes.short_answer',
  open_ended: 'eval.questionTypes.open_ended'
};

export default function EvalTaskDetailPage() {
  const { projectId, taskId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const { task, results, stats, loading, error, setError, loadData } = useEvalTaskDetail(projectId, taskId);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = id => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading && !task) {
    return (
      <Container maxWidth="xl" sx={styles.pageContainer}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const statusConfig = STATUS_CONFIG[task?.status] || STATUS_CONFIG[0];

  return (
    <Container maxWidth="xl" sx={styles.pageContainer}>
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('evalTasks.detailTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {task?.modelInfo?.providerId} / {task?.modelInfo?.modelId}
          </Typography>
        </Box>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 任务进度（仅进行中时显示） */}
      {task?.status === 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{t('evalTasks.progress')}</Typography>
            <Typography variant="body2">
              {task.completedCount}/{task.totalCount}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={task.totalCount > 0 ? (task.completedCount / task.totalCount) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Paper>
      )}

      {/* 统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('evalTasks.status')}
              </Typography>
              <Chip label={t(statusConfig.label)} color={statusConfig.color} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('evalTasks.totalScore')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {task?.detail?.finalScore !== undefined ? `${task.detail.finalScore.toFixed(1)}%` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('evalTasks.correctCount')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats?.correctCount || 0} / {stats?.totalQuestions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('evalTasks.accuracy')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats?.accuracyPercentage !== undefined ? `${stats.accuracyPercentage.toFixed(1)}%` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 按题型统计 */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {t('evalTasks.statsByType')}
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.byType).map(([type, typeStats]) => (
              <Grid item xs={6} sm={4} md={2} key={type}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t(QUESTION_TYPE_LABELS[type] || type)}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {typeStats.correct}/{typeStats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((typeStats.score / typeStats.total) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* 结果列表 */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, p: 2 }}>
          {t('evalTasks.resultDetails')}
        </Typography>
        <Divider />
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell width={50}>#</TableCell>
                <TableCell>{t('evalTasks.question')}</TableCell>
                <TableCell width={120}>{t('evalTasks.questionType')}</TableCell>
                <TableCell width={80} align="center">
                  {t('evalTasks.result')}
                </TableCell>
                <TableCell width={80} align="center">
                  {t('evalTasks.score')}
                </TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results?.map((result, index) => (
                <>
                  <TableRow key={result.id} hover sx={{ cursor: 'pointer' }} onClick={() => toggleRow(result.id)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                        {result.evalDataset?.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(QUESTION_TYPE_LABELS[result.evalDataset?.questionType] || '')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {result.isCorrect ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: result.score >= 0.6 ? 'success.main' : 'error.main'
                        }}
                      >
                        {(result.score * 100).toFixed(0)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        {expandedRows[result.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: 0 }}>
                      <Collapse in={expandedRows[result.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('evalTasks.correctAnswer')}
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                                <Typography variant="body2">{result.evalDataset?.correctAnswer}</Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('evalTasks.modelAnswer')}
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  mt: 0.5,
                                  bgcolor: result.isCorrect ? 'success.light' : 'error.light',
                                  borderColor: result.isCorrect ? 'success.main' : 'error.main'
                                }}
                              >
                                <Typography variant="body2">{result.modelAnswer}</Typography>
                              </Paper>
                            </Grid>
                            {result.judgeResponse && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                  {t('evalTasks.judgeResponse')}
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {result.judgeResponse}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
