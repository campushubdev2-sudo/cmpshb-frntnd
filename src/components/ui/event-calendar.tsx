import { IlamyCalendar, useIlamyCalendarContext, type CalendarView } from "@ilamy/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CampusEventDTO } from "@/services/school-event-service";

const CALENDAR_VIEWS: CalendarView[] = ["day", "week", "month", "year"];

const CalendarHeader = ({ isAdmin }: { isAdmin: boolean }) => {
  const { currentDate, nextPeriod, prevPeriod, setView, today, openEventForm, view } =
    useIlamyCalendarContext();

  return (
    <div className="bg-card text-card-foreground flex flex-col items-center justify-between gap-4 border-b p-4 sm:flex-row">
      {/* Navigation: Order-2 on mobile for thumb accessibility */}
      <div className="order-2 flex w-full items-center justify-center gap-2 sm:order-1 sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPeriod}
          className="h-8 flex-1 sm:flex-none"
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPeriod}
          className="h-8 flex-1 cursor-pointer sm:flex-none"
        >
          Next
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={today}
          className="h-8 flex-1 cursor-pointer sm:flex-none"
        >
          Today
        </Button>
      </div>

      {/* Title: Order-1 on mobile */}
      <div className="order-1 text-lg font-bold tracking-tight sm:order-2">
        {currentDate.format("MMMM YYYY")}
      </div>

      {/* Views & Actions: Order-3 */}
      <div className="order-3 flex w-full items-center justify-center gap-2 sm:w-auto">
        <div className="bg-muted hidden items-center gap-1 rounded-lg border p-1 md:flex">
          {CALENDAR_VIEWS.map((option) => (
            <button
              key={option}
              onClick={() => setView(option)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-all",
                view === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => openEventForm()} className="h-8 w-full sm:w-auto">
            Add Event
          </Button>
        )}
      </div>
    </div>
  );
};

interface CalendarSectionProps {
  isAdmin: boolean;
  events: CampusEventDTO[];
  onEventSave?: (event: any) => void | Promise<void>;
  onEventDelete?: (eventId: string) => void | Promise<void>;
  onDateChange?: (date: Date) => void;
}

export const CalendarSection = ({ isAdmin, events, onEventSave, onEventDelete, onDateChange }: CalendarSectionProps) => {
  return (
    <div className="bg-background flex-1 overflow-hidden rounded border shadow-md">
      <IlamyCalendar
        events={events}
        initialView="month"
        dayMaxEvents={2}
        headerComponent={<CalendarHeader isAdmin={isAdmin} />}
        disableCellClick={!isAdmin}
        disableEventClick={!isAdmin}
        disableDragAndDrop={!isAdmin}
        onEventSave={onEventSave}
        onEventDelete={onEventDelete}
        onDateChange={(date) => onDateChange?.(date.toDate())}
        classesOverride={{
          disabledCell: "bg-gray-50 dark:bg-slate-800/50 opacity-30 cursor-not-allowed",
        }}
      />
    </div>
  );
};
