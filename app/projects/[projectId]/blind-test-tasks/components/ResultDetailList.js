import { Box, Paper, Typography, Chip, Collapse, IconButton } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useState } from 'react';
import 'github-markdown-css/github-markdown-light.css';
import { blindTestStyles } from '@/styles/blindTest';

// 解析包含 <think> 标签的内容
const parseAnswerContent = text => {
  if (!text) return { thinking: '', content: '' };

  // 匹配 <think>...</think> 内容
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      content: text.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    };
  }

  return { thinking: '', content: text };
};

function ResultAnswerSection({ title, rawContent, isWinner, t, theme }) {
  const { thinking, content } = parseAnswerContent(rawContent);
  const [showThinking, setShowThinking] = useState(false);

  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {isWinner && (
          <Chip
            label={t('blindTest.winner', '胜出')}
            size="small"
            color={title.includes('左') ? 'primary' : 'secondary'}
          />
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        {/* 思维链展示 */}
        {thinking && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                userSelect: 'none',
                mb: 1,
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
              onClick={() => setShowThinking(!showThinking)}
            >
              <PsychologyIcon fontSize="small" color="action" />
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                {t('playground.reasoningProcess', '推理过程')}
              </Typography>
              <IconButton size="small" sx={{ p: 0, ml: 'auto' }}>
                {showThinking ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={showThinking}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  mb: 2,
                  border: `1px dashed ${theme.palette.divider}`
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                  {thinking}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* 正文内容 */}
        <div className="markdown-body" style={{ fontSize: '0.9rem' }}>
          <ReactMarkdown>{content || '-'}</ReactMarkdown>
        </div>
      </Paper>
    </Box>
  );
}

function ResultItem({ result, index, task, question }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = blindTestStyles(theme);
  const [expanded, setExpanded] = useState(false);

  // 预处理答案，截取一部分作为预览
  const getPreview = text => {
    if (!text) return '-';
    const lines = text.split('\n').slice(0, 3);
    return lines.join('\n') + (text.split('\n').length > 3 ? '...' : '');
  };

  return (
    <Paper sx={styles.resultItem}>
      {/* 头部摘要 */}
      <Box sx={styles.resultItemHeader} onClick={() => setExpanded(!expanded)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 60 }}>
            #{index + 1}
          </Typography>
          <Typography variant="body1" noWrap sx={{ fontWeight: 500, maxWidth: { xs: 200, md: 600 } }}>
            {question?.question || result.questionId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            variant="outlined"
          />
          <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Box>
      </Box>

      {/* 展开详情 */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            {question?.question}
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* 左侧详情 */}
            <ResultAnswerSection
              title={`${result.isSwapped ? task.modelInfo?.modelB?.modelName : task.modelInfo?.modelA?.modelName} (${t('blindTest.left', '左')})`}
              rawContent={result.leftAnswer}
              isWinner={result.vote === 'left'}
              t={t}
              theme={theme}
            />

            {/* 右侧详情 */}
            <ResultAnswerSection
              title={`${result.isSwapped ? task.modelInfo?.modelA?.modelName : task.modelInfo?.modelB?.modelName} (${t('blindTest.right', '右')})`}
              rawContent={result.rightAnswer}
              isWinner={result.vote === 'right'}
              t={t}
              theme={theme}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function ResultDetailList({ task }) {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('blindTest.detailResults', '详细结果')}
      </Typography>

      {task.detail?.results?.map((result, index) => {
        const question = task.evalDatasets?.find(q => q.id === result.questionId);
        return <ResultItem key={index} result={result} index={index} task={task} question={question} />;
      })}
    </Box>
  );
}
