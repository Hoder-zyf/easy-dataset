'use client';

import { Box, Typography, Checkbox, FormHelperText } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function ModelSelector({ models, selectedModels, onSelectionChange, error }) {
  const { t } = useTranslation();

  const getModelKey = model => `${model.providerId}::${model.modelId}`;

  const handleToggle = modelKey => {
    const newSelection = selectedModels.includes(modelKey)
      ? selectedModels.filter(m => m !== modelKey)
      : [...selectedModels, modelKey];
    onSelectionChange(newSelection);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        {t('evalTasks.selectModels')} *
      </Typography>
      <Box
        sx={{
          p: 2,
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper'
        }}
      >
        {models.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            暂无可用模型，请先在设置中配置模型
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {models.map(model => {
              const modelKey = getModelKey(model);
              return (
                <Box
                  key={modelKey}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggle(modelKey)}
                >
                  <Checkbox checked={selectedModels.includes(modelKey)} sx={{ p: 0, mr: 1.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {model.providerName || model.providerId} / {model.modelName || model.modelId}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      <FormHelperText>{t('evalTasks.selectModelsHint')}</FormHelperText>
    </Box>
  );
}
