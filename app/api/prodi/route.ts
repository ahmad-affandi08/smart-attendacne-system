import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prodi - Get all program studi
export async function GET() {
  try {
    const prodi = await prisma.programStudi.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    
    return NextResponse.json(prodi);
  } catch (error) {
    console.error('Error fetching prodi:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program studi' },
      { status: 500 }
    );
  }
}

// POST /api/prodi - Create new program studi
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, faculty } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.programStudi.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Program studi with this code already exists' },
        { status: 409 }
      );
    }

    // Create program studi
    const prodi = await prisma.programStudi.create({
      data: {
        code: code.toUpperCase(),
        name,
        faculty: faculty || null,
      },
    });

    return NextResponse.json(prodi, { status: 201 });
  } catch (error) {
    console.error('Error creating prodi:', error);
    return NextResponse.json(
      { error: 'Failed to create program studi' },
      { status: 500 }
    );
  }
}
