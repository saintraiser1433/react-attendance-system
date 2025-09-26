"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Building2, Users, Calendar } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Section {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    fetchSections();
    fetchDepartments();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/admin/sections");
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      } else {
        toast.error("Failed to fetch sections");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };


  const handleCreateSection = async () => {
    try {
      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Section created successfully");
        setIsCreateDialogOpen(false);
        setFormData({ name: "" });
        fetchSections();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create section");
      }
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error("Failed to create section");
    }
  };

  const handleEditSection = async () => {
    if (!editingSection) return;

    try {
      const response = await fetch(`/api/admin/sections/${editingSection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Section updated successfully");
        setIsEditDialogOpen(false);
        setEditingSection(null);
        setFormData({ name: "" });
        fetchSections();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update section");
      }
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Section deleted successfully");
        fetchSections();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete section");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
    });
    setIsEditDialogOpen(true);
  };

  const filteredSections = sections.filter((section) => {
    const matchesSearch = 
      section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination helper functions
  const getPaginatedSections = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSections.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredSections.length / itemsPerPage);
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalSections = sections.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading sections...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sections</h1>
            <p className="text-muted-foreground">
              Manage academic sections across departments
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
                <DialogDescription>
                  Add a new section to organize students within a department.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Section Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Section A"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSection}>Create Section</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSections}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sections ({filteredSections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedSections().map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>
                        <div className="font-medium">{section.name}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{section.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSection(section.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
              totalItems={filteredSections.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
              itemName="sections"
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update the section information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Section Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Section A"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSection}>Update Section</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}










