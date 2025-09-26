"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen, Users, GraduationCap, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  course: {
    id: string;
    name: string;
    code: string;
    department: string;
  };
  enrollmentCount: number;
  scheduleCount: number;
  years: string[];
  sections: string[];
  createdAt: string;
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<{
    academicYear: string;
    semester: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    year: "",
    section: "",
    course: ""
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
    fetchActiveAcademicPeriod();
  }, []);

  const fetchActiveAcademicPeriod = async () => {
    try {
      const response = await fetch('/api/teacher/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.activeAcademicYearId && data.activeSemesterId) {
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
      }
    } catch (error) {
      console.error('Error fetching active academic period:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await fetchSubjects();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/teacher/subjects');
      const data = await response.json();
      
      if (response.ok) {
        setSubjects(data.subjects);
      } else {
        toast.error(data.error || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    }
  };


  const getFilteredSubjects = () => {
    let filtered = subjects;
    
    if (filters.year) {
      filtered = filtered.filter(subject => 
        subject.years.includes(filters.year)
      );
    }
    
    if (filters.section) {
      filtered = filtered.filter(subject => 
        subject.sections.includes(filters.section)
      );
    }
    
    if (filters.course) {
      filtered = filtered.filter(subject => 
        subject.course.code === filters.course || 
        subject.course.name.toLowerCase().includes(filters.course.toLowerCase())
      );
    }

    return filtered;
  };

  // Pagination helper functions
  const getPaginatedSubjects = () => {
    const filtered = getFilteredSubjects();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredSubjects();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getUniqueYears = () => {
    const years = new Set<string>();
    subjects.forEach(subject => {
      subject.years.forEach(year => years.add(year));
    });
    return Array.from(years).sort();
  };

  const getUniqueSections = () => {
    const sections = new Set<string>();
    subjects.forEach(subject => {
      subject.sections.forEach(section => sections.add(section));
    });
    return Array.from(sections).sort();
  };

  const getUniqueCourses = () => {
    const courses = new Set<string>();
    subjects.forEach(subject => {
      courses.add(subject.course.code);
    });
    return Array.from(courses).sort();
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
            <p className="text-muted-foreground">
              View your assigned subjects and their details
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Assigned subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subjects.reduce((sum, subject) => sum + subject.enrollmentCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedules</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subjects.reduce((sum, subject) => sum + subject.scheduleCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total scheduled classes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subjects.reduce((sum, subject) => sum + subject.credits, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Credit hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Academic Period */}
        {activeAcademicPeriod && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  Active Period: {activeAcademicPeriod.academicYear} - {activeAcademicPeriod.semester}
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Showing subjects with schedules or enrollments for this period
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter subjects by year, section, and course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
                <Label>Course</Label>
                <Select value={filters.course || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, course: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {getUniqueCourses().map(course => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Subjects</CardTitle>
            <CardDescription>
              View your assigned subjects and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : getFilteredSubjects().length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="No subjects found"
                description="You don't have any subjects assigned yet. Contact your administrator to get subjects assigned to you."
                className="py-12"
              />
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Schedules</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedSubjects().map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-xs text-muted-foreground">{subject.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subject.course.code}</div>
                          <div className="text-xs text-muted-foreground">{subject.course.department}</div>
                        </div>
                      </TableCell>
                      <TableCell>{subject.credits}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.enrollmentCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.scheduleCount}</Badge>
                      </TableCell>
                      <TableCell>{subject.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              <DataTablePagination
                currentPage={currentPage}
                totalPages={getTotalPages()}
                itemsPerPage={itemsPerPage}
                totalItems={getFilteredSubjects().length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
                itemName="subjects"
              />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}








