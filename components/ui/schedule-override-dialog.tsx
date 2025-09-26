"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ScheduleOverrideDialogProps {
  schedule: {
    id: string;
    subjectCode: string;
    subject: string;
    dayName: string;
    dayOfWeek: number; // 0-6 (Sun-Sat)
    startTime: string;
    endTime: string;
  };
  onOverrideCreated?: () => void;
}

export function ScheduleOverrideDialog({ schedule, onOverrideCreated }: ScheduleOverrideDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
    overrideType: "",
    newStartTime: "",
    newEndTime: "",
  });

  // Generate valid dates for the schedule's day of week
  const getValidDates = () => {
    const today = new Date();
    const validDates = [];
    
    // Generate dates for the next 8 weeks (56 days)
    for (let i = 0; i < 56; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Check if this date matches the schedule's day of week
      if (date.getDay() === schedule.dayOfWeek) {
        validDates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return validDates;
  };

  const validDates = getValidDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/teacher/schedule-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          date: formData.date,
          reason: formData.reason,
          overrideType: formData.overrideType,
          newStartTime: formData.overrideType === 'time-change' ? formData.newStartTime : undefined,
          newEndTime: formData.overrideType === 'time-change' ? formData.newEndTime : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Schedule override request submitted successfully!");
        setOpen(false);
        setFormData({
          date: "",
          reason: "",
          overrideType: "",
          newStartTime: "",
          newEndTime: "",
        });
        onOverrideCreated?.();
      } else {
        toast.error(data.error || "Failed to submit override request");
      }
    } catch (error) {
      console.error('Error submitting override request:', error);
      toast.error("Failed to submit override request");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      reason: "",
      overrideType: "",
      newStartTime: "",
      newEndTime: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Request Override
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Schedule Override</DialogTitle>
          <DialogDescription>
            Request a modification to your schedule for a specific day. This requires admin approval.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Schedule Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Schedule Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>Subject:</strong> {schedule.subjectCode} - {schedule.subject}</div>
              <div><strong>Day:</strong> {schedule.dayName}</div>
              <div><strong>Time:</strong> {schedule.startTime} - {schedule.endTime}</div>
            </div>
          </div>

          {/* Override Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Override Date *</Label>
            <Select
              value={formData.date}
              onValueChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${schedule.dayName} for override`} />
              </SelectTrigger>
              <SelectContent>
                {validDates.map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    {date.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only {schedule.dayName}s are available for this schedule
            </p>
          </div>

          {/* Override Type */}
          <div className="space-y-2">
            <Label htmlFor="overrideType">Override Type *</Label>
            <Select
              value={formData.overrideType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, overrideType: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select override type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time-change">Time Change</SelectItem>
                <SelectItem value="cancel">Cancel Class</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Times (only for time-change) */}
          {formData.overrideType === 'time-change' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newStartTime">New Start Time</Label>
                <Input
                  id="newStartTime"
                  type="time"
                  value={formData.newStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, newStartTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEndTime">New End Time</Label>
                <Input
                  id="newEndTime"
                  type="time"
                  value={formData.newEndTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, newEndTime: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need this schedule override (e.g., 'Faculty meeting scheduled', 'Medical appointment', etc.)"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <strong>Note:</strong> This request will be reviewed by an administrator. 
              You will be notified once it's approved or rejected.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}












