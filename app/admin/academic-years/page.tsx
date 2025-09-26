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
import { SemesterManager } from "@/components/ui/semester-manager";
import { Plus, MoreHorizontal, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semesterCount: number;
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSemesterDialogOpen, setIsSemesterDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Pagination helper functions
  const getPaginatedAcademicYears = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return academicYears.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(academicYears.length / itemsPerPage);
  };

  const fetchAcademicYears = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/academic-years');
      const data = await response.json();
      
      if (response.ok) {
        setAcademicYears(data.academicYears);
      } else {
        toast.error(data.error || 'Failed to fetch academic years');
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Failed to fetch academic years');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/academic-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setAcademicYears(prev => [data.academicYear, ...prev]);
        setIsDialogOpen(false);
        setFormData({ name: "", startDate: "", endDate: "" });
        toast.success("Academic year created successfully!");
      } else {
        toast.error(data.error || 'Failed to create academic year');
      }
    } catch (error) {
      console.error('Error creating academic year:', error);
      toast.error('Failed to create academic year');
    }
  };

  const activateYear = async (yearId: string) => {
    try {
      const response = await fetch(`/api/admin/academic-years/${yearId}/activate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setAcademicYears(prev => prev.map(year => ({
          ...year,
          isActive: year.id === yearId
        })));
        toast.success("Academic year activated!");
      } else {
        toast.error(data.error || 'Failed to activate academic year');
      }
    } catch (error) {
      console.error('Error activating academic year:', error);
      toast.error('Failed to activate academic year');
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    setEditFormData({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;

    try {
      const response = await fetch(`/api/admin/academic-years/${selectedYear.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setAcademicYears(prev => prev.map(year => 
          year.id === selectedYear.id ? data.academicYear : year
        ));
        setIsEditDialogOpen(false);
        setSelectedYear(null);
        toast.success("Academic year updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update academic year');
      }
    } catch (error) {
      console.error('Error updating academic year:', error);
      toast.error('Failed to update academic year');
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (confirm(`Are you sure you want to delete ${year.name}?`)) {
      try {
        const response = await fetch(`/api/admin/academic-years/${year.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setAcademicYears(prev => prev.filter(y => y.id !== year.id));
          toast.success("Academic year deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete academic year');
        }
      } catch (error) {
        console.error('Error deleting academic year:', error);
        toast.error('Failed to delete academic year');
      }
    }
  };

  const handleManageSemesters = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsSemesterDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Years</h1>
            <p className="text-muted-foreground">
              Manage academic years and activate current term
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Academic Year</DialogTitle>
                <DialogDescription>
                  Create a new academic year with start and end dates.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Academic Year Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., 2025/2026"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Academic Year</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Years</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{academicYears.length}</div>
              <p className="text-xs text-muted-foreground">
                Academic years configured
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Year</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {academicYears.find(y => y.isActive)?.name || "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Semesters</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {academicYears.reduce((sum, year) => sum + year.semesterCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all years
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Academic Years Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Academic Years</CardTitle>
            <CardDescription>
              Manage academic years and their status.
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
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Semesters</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          icon={<Calendar className="w-12 h-12" />}
                          title="No academic years found"
                          description="Create academic years to organize your academic calendar. Academic years contain semesters and define the academic period."
                          action={
                            <Button onClick={() => setIsDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Academic Year
                            </Button>
                          }
                          className="py-12"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedAcademicYears().map((year) => (
                      <TableRow key={year.id}>
                        <TableCell className="font-medium">{year.name}</TableCell>
                        <TableCell>{new Date(year.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(year.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={year.isActive ? "default" : "secondary"}>
                            {String(year.isActive ? "Active" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>{year.semesterCount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!year.isActive && (
                                <DropdownMenuItem onClick={() => activateYear(year.id)}>
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(year)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageSemesters(year)}>
                                Manage Semesters
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(year)}
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
                totalItems={academicYears.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
                itemName="academic years"
              />
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Academic Year Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Academic Year</DialogTitle>
              <DialogDescription>
                Update academic year information and dates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Academic Year Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
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

        {/* Manage Semesters Dialog */}
        <Dialog open={isSemesterDialogOpen} onOpenChange={setIsSemesterDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Semesters - {selectedYear?.name}</DialogTitle>
              <DialogDescription>
                Configure semesters for this academic year.
              </DialogDescription>
            </DialogHeader>
            <SemesterManager 
              academicYear={selectedYear} 
              onClose={() => setIsSemesterDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
