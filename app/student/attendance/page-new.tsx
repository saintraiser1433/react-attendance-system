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
import { Textarea } from "@/components/ui/textarea";
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
      { id: "2", subject: "MA201 - Calculus I", date: "2025-09-18", status: "ABSENT", note: "Medical appointment" },
      { id: "3", subject: "PH101 - Physics", date: "2025-09-17", status: "LATE", time: "10:25" },
      { id: "4", subject: "CS101 - Intro to CS", date: "2025-09-16", status: "PRESENT", time: "09:05" },
      { id: "5", subject: "ENG101 - English", date: "2025-09-15", status: "EXCUSED", note: "Family emergency" },
      { id: "6", subject: "MA201 - Calculus I", date: "2025-09-14", status: "PRESENT", time: "11:10" },
      { id: "7", subject: "PH101 - Physics", date: "2025-09-13", status: "ABSENT" },
      { id: "8", subject: "CS101 - Intro to CS", date: "2025-09-12", status: "PRESENT", time: "09:00" },
      { id: "9", subject: "ENG101 - English", date: "2025-09-11", status: "LATE", time: "08:35" },
      { id: "10", subject: "MA201 - Calculus I", date: "2025-09-10", status: "PRESENT", time: "11:05" },
      { id: "11", subject: "PH101 - Physics", date: "2025-09-09", status: "ABSENT" },
      { id: "12", subject: "CS101 - Intro to CS", date: "2025-09-08", status: "PRESENT", time: "09:10" },
      { id: "13", subject: "ENG101 - English", date: "2025-09-07", status: "PRESENT", time: "08:30" },
      { id: "14", subject: "MA201 - Calculus I", date: "2025-09-06", status: "LATE", time: "11:20" },
      { id: "15", subject: "PH101 - Physics", date: "2025-09-05", status: "PRESENT", time: "02:15" },
    ];
    
    setTimeout(() => {
      setAttendance(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock excuse submission
    toast.success("Excuse submitted successfully! It will be reviewed by your teacher.");
    
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
            <h1 className="text-3xl font-bold tracking-tight">Attendance Overview</h1>
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

        {/* Attendance History with Filters and Pagination */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Your complete attendance record with details and reasons.
                </CardDescription>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="EXCUSED">Excused</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="cards">Card View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="table" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAttendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {new Date(record.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {record.subject}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(record.status)}
                                {getStatusBadge(record.status)}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {record.time || "—"}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground">
                              {record.note || "—"}
                            </TableCell>
                            <TableCell>
                              {record.status === "ABSENT" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  Add Excuse
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="space-y-4">
                  <div className="space-y-3">
                    {paginatedAttendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
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
                        {record.status === "ABSENT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDialogOpen(true);
                            }}
                          >
                            Add Excuse
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination for card view */}
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {filteredAttendance.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records found for the selected filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter("all");
                    setSubjectFilter("all");
                    setDateFilter("all");
                    setCurrentPage(1);
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Excuse Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Submit Excuse for Absence</DialogTitle>
              <DialogDescription>
                Provide a reason and optional documentation for your absence on{" "}
                {selectedRecord && new Date(selectedRecord.date).toLocaleDateString()} in {selectedRecord?.subject}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitExcuse}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="excuse-note">Reason for Absence</Label>
                  <Textarea
                    id="excuse-note"
                    value={excuseNote}
                    onChange={(e) => setExcuseNote(e.target.value)}
                    placeholder="Please provide a detailed reason for your absence..."
                    required
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="excuse-file">Supporting Document (Optional)</Label>
                  <Input
                    id="excuse-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setExcuseFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload medical certificate, parent note, or other supporting documents
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Excuse
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
