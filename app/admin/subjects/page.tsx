"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, MoreHorizontal, BookOpen, Users, Calendar, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  courseId: string;
  courseName?: string;
  teacherId?: string;
  teacherName?: string;
  enrollmentCount?: number;
  scheduleCount?: number;
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName?: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createFormData, setCreateFormData] = useState({
    code: "",
    name: "",
    description: "",
    credits: 3,
    courseId: "",
  });

  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    description: "",
    credits: 3,
    courseId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [subjectsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/courses')
      ]);

      const [subjectsData, coursesData] = await Promise.all([
        subjectsRes.json(),
        coursesRes.json()
      ]);

      if (subjectsRes.ok) {
        setSubjects(subjectsData.subjects || []);
      }
      
      if (coursesRes.ok) {
        setCourses(coursesData.courses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubjects(prev => [data.subject, ...prev]);
        setIsCreateDialogOpen(false);
        setCreateFormData({
          code: "",
          name: "",
          description: "",
          credits: 3,
          courseId: "",
        });
        toast.success("Subject created successfully!");
      } else {
        toast.error(data.error || 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditFormData({
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
      credits: subject.credits || 3,
      courseId: subject.courseId,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject) return;

    try {
      const response = await fetch(`/api/admin/subjects/${selectedSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? data.subject : s));
        setIsEditDialogOpen(false);
        setSelectedSubject(null);
        toast.success("Subject updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update subject');
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      try {
        const response = await fetch(`/api/admin/subjects/${subject.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setSubjects(prev => prev.filter(s => s.id !== subject.id));
          toast.success("Subject deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete subject');
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        toast.error('Failed to delete subject');
      }
    }
  };

  const getFilteredSubjects = () => {
    let filtered = subjects.filter(subject => {
      const matchesSearch = !searchTerm || 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTeacher = filterTeacher === "all" || 
        (filterTeacher === "assigned" && subject.teacherId) ||
        (filterTeacher === "unassigned" && !subject.teacherId) ||
        subject.teacherId === filterTeacher;

      return matchesSearch && matchesTeacher;
    });

    return filtered;
  };

  const getPaginatedSubjects = () => {
    const filtered = getFilteredSubjects();
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredSubjects().length / pageSize);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
            <p className="text-muted-foreground">
              Create and manage subjects in your academic system
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject and add it to the master list.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="createCode">Subject Code</Label>
                      <Input
                        id="createCode"
                        value={createFormData.code}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="e.g., CS101, MATH201"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="createName">Subject Name</Label>
                      <Input
                        id="createName"
                        value={createFormData.name}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Introduction to Computer Science"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="createDescription">Description</Label>
                      <Textarea
                        id="createDescription"
                        value={createFormData.description}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the subject"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="createCredits">Credits</Label>
                      <Input
                        id="createCredits"
                        type="number"
                        min="1"
                        max="6"
                        value={createFormData.credits}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="createCourseId">Course</Label>
                      <Select value={createFormData.courseId} onValueChange={(value) => setCreateFormData(prev => ({ ...prev, courseId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Subject</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                Across all courses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Subjects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.filter(s => s.teacherId).length}</div>
              <p className="text-xs text-muted-foreground">
                With teachers assigned
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Subjects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.filter(s => !s.teacherId).length}</div>
              <p className="text-xs text-muted-foreground">
                Available for assignment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">
                Academic programs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="teacherFilter">Filter by Teacher</Label>
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="assigned">Assigned Subjects</SelectItem>
                    <SelectItem value="unassigned">Unassigned Subjects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>
              Manage all subjects in your academic system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading subjects...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Schedules</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedSubjects().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0">
                        <EmptyState
                          icon={<BookOpen className="w-12 h-12" />}
                          title="No subjects found"
                          description="Create subjects to organize your academic curriculum. Subjects can be assigned to teachers and scheduled for specific times."
                          action={
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                              Create Subject
                            </Button>
                          }
                          className="py-12"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedSubjects().map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subject.name}</div>
                            <div className="text-xs text-muted-foreground">{subject.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{String(subject.code)}</Badge>
                        </TableCell>
                        <TableCell>
                          {subject.teacherName ? (
                            subject.teacherName
                          ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>{subject.courseName}</TableCell>
                        <TableCell>{subject.credits}</TableCell>
                        <TableCell>{subject.enrollmentCount}</TableCell>
                        <TableCell>{subject.scheduleCount}</TableCell>
                        <TableCell>{new Date(subject.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(subject)}>
                                Edit Subject
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(subject)}
                              >
                                Delete Subject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <DataTablePagination
              currentPage={currentPage}
              totalPages={getTotalPages()}
              itemsPerPage={pageSize}
              totalItems={getFilteredSubjects().length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemName="subjects"
            />
          </CardContent>
        </Card>

        {/* Edit Subject Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>
                Update the subject information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editCode">Subject Code</Label>
                  <Input
                    id="editCode"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., CS101, MATH201"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editName">Subject Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the subject"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCredits">Credits</Label>
                  <Input
                    id="editCredits"
                    type="number"
                    min="1"
                    max="6"
                    value={editFormData.credits}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCourseId">Course</Label>
                  <Select value={editFormData.courseId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, courseId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Subject</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}