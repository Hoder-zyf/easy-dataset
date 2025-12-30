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
 * 获取项目的所有测评题目
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
