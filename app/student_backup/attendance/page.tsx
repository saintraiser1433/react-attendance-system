"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CheckCircle, XCircle, Clock, BarChart3, Calendar, User, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
  timeIn: string | null;
  timeOut: string | null;
  lateMinutes: number;
  note?: string;
  createdAt: string;
}

interface SubjectGroup {
  subject: {
    id: string;
    code: string;
    name: string;
    teacher: string;
    academicYear: string;
    semester: string;
  };
  records: AttendanceRecord[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  };
}

interface AttendanceData {
  categorizedAttendance: SubjectGroup[];
  overallStats: {
    totalRecords: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    overallAttendanceRate: number;
    totalSubjects: number;
  };
  studentInfo: {
    name: string;
    studentId: string;
    department: string;
    section: string;
    yearLevel: string;
  };
}

export default function StudentAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination states for each subject
  const [paginationState, setPaginationState] = useState<{[subjectId: string]: {currentPage: number, itemsPerPage: number}}>({});

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Auto-refresh every 30 seconds to check for active academic period changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/attendance');
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceData(data);
      } else {
        toast.error(data.error || 'Failed to fetch attendance records');
        setAttendanceData(null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
      setAttendanceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Present</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>;
      case 'LATE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination helper functions
  const getPaginationState = (subjectId: string) => {
    return paginationState[subjectId] || { currentPage: 1, itemsPerPage: 10 };
  };

  const setPaginationForSubject = (subjectId: string, updates: Partial<{currentPage: number, itemsPerPage: number}>) => {
    setPaginationState(prev => ({
      ...prev,
      [subjectId]: { ...getPaginationState(subjectId), ...updates }
    }));
  };

  const getPaginatedRecords = (records: AttendanceRecord[], subjectId: string) => {
    const { currentPage, itemsPerPage } = getPaginationState(subjectId);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return records.slice(startIndex, endIndex);
  };

  const getTotalPages = (records: AttendanceRecord[], subjectId: string) => {
    const { itemsPerPage } = getPaginationState(subjectId);
    return Math.ceil(records.length / itemsPerPage);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attendanceData) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
              <p className="text-muted-foreground">
                Your attendance records categorized by subject
              </p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No attendance records found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { categorizedAttendance, overallStats, studentInfo } = attendanceData;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
            <p className="text-muted-foreground">
              Your attendance records categorized by subject
            </p>
          </div>
        </div>

        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>
                <p className="text-muted-foreground">{studentInfo.name}</p>
              </div>
              <div>
                <span className="font-medium">Student ID:</span>
                <p className="text-muted-foreground">{studentInfo.studentId}</p>
              </div>
              <div>
                <span className="font-medium">Department:</span>
                <p className="text-muted-foreground">{studentInfo.department}</p>
              </div>
              <div>
                <span className="font-medium">Section:</span>
                <p className="text-muted-foreground">{studentInfo.section}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.overallAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalPresent + overallStats.totalLate} of {overallStats.totalRecords} classes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">All subjects combined</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overallStats.totalPresent}</div>
              <p className="text-xs text-muted-foreground">Classes attended</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{overallStats.totalLate}</div>
              <p className="text-xs text-muted-foreground">Classes late</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overallStats.totalAbsent}</div>
              <p className="text-xs text-muted-foreground">Classes missed</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Attendance */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Attendance by Subject</h2>
          
          {categorizedAttendance.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No attendance records found</p>
              </CardContent>
            </Card>
          ) : (
            categorizedAttendance.map((subjectGroup) => (
              <Card key={subjectGroup.subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {subjectGroup.subject.code} - {subjectGroup.subject.name}
                      </CardTitle>
                      <CardDescription>
                        Teacher: {subjectGroup.subject.teacher} • {subjectGroup.subject.academicYear} - {subjectGroup.subject.semester}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{subjectGroup.stats.attendanceRate}%</div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Subject Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{subjectGroup.stats.total}</div>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{subjectGroup.stats.present}</div>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{subjectGroup.stats.absent}</div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{subjectGroup.stats.late}</div>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>

                  {/* Attendance Records Table */}
                  {subjectGroup.records.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time In</TableHead>
                            <TableHead>Time Out</TableHead>
                            <TableHead>Late Minutes</TableHead>
                            <TableHead>Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedRecords(subjectGroup.records, subjectGroup.subject.id).map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(record.status)}
                                  {getStatusBadge(record.status)}
                                </div>
                              </TableCell>
                              <TableCell>{record.timeIn || '-'}</TableCell>
                              <TableCell>{record.timeOut || '-'}</TableCell>
                              <TableCell>
                                {record.lateMinutes > 0 ? (
                                  <span className="text-orange-600 font-medium">
                                    {record.lateMinutes} min late
                                  </span>
                                ) : (
                                  <span className="text-green-600">On time</span>
                                )}
                              </TableCell>
                              <TableCell>{record.note || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {/* Pagination Controls */}
                      <DataTablePagination
                        currentPage={getPaginationState(subjectGroup.subject.id).currentPage}
                        totalPages={getTotalPages(subjectGroup.records, subjectGroup.subject.id)}
                        itemsPerPage={getPaginationState(subjectGroup.subject.id).itemsPerPage}
                        totalItems={subjectGroup.records.length}
                        onPageChange={(page) => setPaginationForSubject(subjectGroup.subject.id, { currentPage: page })}
                        onItemsPerPageChange={(itemsPerPage) => setPaginationForSubject(subjectGroup.subject.id, { itemsPerPage, currentPage: 1 })}
                        itemName="records"
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No attendance records for this subject</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}