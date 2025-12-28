import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance - Get all attendance logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.timestamp = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    const attendances = await prisma.attendanceLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 records
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create attendance record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, studentId, studentName, class: className, status, source = 'rfid' } = body;

    if (!uid || !studentName || !className || !status) {
      return NextResponse.json(
        { error: 'UID, student name, class, and status are required' },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendance = await prisma.attendanceLog.create({
      data: {
        uid,
        studentId: studentId || null,
        studentName,
        class: className,
        status,
        source,
      },
      include: {
        student: true
      }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance - Delete all attendance logs
export async function DELETE() {
  try {
    await prisma.attendanceLog.deleteMany();
    return NextResponse.json({ message: 'All attendance logs deleted' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance logs' },
      { status: 500 }
    );
  }
}
