"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Calendar, Upload, FileText, BarChart3, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
  time?: string;
  note?: string;
}

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [excuseFile, setExcuseFile] = useState<File | null>(null);
  const [excuseNote, setExcuseNote] = useState("");
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all"); // all, week, month

  useEffect(() => {
    // Mock data for attendance records
    const mockData: AttendanceRecord[] = [
      { id: "1", subject: "CS101 - Intro to CS", date: "2025-09-19", status: "PRESENT", time: "09:15" },
      { id: "2", subject: "CS101 - Intro to CS", date: "2025-09-18", status: "ABSENT" },
      { id: "3", subject: "CS101 - Intro to CS", date: "2025-09-17", status: "PRESENT", time: "09:12" },
      { id: "4", subject: "CS101 - Intro to CS", date: "2025-09-16", status: "LATE", time: "09:25" },
      { id: "5", subject: "CS101 - Intro to CS", date: "2025-09-15", status: "EXCUSED", note: "Medical appointment" },
    ];
    
    setTimeout(() => {
      setAttendance(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSubmitExcuse = async () => {
    if (!selectedRecord || !excuseFile) {
      toast.error("Please select a file and provide details");
      return;
    }

    // Mock file upload and excuse submission
    toast.success("Excuse submitted successfully!");
    setIsDialogOpen(false);
    setExcuseFile(null);
    setExcuseNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      case "EXCUSED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Excused</Badge>;
      case "LATE":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Late</Badge>;
      default:
        return <Badge variant="outline">{String(status || "Unknown")}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "EXCUSED":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Filtering logic
  const getFilteredAttendance = () => {
    let filtered = attendance;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(record => record.subject === subjectFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const recordDate = new Date();
      
      filtered = filtered.filter(record => {
        const recordDateObj = new Date(record.date);
        if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return recordDateObj >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return recordDateObj >= monthAgo;
        }
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredAttendance = getFilteredAttendance();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, startIndex + itemsPerPage);

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(attendance.map(record => record.subject)));

  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === "PRESENT").length,
    absent: attendance.filter(a => a.status === "ABSENT").length,
    excused: attendance.filter(a => a.status === "EXCUSED").length,
    late: attendance.filter(a => a.status === "LATE").length,
  };

  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round(((attendanceStats.present + attendanceStats.excused) / attendanceStats.total) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
            <p className="text-muted-foreground">
              View your attendance history and submit excuse documentation
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
              <p className="text-xs text-muted-foreground">
                Classes attended
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
              <p className="text-xs text-muted-foreground">
                Classes missed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excused</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendanceStats.excused}</div>
              <p className="text-xs text-muted-foreground">
                Excused absences
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Your complete attendance record with details and reasons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Enhanced view with reasons */}
                <div className="space-y-3">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-sm font-medium">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                          {record.time && (
                            <div className="text-xs text-muted-foreground">
                              Marked at {record.time}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.subject}
                        </div>
                        {record.note && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Reason: {record.note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {record.status === "ABSENT" && (
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Upload className="mr-1 h-3 w-3" />
                                Add Excuse
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                        {record.status === "EXCUSED" && (
                          <Button variant="ghost" size="sm" disabled>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Excused
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Excuse Upload Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Submit Excuse Documentation</DialogTitle>
              <DialogDescription>
                Upload documentation for your absence on {selectedRecord?.date} in {selectedRecord?.subject}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="excuse-file">Upload Document</Label>
                <Input
                  id="excuse-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setExcuseFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excuse-note">Additional Note</Label>
                <Input
                  id="excuse-note"
                  value={excuseNote}
                  onChange={(e) => setExcuseNote(e.target.value)}
                  placeholder="Brief explanation of absence..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmitExcuse} disabled={!excuseFile}>
                Submit Excuse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
