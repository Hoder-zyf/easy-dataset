import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * 获取当前题目信息（包括随机交换信息）
 */
export async function GET(request, { params }) {
  const { projectId, taskId } = params;

  try {
    if (!projectId || !taskId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 获取任务信息
    const task = await db.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.taskType !== 'blind-test') {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 解析任务详情
    const detail = JSON.parse(task.detail || '{}');
    // 兼容 evalDatasetIds 和 questionIds
    const questionIds = detail.questionIds || detail.evalDatasetIds || [];
    const currentIndex = detail.currentIndex || 0;

    // 检查任务是否已完成
    if (questionIds.length === 0 || currentIndex >= questionIds.length) {
      return NextResponse.json({
        completed: true,
        currentIndex,
        totalQuestions: questionIds.length
      });
    }

    // 获取当前题目
    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = await db.evalDatasets.findUnique({
      where: { id: currentQuestionId }
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    // 随机决定是否交换（盲测核心）
    const isSwapped = Math.random() > 0.5;

    return NextResponse.json({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: currentQuestion.correctAnswer || '',
      questionIndex: currentIndex + 1,
      totalQuestions: questionIds.length,
      isSwapped
    });
  } catch (error) {
    console.error('获取题目信息失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
