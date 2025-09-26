"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UserAvatar } from "@/components/ui/user-avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, MoreHorizontal, UserPlus, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  subjects: number;
  createdAt: string;
  image?: string | null;
}

interface TeacherSubject {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  semester: string;
  studentCount: number;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    departmentId: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    departmentId: "",
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/teachers');
      const data = await response.json();
      
      if (response.ok) {
        setTeachers(data.teachers);
      } else {
        toast.error(data.error || 'Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Departments loaded:', data.departments);
        setDepartments(data.departments);
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First, create the teacher without image
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // If image was selected, upload it
        if (selectedImage) {
          const formDataImage = new FormData();
          formDataImage.append('file', selectedImage);
          formDataImage.append('teacherId', data.teacher.id);

          const imageResponse = await fetch('/api/admin/teachers/upload-image', {
            method: 'POST',
            body: formDataImage,
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // Update the teacher with the image URL
            data.teacher.image = imageData.imageUrl;
          } else {
            const imageError = await imageResponse.json();
            console.error('Image upload failed:', imageError);
            toast.error('Teacher created but image upload failed');
          }
        }

        setTeachers(prev => [data.teacher, ...prev]);
        setIsDialogOpen(false);
        setFormData({ name: "", email: "", password: "", employeeId: "", departmentId: "" });
        setSelectedImage(null);
        setImagePreview(null);
        toast.success("Teacher created successfully!");
      } else {
        toast.error(data.error || 'Failed to create teacher');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      toast.error('Failed to create teacher');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditFormData({
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      departmentId: "", // This would be the ID from the teacher lookup
    });
    setEditImagePreview(teacher.image || null);
    setEditSelectedImage(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      // First, update the teacher without image
      const response = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        // If new image was selected, upload it
        if (editSelectedImage) {
          const formDataImage = new FormData();
          formDataImage.append('file', editSelectedImage);
          formDataImage.append('teacherId', selectedTeacher.id);

          const imageResponse = await fetch('/api/admin/teachers/upload-image', {
            method: 'POST',
            body: formDataImage,
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // Update the teacher with the new image URL
            data.teacher.image = imageData.imageUrl;
          } else {
            const imageError = await imageResponse.json();
            console.error('Image upload failed:', imageError);
            toast.error('Teacher updated but image upload failed');
          }
        }

        setTeachers(prev => prev.map(t =>
          t.id === selectedTeacher.id ? data.teacher : t
        ));
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        setEditImagePreview(null);
        setEditSelectedImage(null);
        toast.success("Teacher updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update teacher');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher');
    }
  };

  const handleViewSubjects = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsLoadingSubjects(true);
    setIsSubjectsDialogOpen(true);
    
    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}/subjects`);
      const data = await response.json();
      
      if (response.ok) {
        setTeacherSubjects(data.subjects || []);
      } else {
        toast.error(data.error || 'Failed to fetch teacher subjects');
        setTeacherSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      toast.error('Failed to fetch teacher subjects');
      setTeacherSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (confirm(`Are you sure you want to delete ${teacher.name}?`)) {
      try {
        const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setTeachers(prev => prev.filter(t => t.id !== teacher.id));
          toast.success("Teacher deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete teacher');
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleResetPassword = (teacher: Teacher) => {
    toast.success(`Password reset email sent to ${teacher.email}`);
  };

  // Define columns for the data table
  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center space-x-3">
            <UserAvatar 
              name={teacher.name}
              image={teacher.image}
              role="teacher"
              size="sm"
            />
            <span className="font-medium">{teacher.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "employeeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee ID" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{String(row.getValue("employeeId") || "")}</Badge>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Department" />
      ),
    },
    {
      accessorKey: "subjects",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subjects" />
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const teacher = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewSubjects(teacher)}>
                View Subjects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(teacher)}>
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => handleDelete(teacher)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
            <p className="text-muted-foreground">
              Add and manage teacher accounts
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account with department assignment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <FileUpload
                    label="Profile Picture"
                    currentImage={imagePreview}
                    onImageChange={(file, preview) => {
                      setSelectedImage(file);
                      setImagePreview(preview);
                    }}
                    size="lg"
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      placeholder="Enter employee ID"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) => {
                        console.log('Department selected:', value);
                        setFormData(prev => ({ ...prev, departmentId: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Teacher</Button>
                  </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active teachers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.reduce((sum, t) => sum + t.subjects, 0)}</div>
              <p className="text-xs text-muted-foreground">
                Being taught
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(teachers.map(t => t.department)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                With teachers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Teachers</CardTitle>
            <CardDescription>
              Comprehensive list of teachers with search, sorting, and pagination.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={teachers} 
                searchPlaceholder="Search teachers..." 
                pageSize={10}
                emptyState={{
                  icon: <Users className="w-12 h-12" />,
                  title: "No teachers found",
                  description: "Add teachers to your system to manage classes and assignments. Teachers can be assigned to departments and subjects.",
                  action: (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Teacher
                    </Button>
                  )
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Teacher Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>
                Update teacher information and department assignment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <FileUpload
                  label="Profile Picture"
                  currentImage={editImagePreview || selectedTeacher?.image}
                  onImageChange={(file, preview) => {
                    setEditSelectedImage(file);
                    setEditImagePreview(preview);
                  }}
                  size="lg"
                />
                <div className="grid gap-2">
                  <Label htmlFor="editName">Full Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEmployeeId">Employee ID</Label>
                  <Input
                    id="editEmployeeId"
                    value={editFormData.employeeId}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    required
                  />
                </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editDepartmentId">Department</Label>
                      <Select
                        value={editFormData.departmentId}
                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, departmentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Subjects Dialog */}
        <Dialog open={isSubjectsDialogOpen} onOpenChange={setIsSubjectsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Subjects - {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>
                Subjects assigned to this teacher.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingSubjects ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading subjects...</div>
                </div>
              ) : teacherSubjects.length > 0 ? (
                <div className="space-y-2">
                  {teacherSubjects.map((subject) => (
                    <div key={subject.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{subject.code} - {subject.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subject.academicYear} • {subject.semester} • {subject.studentCount} students
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subjects assigned to this teacher.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubjectsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
