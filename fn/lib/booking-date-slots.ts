export type BookingDateSlot = { label: string; date: Date; id: number };

/** Midnight local time � avoids timezone drift in comparisons and display. */
export const startOfLocalDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addLocalDays = (base: Date, days: number) => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return startOfLocalDay(next);
};

export const getBookingDayName = (date: Date) => {
  const today = startOfLocalDay();
  const d1 = startOfLocalDay(date);
  const diffDays = Math.round(
    (d1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
};

/** Today, tomorrow, and the day after tomorrow (recomputed from the current calendar day). */
export const buildBookingDateSlots = (): BookingDateSlot[] => {
  const today = startOfLocalDay();
  return [0, 1, 2].map((offset, id) => {
    const date = addLocalDays(today, offset);
    return { label: getBookingDayName(date), date, id };
  });
};
