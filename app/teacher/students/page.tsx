"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { UserAvatar } from "@/components/ui/user-avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, MoreHorizontal, Users, Upload, Download, QrCode, TrendingUp, Calendar, Clock, Filter, FileSpreadsheet, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  department: string;
  departmentId?: string;
  section?: string;
  sectionId?: string;
  yearLevel?: string;
  enrolledSubjects: number;
  attendanceRate: number;
  createdAt: string;
  image?: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [sections, setSections] = useState<{id: string, name: string, code: string, departmentId: string}[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    departmentId: "",
    sectionId: "",
    yearLevel: "1st Year",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    studentId: "",
    departmentId: "",
    sectionId: "",
    yearLevel: "1st Year",
  });

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<'name' | 'section' | 'yearLevel' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterYearLevel, setFilterYearLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterSubjects, setFilterSubjects] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<{
    academicYear: string;
    semester: string;
  } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(10);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize, setStudentsPageSize] = useState(10);
  const [filterByActivePeriod, setFilterByActivePeriod] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchSections();
    fetchActiveAcademicPeriod();
  }, []);

  // Reset students pagination when filters change
  useEffect(() => {
    setStudentsPage(1);
  }, [searchQuery, filterSection, filterYearLevel, filterDepartment, filterSubjects]);

  // Refetch students when filter by active period changes
  useEffect(() => {
    fetchStudents();
  }, [filterByActivePeriod]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const url = `/api/teacher/students${filterByActivePeriod ? '?filterByActivePeriod=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data.students);
        if (data.warning) {
          toast.warning(data.warning);
        }
      } else {
        toast.error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/teacher/departments');
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments);
      } else {
        console.error('Error fetching departments:', data.error);
        toast.error('Failed to load departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/teacher/sections');
      const data = await response.json();
      
      if (response.ok) {
        setSections(data);
      } else {
        console.error('Error fetching sections:', data.error);
        toast.error('Failed to load sections');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    }
  };

  const fetchActiveAcademicPeriod = async () => {
    try {
      const response = await fetch('/api/teacher/settings');
      const data = await response.json();
      
      if (response.ok && data.activeAcademicYearId && data.activeSemesterId) {
        // Fetch academic year and semester details
        const [academicYearResponse, semesterResponse] = await Promise.all([
          fetch(`/api/teacher/academic-years/${data.activeAcademicYearId}`),
          fetch(`/api/teacher/academic-years/${data.activeAcademicYearId}/semesters/${data.activeSemesterId}`)
        ]);
        
        if (academicYearResponse.ok && semesterResponse.ok) {
          const [academicYearData, semesterData] = await Promise.all([
            academicYearResponse.json(),
            semesterResponse.json()
          ]);
          
          setActiveAcademicPeriod({
            academicYear: academicYearData.academicYear?.name || 'Unknown',
            semester: semesterData.semester?.name || 'Unknown'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching active academic period:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStudents(prev => [data.student, ...prev]);
        setIsDialogOpen(false);
        setFormData({ name: "", studentId: "", departmentId: "", sectionId: "", yearLevel: "1st Year" });
        toast.success("Student added successfully!");
      } else {
        toast.error(data.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileDialogOpen(true);
  };

  const handleGenerateQR = async (student: Student) => {
    setSelectedStudent(student);
    setIsGeneratingQR(true);
    setQrCodeUrl('');
    
    try {
      // Simple QR generation - only requires student ID
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: student.studentId
        }),
      });

      if (response.ok) {
        const qrPayload = await response.json();
        
        // Use the QR image from the API if available, otherwise generate locally
        if (qrPayload.qrCodeImage) {
          setQrCodeUrl(qrPayload.qrCodeImage);
        } else {
          // Fallback to local generation
          const qrString = JSON.stringify(qrPayload);
          const qrDataUrl = await QRCode.toDataURL(qrString, {
            width: 300,
            margin: 2,
          });
          setQrCodeUrl(qrDataUrl);
        }
        
        setIsQRDialogOpen(true);
        toast.success("QR Code generated successfully!");
      } else {
        const error = await response.json();
        console.error('QR generation error:', error);
        toast.error(error.error || "Failed to generate QR code");
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error("Failed to generate QR code");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleViewAttendance = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingAttendance(true);
    setIsAttendanceDialogOpen(true);
    
    try {
      const response = await fetch(`/api/teacher/student-attendance?studentId=${student.studentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceRecords(data.records);
        setAttendanceAnalytics(data.analytics);
        setSelectedSubjectFilter('all'); // Reset filter
        setAttendancePage(1); // Reset pagination
        setExpandedSubjects(new Set()); // Reset expanded subjects
      } else {
        toast.error(data.error || 'Failed to fetch attendance records');
        setAttendanceRecords([]);
        setAttendanceAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to fetch attendance records');
      setAttendanceRecords([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl || !selectedStudent) return;
    
    const link = document.createElement("a");
    link.download = `qr-${selectedStudent.studentId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setEditFormData({
      name: student.name,
      studentId: student.studentId,
      departmentId: student.departmentId || "",
      sectionId: student.sectionId || "",
      yearLevel: student.yearLevel || "1st Year",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    try {
      const response = await fetch(`/api/teacher/students/${editStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setStudents(prev => prev.map(student => 
          student.id === editStudent.id ? data.student : student
        ));
        setIsEditDialogOpen(false);
        setEditStudent(null);
        toast.success("Student updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  const handleDelete = async (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        const response = await fetch(`/api/teacher/students/${student.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setStudents(prev => prev.filter(s => s.id !== student.id));
          toast.success("Student deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete student');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleRemoveStudent = (student: Student) => {
    if (confirm(`Are you sure you want to remove ${student.name} from your subjects?`)) {
      setStudents(prev => prev.filter(s => s.id !== student.id));
      toast.success("Student removed successfully!");
    }
  };

  const handleImport = () => {
    toast.success("CSV import functionality coming soon!");
  };

  const handleExport = () => {
    toast.success("Exporting student list...");
  };

  const handleExportAttendance = () => {
    if (!selectedStudent || !attendanceRecords.length) {
      toast.error("No attendance data to export");
      return;
    }

    // Filter records based on selected subject
    const filteredRecords = getFilteredRecords();

    // Create CSV content
    const csvHeaders = ['Date', 'Subject Code', 'Subject Name', 'Time In', 'Time Out', 'Status', 'Late Minutes'];
    const csvRows = filteredRecords.map(record => [
      record.date,
      record.subjectCode,
      record.subjectName,
      record.timeIn || '',
      record.timeOut || '',
      record.status,
      record.lateMinutes || 0
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-${selectedStudent.studentId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Attendance data exported successfully!");
  };

  const toggleSubjectExpansion = (subjectKey: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectKey)) {
      newExpanded.delete(subjectKey);
    } else {
      newExpanded.add(subjectKey);
    }
    setExpandedSubjects(newExpanded);
  };

  // Pagination functions
  const getFilteredRecords = () => {
    return selectedSubjectFilter === 'all' 
      ? attendanceRecords 
      : attendanceRecords.filter(record => 
          `${record.subjectCode} - ${record.subjectName}` === selectedSubjectFilter
        );
  };

  const getPaginatedRecords = () => {
    const filtered = getFilteredRecords();
    const startIndex = (attendancePage - 1) * attendancePageSize;
    const endIndex = startIndex + attendancePageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredRecords().length / attendancePageSize);

  const handlePageChange = (page: number) => {
    setAttendancePage(page);
  };

  const handleStudentsPageChange = (page: number) => {
    setStudentsPage(page);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getYearSuffix = (year: string) => {
    // No suffix needed since yearLevel is already formatted as "1st Year", "2nd Year", etc.
    return "";
  };

  // Get unique sections, year levels, and departments for filtering
  const uniqueSections = sections.map(s => s.name).sort();
  const uniqueYearLevels = [...new Set(students.map(s => s.yearLevel).filter(Boolean))].sort();
  const uniqueDepartments = [...new Set(students.map(s => s.department).filter(Boolean))].sort();


  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = !searchQuery || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = !filterSection || filterSection === "all" || student.sectionId === filterSection;
      const matchesYearLevel = !filterYearLevel || filterYearLevel === "all" || student.yearLevel?.toString() === filterYearLevel;
      const matchesDepartment = !filterDepartment || filterDepartment === "all" || student.department === filterDepartment;
      const matchesSubjects = !filterSubjects || filterSubjects === "all" || 
        (filterSubjects === "with-subjects" && student.enrolledSubjects > 0) ||
        (filterSubjects === "no-subjects" && student.enrolledSubjects === 0);

      return matchesSearch && matchesSection && matchesYearLevel && matchesDepartment && matchesSubjects;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'section':
          aValue = a.section || '';
          bValue = b.section || '';
          break;
        case 'yearLevel':
          aValue = a.yearLevel || 0;
          bValue = b.yearLevel || 0;
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });


  const handleSort = (column: 'name' | 'section' | 'yearLevel' | 'department') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setStudentsPage(1); // Reset to first page when sorting changes
  };

  // Students pagination functions (after filteredAndSortedStudents is defined)
  const getPaginatedStudents = () => {
    const startIndex = (studentsPage - 1) * studentsPageSize;
    const endIndex = startIndex + studentsPageSize;
    return filteredAndSortedStudents.slice(startIndex, endIndex);
  };

  const studentsTotalPages = Math.ceil(filteredAndSortedStudents.length / studentsPageSize);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
            <p className="text-muted-foreground">
              Manage students enrolled in your subjects
            </p>
            {activeAcademicPeriod && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Active Period: {activeAcademicPeriod.academicYear} - {activeAcademicPeriod.semester}
                </Badge>
                <Button
                  variant={filterByActivePeriod ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterByActivePeriod(!filterByActivePeriod)}
                  className="text-xs"
                >
                  {filterByActivePeriod ? "Show All Students" : "Show Only Current Period"}
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Add a student to your subject and create their account. The student will be available for enrollment in your subjects for the current academic period.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter student name"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                        placeholder="Enter student ID"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="departmentId">Department</Label>
                      <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={formData.sectionId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, sectionId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="yearLevel">Year Level</Label>
                      <Select value={formData.yearLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, yearLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          <SelectItem value="5th Year">5th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Student</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Student Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>
                  Update student information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEdit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editStudentId">Student ID</Label>
                    <Input
                      id="editStudentId"
                      value={editFormData.studentId}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, studentId: e.target.value }))}
                      placeholder="Enter student ID"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editDepartmentId">Department</Label>
                    <Select value={editFormData.departmentId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, departmentId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editSection">Section</Label>
                    <Select
                      value={editFormData.sectionId}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, sectionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editYearLevel">Year Level</Label>
                    <Select value={editFormData.yearLevel} onValueChange={(value) => setEditFormData(prev => ({ ...prev, yearLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="5th Year">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Update Student</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAndSortedStudents.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredAndSortedStudents.length !== students.length ? 
                  `Filtered from ${students.length} total` : 'In your subjects'}
                {studentsTotalPages > 1 && ` • Page ${studentsPage} of ${studentsTotalPages}`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.length > 0 ? (students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length).toFixed(1) + "%" : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Performers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => s.attendanceRate >= 90).length}
              </div>
              <p className="text-xs text-muted-foreground">≥90% attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => s.attendanceRate < 75).length}
              </div>
              <p className="text-xs text-muted-foreground">&lt;75% attendance</p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student List</CardTitle>
                <CardDescription>
                  Students enrolled in your subjects grouped by department.
                  {studentsTotalPages > 1 && (
                    <span className="ml-2 text-sm">
                      Showing {getPaginatedStudents().length} of {filteredAndSortedStudents.length} students
                    </span>
                  )}
                </CardDescription>
              </div>
              {studentsTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStudentsPageChange(studentsPage - 1)}
                    disabled={studentsPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {studentsPage} of {studentsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStudentsPageChange(studentsPage + 1)}
                    disabled={studentsPage === studentsTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search students by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterDepartment || "all"} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map(department => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSection || "all"} onValueChange={(value) => setFilterSection(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYearLevel || "all"} onValueChange={(value) => setFilterYearLevel(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYearLevels.map(year => (
                      <SelectItem key={year || "1st Year"} value={year || "1st Year"}>{year || "1st Year"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSubjects || "all"} onValueChange={(value) => setFilterSubjects(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="with-subjects">With Subjects</SelectItem>
                    <SelectItem value="no-subjects">No Subjects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        Student {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('department')}
                      >
                        Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('section')}
                      >
                        Section {sortBy === 'section' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('yearLevel')}
                      >
                        Year {sortBy === 'yearLevel' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            icon={<Users className="w-12 h-12" />}
                            title="No students found"
                            description={searchQuery || filterSection || filterYearLevel || filterDepartment || filterSubjects ? 
                              "No students match your current filters. Try adjusting your search criteria." : 
                              "Add students to your classes to track attendance and manage enrollments."}
                            action={
                              <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Student
                              </Button>
                            }
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedStudents().map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <UserAvatar 
                              name={student.name}
                              image={student.image}
                              role="student"
                              size="sm"
                            />
                            <span>{student.name}</span>
                          </div>
                        </TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(student.studentId || "")}</Badge>
                          </TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{String(student.section || "N/A")}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.yearLevel || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>{student.enrolledSubjects}</TableCell>
                          <TableCell className={getAttendanceColor(student.attendanceRate)}>
                            {student.attendanceRate.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                  Edit Student
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGenerateQR(student)}>
                                  Generate QR
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewAttendance(student)}>
                                  View Attendance
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(student)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Students Pagination Controls */}
            <DataTablePagination
              currentPage={studentsPage}
              totalPages={studentsTotalPages}
              itemsPerPage={studentsPageSize}
              totalItems={filteredAndSortedStudents.length}
              onPageChange={handleStudentsPageChange}
              onItemsPerPageChange={(newSize) => {
                setStudentsPageSize(newSize);
                setStudentsPage(1);
              }}
              itemName="students"
            />
          </CardContent>
        </Card>

        {/* Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Student Profile - {selectedStudent?.name}</DialogTitle>
              <DialogDescription>
                Detailed information about the student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedStudent && (
                <div className="grid gap-4">
                  <div className="flex items-center space-x-4">
                    <UserAvatar 
                      name={selectedStudent.name}
                      image={selectedStudent.image}
                      role="student"
                      size="lg"
                    />
                    <div>
                      <h3 className="font-medium">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStudent.studentId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Department</Label>
                      <p className="text-sm">{selectedStudent.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Enrolled Subjects</Label>
                      <p className="text-sm">{selectedStudent.enrolledSubjects}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Attendance Rate</Label>
                      <p className="text-sm">{selectedStudent.attendanceRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Attendance Dialog */}
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance Analytics - {selectedStudent?.name}
              </DialogTitle>
              <DialogDescription>
                Comprehensive attendance records and analytics for this student.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 overflow-y-auto max-h-[70vh]">
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found for this student.</p>
                </div>
              ) : (
                <>
                  {/* Analytics Cards */}
                  {attendanceAnalytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.attendanceRate}%</div>
                          <p className="text-xs text-muted-foreground">
                            {attendanceAnalytics.presentRecords} of {attendanceAnalytics.totalRecords} classes
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.totalRecords}</div>
                          <p className="text-xs text-muted-foreground">Classes attended</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.uniqueSubjects.length}</div>
                          <p className="text-xs text-muted-foreground">Different subjects</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Subject Performance */}
                  {attendanceAnalytics && attendanceAnalytics.subjectGroups.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Subject Performance</CardTitle>
                        <CardDescription>Attendance rate by subject with detailed records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {attendanceAnalytics.subjectGroups.map((subject: any) => {
                            const subjectKey = `${subject.subjectCode} - ${subject.subjectName}`;
                            const isExpanded = expandedSubjects.has(subjectKey);
                            
                            return (
                              <div key={subject.subjectCode} className="border rounded-lg">
                                <div 
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => toggleSubjectExpansion(subjectKey)}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{subject.subjectCode} - {subject.subjectName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {subject.presentRecords} of {subject.totalRecords} classes attended
                                      {subject.lateRecords > 0 && (
                                        <span className="ml-2 text-orange-600">
                                          • {subject.lateRecords} late arrivals (avg: {subject.averageLateMinutes} min)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <div className="font-bold">{subject.attendanceRate}%</div>
                                    </div>
                                    <div className={`w-16 h-2 rounded-full ${
                                      subject.attendanceRate >= 90 ? 'bg-green-500' :
                                      subject.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}>
                                      <div 
                                        className="h-full bg-gray-200 rounded-full"
                                        style={{ width: `${100 - subject.attendanceRate}%`, marginLeft: 'auto' }}
                                      />
                                    </div>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div className="border-t bg-muted/20 p-3">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Individual Attendance Records ({subject.records.length} total):
                                      </div>
                                      <div className="max-h-64 overflow-y-auto space-y-2">
                                        {subject.records.slice(0, 20).map((record: any) => (
                                          <div key={record.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">
                                                {record.date} - {record.timeIn}
                                                {record.timeOut && ` to ${record.timeOut}`}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                Status: {record.status}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {record.lateMinutes > 0 && (
                                                <div className="flex items-center gap-1 text-orange-600 text-sm">
                                                  <AlertTriangle className="h-3 w-3" />
                                                  {record.lateMinutes} min late
                                                </div>
                                              )}
                                              <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                                                {record.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                        {subject.records.length > 20 && (
                                          <div className="text-center py-2 text-sm text-muted-foreground">
                                            Showing first 20 of {subject.records.length} records. Use the main table below for full pagination.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Filter and Export Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filter by Subject:</span>
                      </div>
                      <Select 
                        value={selectedSubjectFilter} 
                        onValueChange={(value) => {
                          setSelectedSubjectFilter(value);
                          setAttendancePage(1); // Reset to first page when filter changes
                        }}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {attendanceAnalytics?.uniqueSubjects.map((subject: any) => (
                            <SelectItem key={subject.fullName} value={subject.fullName}>
                              {subject.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={handleExportAttendance} variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Attendance Records Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Attendance Records</CardTitle>
                          <CardDescription>
                            {selectedSubjectFilter === 'all' 
                              ? `Showing ${getPaginatedRecords().length} of ${getFilteredRecords().length} records` 
                              : `Showing ${getPaginatedRecords().length} of ${getFilteredRecords().length} records for ${selectedSubjectFilter}`
                            }
                          </CardDescription>
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(attendancePage - 1)}
                              disabled={attendancePage === 1}
                            >
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (attendancePage <= 3) {
                                  pageNum = i + 1;
                                } else if (attendancePage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = attendancePage - 2 + i;
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={attendancePage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(attendancePage + 1)}
                              disabled={attendancePage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getPaginatedRecords().map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="font-medium">{record.subjectCode} - {record.subjectName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {record.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {record.timeIn}
                                  {record.timeOut && ` - ${record.timeOut}`}
                                </span>
                                {record.lateMinutes > 0 && (
                                  <span className="flex items-center gap-1 text-orange-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    {record.lateMinutes} min late
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </div>
                        ))}
                        
                        {getPaginatedRecords().length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No attendance records found for the selected filter.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Attendance Records Pagination Controls */}
                      <DataTablePagination
                        currentPage={attendancePage}
                        totalPages={totalPages}
                        itemsPerPage={attendancePageSize}
                        totalItems={getFilteredRecords().length}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={(newSize) => {
                          setAttendancePageSize(newSize);
                          setAttendancePage(1);
                        }}
                        itemName="records"
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code - {selectedStudent?.name}
              </DialogTitle>
              <DialogDescription>
                QR code for student attendance scanning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isGeneratingQR ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Generating QR code...</p>
                  </div>
                </div>
              ) : qrCodeUrl ? (
                <div className="text-center space-y-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="Student QR Code" 
                    className="mx-auto border rounded-lg"
                  />
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Student ID:</strong> {selectedStudent?.studentId}</p>
                    <p><strong>Student Name:</strong> {selectedStudent?.name}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-gray-500">QR code will appear here</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQRDialogOpen(false)}>
                Close
              </Button>
              {qrCodeUrl && (
                <Button onClick={downloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
