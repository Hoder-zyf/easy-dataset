import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import LLMClient from '@/lib/llm/core/index';
import { getModelConfigById } from '@/lib/db/model-config';

/**
 * 流式获取指定模型的回答
 * 查询参数: model=A 或 model=B
 */
export async function GET(request, { params }) {
  const { projectId, taskId } = params;
  const { searchParams } = new URL(request.url);
  const modelType = searchParams.get('model'); // 'A' 或 'B'

  try {
    if (!projectId || !taskId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    if (!modelType || !['A', 'B'].includes(modelType)) {
      return NextResponse.json({ error: '必须指定模型类型(A或B)' }, { status: 400 });
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
    const modelInfo = JSON.parse(task.modelInfo || '{}');
    // 兼容 evalDatasetIds 和 questionIds
    const questionIds = detail.questionIds || detail.evalDatasetIds || [];
    const currentIndex = detail.currentIndex || 0;

    // 检查任务是否已完成
    if (questionIds.length === 0 || currentIndex >= questionIds.length) {
      return NextResponse.json({ completed: true });
    }

    // 获取当前题目
    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = await db.evalDatasets.findUnique({
      where: { id: currentQuestionId }
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    // 根据 modelType 获取对应的模型配置
    const modelConfigKey = modelType === 'A' ? 'modelA' : 'modelB';
    const modelConfig = await getModelConfigById(modelInfo[modelConfigKey].providerId);

    if (!modelConfig) {
      return NextResponse.json({ error: '模型配置不存在' }, { status: 400 });
    }

    // 准备消息
    const messages = [
      { role: 'system', content: '你是一个智能助手，请根据用户的问题给出详细、准确的回答。' },
      { role: 'user', content: currentQuestion.question }
    ];

    // 创建 LLM 客户端
    const client = new LLMClient({
      projectId,
      providerId: modelConfig.providerId,
      endpoint: modelConfig.endpoint,
      apiKey: modelConfig.apiKey,
      modelName: modelConfig.modelName,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      topP: modelConfig.topP,
      topK: modelConfig.topK
    });

    // 调用流式接口并直接返回
    const response = await client.chatStreamAPI(messages);

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error(`模型${modelType}流式调用失败:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
