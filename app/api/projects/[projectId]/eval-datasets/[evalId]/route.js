import { NextResponse } from 'next/server';
import { getEvalQuestionById, updateEvalQuestion, deleteEvalQuestion } from '@/lib/db/evalDatasets';
import { db } from '@/lib/db/index';

/**
 * 获取单个评估数据集详情
 * 支持 operateType=prev|next 获取相邻记录
 */
export async function GET(request, { params }) {
  try {
    const { projectId, evalId } = params;
    const { searchParams } = new URL(request.url);
    const operateType = searchParams.get('operateType');

    // 如果是导航请求 (prev/next)
    if (operateType) {
      const current = await db.evalDatasets.findUnique({
        where: { id: evalId },
        select: { createAt: true }
      });

      if (!current) {
        return NextResponse.json(null);
      }

      let neighbor = null;

      if (operateType === 'prev') {
        // 获取上一条（时间更晚的，因为列表通常是按时间倒序）
        // 或者按时间正序的话，上一条就是时间更早的。
        // 这里的列表是 orderBy: { createAt: 'desc' }，所以上一条应该是 createAt > current.createAt
        // 但是为了符合直觉（列表向下是 next），列表上面的（prev）应该是 createAt 更大的
        neighbor = await db.evalDatasets.findFirst({
          where: {
            projectId,
            createAt: { gt: current.createAt }
          },
          orderBy: { createAt: 'asc' }, // 离当前最近的一个
          select: { id: true }
        });
      } else if (operateType === 'next') {
        // 获取下一条（时间更早的）
        neighbor = await db.evalDatasets.findFirst({
          where: {
            projectId,
            createAt: { lt: current.createAt }
          },
          orderBy: { createAt: 'desc' }, // 离当前最近的一个
          select: { id: true }
        });
      }

      return NextResponse.json(neighbor || null);
    }

    // 常规详情请求
    const evalQuestion = await getEvalQuestionById(evalId);

    if (!evalQuestion) {
      return NextResponse.json({ error: 'Eval question not found' }, { status: 404 });
    }

    return NextResponse.json(evalQuestion);
  } catch (error) {
    console.error('Failed to get eval question:', error);
    return NextResponse.json({ error: error.message || 'Failed to get eval question' }, { status: 500 });
  }
}

/**
 * 更新评估数据集
 */
export async function PUT(request, { params }) {
  try {
    const { evalId } = params;
    const data = await request.json();

    // 只允许更新特定字段
    const allowedFields = ['question', 'options', 'correctAnswer', 'tags', 'note'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await updateEvalQuestion(evalId, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update eval question:', error);
    return NextResponse.json({ error: error.message || 'Failed to update eval question' }, { status: 500 });
  }
}

/**
 * 删除评估数据集
 */
export async function DELETE(request, { params }) {
  try {
    const { evalId } = params;

    await deleteEvalQuestion(evalId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete eval question:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete eval question' }, { status: 500 });
  }
}
