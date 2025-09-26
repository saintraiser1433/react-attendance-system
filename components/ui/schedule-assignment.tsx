"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, Clock, Calendar, ChevronDown, ChevronRight } from "lucide-react";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  department?: string;
  year?: string;
  section?: string;
  sectionId?: string | null;
}

interface ScheduleAssignmentProps {
  schedules: ScheduleSlot[];
  onSchedulesChange: (schedules: ScheduleSlot[]) => void;
  departments?: Array<{ id: string; name: string }>;
  years?: Array<{ value: string; label: string }>;
  sections?: Array<{ id: string; name: string }>;
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

const DEFAULT_YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

// Helper function to convert 24-hour time to 12-hour format
function formatTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
}

export function ScheduleAssignment({ schedules, onSchedulesChange, departments = [], years = [], sections = [] }: ScheduleAssignmentProps) {
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    room: "",
    department: "",
    year: "",
    sectionId: null as string | null
  });
  const [isOpen, setIsOpen] = useState(false);

  const addSchedule = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent form submission
    e?.stopPropagation();
    
    // Check for time conflicts with existing schedules on the same day
    const conflictingSchedule = schedules.find(s => 
      s.dayOfWeek === newSchedule.dayOfWeek &&
      (
        (newSchedule.startTime >= s.startTime && newSchedule.startTime < s.endTime) ||
        (newSchedule.endTime > s.startTime && newSchedule.endTime <= s.endTime) ||
        (newSchedule.startTime <= s.startTime && newSchedule.endTime >= s.endTime)
      )
    );
    
    if (conflictingSchedule) {
      // You could show a toast error here
      return; // Don't add conflicting schedule
    }

    const selectedSection = sections.find(s => s.id === newSchedule.sectionId);
    const schedule: ScheduleSlot = {
      id: `temp-${Date.now()}`,
      dayOfWeek: newSchedule.dayOfWeek,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      room: newSchedule.room,
      department: newSchedule.department,
      year: newSchedule.year,
      section: selectedSection?.name || "",
      sectionId: newSchedule.sectionId
    };

    onSchedulesChange([...schedules, schedule]);
    
    // Reset form
    setNewSchedule({
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
      room: "",
      department: "",
      year: "",
      sectionId: null as string | null
    });
  };

  const removeSchedule = (id: string) => {
    onSchedulesChange(schedules.filter(s => s.id !== id));
  };

  const updateSchedule = (id: string, field: keyof ScheduleSlot, value: string | number) => {
    onSchedulesChange(schedules.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || "Unknown";
  };

  const getAvailableDays = () => {
    // Return all days - we now allow multiple schedules per day
    return DAYS_OF_WEEK;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule Assignment</span>
                {schedules.length > 0 && (
                  <Badge variant="secondary">{schedules.length} schedule(s)</Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              Set specific days and times for this subject. Multiple schedules can be added for the same day as long as they don't conflict in time.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        {/* Add New Schedule */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Add New Schedule</h4>
            <Badge variant="outline" className="text-xs">
              {getAvailableDays().length} day(s) available
            </Badge>
          </div>
          
          {/* First Row: Day and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Day of Week</Label>
              <Select 
                value={newSchedule.dayOfWeek.toString()} 
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {getAvailableDays().map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time</Label>
              <Input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Time</Label>
              <Input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Second Row: Location and Academic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Room</Label>
              <Input
                type="text"
                value={newSchedule.room}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, room: e.target.value }))}
                placeholder="e.g., Room 101, Lab A"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Select 
                value={newSchedule.department} 
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Year Level</Label>
              <Select 
                value={newSchedule.year} 
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {(years.length > 0 ? years : DEFAULT_YEARS).map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Section</Label>
              <Select 
                value={newSchedule.sectionId || ""} 
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, sectionId: value || null }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Add Button */}
          <div className="flex justify-end">
            <Button 
              type="button"
              onClick={addSchedule}
              disabled={getAvailableDays().length === 0}
              className="px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        {/* Current Schedules */}
        {schedules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Assigned Schedules</h4>
              <Badge variant="secondary" className="text-xs">
                {schedules.length} schedule(s)
              </Badge>
            </div>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      {/* Main Schedule Info */}
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-medium">
                              {getDayName(schedule.dayOfWeek)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatTo12Hour(schedule.startTime)} - {formatTo12Hour(schedule.endTime)}
                            </span>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-2">
                            {schedule.room && (
                              <Badge variant="secondary" className="text-xs">
                                📍 {schedule.room}
                              </Badge>
                            )}
                            {schedule.department && (
                              <Badge variant="outline" className="text-xs">
                                🏢 {schedule.department}
                              </Badge>
                            )}
                            {schedule.year && (
                              <Badge variant="outline" className="text-xs">
                                🎓 {schedule.year}
                              </Badge>
                            )}
                            {schedule.section && (
                              <Badge variant="outline" className="text-xs">
                                📚 {schedule.section}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSchedule(schedule.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No schedules assigned yet</p>
            <p className="text-xs">Add days and times for this subject above</p>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}








