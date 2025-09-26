"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, MoreHorizontal, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
  teacherCount: number;
  studentCount: number;
  createdAt: string;
  teachers?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  }[];
  students?: {
    id: string;
    name: string;
    email: string;
    studentId: string;
  }[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTeachersDialogOpen, setIsTeachersDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Pagination helper functions
  const getPaginatedDepartments = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return departments.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(departments.length / itemsPerPage);
  };

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments);
      } else {
        toast.error(data.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setDepartments(prev => [data.department, ...prev]);
        setIsDialogOpen(false);
        setFormData({ name: "", code: "" });
        toast.success("Department created successfully!");
      } else {
        toast.error(data.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setEditFormData({
      name: department.name,
      code: department.code,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      const response = await fetch(`/api/admin/departments/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setDepartments(prev => prev.map(dept =>
          dept.id === selectedDepartment.id ? data.department : dept
        ));
        setIsEditDialogOpen(false);
        setSelectedDepartment(null);
        toast.success("Department updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    }
  };

  const handleDelete = async (department: Department) => {
    if (confirm(`Are you sure you want to delete ${department.name}?`)) {
      try {
        const response = await fetch(`/api/admin/departments/${department.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setDepartments(prev => prev.filter(d => d.id !== department.id));
          toast.success("Department deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete department');
        }
      } catch (error) {
        console.error('Error deleting department:', error);
        toast.error('Failed to delete department');
      }
    }
  };

  const handleViewTeachers = async (department: Department) => {
    setSelectedDepartment(department);
    setIsTeachersDialogOpen(true);
    
    // Fetch detailed department data with teachers
    try {
      const response = await fetch(`/api/admin/departments/${department.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedDepartment(data.department);
      }
    } catch (error) {
      console.error('Error fetching department details:', error);
    }
  };

  const handleViewStudents = async (department: Department) => {
    setSelectedDepartment(department);
    setIsStudentsDialogOpen(true);
    
    // Fetch detailed department data with students
    try {
      const response = await fetch(`/api/admin/departments/${department.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedDepartment(data.department);
      }
    } catch (error) {
      console.error('Error fetching department details:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
            <p className="text-muted-foreground">
              Organize and manage academic departments
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new academic department with a unique code.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., College of Information Technology"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Department Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., CCIT"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Department</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-xs text-muted-foreground">
                Active departments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.reduce((sum, dept) => sum + dept.teacherCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all departments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.reduce((sum, dept) => sum + dept.studentCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Enrolled students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>
              Manage academic departments and their details.
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
                      <TableHead>Department</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            icon={<GraduationCap className="w-12 h-12" />}
                            title="No departments found"
                            description="Create departments to organize your academic structure. Departments can contain teachers, students, and courses."
                            action={
                              <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Department
                              </Button>
                            }
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedDepartments().map((department) => (
                        <TableRow key={department.id}>
                          <TableCell className="font-medium">{department.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(department.code || "")}</Badge>
                          </TableCell>
                          <TableCell>{department.teacherCount}</TableCell>
                          <TableCell>{department.studentCount}</TableCell>
                          <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(department)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewTeachers(department)}>
                                  View Teachers
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewStudents(department)}>
                                  View Students
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(department)}
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
                
                {/* Pagination Controls */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={getTotalPages()}
                  itemsPerPage={itemsPerPage}
                  totalItems={departments.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    setCurrentPage(1);
                  }}
                  itemName="departments"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Department Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update department information and code.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Department Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., College of Information Technology"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCode">Department Code</Label>
                  <Input
                    id="editCode"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., CCIT"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Teachers Dialog */}
        <Dialog open={isTeachersDialogOpen} onOpenChange={setIsTeachersDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Teachers - {selectedDepartment?.name}</DialogTitle>
              <DialogDescription>
                Teachers assigned to this department.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDepartment && (
                <div className="space-y-2">
                  {selectedDepartment.teachers && selectedDepartment.teachers.length > 0 ? (
                    selectedDepartment.teachers.map(teacher => (
                      <div key={teacher.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-muted-foreground">Employee ID: {teacher.employeeId}</div>
                            <div className="text-xs text-muted-foreground">{teacher.email}</div>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No teachers assigned to this department.
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTeachersDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Students Dialog */}
        <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Students - {selectedDepartment?.name}</DialogTitle>
              <DialogDescription>
                Students enrolled in this department.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDepartment && (
                <div className="space-y-2">
                  {selectedDepartment.students && selectedDepartment.students.length > 0 ? (
                    selectedDepartment.students.map(student => (
                      <div key={student.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">Student ID: {student.studentId}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No students enrolled in this department.
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
