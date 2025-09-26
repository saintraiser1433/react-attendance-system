"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CheckCircle, XCircle, Clock, Calendar, User, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ScheduleOverride {
  id: string;
  scheduleId: string;
  teacherName: string;
  teacherEmail: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  reason: string;
  overrideType: string;
  originalStartTime: string;
  originalEndTime: string;
  newStartTime: string | null;
  newEndTime: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: string;
}

export default function AdminScheduleOverridesPage() {
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOverride, setSelectedOverride] = useState<ScheduleOverride | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [semesters, setSemesters] = useState<{id: string, name: string, academicYearId: string}[]>([]);

  useEffect(() => {
    fetchOverrides();
    fetchAcademicYears();
    fetchSemesters();
  }, []);

  const fetchOverrides = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/schedule-overrides');
      const data = await response.json();
      
      if (response.ok) {
        setOverrides(data.overrides);
      } else {
        toast.error(data.error || 'Failed to fetch schedule overrides');
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast.error('Failed to fetch schedule overrides');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/admin/academic-years');
      const data = await response.json();
      
      if (response.ok) {
        setAcademicYears(data.academicYears || []);
      } else {
        console.error('Error fetching academic years:', data.error);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/admin/semesters');
      const data = await response.json();
      
      if (response.ok) {
        setSemesters(data.semesters || []);
      } else {
        console.error('Error fetching semesters:', data.error);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  // Pagination helper functions
  const getFilteredOverrides = () => {
    return overrides.filter(override => {
      // Note: Since schedule overrides don't directly have academic year/semester,
      // we would need to filter based on the associated schedule's academic year/semester
      // For now, we'll return all overrides since the API doesn't provide this data
      return true;
    });
  };

  const getPaginatedOverrides = () => {
    const filtered = getFilteredOverrides();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredOverrides().length / itemsPerPage);
  };

  const handleApprove = async () => {
    if (!selectedOverride) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/schedule-overrides/${selectedOverride.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          adminNotes: adminNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Schedule override approved!");
        setIsDialogOpen(false);
        setAdminNotes("");
        fetchOverrides();
      } else {
        toast.error(data.error || 'Failed to approve override');
      }
    } catch (error) {
      console.error('Error approving override:', error);
      toast.error('Failed to approve override');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOverride) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/schedule-overrides/${selectedOverride.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          adminNotes: adminNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Schedule override rejected!");
        setIsDialogOpen(false);
        setAdminNotes("");
        fetchOverrides();
      } else {
        toast.error(data.error || 'Failed to reject override');
      }
    } catch (error) {
      console.error('Error rejecting override:', error);
      toast.error('Failed to reject override');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDialog = (override: ScheduleOverride) => {
    setSelectedOverride(override);
    setAdminNotes(override.adminNotes || "");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverrideTypeLabel = (type: string) => {
    switch (type) {
      case 'time-change':
        return 'Time Change';
      case 'cancel':
        return 'Cancel Class';
      default:
        return type;
    }
  };

  const pendingOverrides = overrides.filter(o => o.status === 'PENDING');
  const approvedOverrides = overrides.filter(o => o.status === 'APPROVED');
  const rejectedOverrides = overrides.filter(o => o.status === 'REJECTED');

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
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Override Requests</h1>
            <p className="text-muted-foreground">
              Review and approve teacher requests for schedule modifications.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOverrides.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedOverrides.length}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedOverrides.length}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
        </div>

        {/* Override Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Override Requests</CardTitle>
            <CardDescription>
              Review teacher requests for schedule modifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="grid gap-2">
                <Label>Filter by Academic Year</Label>
                <Select value={selectedAcademicYear || "all"} onValueChange={(v) => {
                  setSelectedAcademicYear(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All academic years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All academic years</SelectItem>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Filter by Semester</Label>
                <Select value={selectedSemester || "all"} onValueChange={(v) => {
                  setSelectedSemester(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {semesters.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            {overrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schedule override requests found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Original Time</TableHead>
                    <TableHead>New Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedOverrides().map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{override.teacherName}</div>
                          <div className="text-sm text-muted-foreground">{override.teacherEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{override.subjectCode}</div>
                          <div className="text-sm text-muted-foreground">{override.subjectName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(override.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getOverrideTypeLabel(override.overrideType)}</TableCell>
                      <TableCell>
                        {override.originalStartTime} - {override.originalEndTime}
                      </TableCell>
                      <TableCell>
                        {override.newStartTime && override.newEndTime 
                          ? `${override.newStartTime} - ${override.newEndTime}`
                          : override.overrideType === 'cancel' 
                            ? 'Cancelled'
                            : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(override.status)}</TableCell>
                      <TableCell>
                        {override.status === 'PENDING' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(override)}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {override.adminNotes ? 'Reviewed' : 'Processed'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <DataTablePagination
              currentPage={currentPage}
              totalPages={getTotalPages()}
              itemsPerPage={itemsPerPage}
              totalItems={getFilteredOverrides().length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
              itemName="overrides"
            />
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Schedule Override Request</DialogTitle>
              <DialogDescription>
                Review the teacher's request and approve or reject it.
              </DialogDescription>
            </DialogHeader>
            
            {selectedOverride && (
              <div className="space-y-4">
                {/* Request Details */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Teacher:</strong> {selectedOverride.teacherName}</div>
                    <div><strong>Email:</strong> {selectedOverride.teacherEmail}</div>
                    <div><strong>Subject:</strong> {selectedOverride.subjectCode} - {selectedOverride.subjectName}</div>
                    <div><strong>Date:</strong> {new Date(selectedOverride.date).toLocaleDateString()}</div>
                    <div><strong>Type:</strong> {getOverrideTypeLabel(selectedOverride.overrideType)}</div>
                    <div><strong>Original Time:</strong> {selectedOverride.originalStartTime} - {selectedOverride.originalEndTime}</div>
                  </div>
                  
                  {selectedOverride.newStartTime && selectedOverride.newEndTime && (
                    <div className="text-sm">
                      <strong>New Time:</strong> {selectedOverride.newStartTime} - {selectedOverride.newEndTime}
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <strong>Reason:</strong>
                    <p className="mt-1 p-2 bg-background rounded border">{selectedOverride.reason}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add any notes for the teacher..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? "Approving..." : "Approve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}











