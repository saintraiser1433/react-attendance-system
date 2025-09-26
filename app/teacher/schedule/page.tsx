"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CalendarSchedule } from "@/components/ui/calendar-schedule";
import { ScheduleOverrideDialog } from "@/components/ui/schedule-override-dialog";
import { Plus, MoreHorizontal, Calendar, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  subject: string;
  subjectCode: string;
  subjectId: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  room: string;
  department?: string;
  year?: string;
  section?: string;
  semester: string;
  semesterId: string;
  academicYear: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  // Override information
  hasOverride?: boolean;
  overrideType?: string | null;
  overrideReason?: string | null;
  overrideAdminNotes?: string | null;
  originalStartTime?: string;
  originalEndTime?: string;
}


export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [scheduleOverrides, setScheduleOverrides] = useState<any[]>([]);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterAcademicYear, setFilterAcademicYear] = useState("");

  useEffect(() => {
    fetchSchedules();
    fetchScheduleOverrides();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/schedules');
      const data = await response.json();
      
      if (response.ok) {
        setSchedules(data.schedules);
      } else {
        toast.error(data.error || 'Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduleOverrides = async () => {
    try {
      const response = await fetch('/api/teacher/schedule-overrides');
      const data = await response.json();
      
      if (response.ok) {
        setScheduleOverrides(data.overrides);
      }
    } catch (error) {
      console.error('Error fetching schedule overrides:', error);
    }
  };

  // Check if schedule has an approved override for today
  const getScheduleOverrideStatus = (scheduleId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const override = scheduleOverrides.find(o => 
      o.scheduleId === scheduleId && 
      o.date === today && 
      o.status === 'APPROVED'
    );
    return override;
  };

  // Get all overrides for a specific schedule
  const getScheduleOverrides = (scheduleId: string) => {
    return scheduleOverrides.filter(o => o.scheduleId === scheduleId);
  };




  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

  // Check if schedule is for today
  const isScheduleForToday = (schedule: Schedule) => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return schedule.dayOfWeek === currentDayOfWeek;
  };

  // Check if attendance button should be disabled
  const isAttendanceDisabled = (schedule: Schedule) => {
    const override = getScheduleOverrideStatus(schedule.id);
    if (override && override.overrideType === 'cancel') {
      return true; // Disabled if class is cancelled
    }
    return !schedule.isActive || !isScheduleForToday(schedule);
  };

  const handleStartAttendance = (schedule: Schedule) => {
    // Navigate to attendance scanner page with schedule info
    const scheduleData = encodeURIComponent(JSON.stringify({
      id: schedule.id,
      subjectCode: schedule.subjectCode,
      subject: schedule.subject,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      dayName: schedule.dayName,
      dayOfWeek: schedule.dayOfWeek,
      department: schedule.department,
      year: schedule.year,
      section: schedule.section,
      academicYear: schedule.academicYear,
      academicYearId: schedule.academicYearId,
      semester: schedule.semester,
      semesterId: schedule.semesterId,
      // Include override information
      hasOverride: schedule.hasOverride,
      overrideType: schedule.overrideType,
      overrideReason: schedule.overrideReason,
      overrideAdminNotes: schedule.overrideAdminNotes,
      originalStartTime: schedule.originalStartTime,
      originalEndTime: schedule.originalEndTime
    }));
    
    window.location.href = `/teacher/scanner?schedule=${scheduleData}`;
  };


  const formatTime = (time: string) => {
    try {
      // The API already sends formatted times (e.g., "6:20 PM")
      // Check if it's already in 12-hour format
      if (time.includes('AM') || time.includes('PM')) {
        return time; // Already formatted, return as is
      }
      
      // Handle different time formats for backward compatibility
      let formattedTime = time;
      if (time.includes('T')) {
        formattedTime = time.split('T')[1];
      }
      
      // Ensure we have a valid time format
      const timeParts = formattedTime.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        
        // Convert to 12-hour format
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours < 12 ? 'AM' : 'PM';
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      
      return time;
    } catch (error) {
      console.error('Error formatting time:', time, error);
      return time;
    }
  };

  // Filtering and pagination functions
  const getFilteredSchedules = () => {
    let filtered = schedules;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(schedule =>
        schedule.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.dayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Individual filters
    if (filterSubject) {
      filtered = filtered.filter(schedule => schedule.subject === filterSubject);
    }
    if (filterDay) {
      filtered = filtered.filter(schedule => schedule.dayName === filterDay);
    }
    if (filterDepartment) {
      filtered = filtered.filter(schedule => schedule.department === filterDepartment);
    }
    if (filterYear) {
      filtered = filtered.filter(schedule => schedule.year === filterYear);
    }
    if (filterSection) {
      filtered = filtered.filter(schedule => schedule.section === filterSection);
    }
    if (filterSemester) {
      filtered = filtered.filter(schedule => schedule.semester === filterSemester);
    }
    if (filterAcademicYear) {
      filtered = filtered.filter(schedule => schedule.academicYear === filterAcademicYear);
    }

    return filtered;
  };

  const getPaginatedSchedules = () => {
    const filtered = getFilteredSchedules();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredSchedules();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Helper functions for unique values
  const getUniqueSubjects = () => {
    const subjects = new Set<string>();
    schedules.forEach(schedule => {
      subjects.add(schedule.subject);
    });
    return Array.from(subjects).sort();
  };

  const getUniqueDays = () => {
    const days = new Set<string>();
    schedules.forEach(schedule => {
      days.add(schedule.dayName);
    });
    return Array.from(days).sort();
  };

  const getUniqueDepartments = () => {
    const departments = new Set<string>();
    schedules.forEach(schedule => {
      if (schedule.department) departments.add(schedule.department);
    });
    return Array.from(departments).sort();
  };

  const getUniqueYears = () => {
    const years = new Set<string>();
    schedules.forEach(schedule => {
      if (schedule.year) years.add(schedule.year);
    });
    return Array.from(years).sort();
  };

  const getUniqueSections = () => {
    const sections = new Set<string>();
    schedules.forEach(schedule => {
      if (schedule.section) sections.add(schedule.section);
    });
    return Array.from(sections).sort();
  };

  const getUniqueSemesters = () => {
    const semesters = new Set<string>();
    schedules.forEach(schedule => {
      semesters.add(schedule.semester);
    });
    return Array.from(semesters).sort();
  };

  const getUniqueAcademicYears = () => {
    const academicYears = new Set<string>();
    schedules.forEach(schedule => {
      academicYears.add(schedule.academicYear);
    });
    return Array.from(academicYears).sort();
  };

  // Generate random colors for each unique schedule
  const generateRandomColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash) % 30); // 70-100%
    const lightness = 45 + (Math.abs(hash) % 20); // 45-65%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Convert schedules to calendar events
  const getCalendarEvents = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    return schedules.map((schedule, index) => {
      const eventDate = new Date(currentWeekStart);
      eventDate.setDate(currentWeekStart.getDate() + schedule.dayOfWeek);
      
      const startDateTime = `${eventDate.toISOString().split('T')[0]}T${schedule.startTime}`;
      const endDateTime = `${eventDate.toISOString().split('T')[0]}T${schedule.endTime}`;
      
      const randomColor = generateRandomColor(schedule.id + schedule.subjectCode);
      
      return {
        id: schedule.id,
        title: `${schedule.subjectCode}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: schedule.isActive ? randomColor : '#6b7280',
        borderColor: schedule.isActive ? randomColor : '#4b5563',
        extendedProps: {
          subject: schedule.subject,
          room: schedule.room,
          semester: schedule.semester,
        }
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
            <p className="text-muted-foreground">
              View your fixed schedule and start attendance for each class
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetchSchedules();
                fetchScheduleOverrides();
                toast.success("Schedule data refreshed");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
            >
              Table View
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              Calendar View
            </Button>
          </div>
        </div>

        {/* Fixed Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Fixed Schedule</CardTitle>
            <CardDescription>
              Your schedule as set by the admin. Click "Start Attendance" to begin taking attendance for each class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search schedules by subject, code, room, or day..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-md"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {getFilteredSchedules().length} of {schedules.length} schedules
                </div>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Subject</Label>
                  <Select value={filterSubject || "all"} onValueChange={(value) => {
                    setFilterSubject(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {getUniqueSubjects().map((subject, index) => (
                        <SelectItem key={`subject-${subject}-${index}`} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Day</Label>
                  <Select value={filterDay || "all"} onValueChange={(value) => {
                    setFilterDay(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All days</SelectItem>
                      {getUniqueDays().map((day, index) => (
                        <SelectItem key={`day-${day}-${index}`} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Department</Label>
                  <Select value={filterDepartment || "all"} onValueChange={(value) => {
                    setFilterDepartment(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {getUniqueDepartments().map((dept, index) => (
                        <SelectItem key={`dept-${dept}-${index}`} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Year</Label>
                  <Select value={filterYear || "all"} onValueChange={(value) => {
                    setFilterYear(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {getUniqueYears().map((year, index) => (
                        <SelectItem key={`year-${year}-${index}`} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Section</Label>
                  <Select value={filterSection || "all"} onValueChange={(value) => {
                    setFilterSection(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {getUniqueSections().map((section, index) => (
                        <SelectItem key={`section-${section}-${index}`} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Academic Year</Label>
                  <Select value={filterAcademicYear || "all"} onValueChange={(value) => {
                    setFilterAcademicYear(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {getUniqueAcademicYears().map((year, index) => (
                        <SelectItem key={`academic-year-${year}-${index}`} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Semester</Label>
                  <Select value={filterSemester || "all"} onValueChange={(value) => {
                    setFilterSemester(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All semesters</SelectItem>
                      {getUniqueSemesters().map((semester, index) => (
                        <SelectItem key={`semester-${semester}-${index}`} value={semester}>{semester}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Actions</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterSubject("");
                      setFilterDay("");
                      setFilterDepartment("");
                      setFilterYear("");
                      setFilterSection("");
                      setFilterSemester("");
                      setFilterAcademicYear("");
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : viewMode === "table" ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Overrides</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredSchedules().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="p-0">
                          <EmptyState
                            icon={<Calendar className="w-12 h-12" />}
                            title="No schedules found"
                            description="You don't have any schedules assigned yet. Contact your administrator to get schedules assigned to your subjects."
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedSchedules().map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{schedule.subjectCode}</div>
                              <div className="text-sm text-muted-foreground">{schedule.subject}</div>
                            </div>
                          </TableCell>
                          <TableCell>{schedule.dayName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </span>
                              {schedule.hasOverride && schedule.overrideType === 'time-change' && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                  Modified
                                </Badge>
                              )}
                              {schedule.hasOverride && schedule.overrideType === 'cancel' && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                            {schedule.hasOverride && schedule.overrideReason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Reason: {schedule.overrideReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{schedule.room || "-"}</TableCell>
                          <TableCell>{schedule.department || "-"}</TableCell>
                          <TableCell>{schedule.year || "-"}</TableCell>
                          <TableCell>{schedule.section || "-"}</TableCell>
                          <TableCell>{schedule.academicYear}</TableCell>
                          <TableCell>{schedule.semester}</TableCell>
                          <TableCell>{getStatusBadge(schedule.isActive)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getScheduleOverrides(schedule.id).length === 0 ? (
                                <span className="text-sm text-muted-foreground">No overrides</span>
                              ) : (
                                getScheduleOverrides(schedule.id).map((override) => (
                                  <div key={override.id} className="flex items-center gap-2 text-xs">
                                    <Badge 
                                      variant={override.status === 'APPROVED' ? 'default' : 
                                               override.status === 'REJECTED' ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {override.status}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {new Date(override.date).toLocaleDateString()}
                                    </span>
                                    {override.overrideType === 'time-change' && (
                                      <span className="text-blue-600">
                                        {override.newStartTime} - {override.newEndTime}
                                      </span>
                                    )}
                                    {override.overrideType === 'cancel' && (
                                      <span className="text-red-600">Cancelled</span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStartAttendance(schedule)}
                                disabled={isAttendanceDisabled(schedule)}
                                title={
                                  !schedule.isActive 
                                    ? "Schedule is inactive" 
                                    : !isScheduleForToday(schedule) 
                                      ? `Schedule is for ${schedule.dayName}, not today` 
                                      : getScheduleOverrideStatus(schedule.id)?.overrideType === 'cancel'
                                        ? `Class cancelled: ${getScheduleOverrideStatus(schedule.id)?.reason}`
                                        : "Start taking attendance for this class"
                                }
                              >
                                {!schedule.isActive 
                                  ? "Schedule Inactive" 
                                  : !isScheduleForToday(schedule) 
                                    ? `Not Today (${schedule.dayName})` 
                                    : getScheduleOverrideStatus(schedule.id)?.overrideType === 'cancel'
                                      ? "Class Cancelled"
                                      : "Start Attendance"
                                }
                              </Button>
                              <ScheduleOverrideDialog 
                                schedule={{
                                  id: schedule.id,
                                  subjectCode: schedule.subjectCode,
                                  subject: schedule.subject,
                                  dayName: schedule.dayName,
                                  dayOfWeek: schedule.dayOfWeek,
                                  startTime: schedule.startTime,
                                  endTime: schedule.endTime,
                                }}
                                onOverrideCreated={() => {
                                  toast.success("Override request submitted!");
                                  fetchScheduleOverrides(); // Refresh overrides list
                                }}
                              />
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
                  totalItems={getFilteredSchedules().length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    setCurrentPage(1);
                  }}
                  itemName="schedules"
                />
              </>
            ) : (
              <div className="w-full">
                <CalendarSchedule events={getCalendarEvents()} useSimpleCalendar={true} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}