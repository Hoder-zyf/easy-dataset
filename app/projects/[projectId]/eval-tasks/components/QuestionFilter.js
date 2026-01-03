'use client';

import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Slider,
  Button
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';

const QUESTION_TYPES = [
  { value: 'true_false', labelKey: 'eval.questionTypes.true_false' },
  { value: 'single_choice', labelKey: 'eval.questionTypes.single_choice' },
  { value: 'multiple_choice', labelKey: 'eval.questionTypes.multiple_choice' },
  { value: 'short_answer', labelKey: 'eval.questionTypes.short_answer' },
  { value: 'open_ended', labelKey: 'eval.questionTypes.open_ended' }
];

export default function QuestionFilter({
  questionTypes,
  selectedTags,
  searchKeyword,
  questionCount,
  availableTags,
  typeStats,
  filteredCount,
  onQuestionTypesChange,
  onTagsChange,
  onSearchChange,
  onQuestionCountChange,
  onReset
}) {
  const { t } = useTranslation();

  const hasFilters = questionTypes.length > 0 || selectedTags.length > 0 || searchKeyword || questionCount > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
          题目筛选
        </Typography>
        {hasFilters && (
          <Button size="small" startIcon={<ClearIcon />} onClick={onReset}>
            清空筛选
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 关键字搜索 */}
        <TextField
          fullWidth
          size="small"
          label="搜索关键字"
          placeholder="搜索题目或答案内容..."
          value={searchKeyword}
          onChange={e => onSearchChange(e.target.value)}
        />

        {/* 题型和标签筛选 - 并排显示 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* 题型筛选 */}
          <FormControl fullWidth size="small">
            <InputLabel>题型筛选</InputLabel>
            <Select
              multiple
              value={questionTypes}
              onChange={e => onQuestionTypesChange(e.target.value)}
              input={<OutlinedInput label="题型筛选" />}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => (
                    <Chip key={value} label={t(`eval.questionTypes.${value}`)} size="small" />
                  ))}
                </Box>
              )}
            >
              {QUESTION_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  <Checkbox checked={questionTypes.includes(type.value)} />
                  <ListItemText primary={`${t(type.labelKey)} (${typeStats[type.value] || 0})`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 标签筛选 */}
          {availableTags.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>标签筛选</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={e => onTagsChange(e.target.value)}
                input={<OutlinedInput label="标签筛选" />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableTags.map(tag => (
                  <MenuItem key={tag} value={tag}>
                    <Checkbox checked={selectedTags.includes(tag)} />
                    <ListItemText primary={tag} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* 题目数量选择 - 紧凑布局 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              题目数量：{questionCount === 0 ? '全部' : questionCount} / {filteredCount}
            </Typography>
            <TextField
              size="small"
              type="number"
              value={questionCount}
              onChange={e => onQuestionCountChange(parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: filteredCount }}
              sx={{ width: 100 }}
            />
          </Box>
          <Slider
            value={questionCount}
            onChange={(e, value) => onQuestionCountChange(value)}
            min={0}
            max={filteredCount}
            step={1}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary">
            {questionCount === 0 ? '使用全部筛选结果' : `将从 ${filteredCount} 道题中随机抽取 ${questionCount} 道`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
