"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User2, BarChart3, QrCode, GraduationCap } from "lucide-react";
import Link from "next/link";

interface StudentProfile {
  studentId: string;
  name: string;
  email: string;
  department: string;
  section: string;
  yearLevel: string;
  academicYear: string;
}

interface StudentStats {
  attendanceRate: number;
  classesAttended: string;
  enrolledSubjects: number;
  totalAttendance: number;
  presentCount: number;
  absentCount: number;
}

interface SubjectAttendance {
  subject: string;
  teacher: string;
  attendance: number;
  total: number;
  rate: number;
}

interface StudentAnalytics {
  profile: StudentProfile;
  stats: StudentStats;
  subjectAttendance: SubjectAttendance[];
}

export function StudentDashboardContent() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/student/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch student analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = analytics?.profile;
  const stats = analytics?.stats;

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User2 className="h-5 w-5 text-primary" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>Your account details and academic information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
              <p className="text-lg">{profile?.studentId || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-lg">{profile?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
              <p className="text-lg">{profile?.department || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Section</Label>
              <p className="text-lg">{profile?.section || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Year Level</Label>
              <p className="text-lg">{profile?.yearLevel || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
              <p className="text-lg">{profile?.academicYear || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.classesAttended || "0/0"}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enrolledSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Current semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAttendance || 0}</div>
            <p className="text-xs text-muted-foreground">Attendance records</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      {analytics?.subjectAttendance && analytics.subjectAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
            <CardDescription>Your attendance performance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.subjectAttendance.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{subject.subject}</h4>
                    <p className="text-sm text-muted-foreground">Teacher: {subject.teacher}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{subject.rate}%</div>
                    <div className="text-sm text-muted-foreground">
                      {subject.attendance}/{subject.total} classes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}














