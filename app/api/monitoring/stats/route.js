import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d
    const projectId = searchParams.get('projectId');
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');

    // 计算时间范围
    const now = new Date();
    let startDate = new Date();

    if (timeRange === '24h') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      // 默认 7d
      startDate.setDate(startDate.getDate() - 7);
    }

    // 构建查询条件
    const where = {
      createAt: {
        gte: startDate
      }
    };

    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }
    if (provider && provider !== 'all') {
      where.provider = provider;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    // 1. 获取汇总数据
    // 注意：Prisma 的 aggregate 对于大量数据可能较慢，但对于监控看板通常还可以接受
    // 如果数据量巨大，建议后续优化为定期聚合表
    const logs = await db.llmUsageLogs.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        latency: true,
        status: true,
        errorMessage: true,
        createAt: true,
        dateString: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    // 获取项目信息映射
    const projects = await db.projects.findMany({
      select: { id: true, name: true }
    });
    const projectMap = projects.reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {});

    // 2. 数据处理与聚合
    const summary = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCalls: logs.length,
      successCalls: 0,
      failedCalls: 0,
      totalLatency: 0,
      avgLatency: 0
    };

    const trendMap = {};
    const modelStats = {};
    const detailedStatsMap = {}; // Key: projectId-model-status-errorMessage

    logs.forEach(log => {
      // Summary
      summary.totalTokens += log.totalTokens;
      summary.inputTokens += log.inputTokens;
      summary.outputTokens += log.outputTokens;

      if (log.status === 'SUCCESS') {
        summary.successCalls++;
        summary.totalLatency += log.latency;
      } else {
        summary.failedCalls++;
      }

      // Trend (按天或按小时)
      let timeKey;
      if (timeRange === '24h') {
        const date = new Date(log.createAt);
        timeKey = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        timeKey = log.dateString.slice(5); // MM-DD
      }

      if (!trendMap[timeKey]) {
        trendMap[timeKey] = { name: timeKey, input: 0, output: 0 };
      }
      trendMap[timeKey].input += log.inputTokens;
      trendMap[timeKey].output += log.outputTokens;

      // Model Distribution
      const modelKey = log.model;
      if (!modelStats[modelKey]) {
        modelStats[modelKey] = { name: modelKey, value: 0 };
      }
      modelStats[modelKey].value += log.totalTokens;

      // Detailed Table Aggregation
      // Key: projectId + model + status + (errorMessage || '')
      const errorKey = log.errorMessage || '';
      const detailKey = `${log.projectId}|${log.model}|${log.status}|${errorKey}`;

      if (!detailedStatsMap[detailKey]) {
        detailedStatsMap[detailKey] = {
          projectId: log.projectId,
          projectName: projectMap[log.projectId] || 'Unknown Project',
          provider: log.provider,
          model: log.model,
          status: log.status,
          failureReason: log.errorMessage,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          calls: 0,
          totalLatency: 0
        };
      }
      const detailItem = detailedStatsMap[detailKey];
      detailItem.inputTokens += log.inputTokens;
      detailItem.outputTokens += log.outputTokens;
      detailItem.totalTokens += log.totalTokens;
      detailItem.calls += 1;
      if (log.status === 'SUCCESS') {
        detailItem.totalLatency += log.latency;
      }
    });

    // 计算平均值
    if (summary.successCalls > 0) {
      summary.avgLatency = Math.round(summary.totalLatency / summary.successCalls);
    }
    summary.avgTokensPerCall = summary.totalCalls > 0 ? Math.round(summary.totalTokens / summary.totalCalls) : 0;
    summary.failureRate = summary.totalCalls > 0 ? summary.failedCalls / summary.totalCalls : 0;

    // 格式化图表数据
    const trend = Object.values(trendMap).sort((a, b) => {
      // 简单排序，实际可能需要更严谨的时间排序
      return a.name.localeCompare(b.name);
    });

    const modelDistribution = Object.values(modelStats).sort((a, b) => b.value - a.value);

    // 格式化详细表格数据
    const details = Object.values(detailedStatsMap)
      .map(item => ({
        ...item,
        avgLatency:
          item.status === 'SUCCESS' && item.calls > 0 ? (item.totalLatency / item.calls / 1000).toFixed(2) + 's' : '-'
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens); // 默认按 token 消耗排序

    return NextResponse.json({
      summary,
      trend,
      modelDistribution,
      details,
      projects
    });
  } catch (error) {
    console.error('Failed to fetch monitoring stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
