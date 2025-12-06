import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// GET - Fetch all setup tasks with statistics
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeCompleted = searchParams.get('include_completed') !== 'false';

    // Build where clause
    const where: {
      category?: string;
      completed?: boolean;
    } = {};

    if (category) where.category = category;
    if (!includeCompleted) where.completed = false;

    const tasks = await prisma.adminSetupTask.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { is_required: 'desc' },
        { created_at: 'asc' },
      ],
    });

    // Calculate statistics
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      requiredPending: tasks.filter(t => t.is_required && !t.completed).length,
      byCategory: {} as Record<string, { total: number; completed: number }>,
    };

    // Group by category
    tasks.forEach(task => {
      if (!stats.byCategory[task.category]) {
        stats.byCategory[task.category] = { total: 0, completed: 0 };
      }
      stats.byCategory[task.category].total++;
      if (task.completed) {
        stats.byCategory[task.category].completed++;
      }
    });

    // Calculate completion percentage
    const completionPercentage = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

    return NextResponse.json({
      tasks,
      stats: {
        ...stats,
        completionPercentage,
      },
    });
  } catch (error) {
    logError('Error fetching setup tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup tasks' },
      { status: 500 }
    );
  }
}

// PATCH - Update a task's completion status
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { task_key, completed } = body;

    if (!task_key) {
      return NextResponse.json(
        { error: 'task_key is required' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'completed must be a boolean' },
        { status: 400 }
      );
    }

    const task = await prisma.adminSetupTask.update({
      where: { task_key },
      data: {
        completed,
        completed_at: completed ? new Date() : null,
      },
    });

    // Log the activity
    await prisma.adminActivityLog.create({
      data: {
        action: completed ? 'COMPLETE' : 'UNCOMPLETE',
        entity_type: 'SETUP_TASK',
        entity_id: task.id,
        description: `${completed ? 'Completed' : 'Unmarked'} setup task: ${task.title}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    logError('Error updating setup task:', error);
    return NextResponse.json(
      { error: 'Failed to update setup task' },
      { status: 500 }
    );
  }
}
