"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { EmptyState } from "./empty-state";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
}

interface SimpleCalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: any) => void;
}

export function SimpleCalendar({ events, onEventClick }: SimpleCalendarProps) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Format time function
  const formatTime = (time: string) => {
    try {
      // Handle different time formats
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

  // Create a grid layout with proper rowspan
  const createCalendarGrid = () => {
    const gridItems: Array<{
      type: 'time' | 'cell' | 'event';
      dayIndex?: number;
      timeIndex?: number;
      event?: CalendarEvent & { duration: number; backgroundColor: string; startRow: number };
      content?: string;
    }> = [];

    // Add time labels and empty cells
    timeSlots.forEach((time, timeIndex) => {
      // Time label
      gridItems.push({
        type: 'time',
        timeIndex,
        content: formatTime(time)
      });

      // Day cells
      daysOfWeek.forEach((day, dayIndex) => {
        gridItems.push({
          type: 'cell',
          dayIndex,
          timeIndex
        });
      });
    });

    // Add events with proper positioning
    events.forEach(event => {
      const dayIndex = new Date(event.start).getDay();
      const startTime = event.start.split('T')[1];
      const endTime = event.end.split('T')[1];
      
      // Parse times
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');
      
      const startHour = parseInt(startParts[0]);
      const startMinute = parseInt(startParts[1]);
      const endHour = parseInt(endParts[0]);
      const endMinute = parseInt(endParts[1] || '0');
      
      // Find the start row (which hour slot the event starts in)
      const startRow = timeSlots.findIndex(slot => parseInt(slot.split(':')[0]) === startHour);
      
      // Calculate how many time slots to span
      // For 8:46 AM - 10:46 AM: should span from 8:00 AM to 10:00 AM (2 slots)
      // For 12:00 AM - 1:00 AM: should span from 12:00 AM to 1:00 AM (1 slot)
      let durationSlots = 1;
      
      if (endHour > startHour) {
        // Different hours: span from start hour to end hour
        durationSlots = endHour - startHour;
        // If end time is not at the start of the hour, add one more slot
        if (endMinute > 0) {
          durationSlots += 1;
        }
      } else if (endHour === startHour) {
        // Same hour: check if it spans to next hour
        if (endMinute > startMinute) {
          durationSlots = 1; // Within same hour
        } else {
          durationSlots = 1; // Default to 1 slot
        }
      }
      
      // Ensure minimum 1 slot
      durationSlots = Math.max(1, durationSlots);
      
      if (startRow !== -1) {
        gridItems.push({
          type: 'event',
          dayIndex,
          timeIndex: startRow,
          event: {
            ...event,
            duration: durationSlots,
            backgroundColor: generateRandomColor(event.id + event.title),
            startRow
          }
        });
      }
    });

    return gridItems;
  };

  const gridItems = createCalendarGrid();

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="bg-muted p-4 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold">Schedule Calendar</h3>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <div 
          className="grid border-collapse"
          style={{
            gridTemplateColumns: `80px repeat(${daysOfWeek.length}, 1fr)`,
            gridTemplateRows: `repeat(${timeSlots.length}, 40px)`,
            width: '100%'
          }}
        >
          {/* Header row */}
          <div className="p-2 border bg-muted/50 font-medium text-sm text-left">Time</div>
          {daysOfWeek.map((day) => (
            <div key={day} className="p-2 border bg-muted/50 font-medium text-sm text-center">
              {day}
            </div>
          ))}

          {/* Grid items */}
          {gridItems.map((item, index) => {
            if (item.type === 'time') {
              return (
                <div
                  key={`time-${item.timeIndex}`}
                  className="p-2 border bg-muted/30 text-xs font-medium flex items-center"
                  style={{
                    gridRow: `${item.timeIndex! + 2}`,
                    gridColumn: '1'
                  }}
                >
                  {item.content}
                </div>
              );
            }

            if (item.type === 'cell') {
              return (
                <div
                  key={`cell-${item.dayIndex}-${item.timeIndex}`}
                  className="p-1 border relative"
                  style={{
                    gridRow: `${item.timeIndex! + 2}`,
                    gridColumn: `${item.dayIndex! + 2}`
                  }}
                >
                  {/* Empty cell */}
                </div>
              );
            }

            if (item.type === 'event' && item.event) {
              const event = item.event;
              
              
              return (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded cursor-pointer hover:opacity-80 m-1"
                  style={{
                    backgroundColor: event.backgroundColor,
                    color: 'white',
                    fontSize: '10px',
                    lineHeight: '1.2',
                    gridRow: `${event.startRow + 2} / ${event.startRow + 2 + event.duration}`,
                    gridColumn: `${item.dayIndex! + 2}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '32px',
                  }}
                  onClick={() => onEventClick?.(event)}
                  title={`${event.title}\n${formatTime(event.start)} - ${formatTime(event.end)}`}
                >
                  <div className="truncate font-medium">{event.title}</div>
                  <div className="text-xs opacity-90">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
      
      {events.length === 0 && (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No schedules found"
          description="Create some schedules to see them displayed in this calendar view. Schedules will appear as colored blocks spanning their duration."
          className="h-64"
        />
      )}
    </div>
  );
}









