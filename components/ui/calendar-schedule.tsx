"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { SimpleCalendar } from "./simple-calendar";
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

interface CalendarScheduleProps {
  events: CalendarEvent[];
  onEventClick?: (event: any) => void;
  useSimpleCalendar?: boolean;
}

export function CalendarSchedule({ events, onEventClick, useSimpleCalendar = false }: CalendarScheduleProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('CalendarSchedule events:', events);
  }, [events]);

  // Use simple calendar if requested
  if (useSimpleCalendar) {
    return <SimpleCalendar events={events} onEventClick={onEventClick} />;
  }

  useEffect(() => {
    let mounted = true;

    const loadCalendar = async () => {
      if (typeof window === "undefined" || !calendarRef.current || !mounted) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Import FullCalendar components
        const { Calendar } = await import("@fullcalendar/core");
        const dayGridPlugin = await import("@fullcalendar/daygrid");
        const timeGridPlugin = await import("@fullcalendar/timegrid");
        const interactionPlugin = await import("@fullcalendar/interaction");

        // Destroy existing calendar if it exists
        if (calendar) {
          calendar.destroy();
        }

        if (!mounted || !calendarRef.current) {
          return;
        }

        const newCalendar = new Calendar(calendarRef.current, {
          plugins: [dayGridPlugin.default, timeGridPlugin.default, interactionPlugin.default],
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },
          initialView: 'timeGridWeek',
          editable: false,
          selectable: true,
          selectMirror: true,
          dayMaxEvents: true,
          weekends: true,
          events: events || [],
          eventClick: onEventClick,
          height: 'auto',
          slotMinTime: '00:00:00',
          slotMaxTime: '23:59:59',
          allDaySlot: false,
          nowIndicator: true,
          businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '07:00',
            endTime: '18:00',
          },
          eventDidMount: (info) => {
            // Add tooltip with schedule details
            const props = info.event.extendedProps;
            const tooltipText = [
              info.event.title,
              props?.subject ? `Subject: ${props.subject}` : '',
              props?.teacher ? `Teacher: ${props.teacher}` : '',
              props?.room ? `Room: ${props.room}` : '',
              props?.semester ? `Semester: ${props.semester}` : ''
            ].filter(Boolean).join('\n');
            
            info.el.title = tooltipText;
          }
        });

        await newCalendar.render();
        
        if (mounted) {
          setCalendar(newCalendar);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading calendar:', error);
        if (mounted) {
          setError('Failed to load calendar');
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadCalendar();
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (calendar) {
        calendar.destroy();
      }
    };
  }, [events]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Calendar Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[600px] relative">
      <div ref={calendarRef} className="h-full" />
      {(!events || events.length === 0) && (
        <div className="absolute inset-0 bg-background/80">
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No schedules found"
            description="Create some schedules to see them displayed in this calendar view. Schedules will appear as colored blocks spanning their duration."
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}
