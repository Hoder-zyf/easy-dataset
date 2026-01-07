import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { processTask } from '@/lib/services/tasks';

/**
 * 获取项目的所有评估任务
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

    // 获取评估任务列表和总数
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where: {
          projectId,
          taskType: 'model-evaluation'
        },
        orderBy: { createAt: 'desc' },
        skip,
        take: pageSize
      }),
      db.task.count({
        where: {
          projectId,
          taskType: 'model-evaluation'
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
    console.error('获取评估任务列表失败:', error);
    return NextResponse.json({ code: 500, error: '获取评估任务列表失败', message: error.message }, { status: 500 });
  }
}

/**
 * 创建评估任务
 * 支持同时选择多个模型，为每个模型创建一个任务
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const data = await request.json();

    const {
      models, // 要测试的模型列表 [{ modelId, providerId }]
      evalDatasetIds, // 要评估的题目ID列表
      judgeModelId, // 教师模型ID（用于主观题评分）
      judgeProviderId, // 教师模型提供商ID
      language = 'zh-CN',
      filterOptions = {} // 筛选选项（用于显示）
    } = data;

    // 验证必填字段
    if (!models || models.length === 0) {
      return NextResponse.json({ code: 400, error: '请至少选择一个模型进行评估' }, { status: 400 });
    }

    if (!evalDatasetIds || evalDatasetIds.length === 0) {
      return NextResponse.json({ code: 400, error: '请选择要评估的题目' }, { status: 400 });
    }

    // 检查是否有主观题
    const evalDatasets = await db.evalDatasets.findMany({
      where: {
        id: { in: evalDatasetIds },
        projectId
      },
      select: { questionType: true }
    });

    const hasSubjectiveQuestions = evalDatasets.some(
      q => q.questionType === 'short_answer' || q.questionType === 'open_ended'
    );

    // 如果有主观题，必须提供教师模型
    if (hasSubjectiveQuestions && (!judgeModelId || !judgeProviderId)) {
      return NextResponse.json({ code: 400, error: '存在简答题或开放题，请选择一个教师模型用于评分' }, { status: 400 });
    }

    // 验证教师模型不能与测试模型相同
    if (judgeModelId && judgeProviderId) {
      const judgeModel = { modelId: judgeModelId, providerId: judgeProviderId };
      const isJudgeInTestModels = models.some(
        m => m.modelId === judgeModel.modelId && m.providerId === judgeModel.providerId
      );
      if (isJudgeInTestModels) {
        return NextResponse.json({ code: 400, error: '教师模型不能与测试模型相同' }, { status: 400 });
      }
    }

    // 为每个模型创建一个任务
    const createdTasks = [];

    for (const model of models) {
      const { modelId, providerId } = model;

      // 从数据库查询完整的模型配置信息
      const modelConfig = await db.modelConfig.findFirst({
        where: {
          projectId,
          providerId,
          modelId
        }
      });

      // 保留原始 providerId 用于查询，添加 providerName 用于显示
      const modelInfo = {
        modelId,
        modelName: modelConfig?.modelName || modelId,
        providerId: providerId, // 保留原始 providerId（数据库ID）
        providerName: modelConfig?.providerName || providerId // 添加 providerName 用于显示
      };

      // 构建任务详情
      const taskDetail = {
        evalDatasetIds,
        judgeModelId: judgeModelId || null,
        judgeProviderId: judgeProviderId || null,
        filterOptions,
        hasSubjectiveQuestions
      };

      // 创建任务
      const newTask = await db.task.create({
        data: {
          projectId,
          taskType: 'model-evaluation',
          status: 0, // 处理中
          modelInfo: JSON.stringify(modelInfo),
          language,
          detail: JSON.stringify(taskDetail),
          totalCount: evalDatasetIds.length,
          completedCount: 0,
          note: ''
        }
      });

      createdTasks.push(newTask);

      // 异步启动任务处理
      processTask(newTask.id).catch(err => {
        console.error(`评估任务启动失败: ${newTask.id}`, err);
      });
    }

    return NextResponse.json({
      code: 0,
      data: createdTasks,
      message: `成功创建 ${createdTasks.length} 个评估任务`
    });
  } catch (error) {
    console.error('创建评估任务失败:', error);
    return NextResponse.json({ code: 500, error: '创建评估任务失败', message: error.message }, { status: 500 });
  }
}
