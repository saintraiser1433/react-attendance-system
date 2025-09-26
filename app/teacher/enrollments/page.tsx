"use client";

import { useState, useEffect } from "react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Plus, MoreHorizontal, Users, BookOpen, GraduationCap, Filter } from "lucide-react";
import { toast } from "sonner";

interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentIdNumber: string;
  department: string;
  section: string;
  yearLevel: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  academicYearId: string;
  academicYearName: string;
  semesterId: string;
  semesterName: string;
  attendanceCount: number;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  department: string;
  section: string;
  yearLevel: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
}

export default function TeacherEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<{
    academicYear: string;
    semester: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    subject: "",
    department: "",
    year: "",
    section: "",
    yearLevel: ""
  });
  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isBulkEnrollMode, setIsBulkEnrollMode] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
    fetchActiveAcademicPeriod();
  }, []);

  // Auto-refresh every 30 seconds to check for active academic period changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchActiveAcademicPeriod();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchEnrollments(),
        fetchStudents(),
        fetchSubjects(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/teacher/enrollments');
      const data = await response.json();
      
      if (response.ok) {
        setEnrollments(data.enrollments);
      } else {
        toast.error(data.error || 'Failed to fetch enrollments');
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/enrollment-students');
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/teacher/subjects');
      const data = await response.json();
      
      if (response.ok) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
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
    
    if (!formData.studentId || !formData.subjectId) {
      toast.error("Please select a student and subject");
      return;
    }
    
    try {
      const response = await fetch('/api/teacher/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setEnrollments(prev => [data.enrollment, ...prev]);
        setIsDialogOpen(false);
        setFormData({
          studentId: "",
          subjectId: "",
        });
        setSelectedSubject("");
        toast.success("Student enrolled successfully!");
      } else {
        toast.error(data.error || 'Failed to enroll student');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Failed to enroll student');
    }
  };

  const handleBulkEnroll = async (studentId: string, subjectIds: string[]) => {
    try {
      const promises = subjectIds.map(subjectId => 
        fetch('/api/teacher/enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            subjectId,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successful = results.filter(r => r.enrollment);
      const failed = results.filter(r => r.error);

      if (successful.length > 0) {
        setEnrollments(prev => [...successful.map(r => r.enrollment), ...prev]);
        toast.success(`${successful.length} enrollments created successfully!`);
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} enrollments failed: ${failed.map(f => f.error).join(', ')}`);
      }
    } catch (error) {
      console.error('Error bulk enrolling student:', error);
      toast.error('Failed to bulk enroll student');
    }
  };

  const handleDelete = async (enrollment: Enrollment) => {
    if (confirm(`Are you sure you want to remove ${enrollment.studentName} from ${enrollment.subjectCode}?`)) {
      try {
        const response = await fetch(`/api/teacher/enrollments/${enrollment.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
          toast.success("Enrollment removed successfully!");
        } else {
          toast.error(data.error || 'Failed to remove enrollment');
        }
      } catch (error) {
        console.error('Error removing enrollment:', error);
        toast.error('Failed to remove enrollment');
      }
    }
  };

  const getFilteredEnrollments = () => {
    let filtered = enrollments;
    
    if (filters.subject) {
      filtered = filtered.filter(e => e.subjectId === filters.subject);
    }
    
    if (filters.department) {
      filtered = filtered.filter(e => e.department.toLowerCase().includes(filters.department.toLowerCase()));
    }
    
    if (filters.year) {
      filtered = filtered.filter(e => e.academicYearName === filters.year);
    }
    
    if (filters.section) {
      filtered = filtered.filter(e => e.section === filters.section);
    }
    
    if (filters.yearLevel) {
      filtered = filtered.filter(e => e.yearLevel.toString() === filters.yearLevel);
    }

    return filtered;
  };

  // Get paginated enrollments
  const getPaginatedEnrollments = () => {
    const filtered = getFilteredEnrollments();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    const filtered = getFilteredEnrollments();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.subject, filters.department, filters.year, filters.section, filters.yearLevel]);

  const getUniqueSubjects = () => {
    const subjectMap = new Map();
    subjects.forEach(subject => {
      subjectMap.set(subject.id, subject);
    });
    return Array.from(subjectMap.values());
  };

  const getUniqueDepartments = () => {
    const departments = new Set<string>();
    enrollments.forEach(enrollment => {
      departments.add(enrollment.department);
    });
    return Array.from(departments).sort();
  };

  const getUniqueYears = () => {
    const years = new Set<string>();
    enrollments.forEach(enrollment => {
      years.add(enrollment.academicYearName);
    });
    return Array.from(years).sort();
  };

  const getUniqueSections = () => {
    const sections = new Set<string>();
    enrollments.forEach(enrollment => {
      sections.add(enrollment.section);
    });
    return Array.from(sections).sort();
  };

  const getUniqueYearLevels = () => {
    const yearLevels = new Set<string>();
    enrollments.forEach(enrollment => {
      yearLevels.add(enrollment.yearLevel);
    });
    return Array.from(yearLevels).sort();
  };

  // Check if student is already enrolled in a subject
  const isStudentEnrolled = (studentId: string, subjectId: string) => {
    return enrollments.some(enrollment => 
      enrollment.studentId === studentId && enrollment.subjectId === subjectId
    );
  };

  // Group students by academic criteria
  const getGroupedStudents = () => {
    const grouped: { [key: string]: Student[] } = {};
    
    students.forEach(student => {
      const key = `${student.department}-${student.yearLevel}-${student.section}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(student);
    });
    
    return grouped;
  };

  // Get enrollment status for a student
  const getStudentEnrollmentStatus = (studentId: string) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    return {
      totalEnrollments: studentEnrollments.length,
      enrolledSubjects: studentEnrollments.map(e => e.subjectCode).join(', '),
      isEnrolled: studentEnrollments.length > 0
    };
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Enrollments</h1>
            <p className="text-muted-foreground">
              Manage student enrollments in your subjects
            </p>
            {activeAcademicPeriod && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Active Period: {activeAcademicPeriod.academicYear} - {activeAcademicPeriod.semester}
                </Badge>
              </div>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Enroll Student in Subject(s)</DialogTitle>
                <DialogDescription>
                  Add a student to one or more of your subjects for the current academic period.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="studentId">Student</Label>
                    <Select value={formData.studentId} onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => {
                          const status = getStudentEnrollmentStatus(student.id);
                          return (
                            <SelectItem key={student.id} value={student.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{student.name} ({student.studentId})</span>
                                <span className="text-xs text-muted-foreground">
                                  {student.email} - {student.department} - {student.yearLevel} - Section {student.section}
                                  {status.isEnrolled ? ` • Already enrolled in: ${status.enrolledSubjects}` : ' • Not enrolled'}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enrollmentMode">Enrollment Mode</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsBulkEnrollMode(!isBulkEnrollMode);
                          setSelectedSubjects([]);
                          setFormData(prev => ({ ...prev, subjectId: "" }));
                        }}
                      >
                        {isBulkEnrollMode ? "Single Subject" : "Multiple Subjects"}
                      </Button>
                    </div>
                    
                    {isBulkEnrollMode ? (
                      <div className="space-y-2">
                        <Label>Select Multiple Subjects</Label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                          {subjects.map(subject => {
                            const isAlreadyEnrolled = formData.studentId ? isStudentEnrolled(formData.studentId, subject.id) : false;
                            return (
                              <div key={subject.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`subject-${subject.id}`}
                                  checked={selectedSubjects.includes(subject.id)}
                                  disabled={isAlreadyEnrolled}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSubjects(prev => [...prev, subject.id]);
                                    } else {
                                      setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={`subject-${subject.id}`} className="text-sm flex-1">
                                  <span className="font-medium">{subject.code}</span> - {subject.name}
                                  <span className="text-muted-foreground ml-2">({subject.credits} credits)</span>
                                  {isAlreadyEnrolled && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Already Enrolled
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        {selectedSubjects.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedSubjects.length} subject(s) selected
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="subjectId">Subject</Label>
                        <Select value={formData.subjectId} onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{subject.code} - {subject.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {subject.description} ({subject.credits} credits)
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  {isBulkEnrollMode ? (
                    <Button 
                      type="button"
                      onClick={() => {
                        if (!formData.studentId) {
                          toast.error("Please select a student");
                          return;
                        }
                        if (selectedSubjects.length === 0) {
                          toast.error("Please select at least one subject");
                          return;
                        }
                        handleBulkEnroll(formData.studentId, selectedSubjects);
                        setIsDialogOpen(false);
                        setFormData({ studentId: "", subjectId: "" });
                        setSelectedSubjects([]);
                      }}
                    >
                      Enroll in {selectedSubjects.length} Subject(s)
                    </Button>
                  ) : (
                    <Button type="submit">Enroll Student</Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Available subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                Available students
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUniqueDepartments().length}</div>
              <p className="text-xs text-muted-foreground">
                Different departments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter enrollments by subject, department, academic year, section, and year level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={filters.subject || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {getUniqueSubjects().map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.code} - {subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select value={filters.department || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {getUniqueDepartments().map(department => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Academic Year</Label>
                <Select value={filters.year || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {getUniqueYears().map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <Select value={filters.section || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, section: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sections</SelectItem>
                    {getUniqueSections().map(section => (
                      <SelectItem key={section} value={section}>Section {section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Year Level</Label>
                <Select value={filters.yearLevel || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, yearLevel: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All year levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All year levels</SelectItem>
                    {getUniqueYearLevels().map(yearLevel => (
                      <SelectItem key={yearLevel} value={yearLevel.toString()}>{yearLevel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Groups by Academic Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students by Academic Group
            </CardTitle>
            <CardDescription>
              Students grouped by Department, Year Level, and Section for easy enrollment management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(getGroupedStudents()).map(([groupKey, groupStudents]) => {
                const [department, yearLevel, section] = groupKey.split('-');
                return (
                  <div key={groupKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{department}</Badge>
                        <Badge variant="secondary">{yearLevel}</Badge>
                        <Badge variant="outline">Section {section}</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({groupStudents.length} students)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(true);
                          // Pre-filter students to this group
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Enroll Group
                      </Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {groupStudents.map(student => {
                        const status = getStudentEnrollmentStatus(student.id);
                        return (
                          <div key={student.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{student.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {student.studentId} • {student.email}
                              </div>
                              {status.isEnrolled && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Enrolled in: {status.enrolledSubjects}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {status.isEnrolled ? (
                                <Badge variant="default" className="text-xs">
                                  {status.totalEnrollments} enrolled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Not enrolled
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollments</CardTitle>
            <CardDescription>
              Students enrolled in your subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Year Level</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredEnrollments().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="p-0">
                        <EmptyState
                          icon={<GraduationCap className="w-12 h-12" />}
                          title="No enrollments found"
                          description={Object.values(filters).some(f => f) ? 
                            "No enrollments match your current filters. Try adjusting the filter criteria." : 
                            "No student enrollments found. Students need to enroll in your subjects to appear here."}
                          action={
                            <Button onClick={() => setIsDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Enrollment
                            </Button>
                          }
                          className="py-12"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedEnrollments().map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.studentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {enrollment.studentIdNumber} • {enrollment.studentEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.subjectCode}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.subjectName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Section {enrollment.section}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.yearLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{enrollment.academicYearName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.semesterName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">
                              {enrollment.attendanceCount} sessions
                            </Badge>
                            <Badge 
                              variant={enrollment.attendanceCount > 0 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {enrollment.attendanceCount > 0 ? "Active" : "No attendance"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{enrollment.createdAt}</span>
                            <Badge variant="outline" className="text-xs w-fit">
                              Enrolled
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(enrollment)}
                              >
                                Remove Enrollment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={getTotalPages()}
                  itemsPerPage={itemsPerPage}
                  totalItems={getFilteredEnrollments().length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemName="enrollments"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}










