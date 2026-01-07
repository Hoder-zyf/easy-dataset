import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * 提交评判结果
 * vote: 'left' | 'right' | 'both_good' | 'both_bad'
 */
export async function POST(request, { params }) {
  try {
    const { projectId, taskId } = params;
    const { vote, questionId, isSwapped, leftAnswer, rightAnswer } = await request.json();

    // 验证投票选项
    const validVotes = ['left', 'right', 'both_good', 'both_bad'];
    if (!validVotes.includes(vote)) {
      return NextResponse.json({ code: 400, error: '无效的投票选项' }, { status: 400 });
    }

    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId,
        taskType: 'blind-test'
      }
    });

    if (!task) {
      return NextResponse.json({ code: 404, error: '任务不存在' }, { status: 404 });
    }

    if (task.status !== 0) {
      return NextResponse.json({ code: 400, error: '任务已结束' }, { status: 400 });
    }

    // 解析详情
    let detail = {};
    let modelInfo = {};
    try {
      detail = task.detail ? JSON.parse(task.detail) : {};
      modelInfo = task.modelInfo ? JSON.parse(task.modelInfo) : {};
    } catch (e) {
      console.error('解析任务详情失败:', e);
    }

    // 计算得分
    // isSwapped: true 表示左边是模型B，右边是模型A
    // isSwapped: false 表示左边是模型A，右边是模型B
    let modelAScore = 0;
    let modelBScore = 0;

    if (vote === 'left') {
      // 左边好
      if (isSwapped) {
        modelBScore = 1; // 左边是B
      } else {
        modelAScore = 1; // 左边是A
      }
    } else if (vote === 'right') {
      // 右边好
      if (isSwapped) {
        modelAScore = 1; // 右边是A
      } else {
        modelBScore = 1; // 右边是B
      }
    } else if (vote === 'both_good') {
      // 都好
      modelAScore = 0.5;
      modelBScore = 0.5;
    } else if (vote === 'both_bad') {
      // 都不好
      modelAScore = 0;
      modelBScore = 0;
    }

    // 记录结果
    const result = {
      questionId,
      vote,
      isSwapped,
      modelAScore,
      modelBScore,
      leftAnswer: leftAnswer || '',
      rightAnswer: rightAnswer || '',
      timestamp: new Date().toISOString()
    };

    // 更新任务详情
    const results = detail.results || [];
    results.push(result);

    // 兼容 evalDatasetIds 和 questionIds
    const questionIds = detail.questionIds || detail.evalDatasetIds || [];
    const newCurrentIndex = detail.currentIndex + 1;
    const isCompleted = newCurrentIndex >= questionIds.length;

    const updatedDetail = {
      ...detail,
      currentIndex: newCurrentIndex,
      results
    };

    // 更新任务
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        detail: JSON.stringify(updatedDetail),
        completedCount: newCurrentIndex,
        status: isCompleted ? 1 : 0, // 1-已完成, 0-进行中
        endTime: isCompleted ? new Date() : null
      }
    });

    // 计算当前总分
    const totalModelAScore = results.reduce((sum, r) => sum + (r.modelAScore || 0), 0);
    const totalModelBScore = results.reduce((sum, r) => sum + (r.modelBScore || 0), 0);

    return NextResponse.json({
      code: 0,
      data: {
        success: true,
        isCompleted,
        currentIndex: newCurrentIndex,
        totalCount: questionIds.length,
        scores: {
          modelA: totalModelAScore,
          modelB: totalModelBScore
        }
      },
      message: isCompleted ? '盲测任务已完成' : '评判已记录'
    });
  } catch (error) {
    console.error('提交评判结果失败:', error);
    return NextResponse.json({ code: 500, error: '提交评判结果失败', message: error.message }, { status: 500 });
  }
}
