import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

/**
 * Submit vote result
 * vote: 'left' | 'right' | 'both_good' | 'both_bad'
 */
export async function POST(request, { params }) {
  try {
    const { projectId, taskId } = params;
    const { vote, questionId, isSwapped, leftAnswer, rightAnswer } = await request.json();

    // Validate vote option
    const validVotes = ['left', 'right', 'both_good', 'both_bad'];
    if (!validVotes.includes(vote)) {
      return NextResponse.json({ code: 400, error: 'Invalid vote option' }, { status: 400 });
    }

    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId,
        taskType: 'blind-test'
      }
    });

    if (!task) {
      return NextResponse.json({ code: 404, error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 0) {
      return NextResponse.json({ code: 400, error: 'Task has ended' }, { status: 400 });
    }

    // Parse task details
    let detail = {};
    let modelInfo = {};
    try {
      detail = task.detail ? JSON.parse(task.detail) : {};
      modelInfo = task.modelInfo ? JSON.parse(task.modelInfo) : {};
    } catch (e) {
      console.error('Failed to parse task detail:', e);
    }

    // Calculate scores
    // isSwapped: true means left is model B and right is model A
    // isSwapped: false means left is model A and right is model B
    let modelAScore = 0;
    let modelBScore = 0;

    if (vote === 'left') {
      // Left is better
      if (isSwapped) {
        modelBScore = 1; // Left is B
      } else {
        modelAScore = 1; // Left is A
      }
    } else if (vote === 'right') {
      // Right is better
      if (isSwapped) {
        modelAScore = 1; // Right is A
      } else {
        modelBScore = 1; // Right is B
      }
    } else if (vote === 'both_good') {
      // Both are good
      modelAScore = 0.5;
      modelBScore = 0.5;
    } else if (vote === 'both_bad') {
      // Both are bad
      modelAScore = 0;
      modelBScore = 0;
    }

    // Record result
    const result = {
      questionId,
      vote,
      isSwapped,
      modelAScore,
      modelBScore,
      leftAnswer: leftAnswer || '',
      rightAnswer: rightAnswer || '',
      timestamp: new Date().toISOString()
    };

    // Update task details
    const results = detail.results || [];
    results.push(result);

    // Support both evalDatasetIds and questionIds
    const questionIds = detail.questionIds || detail.evalDatasetIds || [];
    const newCurrentIndex = detail.currentIndex + 1;
    const isCompleted = newCurrentIndex >= questionIds.length;

    const updatedDetail = {
      ...detail,
      currentIndex: newCurrentIndex,
      results
    };

    // Update task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        detail: JSON.stringify(updatedDetail),
        completedCount: newCurrentIndex,
        status: isCompleted ? 1 : 0, // 1-completed, 0-running
        endTime: isCompleted ? new Date() : null
      }
    });

    // Calculate current total scores
    const totalModelAScore = results.reduce((sum, r) => sum + (r.modelAScore || 0), 0);
    const totalModelBScore = results.reduce((sum, r) => sum + (r.modelBScore || 0), 0);

    return NextResponse.json({
      code: 0,
      data: {
        success: true,
        isCompleted,
        currentIndex: newCurrentIndex,
        totalCount: questionIds.length,
        scores: {
          modelA: totalModelAScore,
          modelB: totalModelBScore
        }
      },
      message: isCompleted ? 'Blind-test task completed' : 'Vote recorded'
    });
  } catch (error) {
    console.error('Failed to submit vote result:', error);
    return NextResponse.json(
      { code: 500, error: 'Failed to submit vote result', message: error.message },
      { status: 500 }
    );
  }
}
