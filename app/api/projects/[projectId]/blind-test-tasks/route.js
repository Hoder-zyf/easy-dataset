import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * 获取项目的所有盲测任务
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const skip = (page - 1) * pageSize;

    // 获取盲测任务列表和总数
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where: {
          projectId,
          taskType: 'blind-test'
        },
        orderBy: { createAt: 'desc' },
        skip,
        take: pageSize
      }),
      db.task.count({
        where: {
          projectId,
          taskType: 'blind-test'
        }
      })
    ]);

    // 解析任务详情
    const tasksWithDetails = tasks.map(task => {
      let detail = {};
      let modelInfo = {};
      try {
        detail = task.detail ? JSON.parse(task.detail) : {};
        modelInfo = task.modelInfo ? JSON.parse(task.modelInfo) : {};
      } catch (e) {
        console.error('解析任务详情失败:', e);
      }
      return {
        ...task,
        detail,
        modelInfo
      };
    });

    return NextResponse.json({
      code: 0,
      data: {
        items: tasksWithDetails,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取盲测任务列表失败:', error);
    return NextResponse.json({ code: 500, error: '获取盲测任务列表失败', message: error.message }, { status: 500 });
  }
}

/**
 * 创建盲测任务
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const data = await request.json();

    const {
      modelA, // 模型A: { modelId, providerId }
      modelB, // 模型B: { modelId, providerId }
      evalDatasetIds, // 要评估的题目ID列表（仅限 short_answer 和 open_ended）
      language = 'zh-CN'
    } = data;

    // 验证必填字段
    if (!modelA || !modelA.modelId || !modelA.providerId) {
      return NextResponse.json({ code: 400, error: '请选择模型A' }, { status: 400 });
    }

    if (!modelB || !modelB.modelId || !modelB.providerId) {
      return NextResponse.json({ code: 400, error: '请选择模型B' }, { status: 400 });
    }

    // 验证两个模型不能相同
    if (modelA.modelId === modelB.modelId && modelA.providerId === modelB.providerId) {
      return NextResponse.json({ code: 400, error: '两个模型不能相同' }, { status: 400 });
    }

    if (!evalDatasetIds || evalDatasetIds.length === 0) {
      return NextResponse.json({ code: 400, error: '请选择要评估的题目' }, { status: 400 });
    }

    // 验证所选题目必须是主观题（short_answer 或 open_ended）
    const evalDatasets = await db.evalDatasets.findMany({
      where: {
        id: { in: evalDatasetIds },
        projectId
      },
      select: { id: true, questionType: true }
    });

    const invalidQuestions = evalDatasets.filter(
      q => q.questionType !== 'short_answer' && q.questionType !== 'open_ended'
    );

    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        {
          code: 400,
          error: '盲测任务只支持简答题和开放题'
        },
        { status: 400 }
      );
    }

    // 获取模型配置信息
    const [modelConfigA, modelConfigB] = await Promise.all([
      db.modelConfig.findFirst({
        where: { projectId, providerId: modelA.providerId, modelId: modelA.modelId }
      }),
      db.modelConfig.findFirst({
        where: { projectId, providerId: modelB.providerId, modelId: modelB.modelId }
      })
    ]);

    // 构建模型信息（包含两个模型）
    const modelInfo = {
      modelA: {
        modelId: modelA.modelId,
        modelName: modelConfigA?.modelName || modelA.modelId,
        providerId: modelA.providerId,
        providerName: modelConfigA?.providerName || modelA.providerId
      },
      modelB: {
        modelId: modelB.modelId,
        modelName: modelConfigB?.modelName || modelB.modelId,
        providerId: modelB.providerId,
        providerName: modelConfigB?.providerName || modelB.providerId
      }
    };

    // 构建任务详情
    const taskDetail = {
      evalDatasetIds,
      currentIndex: 0, // 当前题目索引
      results: [] // 存储每道题的评判结果: [{ questionId, vote, modelAScore, modelBScore }]
    };

    // 创建任务
    const newTask = await db.task.create({
      data: {
        projectId,
        taskType: 'blind-test',
        status: 0, // 进行中
        modelInfo: JSON.stringify(modelInfo),
        language,
        detail: JSON.stringify(taskDetail),
        totalCount: evalDatasetIds.length,
        completedCount: 0,
        note: ''
      }
    });

    return NextResponse.json({
      code: 0,
      data: {
        ...newTask,
        detail: taskDetail,
        modelInfo
      },
      message: '盲测任务创建成功'
    });
  } catch (error) {
    console.error('创建盲测任务失败:', error);
    return NextResponse.json({ code: 500, error: '创建盲测任务失败', message: error.message }, { status: 500 });
  }
}
