import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/students/check-uid - Check if UID exists and get student info
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    // Find student by UID
    const student = await prisma.student.findUnique({
      where: { uid },
      include: {
        _count: {
          select: { attendances: true }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { found: false, message: 'UID tidak terdaftar' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      student
    });
  } catch (error) {
    console.error('Error checking UID:', error);
    return NextResponse.json(
      { error: 'Failed to check UID' },
      { status: 500 }
    );
  }
}
