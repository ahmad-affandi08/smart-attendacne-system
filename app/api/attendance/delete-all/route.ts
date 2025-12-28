import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    await prisma.attendanceLog.deleteMany({});

    return NextResponse.json({ success: true, message: 'All attendance logs deleted' });
  } catch (error) {
    console.error('Error deleting all attendance logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete all attendance logs' },
      { status: 500 }
    );
  }
}
