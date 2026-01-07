import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * 获取盲测任务详情
 */
export async function GET(request, { params }) {
  try {
    const { projectId, taskId } = params;

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

    // 解析详情
    let detail = {};
    let modelInfo = {};
    try {
      detail = task.detail ? JSON.parse(task.detail) : {};
      modelInfo = task.modelInfo ? JSON.parse(task.modelInfo) : {};
    } catch (e) {
      console.error('解析任务详情失败:', e);
    }

    // 获取所有相关的评估题目
    const evalDatasets = await db.evalDatasets.findMany({
      where: {
        id: { in: detail.evalDatasetIds || [] }
      },
      select: {
        id: true,
        question: true,
        questionType: true,
        correctAnswer: true,
        tags: true
      }
    });

    // 按照 evalDatasetIds 的顺序排序
    const orderedDatasets = (detail.evalDatasetIds || [])
      .map(id => evalDatasets.find(d => d.id === id))
      .filter(Boolean);

    return NextResponse.json({
      code: 0,
      data: {
        ...task,
        detail,
        modelInfo,
        evalDatasets: orderedDatasets
      }
    });
  } catch (error) {
    console.error('获取盲测任务详情失败:', error);
    return NextResponse.json({ code: 500, error: '获取盲测任务详情失败', message: error.message }, { status: 500 });
  }
}

/**
 * 更新盲测任务（中断/终止）
 */
export async function PUT(request, { params }) {
  try {
    const { projectId, taskId } = params;
    const { action } = await request.json();

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

    if (action === 'interrupt') {
      // 中断任务
      if (task.status !== 0) {
        return NextResponse.json({ code: 400, error: '只能中断进行中的任务' }, { status: 400 });
      }

      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          status: 3, // 已中断
          endTime: new Date()
        }
      });

      return NextResponse.json({
        code: 0,
        data: updatedTask,
        message: '任务已中断'
      });
    }

    return NextResponse.json({ code: 400, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('更新盲测任务失败:', error);
    return NextResponse.json({ code: 500, error: '更新盲测任务失败', message: error.message }, { status: 500 });
  }
}

/**
 * 删除盲测任务
 */
export async function DELETE(request, { params }) {
  try {
    const { projectId, taskId } = params;

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

    // 删除任务
    await db.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({
      code: 0,
      message: '任务已删除'
    });
  } catch (error) {
    console.error('删除盲测任务失败:', error);
    return NextResponse.json({ code: 500, error: '删除盲测任务失败', message: error.message }, { status: 500 });
  }
}
