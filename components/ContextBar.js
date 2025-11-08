'use client';

import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  alpha
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useSetAtom, useAtomValue } from 'jotai';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';
import { toast } from 'sonner';
import axios from 'axios';

// Icons
import FolderIcon from '@mui/icons-material/Folder';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckIcon from '@mui/icons-material/Check';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export default function ContextBar({ projects = [], currentProjectId }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  
  // State
  const [projectMenuAnchor, setProjectMenuAnchor] = useState(null);
  const [modelMenuAnchor, setModelMenuAnchor] = useState(null);
  
  // Jotai atoms
  const setConfigList = useSetAtom(modelConfigListAtom);
  const setSelectedModelInfo = useSetAtom(selectedModelInfoAtom);
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);
  const modelConfigList = useAtomValue(modelConfigListAtom);
  
  // Get current project
  const currentProject = projects.find(p => p.id === currentProjectId);
  
  // Handlers
  const handleProjectMenuOpen = event => {
    event.preventDefault();
    setProjectMenuAnchor(event.currentTarget);
  };
  
  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
  };
  
  const handleModelMenuOpen = event => {
    event.preventDefault();
    setModelMenuAnchor(event.currentTarget);
  };
  
  const handleModelMenuClose = () => {
    setModelMenuAnchor(null);
  };
  
  const handleProjectChange = async newProjectId => {
    handleProjectMenuClose();
    
    try {
      // Fetch model config for new project
      const response = await axios.get(`/api/projects/${newProjectId}/model-config`);
      setConfigList(response.data.data);
      
      if (response.data.defaultModelConfigId) {
        setSelectedModelInfo(response.data.data.find(item => item.id === response.data.defaultModelConfigId));
      } else {
        setSelectedModelInfo('');
      }
      
      // Navigate to the new project's text-split page
      router.push(`/projects/${newProjectId}/text-split`);
    } catch (error) {
      console.error('Error switching project:', error);
      toast.error(t('common.error', 'Error switching project'));
    }
  };
  
  const handleModelChange = modelConfig => {
    handleModelMenuClose();
    setSelectedModelInfo(modelConfig);
    toast.success(t('model.switched', 'Model switched successfully'));
  };
  
  // Don't render if not in a project page
  if (!currentProjectId || !currentProject) {
    return null;
  }
  
  return (
    <Paper
      elevation={0}
      component="nav"
      aria-label={t('common.contextNavigation', 'Context navigation')}
      sx={{
        position: 'sticky',
        top: 64, // Below navbar
        zIndex: 1100,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 1.25, sm: 1.5 },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 1px 3px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
        {/* Project Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {t('common.project', 'Project')}:
          </Typography>
          <Tooltip 
            title={currentProject?.name || t('projects.selectProject', 'Select Project')} 
            placement="bottom-start"
            arrow
          >
            <Chip
              icon={<FolderIcon fontSize="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      maxWidth: { xs: '120px', sm: '200px', md: '300px' }
                    }}
                  >
                    {currentProject?.name || t('projects.selectProject', 'Select Project')}
                  </Typography>
                  <ArrowDropDownIcon fontSize="small" sx={{ ml: -0.25, flexShrink: 0 }} />
                </Box>
              }
            onClick={handleProjectMenuOpen}
            clickable
            variant="outlined"
            size="medium"
            sx={{
              minWidth: { xs: 140, sm: 160, md: 180 },
              maxWidth: { xs: 200, sm: 280, md: 360 },
              height: { xs: 36, sm: 40 },
              borderRadius: 2,
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)',
                transform: 'translateY(-1px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(144, 202, 249, 0.15)'
                  : '0 4px 12px rgba(25, 118, 210, 0.15)'
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2
              },
              '& .MuiChip-icon': {
                color: 'text.primary',
                fontSize: '1.1rem',
                ml: 0.5,
                flexShrink: 0
              },
              '& .MuiChip-label': {
                px: 1,
                overflow: 'hidden'
              }
            }}
            aria-label={t('projects.selectProject', 'Select project')}
            aria-controls={projectMenuAnchor ? 'project-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(projectMenuAnchor)}
          />
        </Tooltip>
        </Box>
        
        {/* Model Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {t('common.model', 'Model')}:
          </Typography>
          <Tooltip 
            title={selectedModelInfo ? `${selectedModelInfo.modelName} (${selectedModelInfo.provider})` : t('model.selectModel', 'Select Model')} 
            placement="bottom-start"
            arrow
          >
            <Chip
              icon={<SmartToyIcon fontSize="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography 
                    variant="body2"
                    noWrap
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      maxWidth: { xs: '120px', sm: '200px', md: '300px' }
                    }}
                  >
                    {selectedModelInfo?.modelName || t('model.selectModel', 'Select Model')}
                  </Typography>
                  <ArrowDropDownIcon fontSize="small" sx={{ ml: -0.25, flexShrink: 0 }} />
                </Box>
              }
            onClick={handleModelMenuOpen}
            clickable
            variant="outlined"
            color="primary"
            size="medium"
            sx={{
              minWidth: { xs: 140, sm: 160, md: 180 },
              maxWidth: { xs: 200, sm: 280, md: 360 },
              height: { xs: 36, sm: 40 },
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-1px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(144, 202, 249, 0.25)'
                  : '0 4px 12px rgba(25, 118, 210, 0.25)'
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2
              },
              '& .MuiChip-icon': {
                color: 'primary.main',
                fontSize: '1.1rem',
                ml: 0.5,
                flexShrink: 0
              },
              '& .MuiChip-label': {
                px: 1,
                overflow: 'hidden'
              }
            }}
            aria-label={t('model.selectModel', 'Select model')}
            aria-controls={modelMenuAnchor ? 'model-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(modelMenuAnchor)}
          />
        </Tooltip>
        </Box>
      </Box>
      
      {/* Project Menu */}
      <Menu
        id="project-menu"
        anchorEl={projectMenuAnchor}
        open={Boolean(projectMenuAnchor)}
        onClose={handleProjectMenuClose}
        role="menu"
        aria-label={t('projects.projectMenu', 'Project menu')}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 240,
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: 2,
            overflow: 'visible',
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.paper',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -6,
              left: 24,
              width: 12,
              height: 12,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderTop: `1px solid ${theme.palette.divider}`
            }
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        MenuListProps={{
          'aria-labelledby': 'project-selector',
          dense: false,
          sx: { py: 1 }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}
        >
          {t('projects.allProjects', 'All Projects')}
        </Typography>
        {projects.map((project, index) => (
          <MenuItem
            key={project.id}
            onClick={() => handleProjectChange(project.id)}
            selected={project.id === currentProjectId}
            role="menuitem"
            sx={{
              mx: 1,
              borderRadius: 1.5,
              minHeight: 44,
              py: 1.25,
              px: 1.5,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)',
                transform: 'translateX(4px)'
              },
              '&.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.24)' : 'rgba(25, 118, 210, 0.12)'
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {project.id === currentProjectId ? (
                <CheckIcon fontSize="small" color="primary" />
              ) : (
                <FolderIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={project.name}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: project.id === currentProjectId ? 600 : 400
              }}
            />
          </MenuItem>
        ))}
      </Menu>
      
      {/* Model Menu */}
      <Menu
        id="model-menu"
        anchorEl={modelMenuAnchor}
        open={Boolean(modelMenuAnchor)}
        onClose={handleModelMenuClose}
        role="menu"
        aria-label={t('model.modelMenu', 'Model menu')}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 260,
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: 2,
            overflow: 'visible',
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.paper',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -6,
              left: 24,
              width: 12,
              height: 12,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderTop: `1px solid ${theme.palette.divider}`
            }
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        MenuListProps={{
          'aria-labelledby': 'model-selector',
          dense: false,
          sx: { py: 1 }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}
        >
          {t('model.availableModels', 'Available Models')}
        </Typography>
        {modelConfigList && modelConfigList.length > 0 ? (
          modelConfigList.map((modelConfig, index) => (
            <MenuItem
              key={modelConfig.id}
              onClick={() => handleModelChange(modelConfig)}
              selected={modelConfig.id === selectedModelInfo?.id}
              role="menuitem"
              sx={{
                mx: 1,
                borderRadius: 1.5,
                minHeight: 44,
                py: 1.25,
                px: 1.5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)',
                  transform: 'translateX(4px)'
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.24)' : 'rgba(25, 118, 210, 0.12)'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {modelConfig.id === selectedModelInfo?.id ? (
                  <CheckIcon fontSize="small" color="primary" />
                ) : (
                  <SmartToyIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={modelConfig.modelName}
                secondary={modelConfig.provider}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: modelConfig.id === selectedModelInfo?.id ? 600 : 400
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { fontSize: '0.7rem' }
                }}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled sx={{ mx: 1, py: 1.25 }}>
            <ListItemText
              primary={t('model.noModelsAvailable', 'No models configured')}
              primaryTypographyProps={{
                variant: 'body2',
                color: 'text.secondary'
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
}
