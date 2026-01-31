import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/students - Get all students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        prodi: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, class: className, nis, uid, prodiId } = body;

    if (!name || !className || !nis || !uid) {
      return NextResponse.json(
        { error: 'Name, class, NIS, and UID are required' },
        { status: 400 }
      );
    }

    // Check if student with NIS already exists
    const existingNis = await prisma.student.findUnique({
      where: { nis }
    });

    if (existingNis) {
      return NextResponse.json(
        { error: 'Student with this NIS already exists' },
        { status: 409 }
      );
    }

    // Check if UID already registered
    const existingUid = await prisma.student.findUnique({
      where: { uid }
    });

    if (existingUid) {
      return NextResponse.json(
        { error: 'This KTM UID is already registered' },
        { status: 409 }
      );
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        name,
        class: className,
        nis,
        uid,
        prodiId: prodiId || null,
      },
      include: {
        prodi: true
      }
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
