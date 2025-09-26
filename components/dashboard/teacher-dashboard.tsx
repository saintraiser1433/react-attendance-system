"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BarChart3, QrCode, Calendar } from "lucide-react";
import Link from "next/link";
import { TeacherAttendanceChart, TeacherPerformanceChart, TeacherDailyChart, TeacherOverallChart } from "@/components/charts/teacher-charts";

interface TeacherStats {
  totalStudents: number;
  totalSubjects: number;
  todaysClasses: number;
  attendanceRate: number;
  activeModules: number;
}

interface TeacherAnalytics {
  stats: TeacherStats;
  weeklyData: Array<{
    day: string;
    attendance: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    attendanceRate: number;
  }>;
  dailyClassData: Array<{
    time: string;
    attendance: number;
    subject: string;
  }>;
  performanceData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  activeAcademicPeriod: {
    academicYear: string;
    semester: string;
  };
}

export function TeacherDashboardContent() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch teacher analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalStudents: 0,
    totalSubjects: 0,
    todaysClasses: 0,
    attendanceRate: 0,
    activeModules: 0
  };

  return (
    <div className="space-y-6">
      {/* Analytics Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysClasses}</div>
            <p className="text-xs text-muted-foreground">Scheduled classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Academic Period */}
      {analytics?.activeAcademicPeriod && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                Active Period: {analytics.activeAcademicPeriod.academicYear} - {analytics.activeAcademicPeriod.semester}
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Analytics and data are filtered for this academic period
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Attendance Trends */}
        <TeacherAttendanceChart data={analytics?.weeklyData} />
        
        {/* Student Performance */}
        <TeacherPerformanceChart data={analytics?.subjectPerformance} />
      </div>

      {/* Daily Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <TeacherDailyChart data={analytics?.dailyClassData} />
        
        {/* Overall Performance */}
        <TeacherOverallChart data={analytics?.performanceData} />
      </div>
    </div>
  );
}














