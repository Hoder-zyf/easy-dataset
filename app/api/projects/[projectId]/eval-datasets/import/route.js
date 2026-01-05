import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';
import * as XLSX from 'xlsx';

/**
 * 验证判断题数据格式
 */
function validateTrueFalse(item, index) {
  const errors = [];
  if (!item.question || typeof item.question !== 'string') {
    errors.push(`第 ${index + 1} 条: question 字段缺失或格式错误`);
  }
  if (!item.correctAnswer || (item.correctAnswer !== '✅' && item.correctAnswer !== '❌')) {
    errors.push(`第 ${index + 1} 条: correctAnswer 必须是 "✅" 或 "❌"`);
  }
  return errors;
}

/**
 * 验证单选题数据格式
 */
function validateSingleChoice(item, index) {
  const errors = [];
  if (!item.question || typeof item.question !== 'string') {
    errors.push(`第 ${index + 1} 条: question 字段缺失或格式错误`);
  }

  // 标准化 options 格式
  let options = item.options;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      errors.push(`第 ${index + 1} 条: options 格式错误，无法解析`);
      return errors;
    }
  }

  if (!options || !Array.isArray(options) || options.length < 2) {
    errors.push(`第 ${index + 1} 条: options 必须是包含至少2个选项的数组`);
  }
  if (!item.correctAnswer || !/^[A-Z]$/.test(item.correctAnswer)) {
    errors.push(`第 ${index + 1} 条: correctAnswer 必须是单个大写字母 (A-Z)`);
  }
  // 验证答案索引是否在选项范围内
  if (options && item.correctAnswer) {
    const answerIndex = item.correctAnswer.charCodeAt(0) - 65;
    if (answerIndex >= options.length) {
      errors.push(`第 ${index + 1} 条: correctAnswer "${item.correctAnswer}" 超出选项范围`);
    }
  }
  return errors;
}

/**
 * 验证多选题数据格式
 */
function validateMultipleChoice(item, index) {
  const errors = [];
  if (!item.question || typeof item.question !== 'string') {
    errors.push(`第 ${index + 1} 条: question 字段缺失或格式错误`);
  }

  // 标准化 options 格式
  let options = item.options;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      errors.push(`第 ${index + 1} 条: options 格式错误，无法解析`);
      return errors;
    }
  }

  if (!options || !Array.isArray(options) || options.length < 2) {
    errors.push(`第 ${index + 1} 条: options 必须是包含至少2个选项的数组`);
  }

  // 标准化 correctAnswer 格式
  let correctAnswer = item.correctAnswer;
  if (typeof correctAnswer === 'string') {
    try {
      correctAnswer = JSON.parse(correctAnswer);
    } catch (e) {
      errors.push(`第 ${index + 1} 条: correctAnswer 格式错误，无法解析`);
      return errors;
    }
  }

  if (!correctAnswer || !Array.isArray(correctAnswer) || correctAnswer.length < 1) {
    errors.push(`第 ${index + 1} 条: correctAnswer 必须是包含至少1个答案的数组`);
  }
  // 验证每个答案是否是有效的字母
  if (Array.isArray(correctAnswer)) {
    for (const ans of correctAnswer) {
      if (!/^[A-Z]$/.test(ans)) {
        errors.push(`第 ${index + 1} 条: correctAnswer 中的 "${ans}" 不是有效的选项字母`);
      }
      if (options) {
        const answerIndex = ans.charCodeAt(0) - 65;
        if (answerIndex >= options.length) {
          errors.push(`第 ${index + 1} 条: correctAnswer "${ans}" 超出选项范围`);
        }
      }
    }
  }
  return errors;
}

/**
 * 验证问答题数据格式 (短答案和开放式问题)
 */
function validateQA(item, index) {
  const errors = [];
  if (!item.question || typeof item.question !== 'string') {
    errors.push(`第 ${index + 1} 条: question 字段缺失或格式错误`);
  }
  if (!item.correctAnswer || typeof item.correctAnswer !== 'string') {
    errors.push(`第 ${index + 1} 条: correctAnswer 字段缺失或格式错误`);
  }
  return errors;
}

/**
 * 根据题型验证数据
 */
function validateData(data, questionType) {
  const allErrors = [];

  for (let i = 0; i < data.length; i++) {
    let errors = [];
    switch (questionType) {
      case 'true_false':
        errors = validateTrueFalse(data[i], i);
        break;
      case 'single_choice':
        errors = validateSingleChoice(data[i], i);
        break;
      case 'multiple_choice':
        errors = validateMultipleChoice(data[i], i);
        break;
      case 'short_answer':
      case 'open_ended':
        errors = validateQA(data[i], i);
        break;
      default:
        errors = [`不支持的题型: ${questionType}`];
    }
    allErrors.push(...errors);
  }

  return allErrors;
}

/**
 * 解析 Excel 文件
 */
