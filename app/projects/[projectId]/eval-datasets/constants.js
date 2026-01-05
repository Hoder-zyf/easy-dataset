export const QUESTION_TYPES = [
  { value: 'true_false', label: 'eval.questionTypes.true_false', labelZh: '判断题' },
  { value: 'single_choice', label: 'eval.questionTypes.single_choice', labelZh: '单选题' },
  { value: 'multiple_choice', label: 'eval.questionTypes.multiple_choice', labelZh: '多选题' },
  { value: 'short_answer', label: 'eval.questionTypes.short_answer', labelZh: '短答案题' },
  { value: 'open_ended', label: 'eval.questionTypes.open_ended', labelZh: '开放式问题' }
];

export const FORMAT_PREVIEW = {
  true_false: {
    fields: ['question', 'correctAnswer'],
    example: {
      question: 'Artificial Intelligence is a branch of computer science',
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
      correctAnswer: 'Neural Network'
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

// 获取 JSON 模板数据
export const getJsonTemplateData = type => {
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
export const getExcelTemplateData = type => {
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
export const getColumnWidths = type => {
  if (type === 'single_choice' || type === 'multiple_choice') {
    return [{ wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }];
  }
  return [{ wch: 60 }, { wch: 40 }];
};
