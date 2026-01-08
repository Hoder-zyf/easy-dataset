import { Box, Typography, IconButton, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { blindTestStyles } from '@/styles/blindTest';

export default function BlindTestHeader({ title, status, onBack, actions }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = blindTestStyles(theme);

  return (
    <Box sx={styles.header}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={styles.headerTitle}>
          <CompareArrowsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {status !== undefined && (
            <Chip
              label={
                status === 1
                  ? t('blindTest.statusCompleted', '已完成')
                  : status === 3
                    ? t('blindTest.statusInterrupted', '已中断')
                    : t('blindTest.statusProcessing', '进行中')
              }
              color={status === 1 ? 'success' : status === 3 ? 'warning' : 'primary'}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      <Box>{actions}</Box>
    </Box>
  );
}
