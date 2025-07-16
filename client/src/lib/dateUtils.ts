import { format, formatDistanceToNow } from "date-fns";

export function safeFormat(date: any, formatString: string, fallback: string = 'N/A'): string {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    return format(dateObj, formatString);
  } catch (error) {
    return fallback;
  }
}

export function safeFormatDistanceToNow(date: any, options: any = {}, fallback: string = 'Recently'): string {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    return formatDistanceToNow(dateObj, options);
  } catch (error) {
    return fallback;
  }
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  try {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}