"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Semester {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  academicYearId: string;
  isActive?: boolean;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface SemesterManagerProps {
  academicYear: AcademicYear | null;
  onClose: () => void;
}

export function SemesterManager({ academicYear, onClose }: SemesterManagerProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [newSemester, setNewSemester] = useState({
    name: ""
  });

  useEffect(() => {
    if (academicYear) {
      fetchSemesters();
      fetchActiveSemester();
    }
  }, [academicYear]);

  const fetchSemesters = async () => {
    if (!academicYear) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/semesters?academicYearId=${academicYear.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSemesters(data.semesters || []);
      } else {
        toast.error(data.error || "Failed to fetch semesters");
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast.error("Failed to fetch semesters");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveSemester = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (response.ok) {
        setActiveSemesterId(data.activeSemesterId || null);
      }
    } catch (error) {
      console.error("Error fetching active semester:", error);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYear) return;

    try {
      setIsCreating(true);
      const response = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSemester.name,
          academicYearId: academicYear.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSemesters(prev => [data.semester, ...prev]);
        setNewSemester({ name: "" });
        toast.success("Semester created successfully!");
      } else {
        toast.error(data.error || "Failed to create semester");
      }
    } catch (error) {
      console.error("Error creating semester:", error);
      toast.error("Failed to create semester");
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateSemester = async (semesterId: string) => {
    try {
      const response = await fetch(`/api/admin/semesters/${semesterId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        setActiveSemesterId(semesterId);
        toast.success("Semester activated successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to activate semester");
      }
    } catch (error) {
      console.error("Error activating semester:", error);
      toast.error("Failed to activate semester");
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm("Are you sure you want to delete this semester?")) return;

    try {
      const response = await fetch(`/api/admin/semesters/${semesterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSemesters(prev => prev.filter(s => s.id !== semesterId));
        if (activeSemesterId === semesterId) {
          setActiveSemesterId(null);
        }
        toast.success("Semester deleted successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete semester");
      }
    } catch (error) {
      console.error("Error deleting semester:", error);
      toast.error("Failed to delete semester");
    }
  };

  if (!academicYear) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No academic year selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Academic Year Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {academicYear.name}
          </CardTitle>
          <CardDescription>
            {new Date(academicYear.startDate).toLocaleDateString()} - {new Date(academicYear.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Create New Semester */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Semester</CardTitle>
          <CardDescription>
            Create a new semester for this academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSemester} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="semester-name">Semester Name</Label>
                <Input
                  id="semester-name"
                  value={newSemester.name}
                  onChange={(e) => setNewSemester(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Fall 2025"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Semester"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Semesters */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Semesters</CardTitle>
          <CardDescription>
            Manage semesters for this academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : semesters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No semesters found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {semesters.map((semester) => (
                <div key={semester.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{semester.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {semester.startDate && semester.endDate 
                          ? `${new Date(semester.startDate).toLocaleDateString()} - ${new Date(semester.endDate).toLocaleDateString()}`
                          : "No dates set"
                        }
                      </div>
                    </div>
                    {activeSemesterId === semester.id ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSemesterId !== semester.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateSemester(semester.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSemester(semester.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
