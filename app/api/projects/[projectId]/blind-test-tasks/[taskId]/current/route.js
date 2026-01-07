import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import LLMClient from '@/lib/llm/core/index';
import { getModelConfigById } from '@/lib/db/model-config';

/**
 * 获取当前题目并调用两个模型生成答案
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

    const questionIds = detail.questionIds || detail.evalDatasetIds || [];
    const currentIndex = detail.currentIndex || 0;

    // 检查是否已完成所有题目
    if (questionIds.length === 0 || currentIndex >= questionIds.length) {
      return NextResponse.json({
        code: 0,
        data: {
          completed: true,
          message: '所有题目已完成'
        }
      });
    }

    // 获取当前题目
    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = await db.evalDatasets.findUnique({
      where: { id: currentQuestionId },
      select: {
        id: true,
        question: true,
        questionType: true,
        correctAnswer: true,
        tags: true
      }
    });

    if (!currentQuestion) {
      return NextResponse.json({ code: 404, error: '题目不存在' }, { status: 404 });
    }

    // 获取两个模型的配置
    const [modelConfigA, modelConfigB] = await Promise.all([
      getModelConfigById(modelInfo.modelA.providerId),
      getModelConfigById(modelInfo.modelB.providerId)
    ]);

    if (!modelConfigA || !modelConfigB) {
      return NextResponse.json({ code: 400, error: '模型配置不存在' }, { status: 400 });
    }

    // 构建提示词
    const systemPrompt = '你是一个智能助手，请根据用户的问题给出详细、准确的回答。';
    const userPrompt = currentQuestion.question;

    // 并行调用两个模型
    const startTimeA = Date.now();
    const startTimeB = Date.now();

    let answerA = '';
    let answerB = '';
    let errorA = null;
    let errorB = null;
    let durationA = 0;
    let durationB = 0;

    try {
      // 调用模型A
      const clientA = new LLMClient({
        providerId: modelConfigA.providerId,
        endpoint: modelConfigA.endpoint,
        apiKey: modelConfigA.apiKey,
        modelName: modelConfigA.modelName,
        temperature: modelConfigA.temperature,
        maxTokens: modelConfigA.maxTokens,
        topP: modelConfigA.topP,
        topK: modelConfigA.topK
      });

      const resultA = await clientA.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      answerA = resultA.text || '';
      durationA = Date.now() - startTimeA;
    } catch (err) {
      console.error('模型A调用失败:', err);
      errorA = err.message;
      durationA = Date.now() - startTimeA;
    }

    try {
      // 调用模型B
      const clientB = new LLMClient({
        providerId: modelConfigB.providerId,
        endpoint: modelConfigB.endpoint,
        apiKey: modelConfigB.apiKey,
        modelName: modelConfigB.modelName,
        temperature: modelConfigB.temperature,
        maxTokens: modelConfigB.maxTokens,
        topP: modelConfigB.topP,
        topK: modelConfigB.topK
      });

      const resultB = await clientB.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      answerB = resultB.text || '';
      durationB = Date.now() - startTimeB;
    } catch (err) {
      console.error('模型B调用失败:', err);
      errorB = err.message;
      durationB = Date.now() - startTimeB;
    }

    // 随机决定左右位置（盲测核心）
    const isSwapped = Math.random() > 0.5;

    return NextResponse.json({
      code: 0,
      data: {
        completed: false,
        currentIndex,
        totalCount: evalDatasetIds.length,
        question: currentQuestion,
        // 盲测：不透露哪个是哪个模型
        leftAnswer: {
          content: isSwapped ? answerB : answerA,
          error: isSwapped ? errorB : errorA,
          duration: isSwapped ? durationB : durationA
        },
        rightAnswer: {
          content: isSwapped ? answerA : answerB,
          error: isSwapped ? errorA : errorB,
          duration: isSwapped ? durationA : durationB
        },
        // 服务端记录实际位置，用于后续计分
        _swap: isSwapped
      }
    });
  } catch (error) {
    console.error('获取当前题目失败:', error);
    return NextResponse.json({ code: 500, error: '获取当前题目失败', message: error.message }, { status: 500 });
  }
}
