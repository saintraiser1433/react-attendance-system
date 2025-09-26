"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, BookOpen } from "lucide-react";

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface TeacherSchedulePreviewProps {
  teacherId: string;
  className?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function TeacherSchedulePreview({ teacherId, className, refreshTrigger }: TeacherSchedulePreviewProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [semester, setSemester] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherId) {
      fetchTeacherSchedule();
    } else {
      setSchedules([]);
      setTeacher(null);
      setAcademicYear(null);
      setSemester(null);
    }
  }, [teacherId, refreshTrigger]);

  const fetchTeacherSchedule = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}/schedule`);
      const data = await response.json();
      
      if (response.ok) {
        setSchedules(data.schedules || []);
        setTeacher(data.teacher);
        setAcademicYear(data.academicYear);
        setSemester(data.semester);
      } else {
        // More specific error handling
        if (response.status === 404) {
          setError("Teacher not found");
        } else if (response.status === 401) {
          setError("Unauthorized access");
        } else if (response.status === 500) {
          setError("Server error - please try again");
        } else {
          setError(data.error || "Failed to load schedule");
        }
      }
    } catch (error) {
      console.error("Error fetching teacher schedule:", error);
      setError("Network error - please check your connection");
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleByDay = (dayOfWeek: number) => {
    return schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
  };

  const hasSchedule = schedules.length > 0;

  if (!teacherId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Teacher Schedule</span>
          </CardTitle>
          <CardDescription>
            Select a teacher to view their current schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No teacher selected</p>
            <p className="text-xs">Choose a teacher to see their schedule</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Teacher Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Teacher Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">Error loading schedule</p>
            <p className="text-xs mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTeacherSchedule}
              className="text-xs"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Teacher Schedule</span>
        </CardTitle>
        <CardDescription>
          {teacher && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{teacher.name}</span>
                <Badge variant="outline">{teacher.employeeId}</Badge>
              </div>
              {academicYear && semester && (
                <div className="text-xs text-muted-foreground">
                  {academicYear.name} - {semester.name}
                </div>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasSchedule ? (
          <div className="space-y-4">
            {/* Weekly Schedule Grid */}
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day, index) => {
                const daySchedules = getScheduleByDay(index);
                return (
                  <div key={day} className="space-y-2">
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground">
                        {day.slice(0, 3)}
                      </div>
                    </div>
                    <div className="min-h-[80px] space-y-1">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-2 bg-muted rounded text-xs border"
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">
                              {schedule.startTime}-{schedule.endTime}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-xs">
                              {schedule.subject.code}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {schedule.subject.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Schedule Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Total Classes: {schedules.length}</span>
                </div>
                <div className="text-muted-foreground">
                  {schedules.length > 0 && (
                    <span>
                      {new Set(schedules.map(s => s.dayOfWeek)).size} day(s) per week
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">No schedule assigned</p>
            <p className="text-xs">
              {teacher?.name} has no classes scheduled for this semester
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}









