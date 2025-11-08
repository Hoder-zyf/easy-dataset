'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  useTheme as useMuiTheme,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Collapse,
  useMediaQuery
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import UpdateChecker from './UpdateChecker';
import TaskIcon from './TaskIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// 图标
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function Navbar({ projects = [], currentProject }) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;
  
  // 检测移动设备
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // 移动端抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  
  // 桌面端菜单状态
  const [menuState, setMenuState] = useState({ anchorEl: null, menuType: null });

  const handleMenuOpen = (event, menuType) => {
    setMenuState({ anchorEl: event.currentTarget, menuType });
  };

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, menuType: null });
  };

  const isMenuOpen = menuType => menuState.menuType === menuType;

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    setExpandedMenu(null);
  };

  const toggleMobileSubmenu = menuType => {
    setExpandedMenu(expandedMenu === menuType ? null : menuType);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <AppBar
        component="nav"
        position="sticky"
        elevation={0}
        color={theme.palette.mode === 'dark' ? 'transparent' : 'primary'}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
            : '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        style={{ borderRadius: 0, zIndex: 1200 }}
        role="navigation"
        aria-label={t('common.mainNavigation', 'Main navigation')}
      >
        <Toolbar
          sx={{
            height: '64px',
            minHeight: '64px !important',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 2, md: 3 },
            gap: 2
          }}
        >
          {/* 左侧: 汉堡菜单(移动端) + Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            {/* 汉堡菜单按钮 */}
            {isProjectDetail && isMobile && (
              <Tooltip title={t('common.menu', 'Menu')} placement="bottom">
                <IconButton
                  onClick={toggleDrawer}
                  size="medium"
                  aria-label={t('common.openMenu', 'Open navigation menu')}
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-navigation-drawer"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                    minWidth: 44,
                    minHeight: 44,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Logo */}
            <Tooltip title={t('common.goHome', 'Go to Home')} placement="bottom">
              <Box
                component="a"
                href="/"
                role="link"
                aria-label={t('common.goToHomePage', 'Go to home page')}
                tabIndex={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: 1.5,
                  px: 0.5,
                  '&:hover': { 
                    opacity: 0.85,
                    transform: 'translateY(-1px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                    outlineOffset: 2
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = '/';
                  }
                }}
              >
                <Box
                  component="img"
                  src="/imgs/logo.svg"
                  alt="Easy Dataset Logo"
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    transition: 'transform 0.2s ease'
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                    fontSize: '1.125rem',
                    display: { xs: 'none', md: 'block' },
                    color: 'white',
                    ...(theme.palette.mode === 'dark' && {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    })
                  }}
                >
                  Easy DataSet
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* 中间导航 - 仅桌面端 */}
          {isProjectDetail && !isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: { lg: 1, xl: 3 }, overflow: 'hidden' }}>
              <Tabs
                value={
                  pathname.includes('/settings') || pathname.includes('/playground') || pathname.includes('/datasets-sq')
                    ? 'more'
                    : pathname.includes('/datasets') ||
                      pathname.includes('/multi-turn') ||
                      pathname.includes('/image-datasets')
                    ? 'datasets'
                    : pathname.includes('/text-split') || pathname.includes('/images')
                    ? 'source'
                    : pathname
                }
                textColor="inherit"
                indicatorColor="secondary"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: '64px',
                  '& .MuiTab-root': {
                    minWidth: 100,
                    maxWidth: 180,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                    px: 2,
                    minHeight: '64px',
                    textTransform: 'none',
                    letterSpacing: '0.3px',
                    '&:hover': {
                      color: 'white',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(255, 255, 255, 0.15)'
                    }
                  },
                  '& .Mui-selected': {
                    color: 'white !important',
                    fontWeight: 600,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(255, 255, 255, 0.2)'
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 0 8px rgba(103, 126, 234, 0.5)' 
                      : '0 0 8px rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                <Tab
                  icon={<DescriptionOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {t('common.dataSource')}
                      <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
                    </Box>
                  }
                  value="source"
                  onMouseEnter={e => handleMenuOpen(e, 'source')}
                  sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
                />
                <Tab
                  icon={<TokenOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={t('distill.title')}
                  value={`/projects/${currentProject}/distill`}
                  component={Link}
                  href={`/projects/${currentProject}/distill`}
                  onClick={handleMenuClose}
                  sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
                />
                <Tab
                  icon={<QuestionAnswerOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={t('questions.title')}
                  value={`/projects/${currentProject}/questions`}
                  component={Link}
                  href={`/projects/${currentProject}/questions`}
                  onClick={handleMenuClose}
                  sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
                />
                <Tab
                  icon={<DatasetOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {t('datasets.management')}
                      <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
                    </Box>
                  }
                  value="datasets"
                  onMouseEnter={e => handleMenuOpen(e, 'dataset')}
                  sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
                />
                <Tab
                  icon={<MoreVertIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {t('common.more')}
                      <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
                    </Box>
                  }
                  onMouseEnter={e => handleMenuOpen(e, 'more')}
                  value="more"
                  sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
                />
              </Tabs>
            </Box>
          )}

          {/* 右侧操作区 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {isProjectDetail && <TaskIcon theme={theme} projectId={currentProject} />}

            {/* Language Switcher - Always visible */}
            <LanguageSwitcher />

            {/* Theme Toggle - Always visible */}
            <Tooltip title={resolvedTheme === 'dark' ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}>
              <IconButton
                onClick={toggleTheme}
                size="medium"
                aria-label={resolvedTheme === 'dark' ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.35)',
                    transform: 'rotate(180deg)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                    outlineOffset: 2
                  }
                }}
              >
                {resolvedTheme === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Documentation - Hide below xl */}
            <Tooltip title={t('common.documentation', 'Documentation')}>
              <IconButton
                component="a"
                href={i18n.language === 'zh-CN' ? 'https://docs.easy-dataset.com/' : 'https://docs.easy-dataset.com/ed/en'}
                target="_blank"
                rel="noopener noreferrer"
                size="medium"
                aria-label={t('common.openDocumentation', 'Open documentation')}
                sx={{
                  display: { xs: 'none', xl: 'flex' },
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.35)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                    outlineOffset: 2
                  }
                }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* GitHub - Hide at larger tablet screens and below */}
            <Tooltip title={t('common.viewOnGitHub', 'View on GitHub')}>
              <IconButton
                component="a"
                href="https://github.com/ConardLi/easy-dataset"
                target="_blank"
                rel="noopener noreferrer"
                size="medium"
                aria-label={t('common.openGitHub', 'Open GitHub repository')}
                sx={{
                  display: { xs: 'none', xl: 'flex' },
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  borderRadius: '10px',
                  minWidth: 44,
                  minHeight: 44,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.35)',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.15)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                    outlineOffset: 2
                  }
                }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Update Checker - Hide below xl */}
            <Box sx={{ display: { xs: 'none', xl: 'flex' } }}>
              <UpdateChecker />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 移动端抽屉 */}
      <Drawer
        id="mobile-navigation-drawer"
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          role: "navigation",
          'aria-label': t('common.mobileNavigation', 'Mobile navigation menu'),
          sx: {
            width: { xs: '85vw', sm: 320 },
            maxWidth: 380,
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
              : 'none',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)'
          }
        }}
        ModalProps={{
          keepMounted: true // Better mobile performance
        }}
        transitionDuration={300}
        SlideProps={{
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 64
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/imgs/logo.svg"
              alt="Easy Dataset Logo"
              sx={{ width: 32, height: 32 }}
            />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
              {t('common.navigation', 'Navigation')}
            </Typography>
          </Box>
          <Tooltip title={t('common.closeMenu', 'Close menu')}>
            <IconButton 
              onClick={toggleDrawer}
              aria-label={t('common.closeMenu', 'Close menu')}
              size="medium"
              sx={{
                minWidth: 44,
                minHeight: 44,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  transform: 'rotate(90deg)',
                  bgcolor: 'action.hover'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <List sx={{ pt: 1, px: 1 }} role="menu">
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => toggleMobileSubmenu('source')}
              aria-expanded={expandedMenu === 'source'}
              aria-controls="source-submenu"
              role="menuitem"
              sx={{
                borderRadius: '8px',
                minHeight: 48,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DescriptionOutlinedIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={t('common.dataSource')}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
              {expandedMenu === 'source' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse id="source-submenu" in={expandedMenu === 'source'} timeout="auto" unmountOnExit>
            <List component="div" disablePadding role="menu" sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '8px',
              my: 0.5
            }}>
              <ListItemButton
                role="menuitem"
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/text-split`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <DescriptionOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('textSplit.title')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
              <ListItemButton
                role="menuitem"
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/images`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('images.title')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={`/projects/${currentProject}/distill`}
              onClick={toggleDrawer}
              role="menuitem"
              sx={{
                borderRadius: '8px',
                minHeight: 48,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <TokenOutlinedIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={t('distill.title')}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={`/projects/${currentProject}/questions`}
              onClick={toggleDrawer}
              role="menuitem"
              sx={{
                borderRadius: '8px',
                minHeight: 48,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <QuestionAnswerOutlinedIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={t('questions.title')}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => toggleMobileSubmenu('dataset')}
              role="menuitem"
              aria-expanded={expandedMenu === 'dataset'}
              aria-controls="dataset-submenu"
              sx={{
                borderRadius: '8px',
                minHeight: 48,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DatasetOutlinedIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={t('datasets.management')}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
              {expandedMenu === 'dataset' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expandedMenu === 'dataset'} timeout="auto" unmountOnExit id="dataset-submenu">
            <List component="div" disablePadding sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)', py: 1 }}>
              <ListItemButton
                role="menuitem"
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/datasets`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <DatasetOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('datasets.singleTurn', '单轮问答数据集')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
              <ListItemButton
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/multi-turn`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('datasets.multiTurn', '多轮对话数据集')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
              <ListItemButton
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/image-datasets`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('datasets.imageQA', '图片问答数据集')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => toggleMobileSubmenu('more')}
              role="menuitem"
              aria-expanded={expandedMenu === 'more'}
              aria-controls="more-submenu"
              sx={{
                borderRadius: '8px',
                minHeight: 48,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MoreVertIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={t('common.more')}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
              {expandedMenu === 'more' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expandedMenu === 'more'} timeout="auto" unmountOnExit id="more-submenu">
            <List component="div" disablePadding sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)', py: 1 }}>
              <ListItemButton
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/settings`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SettingsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('settings.title')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
              <ListItemButton
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href={`/projects/${currentProject}/playground`}
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ScienceOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('playground.title')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
              <ListItemButton
                sx={{ 
                  pl: 4,
                  mx: 1,
                  borderRadius: '8px',
                  minHeight: 44,
                  py: 1.25,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.08)' : 'rgba(103, 126, 234, 0.05)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }}
                component={Link}
                href="/dataset-square"
                onClick={toggleDrawer}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <StorageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('datasetSquare.title')} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Utilities Section */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component="a"
                href={i18n.language === 'zh-CN' ? 'https://docs.easy-dataset.com/' : 'https://docs.easy-dataset.com/ed/en'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={toggleDrawer}
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <HelpOutlineIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('common.documentation', 'Documentation')}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  window.open('https://github.com/ConardLi/easy-dataset', '_blank');
                  toggleDrawer();
                }}
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.12)' : 'rgba(103, 126, 234, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <GitHubIcon sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('common.viewOnGitHub', 'View on GitHub')}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 1 }}>
              <Box sx={{ px: 1, width: '100%' }}>
                <UpdateChecker />
              </Box>
            </ListItem>
          </Box>
        </List>
      </Drawer>

      {/* 桌面端悬停菜单 */}
      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('source')}
        onClose={handleMenuClose}
        aria-label={t('common.dataSource', 'Data source menu')}
        PaperProps={{
          elevation: 8,
          sx: { 
            mt: 1.5, 
            borderRadius: '12px', 
            minWidth: 220,
            overflow: 'visible',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 12px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: '50%',
              width: 12,
              height: 12,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              transform: 'translateY(-50%) translateX(50%) rotate(45deg)',
              zIndex: 0,
              boxShadow: theme.palette.mode === 'dark'
                ? '-2px -2px 4px rgba(0, 0, 0, 0.3)'
                : '-2px -2px 4px rgba(0, 0, 0, 0.1)'
            }
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{ 
          dense: false, 
          onMouseLeave: handleMenuClose,
          sx: { py: 1.5 },
          role: 'menu'
        }}
        transitionDuration={200}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/text-split`}
          onClick={handleMenuClose}
          role="menuitem"
          sx={{
            mx: 1,
            borderRadius: '8px',
            py: 1.25,
            minHeight: 44,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DescriptionOutlinedIcon 
              fontSize="small" 
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('textSplit.title')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.75, mx: 1.5 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/images`}
          onClick={handleMenuClose}
          role="menuitem"
          sx={{
            mx: 1,
            borderRadius: '8px',
            py: 1.25,
            minHeight: 44,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ImageIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('images.title')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('dataset')}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: { 
            mt: 1.5, 
            borderRadius: '12px', 
            minWidth: 220,
            overflow: 'visible',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: '50%',
              width: 12,
              height: 12,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              transform: 'translateY(-50%) translateX(50%) rotate(45deg)',
              zIndex: 0
            }
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{ 
          dense: true, 
          onMouseLeave: handleMenuClose,
          sx: { py: 1 }
        }}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/datasets`}
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DatasetOutlinedIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('datasets.singleTurn', '单轮问答数据集')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/multi-turn`}
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ChatIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('datasets.multiTurn', '多轮对话数据集')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/image-datasets`}
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ImageIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('datasets.imageQA', '图片问答数据集')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('more')}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: { 
            mt: 1.5, 
            borderRadius: '12px', 
            minWidth: 200,
            overflow: 'visible',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: '50%',
              width: 12,
              height: 12,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              transform: 'translateY(-50%) translateX(50%) rotate(45deg)',
              zIndex: 0
            }
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{ 
          dense: true, 
          onMouseLeave: handleMenuClose,
          sx: { py: 1 }
        }}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/settings`}
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SettingsOutlinedIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('settings.title')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/playground`}
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ScienceOutlinedIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('playground.title')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href="/dataset-square"
          onClick={handleMenuClose}
          sx={{
            mx: 0.75,
            borderRadius: '8px',
            py: 1,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.1)',
              transform: 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StorageIcon 
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={t('datasetSquare.title')}
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
