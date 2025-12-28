'use client';

import { useEffect } from 'react';
import { useIoTStore } from '@/hooks/useIoTStore';

export function DataInitializer() {
  const { 
    fetchStudents, 
    fetchAttendanceLogs,
    fetchProdi 
  } = useIoTStore();

  useEffect(() => {
    // Fetch all data on mount
    const initializeData = async () => {
      await Promise.all([
        fetchProdi(),
        fetchStudents(),
        fetchAttendanceLogs(),
      ]);
    };

    initializeData();
  }, [fetchProdi, fetchStudents, fetchAttendanceLogs]);

  return null; // This component doesn't render anything
}
