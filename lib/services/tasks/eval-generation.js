/**
 * 评估数据集批量生成任务处理服务
 */

import { PrismaClient } from '@prisma/client';
import { processInParallel } from '@/lib/util/async';
import { updateTask } from './index';
import { getTaskConfig } from '@/lib/db/projects';
import { generateEvalQuestionsForChunk } from '@/lib/services/eval';

const prisma = new PrismaClient();

/**
 * 处理评估数据集批量生成任务
 * @param {object} task - 任务对象
 * @returns {Promise<void>}
 */
export async function processEvalGenerationTask(task) {
  try {
    console.log(`开始处理评估数据集生成任务: ${task.id}`);

    // 解析模型信息
    let modelInfo;
    try {
      modelInfo = JSON.parse(task.modelInfo);
    } catch (error) {
      throw new Error(`模型信息解析失败: ${error.message}`);
    }

    // 获取项目配置
    const taskConfig = await getTaskConfig(task.projectId);
    const concurrencyLimit = taskConfig?.concurrencyLimit || 2;

    // 1. 查询所有还没有生成评估题目的文本块
    // 先获取所有文本块
    const allChunks = await prisma.chunks.findMany({
      where: {
        projectId: task.projectId,
        // 过滤掉特殊文本块
        NOT: {
          name: {
            in: ['Image Chunk', 'Distilled Content']
          }
        }
      }
    });

    if (allChunks.length === 0) {
      console.log(`项目 ${task.projectId} 没有可生成评估题目的文本块`);
      await updateTask(task.id, {
        status: 1,
        completedCount: 0,
        totalCount: 0,
        note: '没有可生成评估题目的文本块'
      });
      return;
    }

    // 查询已经生成过评估题目的文本块ID
    const chunksWithEval = await prisma.evalDatasets.findMany({
      where: {
        projectId: task.projectId
      },
      select: {
        chunkId: true
      },
      distinct: ['chunkId']
    });

    const chunkIdsWithEval = new Set(chunksWithEval.map(item => item.chunkId).filter(Boolean));

    // 过滤出还没有生成评估题目的文本块
    const chunks = allChunks.filter(chunk => !chunkIdsWithEval.has(chunk.id));

    if (chunks.length === 0) {
      console.log(`项目 ${task.projectId} 的所有文本块都已生成评估题目`);
      await updateTask(task.id, {
        status: 1,
        completedCount: 0,
        totalCount: 0,
        note: '所有文本块都已生成评估题目'
      });
      return;
    }

    // 更新任务总数
    const totalCount = chunks.length;
    await updateTask(task.id, {
      totalCount,
      detail: `待处理文本块数量: ${totalCount}`
    });

    // 2. 批量处理每个文本块
    let successCount = 0;
    let errorCount = 0;
    let totalQuestionsGenerated = 0;
    let latestTaskStatus = 0;

    // 单个文本块处理函数
    const processChunk = async chunk => {
      try {
        // 如果任务已经被标记为失败或已中断，不再继续处理
        const latestTask = await prisma.task.findUnique({ where: { id: task.id } });
        if (latestTask.status === 2 || latestTask.status === 3) {
          latestTaskStatus = latestTask.status;
          return;
        }

        const result = await generateEvalQuestionsForChunk(task.projectId, chunk.id, {
          model: modelInfo,
          language: task.language || 'zh-CN'
        });

        console.log(
          `文本块 ${chunk.id} 评估题目生成完成，生成题目数: ${result.total}, 题型分布: ${JSON.stringify(result.breakdown)}`
        );

        // 增加成功计数
        successCount++;
        totalQuestionsGenerated += result.total || 0;

        // 更新任务进度
        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `已处理: ${successCount + errorCount}/${totalCount}, 成功: ${successCount}, 失败: ${errorCount}, 已生成题目: ${totalQuestionsGenerated}`
        });

        return { success: true, chunkId: chunk.id, result };
      } catch (error) {
        console.error(`处理文本块 ${chunk.id} 出错:`, error);
        errorCount++;

        // 更新任务进度
        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `已处理: ${successCount + errorCount}/${totalCount}, 成功: ${successCount}, 失败: ${errorCount}, 已生成题目: ${totalQuestionsGenerated}`
        });

        return { success: false, chunkId: chunk.id, error: error.message };
      }
    };

    // 并行处理所有文本块，使用任务设置中的并发限制
    await processInParallel(chunks, processChunk, concurrencyLimit, async (completed, total) => {
      console.log(`评估数据集生成进度: ${completed}/${total}`);
    });

    if (!latestTaskStatus) {
      // 任务完成，更新状态
      const finalStatus = errorCount > 0 && successCount === 0 ? 2 : 1; // 如果全部失败，标记为失败；否则标记为完成
      await updateTask(task.id, {
        status: finalStatus,
        detail: '',
        note: `处理完成。成功: ${successCount}, 失败: ${errorCount}, 生成题目总数: ${totalQuestionsGenerated}`,
        endTime: new Date()
      });
    }

    console.log(`评估数据集生成任务 ${task.id} 处理完成`);
  } catch (error) {
    console.error(`评估数据集生成任务处理失败: ${task.id}`, error);
    await updateTask(task.id, {
      status: 2,
      detail: `处理失败: ${error.message}`,
      note: `处理失败: ${error.message}`
    });
  }
}
