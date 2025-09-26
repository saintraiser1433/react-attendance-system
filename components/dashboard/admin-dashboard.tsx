"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BarChart3, QrCode } from "lucide-react";
import Link from "next/link";
import { AdminAttendanceChart, AdminDepartmentChart, AdminWeeklyChart } from "@/components/charts/admin-charts";

interface AdminStats {
  totalTeachers: number;
  totalStudents: number;
  totalDepartments: number;
  totalSubjects: number;
  attendanceRate: number;
  activeClasses: number;
}

interface AdminAnalytics {
  stats: AdminStats;
  departmentData: Array<{
    name: string;
    students: number;
    teachers: number;
    color: string;
  }>;
  monthlyData: Array<{
    month: string;
    rate: number;
    students: number;
  }>;
  weeklyData: Array<{
    day: string;
    attendance: number;
  }>;
}

export function AdminDashboardContent() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
    totalTeachers: 0,
    totalStudents: 0,
    totalDepartments: 0,
    totalSubjects: 0,
    attendanceRate: 0,
    activeClasses: 0
  };

  return (
    <div className="space-y-6">
      {/* Analytics Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Across {stats.totalDepartments} departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
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
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClasses}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trends */}
        <AdminAttendanceChart data={analytics?.monthlyData} />
        
        {/* Department Distribution */}
        <AdminDepartmentChart data={analytics?.departmentData} />
      </div>

      {/* Weekly Overview */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Weekly Attendance */}
        <AdminWeeklyChart data={analytics?.weeklyData} />
      </div>
    </div>
  );
}














