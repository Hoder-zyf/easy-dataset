import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { getEvalResultsByTaskId, getEvalResultsStats } from '@/lib/db/evalResults';

/**
 * 获取单个评估任务详情及其结果
 */
export async function GET(request, { params }) {
  try {
    const { projectId, taskId } = params;

    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'Project ID and Task ID are required' }, { status: 400 });
    }

    // 获取任务详情
    const task = await db.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    if (task.projectId !== projectId) {
      return NextResponse.json({ error: '任务不属于该项目' }, { status: 403 });
    }

    // 解析任务详情
    let detail = {};
    let modelInfo = {};
    try {
      detail = task.detail ? JSON.parse(task.detail) : {};
      modelInfo = task.modelInfo ? JSON.parse(task.modelInfo) : {};
    } catch (e) {
      console.error('解析任务详情失败:', e);
    }

    // 获取评估结果
    const results = await getEvalResultsByTaskId(taskId);

    // 获取统计数据
    const stats = await getEvalResultsStats(taskId);

    return NextResponse.json({
      code: 0,
      data: {
        task: {
          ...task,
          detail,
          modelInfo
        },
        results,
        stats
      }
    });
  } catch (error) {
    console.error('获取评估任务详情失败:', error);
    return NextResponse.json({ code: 500, error: '获取评估任务详情失败', message: error.message }, { status: 500 });
  }
}

/**
 * 删除评估任务
 */
export async function DELETE(request, { params }) {
  try {
    const { projectId, taskId } = params;

    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'Project ID and Task ID are required' }, { status: 400 });
    }

    // 验证任务存在且属于该项目
    const task = await db.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    if (task.projectId !== projectId) {
      return NextResponse.json({ error: '任务不属于该项目' }, { status: 403 });
    }

    // 删除评估结果
    await db.evalResults.deleteMany({
      where: { taskId }
    });

    // 删除任务
    await db.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评估任务失败:', error);
    return NextResponse.json({ code: 500, error: '删除评估任务失败', message: error.message }, { status: 500 });
  }
}

/**
 * 中断评估任务
 */
export async function PUT(request, { params }) {
  try {
    const { projectId, taskId } = params;
    const data = await request.json();
    const { action } = data;

    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'Project ID and Task ID are required' }, { status: 400 });
    }

    // 验证任务存在且属于该项目
    const task = await db.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    if (task.projectId !== projectId) {
      return NextResponse.json({ error: '任务不属于该项目' }, { status: 403 });
    }

    if (action === 'interrupt') {
      // 中断任务
      await db.task.update({
        where: { id: taskId },
        data: {
          status: 3, // 已中断
          endTime: new Date()
        }
      });

      return NextResponse.json({
        code: 0,
        message: '任务已中断'
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('操作评估任务失败:', error);
    return NextResponse.json({ code: 500, error: '操作失败', message: error.message }, { status: 500 });
  }
}
