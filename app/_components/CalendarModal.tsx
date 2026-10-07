"use client";

import {
  useState,
  useEffect,
  useRef,
  type RefObject,
  type MouseEvent,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: (motion: "pointer" | "keyboard") => void;
  motion: "pointer" | "keyboard";
  returnFocusRef: RefObject<HTMLButtonElement>;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export function CalendarModal({
  isOpen,
  onClose,
  onDateSelect,
  selectedDate,
  motion,
  returnFocusRef,
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const selected = new Date(selectedDate + "T12:00:00");
    setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [isOpen, selectedDate]);

  const today = new Date();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const days = [];
  const current = new Date(startDate);

  // Generate 6 weeks of days
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return toLocalDateString(date) === selectedDate;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isFutureDate = (date: Date) => {
    return date > today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateClick = (
    date: Date,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (!isOpen || isFutureDate(date)) return;

    const dateString = toLocalDateString(date);
    onDateSelect(dateString);
    onClose(event.detail === 0 ? "keyboard" : "pointer");
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      modal
      onOpenChange={(open, details) => {
        if (open || !isOpen) return;
        const event = details.event;
        const keyboard =
          event.type === "keydown" ||
          event.type === "keyup" ||
          (event.type === "click" && "detail" in event && event.detail === 0);
        onClose(keyboard ? "keyboard" : "pointer");
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="calendar-backdrop"
          data-motion={motion}
        />
        <DialogPrimitive.Popup
          className="calendar-panel"
          data-motion={motion}
          initialFocus={closeButtonRef}
          finalFocus={returnFocusRef}
        >
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title
              id="calendar-title"
              className="text-lg font-semibold text-gray-900"
            >
              Select Date
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              ref={closeButtonRef}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              aria-label="Close calendar"
            >
              ✕
            </DialogPrimitive.Close>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Previous month"
            >
              ←
            </button>
            <div className="font-medium text-gray-900">
              {formatMonthYear(currentMonth)}
            </div>
            <button
              onClick={goToNextMonth}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              const isFuture = isFutureDate(date);

              return (
                <button
                  key={index}
                  onClick={(event) => handleDateClick(date, event)}
                  disabled={isFuture}
                  className={`
                  h-11 w-full min-w-0 text-sm rounded-lg transition-colors
                  ${!isCurrentMonthDay && !isSelectedDate && !isFuture ? "text-muted-foreground" : ""}
                  ${isTodayDate && !isSelectedDate ? "bg-brand-light text-brand font-medium" : ""}
                  ${isSelectedDate ? "bg-brand text-white" : ""}
                  ${isFuture ? "text-gray-400 cursor-not-allowed" : isSelectedDate ? "hover:bg-brand-dark" : "hover:bg-muted"}
                  ${!isTodayDate && !isSelectedDate && isCurrentMonthDay && !isFuture ? "text-gray-900" : ""}
                `}
                  aria-label={`Select ${date.toLocaleDateString()}`}
                  aria-pressed={isSelectedDate}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={(event) => {
                if (!isOpen) return;
                const todayString = toLocalDateString(today);
                onDateSelect(todayString);
                onClose(event.detail === 0 ? "keyboard" : "pointer");
              }}
              className="btn-secondary text-sm"
            >
              Today
            </button>
            <button
              onClick={(event) =>
                isOpen && onClose(event.detail === 0 ? "keyboard" : "pointer")
              }
              className="btn-primary text-sm"
            >
              Close
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
