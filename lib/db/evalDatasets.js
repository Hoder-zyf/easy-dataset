'use server';
import { db } from '@/lib/db/index';

/**
 * 创建单个测评题目
 * @param {Object} data - 题目数据
 * @returns {Promise<Object>} - 创建的题目
 */
export async function createEvalQuestion(data) {
  try {
    return await db.evalDatasets.create({ data });
  } catch (error) {
    console.error('Failed to create eval question:', error);
    throw error;
  }
}

/**
 * 批量创建测评题目
 * @param {Array} dataArray - 题目数据数组
 * @returns {Promise<Object>} - 创建结果
 */
export async function createManyEvalQuestions(dataArray) {
  try {
    return await db.evalDatasets.createMany({ data: dataArray });
  } catch (error) {
    console.error('Failed to create many eval questions:', error);
    throw error;
  }
}

/**
 * 获取项目的所有测评题目（简单查询）
 * @param {string} projectId - 项目ID
 * @returns {Promise<Array>} - 测评题目数组
 */
export async function getEvalQuestions(projectId) {
  try {
    return await db.evalDatasets.findMany({
      where: { projectId },
      orderBy: { createAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get eval questions from database:', error);
    throw error;
  }
}

/**
 * 分页获取项目的测评题目
 * @param {string} projectId - 项目ID
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.questionType - 题型筛选
 * @param {string} options.keyword - 关键词搜索
 * @param {string} options.chunkId - 文本块ID筛选
 * @returns {Promise<Object>} - 分页结果
 */
export async function getEvalQuestionsWithPagination(projectId, options = {}) {
  try {
    const { page = 1, pageSize = 20, questionType, keyword, chunkId } = options;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = { projectId };

    if (questionType) {
      where.questionType = questionType;
    }

    if (chunkId) {
      where.chunkId = chunkId;
    }

    if (keyword) {
      where.question = {
        contains: keyword
      };
    }

    // 并行查询数据和总数
    const [items, total] = await Promise.all([
      db.evalDatasets.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createAt: 'desc' },
        include: {
          chunks: {
            select: {
              id: true,
              name: true,
              fileName: true
            }
          }
        }
      }),
      db.evalDatasets.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Failed to get eval questions with pagination:', error);
    throw error;
  }
}

/**
 * 获取单个测评题目详情
 * @param {string} id - 题目ID
 * @returns {Promise<Object>} - 题目详情
 */
export async function getEvalQuestionById(id) {
  try {
    return await db.evalDatasets.findUnique({
      where: { id },
      include: {
        chunks: {
          select: {
            id: true,
            name: true,
            fileName: true,
            content: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get eval question by ID:', error);
    throw error;
  }
}

/**
 * 更新测评题目
 * @param {string} id - 题目ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} - 更新后的题目
 */
export async function updateEvalQuestion(id, data) {
  try {
    return await db.evalDatasets.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('Failed to update eval question:', error);
    throw error;
  }
}

/**
 * 获取项目测评题目统计
 * @param {string} projectId - 项目ID
 * @returns {Promise<Object>} - 统计数据
 */
export async function getEvalQuestionsStats(projectId) {
  try {
    const [total, byType] = await Promise.all([
      db.evalDatasets.count({ where: { projectId } }),
      db.evalDatasets.groupBy({
        by: ['questionType'],
        where: { projectId },
        _count: { id: true }
      })
    ]);

    const typeStats = {};
    byType.forEach(item => {
      typeStats[item.questionType] = item._count.id;
    });

    return {
      total,
      byType: typeStats
    };
  } catch (error) {
    console.error('Failed to get eval questions stats:', error);
    throw error;
  }
}

/**
 * 根据文本块ID获取测评题目
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Array>} - 测评题目数组
 */
export async function getEvalQuestionsByChunkId(chunkId) {
  try {
    return await db.evalDatasets.findMany({
      where: { chunkId },
      orderBy: { createAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get eval questions by chunk ID:', error);
    throw error;
  }
}

/**
 * 删除测评题目
 * @param {string} id - 题目ID
 * @returns {Promise<Object>} - 删除的题目
 */
export async function deleteEvalQuestion(id) {
  try {
    return await db.evalDatasets.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to delete eval question:', error);
    throw error;
  }
}
