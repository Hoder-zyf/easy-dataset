import { NextResponse } from 'next/server';
import { getEvalQuestionsWithPagination, getEvalQuestionsStats, deleteEvalQuestion } from '@/lib/db/evalDatasets';

/**
 * 获取项目的评估数据集列表（分页）
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const questionType = searchParams.get('questionType') || '';
    const keyword = searchParams.get('keyword') || '';
    const chunkId = searchParams.get('chunkId') || '';
    // 支持多个 tag 参数，或者逗号分隔
    const tags =
      searchParams.getAll('tags').length > 0
        ? searchParams.getAll('tags')
        : searchParams.get('tag')
          ? searchParams.get('tag').split(',')
          : [];

    const includeStats = searchParams.get('includeStats') === 'true';

    // 获取分页数据
    const result = await getEvalQuestionsWithPagination(projectId, {
      page,
      pageSize,
      questionType: questionType || undefined,
      keyword: keyword || undefined,
      chunkId: chunkId || undefined,
      tags: tags.length > 0 ? tags : undefined
    });

    // 如果需要统计数据
    if (includeStats) {
      const stats = await getEvalQuestionsStats(projectId);
      result.stats = stats;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get eval datasets:', error);
    return NextResponse.json({ error: error.message || 'Failed to get eval datasets' }, { status: 500 });
  }
}

/**
 * 批量删除评估数据集
 */
export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request: ids array is required' }, { status: 400 });
    }

    // 批量删除
    const results = await Promise.all(ids.map(id => deleteEvalQuestion(id).catch(err => ({ error: err.message, id }))));

    const deleted = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      message: `Successfully deleted ${deleted} items${failed > 0 ? `, ${failed} failed` : ''}`
    });
  } catch (error) {
    console.error('Failed to delete eval datasets:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete eval datasets' }, { status: 500 });
  }
}
