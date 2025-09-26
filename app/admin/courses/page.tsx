"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Plus, MoreHorizontal, BookOpen, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  yearLevel: string;
  department: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    yearLevel: "",
    departmentId: ""
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/courses');
      const data = await response.json();
      
      if (response.ok) {
        setCourses(data.courses || []);
      } else {
        toast.error(data.error || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setCourses(prev => [data.course, ...prev]);
        setIsDialogOpen(false);
        setFormData({ code: "", name: "", description: "", yearLevel: "", departmentId: "" });
        toast.success("Course created successfully!");
      } else {
        toast.error(data.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course");
    }
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || "",
      yearLevel: course.yearLevel,
      departmentId: course.department.id
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setCourses(prev => prev.map(course => 
          course.id === selectedCourse.id ? data.course : course
        ));
        setIsEditDialogOpen(false);
        setSelectedCourse(null);
        toast.success("Course updated successfully!");
      } else {
        toast.error(data.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        toast.success("Course deleted successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const getYearLevelBadge = (yearLevel: string) => {
    const colors = {
      "1st Year": "bg-blue-100 text-blue-800",
      "2nd Year": "bg-green-100 text-green-800",
      "3rd Year": "bg-yellow-100 text-yellow-800",
      "4th Year": "bg-purple-100 text-purple-800",
      "5th Year": "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[yearLevel as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {yearLevel}
      </Badge>
    );
  };

  // Filter courses based on search term and filters
  const getFilteredCourses = () => {
    let filtered = courses.filter(course => {
      const searchMatch = !searchTerm || 
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const departmentMatch = !selectedDepartment || course.department.id === selectedDepartment;
      const yearLevelMatch = !selectedYearLevel || course.yearLevel === selectedYearLevel;
      
      return searchMatch && departmentMatch && yearLevelMatch;
    });

    return filtered;
  };

  // Get paginated courses
  const getPaginatedCourses = () => {
    const filtered = getFilteredCourses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    const filtered = getFilteredCourses();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedYearLevel]);

  // Get unique year levels for filter
  const getUniqueYearLevels = () => {
    const yearLevels = courses.map(course => course.yearLevel);
    return [...new Set(yearLevels)].sort();
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

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              Manage academic courses and programs
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Create a new academic course.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., BSIT"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Bachelor of Science in Information Technology"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Course description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="yearLevel">Year Level</Label>
                    <select
                      id="yearLevel"
                      value={formData.yearLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select year level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={formData.departmentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Course</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by course code, name, description, or department..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Filter by Department</Label>
                  <Select value={selectedDepartment || "all"} onValueChange={(v) => {
                    setSelectedDepartment(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Filter by Year Level</Label>
                  <Select value={selectedYearLevel || "all"} onValueChange={(v) => {
                    setSelectedYearLevel(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All year levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All year levels</SelectItem>
                      {getUniqueYearLevels().map((yearLevel) => (
                        <SelectItem key={yearLevel} value={yearLevel}>
                          {yearLevel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                Showing {getFilteredCourses().length} of {courses.length} courses
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              Manage and organize academic courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getFilteredCourses().length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="No courses found"
                description={courses.length === 0 ? "Get started by creating your first course." : "No courses match your search criteria."}
                action={
                  courses.length === 0 ? (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Course
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedDepartment("");
                        setSelectedYearLevel("");
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )
                }
                className="py-12"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year Level</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedCourses().map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.department.name}</TableCell>
                        <TableCell>{getYearLevelBadge(course.yearLevel)}</TableCell>
                        <TableCell>
                          {new Date(course.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(course)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(course.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={getTotalPages()}
                  itemsPerPage={itemsPerPage}
                  totalItems={getFilteredCourses().length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemName="courses"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update course information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-code">Course Code</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., BSIT"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Course Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bachelor of Science in Information Technology"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-yearLevel">Year Level</Label>
                  <select
                    id="edit-yearLevel"
                    value={formData.yearLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <select
                    id="edit-department"
                    value={formData.departmentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

