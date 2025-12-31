import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * 获取项目中所有评估数据集的标签
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 获取该项目所有评估数据集的标签
    const datasets = await db.evalDatasets.findMany({
      where: { projectId },
      select: { tags: true }
    });

    // 提取并去重所有标签
    const tagsSet = new Set();
    datasets.forEach(dataset => {
      if (dataset.tags) {
        // 支持逗号和中文逗号分隔
        const tags = dataset.tags
          .split(/[,，]/)
          .map(t => t.trim())
          .filter(Boolean);
        tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return NextResponse.json({ tags: Array.from(tagsSet).sort() });
  } catch (error) {
    console.error('Failed to get tags:', error);
    return NextResponse.json({ error: error.message || 'Failed to get tags' }, { status: 500 });
  }
}
