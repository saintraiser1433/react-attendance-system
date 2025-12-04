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
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, MoreHorizontal, Users, Upload, Download, QrCode, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchSections();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data.students);
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
      const response = await fetch('/api/admin/departments');
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
      const response = await fetch('/api/admin/sections');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/students', {
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
      const response = await fetch(`/api/admin/students/${editStudent.id}`, {
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
        const response = await fetch(`/api/admin/students/${student.id}`, {
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

  const downloadQR = () => {
    if (!qrCodeUrl || !selectedStudent) return;
    
    const link = document.createElement("a");
    link.download = `qr-${selectedStudent.studentId}.png`;
    link.href = qrCodeUrl;
    link.click();
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
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
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

  const getPaginatedStudents = () => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedStudents.slice(startIndex, startIndex + pageSize);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredAndSortedStudents.length / pageSize);
  };

  const handleSort = (column: 'name' | 'section' | 'yearLevel' | 'department') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground">
              Manage all students in the system
            </p>
          </div>
          <div className="flex gap-2">
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
                    Add a new student to the system.
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
                  `Filtered from ${students.length} total` : 'In the system'}
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

        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="grid gap-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="departmentFilter">Department</Label>
                <Select value={filterDepartment || "all"} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map(department => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sectionFilter">Section</Label>
                <Select value={filterSection || "all"} onValueChange={(value) => setFilterSection(value === "all" ? "" : value)}>
                  <SelectTrigger>
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearFilter">Year Level</Label>
                <Select value={filterYearLevel || "all"} onValueChange={(value) => setFilterYearLevel(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYearLevels.map(year => (
                      <SelectItem key={year || "1st Year"} value={year || "1st Year"}>{year || "1st Year"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subjectsFilter">Subjects</Label>
                <Select value={filterSubjects || "all"} onValueChange={(value) => setFilterSubjects(value === "all" ? "" : value)}>
                  <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              All students in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableHead>Email</TableHead>
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
                    {getPaginatedStudents().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            icon={<Users className="w-12 h-12" />}
                            title="No students found"
                            description={searchQuery || filterSection || filterYearLevel || filterDepartment || filterSubjects ? 
                              "No students match your current filters. Try adjusting your search criteria." : 
                              "Add students to the system to manage enrollments and track attendance."}
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
                          <TableCell>{student.email}</TableCell>
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

            {/* Pagination */}
            <DataTablePagination
              currentPage={currentPage}
              totalPages={getTotalPages()}
              itemsPerPage={pageSize}
              totalItems={filteredAndSortedStudents.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
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
                    <p><strong>Department:</strong> {selectedStudent?.department}</p>
                    <p><strong>Section:</strong> {selectedStudent?.section}</p>
                    <p><strong>Year Level:</strong> {selectedStudent?.yearLevel}</p>
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









