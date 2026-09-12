export type ClassCalendarRole = "CLIENTE" | "ENTRENADOR";

export function isClassCalendarDayDisabled({
  role,
  weekOffset,
  dayKey,
  todayKey,
}: {
  role: ClassCalendarRole;
  weekOffset: number;
  dayKey: string;
  todayKey: string;
}) {
  return (
    (role === "CLIENTE" || role === "ENTRENADOR") &&
    weekOffset === 0 &&
    dayKey < todayKey
  );
}

export function resolveClassCalendarSelectionAfterDayChange({
  role,
  selectedDay,
  todayKey,
}: {
  role: ClassCalendarRole;
  selectedDay: string | null;
  todayKey: string;
}) {
  if (
    !selectedDay ||
    !isClassCalendarDayDisabled({
      role,
      weekOffset: 0,
      dayKey: selectedDay,
      todayKey,
    })
  ) {
    return null;
  }

  return {
    selectedDay: todayKey,
    weekOffset: 0,
  };
}
