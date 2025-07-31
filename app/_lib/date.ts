export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekRange(date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10)
  };
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}