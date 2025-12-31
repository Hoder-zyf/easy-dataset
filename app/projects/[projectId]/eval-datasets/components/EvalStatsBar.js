'use client';

import { Box, Paper, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ShortTextIcon from '@mui/icons-material/ShortText';
import NotesIcon from '@mui/icons-material/Notes';
import { useTranslation } from 'react-i18next';

const STATS_CONFIG = [
  { key: 'true_false', icon: CheckCircleIcon, color: 'success' },
  { key: 'single_choice', icon: RadioButtonCheckedIcon, color: 'primary' },
  { key: 'multiple_choice', icon: CheckBoxIcon, color: 'secondary' },
  { key: 'short_answer', icon: ShortTextIcon, color: 'warning' },
  { key: 'open_ended', icon: NotesIcon, color: 'info' }
];

export default function EvalStatsBar({ stats, questionType, onTypeChange }) {
  const { t } = useTranslation();

  if (!stats) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* 总数 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: 'grey.100',
            cursor: 'pointer',
            border: !questionType ? '2px solid' : '2px solid transparent',
            borderColor: !questionType ? 'primary.main' : 'transparent',
            '&:hover': { bgcolor: 'grey.200' }
          }}
          onClick={() => onTypeChange('')}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {stats.total || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('eval.totalQuestions')}
          </Typography>
        </Box>

        <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', height: 40, mx: 1 }} />

        {/* 各题型统计 */}
        {STATS_CONFIG.map(({ key, icon: Icon, color }) => {
          const count = stats.byType?.[key] || 0;
          const isActive = questionType === key;

          return (
            <Chip
              key={key}
              icon={<Icon sx={{ fontSize: 18 }} />}
              label={`${t(`eval.questionTypes.${key}`)} (${count})`}
              color={isActive ? color : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => onTypeChange(isActive ? '' : key)}
              sx={{
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
                '&:hover': { opacity: 0.85 }
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
