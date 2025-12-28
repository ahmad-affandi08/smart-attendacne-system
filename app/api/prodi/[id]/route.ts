import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prodi/[id] - Get single program studi
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prodi = await prisma.programStudi.findUnique({
      where: { id: params.id },
      include: {
        students: true,
        _count: {
          select: { students: true }
        }
      }
    });

    if (!prodi) {
      return NextResponse.json(
        { error: 'Program studi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prodi);
  } catch (error) {
    console.error('Error fetching prodi:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program studi' },
      { status: 500 }
    );
  }
}

// PATCH /api/prodi/[id] - Update program studi
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code, name, faculty } = body;

    const prodi = await prisma.programStudi.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(faculty !== undefined && { faculty: faculty || null }),
      },
    });

    return NextResponse.json(prodi);
  } catch (error) {
    console.error('Error updating prodi:', error);
    return NextResponse.json(
      { error: 'Failed to update program studi' },
      { status: 500 }
    );
  }
}

// DELETE /api/prodi/[id] - Delete program studi
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if there are students in this prodi
    const count = await prisma.student.count({
      where: { prodiId: params.id }
    });

    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete. ${count} students are in this program studi.` },
        { status: 400 }
      );
    }

    await prisma.programStudi.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prodi:', error);
    return NextResponse.json(
      { error: 'Failed to delete program studi' },
      { status: 500 }
    );
  }
}
