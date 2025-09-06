import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import axios from "../api/axios";

type Level = "Danger" | "Success" | "Primary" | "Warning";
interface AppCalendarEvent {
  id?: string;
  title: string;
  start?: string; // ISO
  end?: string;   // ISO | undefined
  allDay?: boolean;
  extendedProps: { calendar: Level };
}

const calendarsEvents = {
  Danger: "danger",
  Success: "success",
  Primary: "primary",
  Warning: "warning",
} as const;

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<AppCalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState(""); // YYYY-MM-DD
  const [eventEndDate, setEventEndDate] = useState("");     // YYYY-MM-DD
  const [eventLevel, setEventLevel] = useState<Level>("Primary");

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const loadEvents = async (
    fetchInfo: { startStr: string; endStr: string },
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: any) => void
  ) => {
    try {
      const { data } = await axios.get("/v1/calendar-events", {
        params: { start: fetchInfo.startStr, end: fetchInfo.endStr },
      });

      const normalized: EventInput[] = (data || []).map((e: any) => ({
        id: String(e.id),
        title: e.title,
        start: e.start,
        end: e.end ?? undefined, // null -> undefined
        allDay: Boolean(e.allDay ?? e.all_day ?? true),
        extendedProps: { calendar: e.extendedProps?.calendar ?? e.level ?? "Primary" },
      }));

      successCallback(normalized);
    } catch (err) {
      console.error(err);
      failureCallback(err);
    }
  };

  const refetch = () => calendarRef.current?.getApi().refetchEvents();

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr.slice(0, 10));
    setEventEndDate((selectInfo.endStr || selectInfo.startStr).slice(0, 10));
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const e = clickInfo.event;
    const level = (e.extendedProps?.calendar as Level) || "Primary";

    setSelectedEvent({
      id: e.id,
      title: e.title,
      start: e.start ? e.start.toISOString() : undefined,
      end: e.end ? e.end.toISOString() : undefined,
      allDay: e.allDay,
      extendedProps: { calendar: level },
    });

    setEventTitle(e.title);
    setEventStartDate(e.start ? e.start.toISOString().slice(0, 10) : "");
    setEventEndDate(e.end ? e.end.toISOString().slice(0, 10) : "");
    setEventLevel(level);
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    const payload = {
      title: eventTitle.trim(),
      start: eventStartDate ? new Date(eventStartDate).toISOString() : null,
      end: eventEndDate ? new Date(eventEndDate).toISOString() : null, // backend null alabilir
      allDay: true,
      level: eventLevel,
    };

    if (!payload.title || !payload.start) return;

    try {
      if (selectedEvent?.id) {
        await axios.put(`/v1/calendar-events/${selectedEvent.id}`, payload);
      } else {
        await axios.post(`/v1/calendar-events`, payload);
      }
      closeModal();
      resetModalFields();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id) return;
    try {
      await axios.delete(`/v1/calendar-events/${selectedEvent.id}`);
      closeModal();
      resetModalFields();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  // Sürükle-bırak — tipi any (sürümden bağımsız çalışsın)
  const onEventDrop = async (arg: any) => {
    try {
      await axios.put(`/v1/calendar-events/${arg.event.id}`, {
        start: arg.event.start?.toISOString(),
        end: arg.event.end?.toISOString() ?? null,
      });
      refetch();
    } catch (e) {
      console.error(e);
      arg.revert();
    }
  };

  // Resize — tipi any
  const onEventResize = async (arg: any) => {
    try {
      await axios.put(`/v1/calendar-events/${arg.event.id}`, {
        start: arg.event.start?.toISOString(),
        end: arg.event.end?.toISOString() ?? null,
      });
      refetch();
    } catch (e) {
      console.error(e);
      arg.revert();
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Primary");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta title="Takvim" description="Etkinlik planlama ve yönetim" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={loadEvents}
            selectable
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            editable
            eventDrop={onEventDrop}
            eventResize={onEventResize}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: () => {
                  resetModalFields();
                  openModal();
                },
              },
            }}
          />
        </div>

        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-6 lg:p-10">
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on track
              </p>
            </div>

            <div className="mt-8">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Event Title
              </label>
              <input
                id="event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />

              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {(Object.keys(calendarsEvents) as Level[]).map((key) => (
                    <label key={key} className="flex items-center text-sm">
                      <input
                        className="mr-2"
                        type="radio"
                        name="event-level"
                        value={key}
                        checked={eventLevel === key}
                        onChange={() => setEventLevel(key)}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <input
                  id="event-start-date"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <input
                  id="event-end-date"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 sm:justify-end">
              {selectedEvent?.id && (
                <button
                  onClick={handleDelete}
                  type="button"
                  className="flex w-full justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Delete
                </button>
              )}
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${String(eventInfo.event.extendedProps.calendar || "").toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;