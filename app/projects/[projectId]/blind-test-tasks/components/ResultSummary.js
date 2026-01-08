import { Box, Paper, Typography, Card, CardContent, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTranslation } from 'react-i18next';
import { blindTestStyles } from '@/styles/blindTest';

export default function ResultSummary({ stats, modelInfo }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = blindTestStyles(theme);

  if (!stats) return null;

  return (
    <Paper sx={{ ...styles.questionPaper, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {t('blindTest.resultSummary', '评测结果汇总')}
      </Typography>

      {/* 模型对比得分 */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card
          sx={{
            ...styles.scoreCard,
            bgcolor: stats.modelAScore > stats.modelBScore ? 'success.50' : 'background.paper',
            borderColor: stats.modelAScore > stats.modelBScore ? 'success.main' : 'divider'
          }}
        >
          <CardContent sx={styles.scoreCardContent}>
            {stats.modelAScore > stats.modelBScore && (
              <EmojiEventsIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
            )}
            <Typography variant="h2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.modelAScore.toFixed(1)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {modelInfo?.modelA?.modelName || 'Model A'}
            </Typography>
            <Chip label={modelInfo?.modelA?.providerName} size="small" variant="outlined" sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('blindTest.wins', '胜出')}: <strong>{stats.modelAWins}</strong> {t('blindTest.times', '次')}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3" color="text.disabled" sx={{ fontWeight: 300 }}>
            VS
          </Typography>
        </Box>

        <Card
          sx={{
            ...styles.scoreCard,
            bgcolor: stats.modelBScore > stats.modelAScore ? 'success.50' : 'background.paper',
            borderColor: stats.modelBScore > stats.modelAScore ? 'success.main' : 'divider'
          }}
        >
          <CardContent sx={styles.scoreCardContent}>
            {stats.modelBScore > stats.modelAScore && (
              <EmojiEventsIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
            )}
            <Typography variant="h2" color="secondary.main" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.modelBScore.toFixed(1)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {modelInfo?.modelB?.modelName || 'Model B'}
            </Typography>
            <Chip label={modelInfo?.modelB?.providerName} size="small" variant="outlined" sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('blindTest.wins', '胜出')}: <strong>{stats.modelBWins}</strong> {t('blindTest.times', '次')}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 统计详情 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip label={`${t('blindTest.totalQuestions', '总题数')}: ${stats.totalQuestions}`} sx={{ fontWeight: 500 }} />
        <Chip label={`${t('blindTest.bothGood', '都好')}: ${stats.bothGood}`} color="success" variant="outlined" />
        <Chip label={`${t('blindTest.bothBad', '都不好')}: ${stats.bothBad}`} color="error" variant="outlined" />
        <Chip label={`${t('blindTest.ties', '平局')}: ${stats.ties}`} variant="outlined" />
      </Box>
    </Paper>
  );
}
