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
import { CalendarSchedule } from "@/components/ui/calendar-schedule";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ScheduleAssignment } from "@/components/ui/schedule-assignment";
import { TeacherSchedulePreview } from "@/components/ui/teacher-schedule-preview";
import { Plus, MoreHorizontal, Calendar, Clock, Users, BookOpen, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  academicYearId: string;
  academicYearName: string;
  semesterId: string;
  semesterName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  startTime: string;
  endTime: string;
  room?: string;
  department?: string;
  year?: string;
  section?: string;
  sectionId?: string;
  isActive: boolean;
  createdAt: string;
}

interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  departmentId: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  description?: string;
  credits?: number;
  courseId: string;
  courseName?: string;
}

interface Semester {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<{id: string, name: string, code: string, departmentId: string}[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof Schedule>("teacherName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const [editFormData, setEditFormData] = useState({
    teacherId: "",
    subjectId: "",
    semesterId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    room: "",
    department: "",
    year: "",
    sectionId: "",
  });

  // Assignment-related state
  const [isUnifiedDialogOpen, setIsUnifiedDialogOpen] = useState(false);
  const [assignmentSchedules, setAssignmentSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [teacherScheduleRefreshTrigger, setTeacherScheduleRefreshTrigger] = useState(0);
  const [assignmentFormData, setAssignmentFormData] = useState({
    subjectId: "",
    teacherId: "",
    courseId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchSchedules(),
        fetchTeachers(),
        fetchSubjects(),
        fetchSemesters(),
        fetchAcademicYears(),
        fetchDepartments(),
        fetchSections(),
        fetchCourses(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules');
      const data = await response.json();
      
      if (response.ok) {
        setSchedules(data.schedules);
      } else {
        toast.error(data.error || 'Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers');
      const data = await response.json();
      
      if (response.ok) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      const data = await response.json();
      
      if (response.ok) {
        setSubjects(data.subjects);
      } else {
        console.error('Error fetching subjects:', data.error);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/admin/semesters');
      const data = await response.json();
      
      if (response.ok) {
        setSemesters(data.semesters);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
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

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/sections');
      const data = await response.json();
      
      if (response.ok) {
        setSections(data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      const data = await response.json();
      
      if (response.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    
    // Convert year number to year level format
    const yearMapping: { [key: string]: string } = {
      "1": "1st Year",
      "2": "2nd Year", 
      "3": "3rd Year",
      "4": "4th Year",
      "5": "5th Year"
    };
    
    // Convert 12-hour time format to 24-hour format for time inputs
    const convertTo24Hour = (time12: string) => {
      if (!time12.includes('AM') && !time12.includes('PM')) {
        return time12; // Already in 24-hour format
      }
      
      const [time, period] = time12.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours, 10);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    };
    
    setEditFormData({
      teacherId: schedule.teacherId,
      subjectId: schedule.subjectId,
      semesterId: schedule.semesterId,
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: convertTo24Hour(schedule.startTime),
      endTime: convertTo24Hour(schedule.endTime),
      room: schedule.room || "",
      department: schedule.department || "",
      year: yearMapping[schedule.year || ""] || schedule.year || "",
      sectionId: schedule.sectionId || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      // Convert year level back to number format
      const yearMapping: { [key: string]: string } = {
        "1st Year": "1",
        "2nd Year": "2",
        "3rd Year": "3", 
        "4th Year": "4",
        "5th Year": "5"
      };
      
      // Get academicYearId from the selected semester
      console.log("All semesters:", semesters);
      console.log("Looking for semester ID:", editFormData.semesterId);
      console.log("Selected schedule:", selectedSchedule);
      const selectedSemester = semesters.find(s => s.id === editFormData.semesterId);
      console.log("Selected semester:", selectedSemester);
      console.log("Academic year ID:", selectedSemester?.academicYearId);
      
      // Fallback: get academicYearId from the existing schedule if semester lookup fails
      let academicYearId = selectedSemester?.academicYearId;
      if (!academicYearId && selectedSchedule) {
        // Find the academic year from the existing schedule's semester
        const existingSemester = semesters.find(s => s.id === selectedSchedule.semesterId);
        academicYearId = existingSemester?.academicYearId;
        console.log("Fallback - existing semester:", existingSemester);
        console.log("Fallback - academic year ID:", academicYearId);
      }
      
      // If still no academicYearId, try to get it from the current semester selection
      if (!academicYearId) {
        console.log("Still no academicYearId, trying current semester selection");
        const currentSemester = semesters.find(s => s.id === editFormData.semesterId);
        academicYearId = currentSemester?.academicYearId;
        console.log("Current semester:", currentSemester);
        console.log("Current academic year ID:", academicYearId);
      }
      
      const dataToSend = {
        ...editFormData,
        year: yearMapping[editFormData.year] || editFormData.year,
        academicYearId: academicYearId || "",
      };
      
      console.log("Data being sent:", dataToSend);

      const response = await fetch(`/api/admin/schedules/${selectedSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setSchedules(prev => prev.map(schedule => 
          schedule.id === selectedSchedule.id ? data.schedule : schedule
        ));
        setIsEditDialogOpen(false);
        setSelectedSchedule(null);
        toast.success("Schedule updated successfully!");
      } else {
        toast.error(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (confirm(`Are you sure you want to delete this schedule?`)) {
      try {
        const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setSchedules(prev => prev.filter(s => s.id !== schedule.id));
          toast.success("Schedule deleted successfully!");
        } else {
          toast.error(data.error || 'Failed to delete schedule');
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('Failed to delete schedule');
      }
    }
  };

  // Assignment functions
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignmentFormData.subjectId || !assignmentFormData.teacherId || !assignmentFormData.courseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoadingSchedules(true);
      
      const response = await fetch(`/api/admin/subjects/${assignmentFormData.subjectId}/assign-with-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: assignmentFormData.teacherId,
          courseId: assignmentFormData.courseId,
          schedules: assignmentSchedules,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsUnifiedDialogOpen(false);
        setAssignmentFormData({
          subjectId: "",
          teacherId: "",
          courseId: "",
        });
        setAssignmentSchedules([]);
        fetchData(); // Refresh schedules
        setTeacherScheduleRefreshTrigger(prev => prev + 1); // Trigger teacher schedule refresh
        
        // Show appropriate success message
        if (data.schedulesSkipped > 0) {
          toast.success(`${data.message}. Check conflicts for details.`);
        } else {
          toast.success(data.message);
        }
      } else {
        if (data.details) {
          toast.error(`${data.error}: ${data.details}`);
        } else {
          toast.error(data.message || data.error || 'Failed to assign subject');
        }
      }
    } catch (error) {
      console.error('Error assigning subject:', error);
      toast.error('Failed to assign subject');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchSubjectSchedules = async (subjectId: string) => {
    if (!subjectId) return;
    
    try {
      setIsLoadingSchedules(true);
      const response = await fetch(`/api/admin/subjects/${subjectId}/schedules`);
      const data = await response.json();
      
      if (response.ok) {
        setAssignmentSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching subject schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const getFilteredSchedules = () => {
    let filtered = schedules.filter(schedule => {
      const teacherMatch = !selectedTeacher || schedule.teacherId === selectedTeacher;
      
      // Department filter - check if teacher belongs to selected department
      const departmentMatch = !selectedDepartment || 
        teachers.find(t => t.id === schedule.teacherId)?.departmentId === selectedDepartment;
      
      // Year filter
      const yearMatch = !selectedYear || schedule.year === selectedYear;
      
      // Section filter
      const sectionMatch = !selectedSection || schedule.sectionId === selectedSection;
      
      // Academic year filter
      const academicYearMatch = !selectedAcademicYear || schedule.academicYearId === selectedAcademicYear;
      
      // Semester filter
      const semesterMatch = !selectedSemester || schedule.semesterId === selectedSemester;
      
      // Search filter
      const searchMatch = !searchTerm || 
        schedule.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.semesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.section?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return teacherMatch && departmentMatch && yearMatch && sectionMatch && academicYearMatch && semesterMatch && searchMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  };

  const getPaginatedSchedules = () => {
    const filtered = getFilteredSchedules();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredSchedules().length / pageSize);
  };

  const handleSort = (field: keyof Schedule) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const getSubjectsForTeacher = (teacherId: string) => {
    return subjects.filter(subject => subject.teacherId === teacherId);
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || "Unknown";
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
    
    return getFilteredSchedules().map(schedule => {
      const eventDate = new Date(currentWeekStart);
      eventDate.setDate(currentWeekStart.getDate() + schedule.dayOfWeek);
      
      const startDateTime = `${eventDate.toISOString().split('T')[0]}T${schedule.startTime}`;
      const endDateTime = `${eventDate.toISOString().split('T')[0]}T${schedule.endTime}`;
      
      const randomColor = generateRandomColor(schedule.id + schedule.subjectCode + schedule.teacherName);
      
      return {
        id: schedule.id,
        title: `${schedule.subjectCode} - ${schedule.teacherName}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: schedule.isActive ? randomColor : '#6b7280',
        borderColor: schedule.isActive ? randomColor : '#4b5563',
        extendedProps: {
          teacher: schedule.teacherName,
          subject: schedule.subjectName,
          room: schedule.room,
          semester: schedule.semesterName,
        }
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
            <p className="text-muted-foreground">
              Create and manage fixed schedules for teachers per semester
            </p>
          </div>
          <div className="flex gap-2">
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
            <Dialog open={isUnifiedDialogOpen} onOpenChange={setIsUnifiedDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1400px] w-full max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Assign Subject with Schedule</DialogTitle>
                  <DialogDescription>
                    Assign a subject to a teacher and set up schedules with department, year, and section information.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAssignSubmit}>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="subjectId">Subject</Label>
                          <Select
                            value={assignmentFormData.subjectId}
                            onValueChange={(value) => {
                              const selectedSubject = subjects.find(s => s.id === value);
                              setAssignmentFormData(prev => ({ 
                                ...prev, 
                                subjectId: value,
                                courseId: selectedSubject?.courseId || ""
                              }));
                              fetchSubjectSchedules(value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.code} - {subject.name} {subject.teacherId ? "(Assigned)" : "(Available)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="teacherId">Teacher</Label>
                          <Select
                            value={assignmentFormData.teacherId}
                            onValueChange={(value) => setAssignmentFormData(prev => ({ ...prev, teacherId: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="courseId">Course</Label>
                          <Select
                            value={assignmentFormData.courseId}
                            onValueChange={(value) => setAssignmentFormData(prev => ({ ...prev, courseId: value }))}
                          >
                            <SelectTrigger className="w-full">
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
                        
                        {assignmentFormData.teacherId && (
                          <TeacherSchedulePreview 
                            teacherId={assignmentFormData.teacherId} 
                            refreshTrigger={teacherScheduleRefreshTrigger}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <ScheduleAssignment
                          schedules={assignmentSchedules}
                          onSchedulesChange={setAssignmentSchedules}
                          departments={departments}
                          sections={sections}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoadingSchedules}>
                      {isLoadingSchedules ? "Assigning..." : "Assign Subject"}
                    </Button>
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
              <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedules.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all semesters
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedules.filter(s => s.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">
                With schedules
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Being scheduled
              </p>
            </CardContent>
          </Card>
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
                  placeholder="Search by teacher, subject, room, or semester..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-7">
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
                      {departments.map(department => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name} ({department.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Filter by Teacher</Label>
                  <Select value={selectedTeacher || "all"} onValueChange={(v) => {
                    setSelectedTeacher(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All teachers</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Filter by Year</Label>
                  <Select value={selectedYear || "all"} onValueChange={(v) => {
                    setSelectedYear(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="5th Year">5th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Filter by Section</Label>
                  <Select value={selectedSection || "all"} onValueChange={(v) => {
                    setSelectedSection(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Schedule Display */}
        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
              Fixed schedules set by admin. Teachers can request overrides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : viewMode === "table" ? (
              <div className="space-y-4">
                {/* Table Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pageSize">Show:</Label>
                    <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      of {getFilteredSchedules().length} schedules
                    </span>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("teacherName")}
                      >
                        <div className="flex items-center gap-2">
                          Teacher
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("subjectCode")}
                      >
                        <div className="flex items-center gap-2">
                          Subject
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("semesterName")}
                      >
                        <div className="flex items-center gap-2">
                          Semester
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("dayOfWeek")}
                      >
                        <div className="flex items-center gap-2">
                          Day
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("room")}
                      >
                        <div className="flex items-center gap-2">
                          Room
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("department")}
                      >
                        <div className="flex items-center gap-2">
                          Department
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("year")}
                      >
                        <div className="flex items-center gap-2">
                          Year
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("section")}
                      >
                        <div className="flex items-center gap-2">
                          Section
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedSchedules().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="p-0">
                          <EmptyState
                            icon={<Calendar className="w-12 h-12" />}
                            title="No schedules found"
                            description="Create schedules to assign teachers to subjects with specific days and times. Schedules help organize the academic calendar."
                            action={
                              <Button onClick={() => setIsUnifiedDialogOpen(true)}>
                                Create Schedule
                              </Button>
                            }
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedSchedules().map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.teacherName}</TableCell>
                          <TableCell>{schedule.subjectCode}</TableCell>
                          <TableCell>{schedule.semesterName}</TableCell>
                          <TableCell>{schedule.dayName}</TableCell>
                          <TableCell>
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </TableCell>
                          <TableCell>{schedule.room || "-"}</TableCell>
                          <TableCell>{schedule.department || "-"}</TableCell>
                          <TableCell>{schedule.year || "-"}</TableCell>
                          <TableCell>{schedule.section || "-"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(schedule)}
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

                {/* Pagination */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={getTotalPages()}
                  itemsPerPage={pageSize}
                  totalItems={getFilteredSchedules().length}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  itemName="schedules"
                />
              </div>
            ) : (
              <div className="w-full">
                <CalendarSchedule events={getCalendarEvents()} useSimpleCalendar={true} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Schedule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] w-full">
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
              <DialogDescription>
                Update the schedule information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editTeacherId">Teacher</Label>
                    <Select value={editFormData.teacherId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, teacherId: value, subjectId: "" }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editSubjectId">Subject</Label>
                    <Select 
                      value={editFormData.subjectId} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, subjectId: value }))}
                      disabled={!editFormData.teacherId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubjectsForTeacher(editFormData.teacherId).map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code} - {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editSemesterId">Semester</Label>
                  <Select value={editFormData.semesterId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, semesterId: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map(semester => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name} ({semester.academicYearName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editDayOfWeek">Day of Week</Label>
                    <Select value={editFormData.dayOfWeek} onValueChange={(value) => setEditFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editStartTime">Start Time</Label>
                    <Input
                      id="editStartTime"
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editEndTime">End Time</Label>
                    <Input
                      id="editEndTime"
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editRoom">Room (Optional)</Label>
                  <Input
                    id="editRoom"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Room 101, Lab A"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="editDepartment">Department</Label>
                    <Select value={editFormData.department} onValueChange={(value) => setEditFormData(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.name}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="editYear">Year Level</Label>
                    <Select value={editFormData.year} onValueChange={(value) => setEditFormData(prev => ({ ...prev, year: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="5th Year">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="editSection">Section</Label>
                    <Select
                      value={editFormData.sectionId}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, sectionId: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const filteredSections = sections.filter(section => 
                            !editFormData.department || 
                            section.departmentId === departments.find(d => d.name === editFormData.department)?.id
                          );
                          
                          if (filteredSections.length === 0 && editFormData.department) {
                            return (
                              <div className="p-2 text-sm text-muted-foreground">
                                No sections available for {editFormData.department}. Please create sections for this department first.
                              </div>
                            );
                          }
                          
                          return filteredSections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Schedule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
