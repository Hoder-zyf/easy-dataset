'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  Divider,
  Link
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

// 题型配置
const QUESTION_TYPES = [
  { value: 'true_false', label: 'eval.questionTypes.true_false', labelZh: '判断题' },
  { value: 'single_choice', label: 'eval.questionTypes.single_choice', labelZh: '单选题' },
  { value: 'multiple_choice', label: 'eval.questionTypes.multiple_choice', labelZh: '多选题' },
  { value: 'short_answer', label: 'eval.questionTypes.short_answer', labelZh: '短答案题' },
  { value: 'open_ended', label: 'eval.questionTypes.open_ended', labelZh: '开放式问题' }
];

// Data format preview configuration
const FORMAT_PREVIEW = {
  true_false: {
    fields: ['question', 'correctAnswer'],
    example: {
      question: 'Artificial intelligence is a branch of computer science',
      correctAnswer: '✅ or ❌'
    },
    description: 'correctAnswer must be "✅" (correct) or "❌" (incorrect)'
  },
  single_choice: {
    fields: ['question', 'options', 'correctAnswer'],
    example: {
      question: 'Which of the following is a core feature of deep learning?',
      options: '["Option A", "Option B", "Option C", "Option D"]',
      correctAnswer: 'B'
    },
    description: 'options is an array of options, correctAnswer is the letter of the correct option (A/B/C/D)'
  },
  multiple_choice: {
    fields: ['question', 'options', 'correctAnswer'],
    example: {
      question: 'Which of the following are commonly used deep learning frameworks?',
      options: '["TensorFlow", "PyTorch", "Excel", "Keras"]',
      correctAnswer: '["A", "B", "D"]'
    },
    description: 'options is an array of options, correctAnswer is an array of correct option letters'
  },
  short_answer: {
    fields: ['question', 'correctAnswer'],
    example: {
      question: 'What is the typical model structure used in deep learning?',
      correctAnswer: 'Neural network'
    },
    description: 'correctAnswer is a short standard answer'
  },
  open_ended: {
    fields: ['question', 'correctAnswer'],
    example: {
      question: 'Analyze the main reasons for the success of deep learning in computer vision.',
      correctAnswer: 'Reference answer content...'
    },
    description: 'correctAnswer is a reference answer (can be long)'
  }
};

