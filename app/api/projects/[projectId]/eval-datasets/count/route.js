import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildEvalQuestionWhere } from '@/lib/db/evalDatasets';

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    const questionType = searchParams.get('questionType') || '';
    const keyword = searchParams.get('keyword') || '';
    const chunkId = searchParams.get('chunkId') || '';

    const tags =
      searchParams.getAll('tags').length > 0
        ? searchParams.getAll('tags')
        : searchParams.get('tag')
          ? searchParams.get('tag').split(',')
          : [];

    const where = buildEvalQuestionWhere(projectId, {
      questionType: questionType || undefined,
      keyword: keyword || undefined,
      chunkId: chunkId || undefined,
      tags: tags.length > 0 ? tags : undefined
    });

    const total = await db.evalDatasets.count({ where });

    return NextResponse.json(
      {
        code: 0,
        data: { total }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to count eval datasets:', error);
    return NextResponse.json(
      { code: 500, error: 'Failed to count eval datasets', message: error.message },
      { status: 500 }
    );
  }
}
