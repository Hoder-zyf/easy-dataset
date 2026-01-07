import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { buildEvalQuestionWhere } from '@/lib/db/evalDatasets';

const BATCH_SIZE = 500;

/**
 * 将评估题目转换为 CSV 行
 */
function convertToCSVRow(item, isHeader = false) {
  if (isHeader) {
    return ['questionType', 'question', 'options', 'correctAnswer', 'tags'].join(',');
  }

  const escapeCSV = str => {
    if (str === null || str === undefined) return '';
    const strValue = String(str);
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  };

  return [
    escapeCSV(item.questionType),
    escapeCSV(item.question),
    escapeCSV(item.options),
    escapeCSV(item.correctAnswer),
    escapeCSV(item.tags)
  ].join(',');
}

/**
 * 将评估题目转换为导出格式
 */
function formatExportItem(item) {
  return {
    questionType: item.questionType,
    question: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    tags: item.tags
  };
}

/**
 * 导出评估数据集
 * 支持 JSON、JSONL、CSV 格式
 * 大数据量采用分批流式导出
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();

    const {
      format = 'json', // json | jsonl | csv
      questionTypes = [],
      tags = [],
      keyword = ''
    } = body;

    // 验证格式
    if (!['json', 'jsonl', 'csv'].includes(format)) {
      return NextResponse.json({ code: 400, error: '不支持的导出格式' }, { status: 400 });
    }

    // 构建查询条件
    const where = buildEvalQuestionWhere(projectId, {
      questionTypes: questionTypes.length > 0 ? questionTypes : undefined,
      tags: tags.length > 0 ? tags : undefined,
      keyword: keyword || undefined
    });

    // 先获取总数
    const total = await db.evalDatasets.count({ where });

    if (total === 0) {
      return NextResponse.json({ code: 400, error: '没有符合条件的数据' }, { status: 400 });
    }

    // 小数据量直接返回
    if (total <= 1000) {
      const items = await db.evalDatasets.findMany({
        where,
        orderBy: { createAt: 'desc' }
      });

      const formattedItems = items.map(formatExportItem);

      if (format === 'json') {
        return new Response(JSON.stringify(formattedItems, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="eval-datasets-${Date.now()}.json"`
          }
        });
      }

      if (format === 'jsonl') {
        const jsonlContent = formattedItems.map(item => JSON.stringify(item)).join('\n');
        return new Response(jsonlContent, {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Content-Disposition': `attachment; filename="eval-datasets-${Date.now()}.jsonl"`
          }
        });
      }

      if (format === 'csv') {
        const csvContent = [convertToCSVRow(null, true), ...items.map(item => convertToCSVRow(item))].join('\n');
        return new Response('\uFEFF' + csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="eval-datasets-${Date.now()}.csv"`
          }
        });
      }
    }

    // 大数据量采用流式导出
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isFirst = true;

        // CSV 格式先输出表头
        if (format === 'csv') {
          controller.enqueue(encoder.encode('\uFEFF' + convertToCSVRow(null, true) + '\n'));
        }

        // JSON 格式输出开始符
        if (format === 'json') {
          controller.enqueue(encoder.encode('[\n'));
        }

        // 分批获取数据
        const totalBatches = Math.ceil(total / BATCH_SIZE);

        for (let batch = 0; batch < totalBatches; batch++) {
          const items = await db.evalDatasets.findMany({
            where,
            orderBy: { createAt: 'desc' },
            skip: batch * BATCH_SIZE,
            take: BATCH_SIZE
          });

          for (const item of items) {
            const formattedItem = formatExportItem(item);

            if (format === 'json') {
              const prefix = isFirst ? '' : ',\n';
              controller.enqueue(encoder.encode(prefix + JSON.stringify(formattedItem)));
              isFirst = false;
            } else if (format === 'jsonl') {
              controller.enqueue(encoder.encode(JSON.stringify(formattedItem) + '\n'));
            } else if (format === 'csv') {
              controller.enqueue(encoder.encode(convertToCSVRow(item) + '\n'));
            }
          }
        }

        // JSON 格式输出结束符
        if (format === 'json') {
          controller.enqueue(encoder.encode('\n]'));
        }

        controller.close();
      }
    });

    const contentTypes = {
      json: 'application/json',
      jsonl: 'application/x-ndjson',
      csv: 'text/csv; charset=utf-8'
    };

    const extensions = {
      json: 'json',
      jsonl: 'jsonl',
      csv: 'csv'
    };

    return new Response(stream, {
      headers: {
        'Content-Type': contentTypes[format],
        'Content-Disposition': `attachment; filename="eval-datasets-${Date.now()}.${extensions[format]}"`,
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error('Failed to export eval datasets:', error);
    return NextResponse.json({ code: 500, error: error.message || '导出失败' }, { status: 500 });
  }
}

/**
 * 获取导出预览信息（数据量统计）
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const questionTypes = searchParams.getAll('questionTypes');
    const tags = searchParams.getAll('tags');
    const keyword = searchParams.get('keyword') || '';

    // 构建查询条件
    const where = buildEvalQuestionWhere(projectId, {
      questionTypes: questionTypes.length > 0 ? questionTypes : undefined,
      tags: tags.length > 0 ? tags : undefined,
      keyword: keyword || undefined
    });

    // 获取数据量
    const total = await db.evalDatasets.count({ where });

    return NextResponse.json({
      code: 0,
      data: {
        total,
        isLargeDataset: total > 1000
      }
    });
  } catch (error) {
    console.error('Failed to get export preview:', error);
    return NextResponse.json({ code: 500, error: error.message || '获取导出预览失败' }, { status: 500 });
  }
}
