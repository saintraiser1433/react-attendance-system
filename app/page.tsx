"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, GraduationCap, Users, QrCode, BarChart3, User2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminAttendanceChart, AdminDepartmentChart, AdminWeeklyChart } from "@/components/charts/admin-charts";
import { TeacherAttendanceChart, TeacherPerformanceChart, TeacherDailyChart, TeacherOverallChart } from "@/components/charts/teacher-charts";
import { AdminDashboardContent } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboardContent } from "@/components/dashboard/teacher-dashboard";
import { GITLogo } from "@/components/ui/git-logo";

export default function Home() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", { 
        email, 
        password, 
        redirect: false 
      });
      
      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else if (result?.ok) {
        toast.success("Welcome back!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <GITLogo size="md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white">GIT</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Student Attendance Management</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  GIT STUDENT
                  <span className="text-primary block">ATTENDANCE</span>
                  <span className="text-gray-600 dark:text-gray-300">MANAGEMENT SYSTEM</span>
                  <span className="text-sm text-primary block mt-2">USING QR CODE</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                  Streamline attendance tracking with QR codes, real-time analytics, and comprehensive reporting.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center lg:items-start space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <QrCode className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">QR Scanning</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Secure QR code generation and scanning</p>
                </div>
                <div className="flex flex-col items-center lg:items-start space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Role Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admin and teacher roles</p>
                </div>
                <div className="flex flex-col items-center lg:items-start space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Detailed reports and insights</p>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                  <div className="flex justify-center mb-4">
                    <GITLogo size="lg" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Need help? Contact your administrator
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user as any;
  const role = user?.role;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {role === "admin" && "Analytics Dashboard"}
            {role === "teacher" && "Analytics Dashboard"}
          </h1>
        </div>
        {role === "admin" && <AdminDashboardContent />}
        {role === "teacher" && <TeacherDashboardContent />}
      </div>
    </DashboardLayout>
  );
}

function AdminDashboard() {
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Across 6 departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.7%</div>
            <p className="text-xs text-muted-foreground">From 1,580 records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trends */}
        <AdminAttendanceChart />
        
        {/* Department Distribution */}
        <AdminDepartmentChart />
      </div>

      {/* Weekly Overview */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Weekly Attendance */}
        <AdminWeeklyChart />
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/teacher/analytics');
        const data = await response.json();
        
        if (response.ok) {
          setAnalyticsData(data);
        } else {
          console.error('Failed to fetch analytics:', data.error);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{analyticsData?.stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.stats?.todaysClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.stats?.attendanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.stats?.totalSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Attendance Trends */}
        <TeacherAttendanceChart data={analyticsData?.weeklyData} />
        
        {/* Student Performance */}
        <TeacherPerformanceChart data={analyticsData?.subjectPerformance} />
      </div>

      {/* Daily Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <TeacherDailyChart data={analyticsData?.dailyClassData} />
        
        {/* Overall Performance */}
        <TeacherOverallChart data={analyticsData?.performanceData} />
      </div>
    </div>
  );
}

function StudentDashboard() {
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
              <p className="text-lg">S001</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-lg">Jane Student</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
              <p className="text-lg">Computer Science</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
              <p className="text-lg">2025/2026</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">37/40</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Current semester</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}