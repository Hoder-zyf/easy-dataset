'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import useBlindTestDetail from '../hooks/useBlindTestDetail';

export default function BlindTestDetailPage() {
  const { projectId, taskId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    task,
    loading,
    error,
    setError,
    currentQuestion,
    leftAnswer,
    rightAnswer,
    answersLoading,
    streamingA,
    streamingB,
    voting,
    completed,
    fetchCurrentQuestion,
    submitVote,
    interruptTask,
    getResultStats
  } = useBlindTestDetail(projectId, taskId);

  const [interruptDialog, setInterruptDialog] = useState(false);

  const handleBack = () => router.push(`/projects/${projectId}/blind-test-tasks`);

  const handleVote = async vote => {
    await submitVote(vote);
  };

  const handleInterrupt = async () => {
    await interruptTask();
    setInterruptDialog(false);
  };

  const stats = getResultStats();
  const progress = task ? (task.completedCount / task.totalCount) * 100 : 0;

  // 加载中
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // 任务不存在
  if (!task) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">{t('blindTest.taskNotFound', '任务不存在')}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          {t('common.back', '返回')}
        </Button>
      </Container>
    );
  }

  // 任务已完成或中断 - 显示结果
  if (completed || task.status !== 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* 头部 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <CompareArrowsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
            {t('blindTest.resultTitle', '盲测结果')}
          </Typography>
          <Chip
            label={
              task.status === 1 ? t('blindTest.statusCompleted', '已完成') : t('blindTest.statusInterrupted', '已中断')
            }
            color={task.status === 1 ? 'success' : 'warning'}
          />
        </Box>

        {/* 结果统计 */}
        {stats && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              {t('blindTest.resultSummary', '评测结果汇总')}
            </Typography>

            {/* 模型对比得分 */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              <Card
                sx={{
                  flex: 1,
                  bgcolor: stats.modelAScore > stats.modelBScore ? 'success.50' : 'background.paper',
                  border: stats.modelAScore > stats.modelBScore ? '2px solid' : '1px solid',
                  borderColor: stats.modelAScore > stats.modelBScore ? 'success.main' : 'divider'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  {stats.modelAScore > stats.modelBScore && (
                    <EmojiEventsIcon sx={{ color: 'success.main', fontSize: 32, mb: 1 }} />
                  )}
                  <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                    {stats.modelAScore.toFixed(1)}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
                    {task.modelInfo?.modelA?.modelName || 'Model A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {task.modelInfo?.modelA?.providerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('blindTest.wins', '胜出')}: {stats.modelAWins} {t('blindTest.times', '次')}
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" color="text.disabled">
                  VS
                </Typography>
              </Box>

              <Card
                sx={{
                  flex: 1,
                  bgcolor: stats.modelBScore > stats.modelAScore ? 'success.50' : 'background.paper',
                  border: stats.modelBScore > stats.modelAScore ? '2px solid' : '1px solid',
                  borderColor: stats.modelBScore > stats.modelAScore ? 'success.main' : 'divider'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  {stats.modelBScore > stats.modelAScore && (
                    <EmojiEventsIcon sx={{ color: 'success.main', fontSize: 32, mb: 1 }} />
                  )}
                  <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 700 }}>
                    {stats.modelBScore.toFixed(1)}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
                    {task.modelInfo?.modelB?.modelName || 'Model B'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {task.modelInfo?.modelB?.providerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('blindTest.wins', '胜出')}: {stats.modelBWins} {t('blindTest.times', '次')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* 统计详情 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`${t('blindTest.totalQuestions', '总题数')}: ${stats.totalQuestions}`} />
              <Chip
                label={`${t('blindTest.bothGood', '都好')}: ${stats.bothGood}`}
                color="success"
                variant="outlined"
              />
              <Chip label={`${t('blindTest.bothBad', '都不好')}: ${stats.bothBad}`} color="error" variant="outlined" />
              <Chip label={`${t('blindTest.ties', '平局')}: ${stats.ties}`} variant="outlined" />
            </Box>
          </Paper>
        )}

        {/* 详细结果列表 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('blindTest.detailResults', '详细结果')}
          </Typography>

          {task.detail?.results?.map((result, index) => {
            const question = task.evalDatasets?.find(q => q.id === result.questionId);
            return (
              <Box key={index} sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('blindTest.question', '问题')} #{index + 1}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {question?.question || result.questionId}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {result.isSwapped ? task.modelInfo?.modelB?.modelName : task.modelInfo?.modelA?.modelName} (
                      {t('blindTest.left', '左')})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {result.leftAnswer || '-'}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {result.isSwapped ? task.modelInfo?.modelA?.modelName : task.modelInfo?.modelB?.modelName} (
                      {t('blindTest.right', '右')})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {result.rightAnswer || '-'}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={
                      result.vote === 'left'
                        ? t('blindTest.leftBetter', '左边更好')
                        : result.vote === 'right'
                          ? t('blindTest.rightBetter', '右边更好')
                          : result.vote === 'both_good'
                            ? t('blindTest.bothGood', '都好')
                            : t('blindTest.bothBad', '都不好')
                    }
                    color={result.vote === 'both_good' ? 'success' : result.vote === 'both_bad' ? 'error' : 'primary'}
                  />
                </Box>
              </Box>
            );
          })}
        </Paper>
      </Container>
    );
  }

  // 盲测进行中
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* 头部 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <CompareArrowsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
          {t('blindTest.inProgress', '盲测进行中')}
        </Typography>
        <Button variant="outlined" color="warning" startIcon={<StopIcon />} onClick={() => setInterruptDialog(true)}>
          {t('blindTest.interrupt', '中断任务')}
        </Button>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 进度条 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('blindTest.progress', '进度')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {task.completedCount} / {task.totalCount}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>

      {/* 当前题目 */}
      {answersLoading && !currentQuestion ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography color="text.secondary">{t('blindTest.generatingAnswers', '正在准备题目...')}</Typography>
        </Box>
      ) : currentQuestion ? (
        <>
          {/* 问题 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('blindTest.question', '问题')} #{(task.detail?.currentIndex || 0) + 1}
            </Typography>
            <Typography variant="h6">{currentQuestion.question}</Typography>
            {currentQuestion.tags && (
              <Box sx={{ mt: 1 }}>
                {currentQuestion.tags.split(',').map(tag => (
                  <Chip key={tag} label={tag.trim()} size="small" sx={{ mr: 0.5 }} />
                ))}
              </Box>
            )}
          </Paper>

          {/* 两个模型的回答 */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            {/* 左边回答 */}
            <Paper sx={{ flex: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                  {t('blindTest.answerA', '回答 A')}
                </Typography>
                {streamingA && <CircularProgress size={16} />}
              </Box>
              {leftAnswer?.error ? (
                <Alert severity="error">{leftAnswer.error}</Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto', minHeight: 100 }}>
                  {leftAnswer?.content ? (
                    <ReactMarkdown>{leftAnswer.content}</ReactMarkdown>
                  ) : streamingA ? (
                    <Typography color="text.disabled">{t('blindTest.generatingAnswers', '正在生成回答...')}</Typography>
                  ) : null}
                </Box>
              )}
              {leftAnswer?.duration > 0 && !streamingA && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                  {t('blindTest.duration', '耗时')}: {(leftAnswer.duration / 1000).toFixed(1)}s
                </Typography>
              )}
            </Paper>

            {/* 右边回答 */}
            <Paper sx={{ flex: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 600 }}>
                  {t('blindTest.answerB', '回答 B')}
                </Typography>
                {streamingB && <CircularProgress size={16} />}
              </Box>
              {rightAnswer?.error ? (
                <Alert severity="error">{rightAnswer.error}</Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto', minHeight: 100 }}>
                  {rightAnswer?.content ? (
                    <ReactMarkdown>{rightAnswer.content}</ReactMarkdown>
                  ) : streamingB ? (
                    <Typography color="text.disabled">{t('blindTest.generatingAnswers', '正在生成回答...')}</Typography>
                  ) : null}
                </Box>
              )}
              {rightAnswer?.duration > 0 && !streamingB && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                  {t('blindTest.duration', '耗时')}: {(rightAnswer.duration / 1000).toFixed(1)}s
                </Typography>
              )}
            </Paper>
          </Box>

          {/* 投票按钮 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center' }}>
              {t('blindTest.whichBetter', '哪个回答更好？')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<ThumbUpIcon />}
                onClick={() => handleVote('left')}
                disabled={voting || streamingA || streamingB}
                sx={{ minWidth: 140 }}
              >
                {t('blindTest.leftBetter', '左边更好')}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                startIcon={<ThumbUpIcon />}
                onClick={() => handleVote('right')}
                disabled={voting || streamingA || streamingB}
                sx={{ minWidth: 140 }}
              >
                {t('blindTest.rightBetter', '右边更好')}
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="large"
                startIcon={<ThumbsUpDownIcon />}
                onClick={() => handleVote('both_good')}
                disabled={voting || streamingA || streamingB}
                sx={{ minWidth: 120 }}
              >
                {t('blindTest.bothGood', '都好')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<ThumbDownIcon />}
                onClick={() => handleVote('both_bad')}
                disabled={voting || streamingA || streamingB}
                sx={{ minWidth: 120 }}
              >
                {t('blindTest.bothBad', '都不好')}
              </Button>
            </Box>
            {voting && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Paper>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Button startIcon={<RefreshIcon />} onClick={fetchCurrentQuestion}>
            {t('blindTest.loadQuestion', '加载题目')}
          </Button>
        </Box>
      )}

      {/* 中断确认对话框 */}
      <Dialog open={interruptDialog} onClose={() => setInterruptDialog(false)}>
        <DialogTitle>{t('blindTest.interruptConfirmTitle', '确认中断')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('blindTest.interruptConfirmMessage', '确定要中断这个盲测任务吗？已完成的评判结果将保留。')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterruptDialog(false)}>{t('common.cancel', '取消')}</Button>
          <Button color="warning" variant="contained" onClick={handleInterrupt}>
            {t('blindTest.interrupt', '中断')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
