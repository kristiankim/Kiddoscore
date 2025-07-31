'use client';

import { useState, useEffect } from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export function CalendarModal({ isOpen, onClose, onDateSelect, selectedDate }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    if (isOpen) {
      const selected = new Date(selectedDate);
      setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const today = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
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
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toISOString().slice(0, 10) === selectedDate;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isFutureDate = (date: Date) => {
    return date > today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (isFutureDate(date)) return;
    
    const dateString = date.toISOString().slice(0, 10);
    onDateSelect(dateString);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="calendar-title" className="text-lg font-semibold text-gray-900">
            Select Date
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close calendar"
          >
            ✕
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Previous month"
          >
            ←
          </button>
          <div className="font-medium text-gray-900">
            {formatMonthYear(currentMonth)}
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                onClick={() => handleDateClick(date)}
                disabled={isFuture}
                className={`
                  h-10 w-10 text-sm rounded transition-colors
                  ${!isCurrentMonthDay ? 'text-gray-300' : ''}
                  ${isTodayDate ? 'bg-blue-100 text-blue-800 font-medium' : ''}
                  ${isSelectedDate ? 'bg-blue-600 text-white' : ''}
                  ${isFuture ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${!isTodayDate && !isSelectedDate && isCurrentMonthDay && !isFuture ? 'text-gray-900' : ''}
                `}
                aria-label={`Select ${date.toLocaleDateString()}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={() => {
              const todayString = today.toISOString().slice(0, 10);
              onDateSelect(todayString);
              onClose();
            }}
            className="btn-secondary text-sm"
          >
            Today
          </button>
          <button onClick={onClose} className="btn-primary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}