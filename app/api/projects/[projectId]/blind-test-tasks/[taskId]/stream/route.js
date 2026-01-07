import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import LLMClient from '@/lib/llm/core/index';
import { getModelConfigById } from '@/lib/db/model-config';

/**
 * 流式获取当前题目的两个模型回答
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
    const modelInfo = JSON.parse(task.modelInfo || '{}');
    const { questionIds = [], currentIndex = 0 } = detail;

    // 检查任务是否已完成
    if (currentIndex >= questionIds.length) {
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

    // 获取模型配置
    const [modelConfigA, modelConfigB] = await Promise.all([
      getModelConfigById(modelInfo.modelA.providerId),
      getModelConfigById(modelInfo.modelB.providerId)
    ]);

    if (!modelConfigA || !modelConfigB) {
      return NextResponse.json({ error: '模型配置不存在' }, { status: 400 });
    }

    // 随机交换位置（盲测核心）
    const isSwapped = Math.random() > 0.5;

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送初始化消息
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'init',
                question: currentQuestion.question,
                questionId: currentQuestion.id,
                questionIndex: currentIndex + 1,
                totalQuestions: questionIds.length,
                isSwapped
              }) + '\n'
            )
          );

          // 准备消息
          const messages = [
            { role: 'system', content: '你是一个智能助手，请根据用户的问题给出详细、准确的回答。' },
            { role: 'user', content: currentQuestion.question }
          ];

          // 创建 LLM 客户端
          const clientA = new LLMClient({
            projectId,
            providerId: modelConfigA.providerId,
            endpoint: modelConfigA.endpoint,
            apiKey: modelConfigA.apiKey,
            modelName: modelConfigA.modelName,
            temperature: modelConfigA.temperature,
            maxTokens: modelConfigA.maxTokens,
            topP: modelConfigA.topP,
            topK: modelConfigA.topK
          });

          const clientB = new LLMClient({
            projectId,
            providerId: modelConfigB.providerId,
            endpoint: modelConfigB.endpoint,
            apiKey: modelConfigB.apiKey,
            modelName: modelConfigB.modelName,
            temperature: modelConfigB.temperature,
            maxTokens: modelConfigB.maxTokens,
            topP: modelConfigB.topP,
            topK: modelConfigB.topK
          });

          let answerA = '';
          let answerB = '';
          const startTime = Date.now();

          // 并行调用两个模型的流式接口
          await Promise.all([
            (async () => {
              try {
                const response = await clientA.chatStreamAPI(messages);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value, { stream: true });
                  answerA += chunk;

                  // 发送流式更新
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'chunk',
                        model: isSwapped ? 'B' : 'A',
                        content: chunk
                      }) + '\n'
                    )
                  );
                }
              } catch (err) {
                console.error('模型A调用失败:', err);
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'error',
                      model: isSwapped ? 'B' : 'A',
                      error: err.message
                    }) + '\n'
                  )
                );
              }
            })(),
            (async () => {
              try {
                const response = await clientB.chatStreamAPI(messages);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value, { stream: true });
                  answerB += chunk;

                  // 发送流式更新
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'chunk',
                        model: isSwapped ? 'A' : 'B',
                        content: chunk
                      }) + '\n'
                    )
                  );
                }
              } catch (err) {
                console.error('模型B调用失败:', err);
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'error',
                      model: isSwapped ? 'A' : 'B',
                      error: err.message
                    }) + '\n'
                  )
                );
              }
            })()
          ]);

          const duration = Date.now() - startTime;

          // 发送完成消息
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
                duration,
                answerA: isSwapped ? answerB : answerA,
                answerB: isSwapped ? answerA : answerB
              }) + '\n'
            )
          );

          controller.close();
        } catch (error) {
          console.error('流式处理失败:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
