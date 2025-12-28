import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/stats - Get attendance statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Parse date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's attendance
    const todayAttendance = await prisma.attendanceLog.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    // Calculate stats
    const stats = {
      total: todayAttendance.length,
      hadir: todayAttendance.filter(a => a.status === 'HADIR').length,
      tidakHadir: todayAttendance.filter(a => a.status === 'TIDAK HADIR').length,
      izin: todayAttendance.filter(a => a.status === 'IZIN').length,
      ditolak: todayAttendance.filter(a => a.status === 'DITOLAK').length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance stats' },
      { status: 500 }
    );
  }
}
