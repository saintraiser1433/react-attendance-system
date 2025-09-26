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
import { Plus, MoreHorizontal, BookOpen, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  subject: string;
  subjectId: string;
  topicCount: number;
  createdAt: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  isCompleted: boolean;
  orderIndex: number;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewTopicsDialogOpen, setIsViewTopicsDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [subjects, setSubjects] = useState<{id: string, name: string, code: string}[]>([]);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    subjectId: "",
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    description: "",
    subjectId: "",
  });
  const [topicFormData, setTopicFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchModules();
    fetchSubjects();
  }, []);

  // Pagination helper functions
  const getPaginatedModules = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return modules.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(modules.length / itemsPerPage);
  };

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/modules');
      const data = await response.json();
      
      if (response.ok) {
        setModules(data.modules);
      } else {
        toast.error(data.error || 'Failed to fetch modules');
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to fetch modules');
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
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/teacher/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setModules(prev => [data.module, ...prev]);
        setIsDialogOpen(false);
        setFormData({ code: "", name: "", description: "", subjectId: "" });
        toast.success("Module created successfully!");
      } else {
        toast.error(data.error || 'Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Topic added successfully!");
    setIsTopicDialogOpen(false);
    setTopicFormData({ title: "", description: "" });
  };

  const handleViewTopics = (module: Module) => {
    setSelectedModule(module);
    setIsViewTopicsDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditModule(module);
    setEditFormData({
      code: module.code,
      name: module.name,
      description: module.description,
      subjectId: module.subjectId,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModule) return;
    
    try {
      const response = await fetch(`/api/teacher/modules/${editModule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setModules(prev => prev.map(m => 
          m.id === editModule.id ? data.module : m
        ));
        setIsEditDialogOpen(false);
        setEditModule(null);
        toast.success("Module updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleDeleteModule = async (module: Module) => {
    if (confirm(`Are you sure you want to delete ${module.name}?`)) {
      try {
        const response = await fetch(`/api/teacher/modules/${module.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setModules(prev => prev.filter(m => m.id !== module.id));
          toast.success("Module deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete module');
        }
      } catch (error) {
        console.error('Error deleting module:', error);
        toast.error('Failed to delete module');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "draft":
        return <BookOpen className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Modules</h1>
            <p className="text-muted-foreground">
              Create and manage course modules with topics
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Add a new module to organize course content into topics.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Module Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., MOD-CS101-01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Module Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter module name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the module content..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subjectId">Subject</Label>
                    <Select value={formData.subjectId} onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code} - {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Module</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modules.length}</div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.length}
              </div>
              <p className="text-xs text-muted-foreground">Currently teaching</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0
              </div>
              <p className="text-xs text-muted-foreground">Finished modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.reduce((sum, m) => sum + m.topicCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Learning topics</p>
            </CardContent>
          </Card>
        </div>

        {/* Modules Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Modules</CardTitle>
            <CardDescription>
              Manage your course modules and their topics.
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
                      <TableHead>Module</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            icon={<BookOpen className="w-12 h-12" />}
                            title="No modules found"
                            description="Create modules to organize your course content. Modules can contain multiple topics and help structure your teaching materials."
                            action={
                              <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Module
                              </Button>
                            }
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedModules().map((module) => (
                        <TableRow key={module.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon("active")}
                              <div>
                                <div className="font-medium">{module.name}</div>
                                <div className="text-xs text-muted-foreground">{module.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(module.code || "")}</Badge>
                          </TableCell>
                          <TableCell>{module.subject}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                0/5 topics
                              </div>
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: `0%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge("active")}</TableCell>
                          <TableCell>{new Date(module.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedModuleId(module.id);
                                    setIsTopicDialogOpen(true);
                                  }}
                                >
                                  Add Topic
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewTopics(module)}>
                                  View Topics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditModule(module)}>
                                  Edit Module
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteModule(module)}
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
                  totalItems={modules.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    setCurrentPage(1);
                  }}
                  itemName="modules"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Topic Dialog */}
        <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Topic</DialogTitle>
              <DialogDescription>
                Add a new topic to the selected module.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTopic}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Topic Title</Label>
                  <Input
                    id="title"
                    value={topicFormData.title}
                    onChange={(e) => setTopicFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter topic title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topicDescription">Description</Label>
                  <Textarea
                    id="topicDescription"
                    value={topicFormData.description}
                    onChange={(e) => setTopicFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this topic covers..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Topic</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Module Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>
                Update module information and details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editCode">Module Code</Label>
                  <Input
                    id="editCode"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editName">Module Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the module"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Topics Dialog */}
        <Dialog open={isViewTopicsDialogOpen} onOpenChange={setIsViewTopicsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Topics - {selectedModule?.name}</DialogTitle>
              <DialogDescription>
                Learning topics within this module.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedModule && (
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Variables and Data Types</div>
                        <div className="text-sm text-muted-foreground">Understanding basic data types in programming</div>
                      </div>
                      <Badge variant="default">Completed</Badge>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Control Flow</div>
                        <div className="text-sm text-muted-foreground">If statements and loops</div>
                      </div>
                      <Badge variant="default">Completed</Badge>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Functions and Methods</div>
                        <div className="text-sm text-muted-foreground">Creating reusable code blocks</div>
                      </div>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Topic
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewTopicsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
