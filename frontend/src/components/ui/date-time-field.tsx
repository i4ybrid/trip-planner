'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
});

const selectedDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateTimeValue(date: string, time: string): string {
  return date ? `${date}T${time || '09:00'}` : '';
}

function getDateTimeParts(value: string) {
  const [date = '', time = ''] = value.split('T');
  return {
    date,
    time: time || '09:00',
  };
}

function getMonthDays(viewDate: Date) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const cursor = new Date(firstOfMonth);
  cursor.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + index);
    return day;
  });
}

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onInteract?: () => string | void;
  error?: string;
  optional?: boolean;
  className?: string;
}

export function DateTimeField({
  label,
  value,
  onChange,
  onInteract,
  error,
  optional = false,
  className,
}: DateTimeFieldProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const selected = getDateTimeParts(value);
  const selectedDate = selected.date ? new Date(`${selected.date}T00:00`) : null;
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const todayValue = formatDateValue(new Date());
  const monthDays = getMonthDays(viewDate);

  const handleOpenCalendar = () => {
    const interactionValue = onInteract?.();
    const nextSelected = getDateTimeParts(typeof interactionValue === 'string' ? interactionValue : value);
    if (nextSelected.date) {
      setViewDate(new Date(`${nextSelected.date}T00:00`));
    }
    setIsCalendarOpen((current) => !current);
  };

  const handleSelectDate = (date: Date) => {
    onChange(buildDateTimeValue(formatDateValue(date), selected.time));
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    onChange(buildDateTimeValue(selected.date || formatDateValue(new Date()), time));
  };

  return (
    <div className={cn('relative', className)}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <button
          type="button"
          onClick={handleOpenCalendar}
          className={cn(
            'flex h-12 min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/75 px-3 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            error && 'border-destructive/60 focus-visible:ring-destructive'
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <span className={cn('truncate', !selectedDate && 'text-muted-foreground')}>
              {selectedDate ? selectedDateFormatter.format(selectedDate) : 'Select date'}
            </span>
          </span>
        </button>

        <div
          className={cn(
            'flex h-12 items-center gap-2 rounded-lg border border-border/70 bg-background/75 px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
            error && 'border-destructive/60 focus-within:ring-destructive'
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-accent" />
          <input
            type="time"
            value={selected.time}
            onFocus={() => onInteract?.()}
            onChange={(event) => handleTimeChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {isCalendarOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full max-w-sm rounded-lg border border-border/70 bg-card/95 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">{monthFormatter.format(viewDate)}</p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dayValue = formatDateValue(day);
              const isSelected = selected.date === dayValue;
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isToday = dayValue === todayValue;

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    isSelected && 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                    !isSelected && isToday && 'border border-primary/50 text-primary',
                    !isSelected && !isToday && isCurrentMonth && 'text-foreground hover:bg-secondary',
                    !isSelected && !isToday && !isCurrentMonth && 'text-muted-foreground/45 hover:bg-secondary/70'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}