export default function ImportDialog({ open, onClose, projectId, onSuccess }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [questionType, setQuestionType] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);

  // 处理文件选择
  const handleFileChange = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!['json', 'xls', 'xlsx'].includes(ext)) {
        setError(t('evalDatasets.import.invalidFileType', '不支持的文件格式，请上传 json、xls 或 xlsx 文件'));
        return;
      }
      setFile(selectedFile);
      setError(null);
      setErrorDetails([]);
    }
  };

  // 下载模板
  const handleDownloadTemplate = format => {
    if (!questionType) {
      setError(t('evalDatasets.import.selectTypeFirst', '请先选择题型'));
      return;
    }

    if (format === 'json') {
      // JSON 模板动态生成并下载
      const templateData = getJsonTemplateData(questionType);
      const jsonContent = JSON.stringify(templateData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eval-dataset-template-${questionType}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Excel 模板动态生成
      const templateData = getExcelTemplateData(questionType);
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

      // 设置列宽
      const colWidths = getColumnWidths(questionType);
      worksheet['!cols'] = colWidths;

      // 下载文件
      XLSX.writeFile(workbook, `eval-dataset-template-${questionType}.xlsx`);
    }
  };

  // 获取 JSON 模板数据
  const getJsonTemplateData = type => {
    switch (type) {
      case 'true_false':
        return [
          { question: 'Artificial Intelligence is a branch of computer science', correctAnswer: '✅' },
          { question: 'Deep learning does not require large amounts of data for training', correctAnswer: '❌' }
        ];
      case 'single_choice':
        return [
          {
            question: 'What is the core feature of deep learning?',
            options: [
              'Requires manual feature engineering',
              'Automatic feature learning',
              'Only handles structured data',
              'Does not need large amounts of data'
            ],
            correctAnswer: 'B'
          },
          {
            question: 'Which of the following is a commonly used deep learning framework?',
            options: ['Excel', 'Word', 'TensorFlow', 'PowerPoint'],
            correctAnswer: 'C'
          }
        ];
      case 'multiple_choice':
        return [
          {
            question: 'Which of the following are commonly used deep learning frameworks?',
            options: ['TensorFlow', 'PyTorch', 'Excel', 'Keras', 'Word'],
            correctAnswer: ['A', 'B', 'D']
          },
          {
            question: 'Which of the following are main types of machine learning?',
            options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Manual Learning'],
            correctAnswer: ['A', 'B', 'C']
          }
        ];
      case 'short_answer':
        return [
          { question: 'What is the typical model structure used in deep learning?', correctAnswer: 'Neural Network' },
          { question: 'What is the maximum sample size mentioned in the text?', correctAnswer: '1000' }
        ];
      case 'open_ended':
        return [
          {
            question: 'Analyze the main reasons for the success of deep learning in computer vision.',
            correctAnswer:
              'The success of deep learning in computer vision can be explained from three dimensions: models, data, and computing power...'
          },
          {
            question: 'Explain the overfitting problem in machine learning and its solutions.',
            correctAnswer:
              'Overfitting refers to the phenomenon where a model performs well on training data but poorly on new data...'
          }
        ];
      default:
        return [];
    }
  };

  // 获取 Excel 模板数据
  const getExcelTemplateData = type => {
    switch (type) {
      case 'true_false':
        return [
          { question: 'Artificial Intelligence is a branch of computer science', correctAnswer: '✅' },
          { question: 'Deep learning does not require large amounts of data for training', correctAnswer: '❌' }
        ];
      case 'single_choice':
        return [
          {
            question: 'What is the core feature of deep learning?',
            options: `["Requires manual feature engineering", "Automatic feature learning", "Only handles structured data", "Does not need large amounts of data"]`,
            correctAnswer: 'B'
          },
          {
            question: 'Which of the following is a commonly used deep learning framework?',
            options: `["Excel", "Word", "TensorFlow", "PowerPoint"]`,
            correctAnswer: 'C'
          }
        ];
      case 'multiple_choice':
        return [
          {
            question: 'Which of the following are commonly used deep learning frameworks?',
            options: `["TensorFlow", "PyTorch", "Excel", "Keras", "Word"]`,
            correctAnswer: `["A", "B", "D"]`
          },
          {
            question: 'Which of the following are main types of machine learning?',
            options: `["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Manual Learning"]`,
            correctAnswer: `["A", "B", "C"]`
          }
        ];
      case 'short_answer':
        return [
          { question: 'What is the typical model structure used in deep learning?', correctAnswer: 'Neural Network' },
          { question: 'What is the maximum sample size mentioned in the text?', correctAnswer: '1000' }
        ];
      case 'open_ended':
        return [
          {
            question: 'Analyze the main reasons for the success of deep learning in computer vision.',
            correctAnswer:
              'The success of deep learning in computer vision can be explained from three dimensions: models, data, and computing power...'
          },
          {
            question: 'Explain the overfitting problem in machine learning and its solutions.',
            correctAnswer:
              'Overfitting refers to the phenomenon where a model performs well on training data but poorly on new data...'
          }
        ];
      default:
        return [];
    }
  };

  // 获取列宽配置
  const getColumnWidths = type => {
    if (type === 'single_choice' || type === 'multiple_choice') {
      return [{ wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }];
    }
    return [{ wch: 60 }, { wch: 40 }];
  };

  // 提交导入
  const handleSubmit = async () => {
    if (!questionType) {
      setError(t('evalDatasets.import.selectTypeFirst', '请先选择题型'));
      return;
    }
    if (!file) {
      setError(t('evalDatasets.import.selectFile', '请选择要导入的文件'));
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionType', questionType);
      formData.append('tags', tags);

      const response = await fetch(`/api/projects/${projectId}/eval-datasets/import`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.code === 0) {
        onSuccess?.(result.data);
        handleClose();
      } else {
        setError(result.error || result.message);
        if (result.details) {
          setErrorDetails(result.details);
        }
      }
    } catch (err) {
      setError(err.message || t('evalDatasets.import.failed', '导入失败'));
    } finally {
      setLoading(false);
    }
  };

  // 关闭对话框
  const handleClose = () => {
    if (loading) return;
    setQuestionType('');
    setTags('');
    setFile(null);
    setError(null);
    setErrorDetails([]);
    onClose();
  };

  // 获取当前题型的格式预览
  const formatPreview = questionType ? FORMAT_PREVIEW[questionType] : null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('evalDatasets.import.title', '导入评估数据集')}
        <IconButton onClick={handleClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            {errorDetails.length > 0 && (
              <Box sx={{ mt: 1, fontSize: '0.85rem' }}>
                {errorDetails.map((detail, index) => (
                  <Box key={index}>• {detail}</Box>
                ))}
                {errorDetails.length < 10 && (
                  <Box sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {t('evalDatasets.import.showingErrors', '显示前 {{count}} 条错误', { count: errorDetails.length })}
                  </Box>
                )}
              </Box>
            )}
          </Alert>
        )}

        {/* 题型选择 */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('evalDatasets.import.questionType', '题型')}</InputLabel>
          <Select
            value={questionType}
            onChange={e => setQuestionType(e.target.value)}
            label={t('evalDatasets.import.questionType', '题型')}
            disabled={loading}
          >
            {QUESTION_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {t(type.label, type.labelZh)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 数据格式预览 */}
        {formatPreview && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('evalDatasets.import.formatPreview', '数据格式预览')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {formatPreview.fields.map(field => (
                <Chip key={field} label={field} size="small" variant="outlined" />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {formatPreview.description}
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                p: 1.5,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0 }}>{JSON.stringify(formatPreview.example, null, 2)}</pre>
            </Box>
          </Paper>
        )}

        {/* 下载模板 */}
        {questionType && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('evalDatasets.import.downloadTemplate', '下载模板')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadTemplate('json')}
              >
                JSON {t('evalDatasets.import.template', '模板')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadTemplate('xlsx')}
              >
                Excel {t('evalDatasets.import.template', '模板')}
              </Button>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 文件上传 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('evalDatasets.import.uploadFile', '上传文件')}
          </Typography>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,.xls,.xlsx"
            style={{ display: 'none' }}
          />
          <Box
            sx={{
              border: '2px dashed',
              borderColor: file ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: file ? 'primary.50' : 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <InsertDriveFileIcon color="primary" />
                <Typography color="primary">{file.name}</Typography>
                <Chip label={`${(file.size / 1024).toFixed(1)} KB`} size="small" variant="outlined" color="primary" />
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography color="text.secondary">
                  {t('evalDatasets.import.dropOrClick', '点击或拖拽文件到此处')}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {t('evalDatasets.import.supportedFormats', '支持 JSON、XLS、XLSX 格式')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* 标签输入 */}
        <TextField
          fullWidth
          label={t('evalDatasets.import.tags', '标签（可选）')}
          placeholder={t('evalDatasets.import.tagsPlaceholder', '为导入的数据添加标签，多个标签用逗号分隔')}
          value={tags}
          onChange={e => setTags(e.target.value)}
          disabled={loading}
          helperText={t('evalDatasets.import.tagsHelp', '导入的所有数据将打上这些标签')}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel', '取消')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !questionType || !file}>
          {loading ? t('evalDatasets.import.importing', '导入中...') : t('evalDatasets.import.import', '导入')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
