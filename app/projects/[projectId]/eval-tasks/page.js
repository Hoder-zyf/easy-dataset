'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import { useTranslation } from 'react-i18next';

export default function EvalTasksPage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {t('eval.tasksTitle')}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300
        }}
      >
        <PlaylistPlayIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {t('eval.tasksComingSoon')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('eval.tasksComingSoonHint')}
        </Typography>
      </Paper>
    </Container>
  );
}
