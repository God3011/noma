import { format, parse, addDays, subDays, isToday, isYesterday, isTomorrow } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function getToday(): string {
    return format(new Date(), DATE_FORMAT);
}

export function formatDate(dateStr: string): string {
    const date = parse(dateStr, DATE_FORMAT, new Date());
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
}

export function getNextDay(dateStr: string): string {
    const date = parse(dateStr, DATE_FORMAT, new Date());
    return format(addDays(date, 1), DATE_FORMAT);
}

export function getPrevDay(dateStr: string): string {
    const date = parse(dateStr, DATE_FORMAT, new Date());
    return format(subDays(date, 1), DATE_FORMAT);
}

export function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return format(date, 'h:mm a');
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}
