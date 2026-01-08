import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import 'github-markdown-css/github-markdown-light.css';
import { blindTestStyles } from '@/styles/blindTest';

function AnswerBox({ title, answer, streaming, showThinking, setShowThinking, scrollRef, styles, theme }) {
  const { t } = useTranslation();

  return (
    <Paper sx={styles.answerPaper}>
      <Box sx={styles.answerHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: title.includes('A') ? 'primary.main' : 'secondary.main' }}
          >
            {title}
          </Typography>
          {streaming && <CircularProgress size={14} />}
        </Box>
        {answer?.duration > 0 && !streaming && (
          <Chip
            label={`${(answer.duration / 1000).toFixed(1)}s`}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {answer?.error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{answer.error}</Alert>
        </Box>
      ) : (
        <Box ref={scrollRef} sx={styles.answerContent}>
          {/* 思维链渲染 */}
          {answer?.thinking && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setShowThinking(!showThinking)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {answer.isThinking ? (
                    <AutoFixHighIcon
                      fontSize="small"
                      color="primary"
                      sx={{
                        animation: 'thinking-pulse 1.5s infinite',
                        '@keyframes thinking-pulse': {
                          '0%': { opacity: 0.4 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.4 }
                        }
                      }}
                    />
                  ) : (
                    <PsychologyIcon fontSize="small" color="action" />
                  )}
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {t('playground.reasoningProcess', '推理过程')}
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ p: 0.5 }}>
                  {showThinking ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Collapse in={showThinking}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'grey.50',
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    mb: 2,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                    {answer.thinking}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}

          {answer?.content ? (
            <div className="markdown-body" style={{ fontSize: '0.95rem' }}>
              <ReactMarkdown>{answer.content}</ReactMarkdown>
            </div>
          ) : streaming ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.disabled', mt: 2 }}>
              <Typography variant="body2">{t('blindTest.generatingAnswers', '正在生成回答...')}</Typography>
            </Box>
          ) : null}
        </Box>
      )}
    </Paper>
  );
}

export default function BlindTestInProgress({
  task,
  currentQuestion,
  leftAnswer,
  rightAnswer,
  streamingA,
  streamingB,
  answersLoading,
  voting,
  onVote,
  onReload
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = blindTestStyles(theme);

  const [showThinkingLeft, setShowThinkingLeft] = useState(true);
  const [showThinkingRight, setShowThinkingRight] = useState(true);

  // 自动滚动引用
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);

  // 处理自动滚动
  useEffect(() => {
    if (streamingA && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [leftAnswer?.content, leftAnswer?.thinking, streamingA]);

  useEffect(() => {
    if (streamingB && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight;
    }
  }, [rightAnswer?.content, rightAnswer?.thinking, streamingB]);

  const progress = task ? (task.completedCount / task.totalCount) * 100 : 0;

  if (answersLoading && !currentQuestion) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
      >
        <CircularProgress size={48} sx={{ mb: 3 }} />
        <Typography color="text.secondary" variant="h6">
          {t('blindTest.generatingAnswers', '正在准备题目...')}
        </Typography>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<RefreshIcon />}
          onClick={onReload}
          sx={{ borderRadius: 2, px: 4, py: 1.5 }}
        >
          {t('blindTest.loadQuestion', '加载题目')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      {/* 顶部进度和问题 */}
      <Paper sx={styles.questionPaper}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 60 }}>
            {t('blindTest.progress', '进度')} {task.completedCount + 1}/{task.totalCount}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        </Box>
      </Paper>

      {/* 回答区域 */}
      <Box sx={styles.answersContainer}>
        <AnswerBox
          title={t('blindTest.answerA', '回答 A') + `（${currentQuestion.question}）`}
          answer={leftAnswer}
          streaming={streamingA}
          showThinking={showThinkingLeft}
          setShowThinking={setShowThinkingLeft}
          scrollRef={leftScrollRef}
          styles={styles}
          theme={theme}
        />
        <AnswerBox
          title={t('blindTest.answerB', '回答 B') + `（${currentQuestion.question}）`}
          answer={rightAnswer}
          streaming={streamingB}
          showThinking={showThinkingRight}
          setShowThinking={setShowThinkingRight}
          scrollRef={rightScrollRef}
          styles={styles}
          theme={theme}
        />
      </Box>

      {/* 底部投票区域 */}
      <Paper elevation={4} sx={styles.voteBar}>
        <Box sx={styles.voteButtons}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ThumbUpIcon />}
            onClick={() => onVote('left')}
            disabled={voting || streamingA || streamingB}
            sx={styles.voteBtn}
          >
            {t('blindTest.leftBetter', '左边更好')}
          </Button>
          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<ThumbsUpDownIcon />}
            onClick={() => onVote('both_good')}
            disabled={voting || streamingA || streamingB}
            sx={styles.voteBtn}
          >
            {t('blindTest.bothGood', '都好')}
          </Button>
          <Tooltip
            title={
              currentQuestion?.answer ? (
                <Box sx={{ p: 1, maxWidth: 400 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}
                  >
                    <AssignmentIcon fontSize="small" color="primary" />
                    {t('blindTest.referenceAnswer', '参考答案')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', color: 'text.secondary' }}
                  >
                    {currentQuestion.answer}
                  </Typography>
                </Box>
              ) : (
                t('blindTest.noReferenceAnswer', '暂无参考答案')
              )
            }
            arrow
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
                  color: 'text.primary',
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${theme.palette.divider}`,
                  p: 0,
                  '& .MuiTooltip-arrow': {
                    color: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
                    '&::before': {
                      border: `1px solid ${theme.palette.divider}`
                    }
                  }
                }
              }
            }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<InfoOutlinedIcon />}
              sx={{
                ...styles.voteBtn,
                color: 'primary.main',
                borderColor: 'primary.light',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }
              }}
            >
              {t('blindTest.referenceAnswer', '参考答案')}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<ThumbDownIcon />}
            onClick={() => onVote('both_bad')}
            disabled={voting || streamingA || streamingB}
            sx={styles.voteBtn}
          >
            {t('blindTest.bothBad', '都不好')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<ThumbUpIcon />}
            onClick={() => onVote('right')}
            disabled={voting || streamingA || streamingB}
            sx={styles.voteBtn}
          >
            {t('blindTest.rightBetter', '右边更好')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