function parseExcel(buffer, questionType) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  // 转换数据格式
  const data = rawData.map(row => {
    const item = {
      question: row.question || row['题目'] || '',
      correctAnswer: row.correctAnswer || row['正确答案'] || row['答案'] || ''
    };

    // 处理选项 (选择题)
    if (questionType === 'single_choice' || questionType === 'multiple_choice') {
      // 尝试从 options 列解析
      if (row.options || row['选项']) {
        let optionsStr = (row.options || row['选项']).trim();

        // 将单引号替换为双引号，使其成为有效的 JSON
        if (optionsStr.startsWith('[') && optionsStr.includes("'")) {
          optionsStr = optionsStr.replace(/'/g, '"');
        }

        try {
          // 尝试 JSON 解析
          item.options = JSON.parse(optionsStr);
        } catch {
          // 尝试用分隔符分割
          item.options = optionsStr
            .split(/[,;|，；]/)
            .map(o => o.trim())
            .filter(Boolean);
        }
      }
    }

    // 处理多选答案
    if (questionType === 'multiple_choice') {
      if (typeof item.correctAnswer === 'string') {
        let answerStr = item.correctAnswer.trim();

        // 将单引号替换为双引号，使其成为有效的 JSON
        if (answerStr.startsWith('[') && answerStr.includes("'")) {
          answerStr = answerStr.replace(/'/g, '"');
        }

        // 尝试 JSON 解析
        try {
          item.correctAnswer = JSON.parse(answerStr);
        } catch {
          // 分割字符串，如 "A,B,C" 或 "ABC"
          if (answerStr.includes(',') || answerStr.includes('，')) {
            item.correctAnswer = answerStr.split(/[,，]/).map(a => a.trim().toUpperCase());
          } else {
            // 直接分割字符，如 "ABC" -> ["A", "B", "C"]
            item.correctAnswer = answerStr
              .toUpperCase()
              .split('')
              .filter(c => /[A-Z]/.test(c));
          }
        }
      }
    }

    return item;
  });

  return data;
}

/**
 * 解析 JSON 文件
 */
function parseJSON(content) {
  return JSON.parse(content);
}

/**
 * POST - 导入评估数据集
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const formData = await request.formData();

    const file = formData.get('file');
    const questionType = formData.get('questionType');
    const tags = formData.get('tags') || '';

    console.log(`[导入] 开始处理，项目: ${projectId}, 题型: ${questionType}, 标签: ${tags}`);

    if (!file) {
      return NextResponse.json({ code: 400, error: '请上传文件' }, { status: 400 });
    }

    if (!questionType) {
      return NextResponse.json({ code: 400, error: '请选择题型' }, { status: 400 });
    }

    // 验证题型
    const validTypes = ['true_false', 'single_choice', 'multiple_choice', 'short_answer', 'open_ended'];
    if (!validTypes.includes(questionType)) {
      return NextResponse.json({ code: 400, error: `不支持的题型: ${questionType}` }, { status: 400 });
    }

    // 获取文件扩展名
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();
    console.log(`[导入] 文件名: ${fileName}, 扩展名: ${fileExt}`);

    // 验证文件类型
    if (!['json', 'xls', 'xlsx'].includes(fileExt)) {
      return NextResponse.json(
        { code: 400, error: '不支持的文件格式，请上传 json、xls 或 xlsx 文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const buffer = await file.arrayBuffer();
    let data = [];

    // 解析文件
    console.log(`[导入] 开始解析文件...`);
    if (fileExt === 'json') {
      const content = new TextDecoder().decode(buffer);
      data = parseJSON(content);
    } else {
      data = parseExcel(Buffer.from(buffer), questionType);
    }

    console.log(`[导入] 解析完成，共 ${data.length} 条数据`);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ code: 400, error: '文件内容为空或格式错误' }, { status: 400 });
    }

    // 验证数据格式
    console.log(`[导入] 开始验证数据格式...`);
    const errors = validateData(data, questionType);
    if (errors.length > 0) {
      console.log(`[导入] 验证失败，错误数: ${errors.length}`);
      return NextResponse.json(
        {
          code: 400,
          error: '数据格式验证失败',
          details: errors.slice(0, 10), // 最多返回10条错误
          totalErrors: errors.length
        },
        { status: 400 }
      );
    }

    console.log(`[导入] 验证通过，开始写入数据库...`);

    // 准备数据
    const now = new Date();
    const evalDatasets = data.map(item => {
      // 标准化 options 格式
      let options = item.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          // 如果解析失败，保持原样
        }
      }

      // 标准化 correctAnswer 格式
      let correctAnswer = item.correctAnswer;
      if (typeof correctAnswer === 'string' && questionType === 'multiple_choice') {
        try {
          correctAnswer = JSON.parse(correctAnswer);
        } catch (e) {
          // 如果解析失败，保持原样
        }
      }

      return {
        id: nanoid(),
        projectId,
        question: item.question,
        questionType,
        options: options ? JSON.stringify(options) : '',
        // 多选题的 correctAnswer 保存为 JSON 数组字符串，其他题型保存为字符串
        correctAnswer: Array.isArray(correctAnswer) ? JSON.stringify(correctAnswer) : correctAnswer,
        tags: tags || '',
        note: '',
        createAt: now,
        updateAt: now
      };
    });

    // 批量插入
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < evalDatasets.length; i += batchSize) {
      const batch = evalDatasets.slice(i, i + batchSize);
      await db.evalDatasets.createMany({ data: batch });
      insertedCount += batch.length;
      console.log(`[导入] 已写入 ${insertedCount}/${evalDatasets.length} 条数据`);
    }

    console.log(`[导入] 导入完成，共写入 ${insertedCount} 条数据`);

    return NextResponse.json({
      code: 0,
      data: {
        total: insertedCount,
        questionType,
        tags
      },
      message: `成功导入 ${insertedCount} 条评估数据`
    });
  } catch (error) {
    console.error('[导入] 导入失败:', error);
    return NextResponse.json(
      {
        code: 500,
        error: '导入失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}
