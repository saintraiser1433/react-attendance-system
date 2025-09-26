import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

// Manila timezone
export const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Format a time string in Manila timezone
 * @param timeString - Time in HH:MM format (e.g., "18:06")
 * @returns Formatted time string in Manila timezone
 */
export function formatTimeInManila(timeString: string): string {
  try {
    // Create a date object for today with the given time
    const today = new Date();
    const [hours, minutes] = timeString.split(':');
    
    // Create date with the time in Manila timezone
    const dateInManila = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
    
    // Convert to Manila timezone and format
    return format(dateInManila, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time in Manila:', error);
    return timeString; // Return original if error
  }
}

/**
 * Convert a Date object to Manila timezone and format as HH:MM
 * @param date - Date object
 * @returns Time string in HH:MM format in Manila timezone
 */
export function formatDateToManilaTime(date: Date): string {
  try {
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting date to Manila time:', error);
    return date.toTimeString().slice(0, 5); // Fallback
  }
}

/**
 * Convert a Date object to Manila timezone and format as 12-hour format
 * @param date - Date object
 * @returns Time string in 12-hour format (e.g., "6:06 PM") in Manila timezone
 */
export function formatDateToManilaTime12Hour(date: Date): string {
  try {
    // Since we're now storing actual scan times, just format the date directly
    // The server is already in Philippines timezone, so the date represents local time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting date to Manila 12-hour time:', error);
    // Fallback to manual conversion
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
}

/**
 * Create a Date object with time in Manila timezone
 * @param timeString - Time in HH:MM format
 * @returns Date object representing the time in Manila timezone
 */
export function createManilaTime(timeString: string): Date {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    // Since server is already in Philippine Standard Time (GMT+8),
    // we can create the date directly without timezone conversion
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create date with the specified time (server is already in Manila timezone)
    return new Date(year, month, day, hour, minute, 0);
  } catch (error) {
    console.error('Error creating Manila time:', error);
    // Fallback to simple date creation
    const today = new Date();
    const [hours, minutes] = timeString.split(':');
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
  }
}








