"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  Flag,
  List,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  addDays,
  addMonths,
  formatDay,
  getMonthGrid,
  isSameDay,
  startOfWeek,
} from "@/components/calendar/calendar-utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  dateValue,
  idValue,
  labelize,
  relativeDate,
  rows,
  stringValue,
  type DashboardRow,
} from "@/components/dashboard/dashboard-utils";
import { useCalendarData } from "@/hooks/use-calendar-data";
import { useCreateRecord, useDeleteRecord, useUpdateRecord } from "@/hooks/use-table";

type View = "month" | "week" | "day" | "agenda";
type Kind = "event" | "assignment" | "delivery";
type CalendarItem = {
  id: string;
  sourceId: string;
  kind: Kind;
  title: string;
  start: Date;
  end: Date;
  color: string;
  row: DashboardRow;
  editable: boolean;
  description: string;
  projectId: string;
  clientId: string;
  assigneeId: string;
  priority: string;
  status: string;
  category: string;
};
type Values = {
  title: string;
  description: string;
  start: string;
  end: string;
  type: string;
  color: string;
  projectId: string;
  clientId: string;
  priority: string;
  status: string;
  recurrence: string;
};
type Filters = { query: string; project: string; team: string; status: string; category: string };

const views: View[] = ["month", "week", "day", "agenda"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const colors: Record<string, string> = {
  violet: "bg-violet-300/18 text-violet-100 ring-violet-300/25",
  cyan: "bg-cyan-300/15 text-cyan-100 ring-cyan-300/25",
  amber: "bg-amber-300/15 text-amber-100 ring-amber-300/25",
  rose: "bg-rose-300/15 text-rose-100 ring-rose-300/25",
  emerald: "bg-emerald-300/15 text-emerald-100 ring-emerald-300/25",
};
const dots: Record<string, string> = {
  violet: "bg-violet-300",
  cyan: "bg-cyan-300",
  amber: "bg-amber-300",
  rose: "bg-rose-300",
  emerald: "bg-emerald-300",
};
const input = "auth-input min-h-11 w-full";
const panel = "cfy-calendar-panel rounded-[16px] border border-[#27344d] bg-[#101b30] shadow-[0_18px_45px_rgba(0,0,0,.16)]";

export function CalendarContent({ email }: { email: string | null }) {
  const data = useCalendarData();
  const create = useCreateRecord("calendar_events");
  const update = useUpdateRecord("calendar_events");
  const remove = useDeleteRecord("calendar_events");
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState<{ item: CalendarItem | null; values: Values } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tabletPanel, setTabletPanel] = useState(false);
  const [daySheet, setDaySheet] = useState(false);
  const [pendingItems, setPendingItems] = useState<CalendarItem[]>([]);
  const [filters, setFilters] = useState<Filters>({ query: "", project: "", team: "", status: "", category: "" });
  const deferredQuery = useDeferredValue(filters.query.trim().toLowerCase());

  const projects = rows(data.projects.data);
  const clients = rows(data.clients.data);
  const people = rows(data.teamMembers.data).concat(rows(data.memberships.data));
  const baseItems = useMemo(
    () => calendarItems(rows(data.calendarEvents.data), rows(data.assignments.data), rows(data.deliverables.data)),
    [data.calendarEvents.data, data.assignments.data, data.deliverables.data],
  );
  const allItems = useMemo(() => [...pendingItems, ...baseItems], [pendingItems, baseItems]);
  const items = useMemo(
    () => allItems.filter((item) => {
      const searchText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return (!deferredQuery || searchText.includes(deferredQuery))
        && (!filters.project || item.projectId === filters.project)
        && (!filters.team || item.assigneeId === filters.team)
        && (!filters.status || item.status === filters.status)
        && (!filters.category || item.category === filters.category);
    }),
    [allItems, deferredQuery, filters.project, filters.team, filters.status, filters.category],
  );
  const busy = data.calendarEvents.isLoading && data.assignments.isLoading;

  const navigate = useCallback((direction: -1 | 1) => {
    setCursor((current) => view === "month" ? addMonths(current, direction) : addDays(current, direction * (view === "week" ? 7 : 1)));
  }, [view]);
  const openNew = useCallback((date = cursor) => setForm({ item: null, values: emptyValues(date) }), [cursor]);
  const chooseDay = useCallback((date: Date) => {
    setSelectedDay(date);
    if (window.matchMedia("(max-width: 767px)").matches) setDaySheet(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (form || selected || isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft") navigate(-1);
      if (event.key === "ArrowRight") navigate(1);
      if (event.key.toLowerCase() === "t") { const today = new Date(); setCursor(today); setSelectedDay(today); }
      const shortcut = views.find((item) => item[0] === event.key.toLowerCase());
      if (shortcut) setView(shortcut);
      if (event.key.toLowerCase() === "n") openNew();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [form, selected, navigate, openNew]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !form.values.title.trim()) return toast.error("Add an event title.");
    if (new Date(form.values.end) <= new Date(form.values.start)) return toast.error("End time must be after the start time.");
    const payload = eventPayload(form.values, rows(data.workspaces.data)[0]);
    const optimistic = form.item ? null : optimisticItem(form.values);
    if (optimistic) setPendingItems((current) => [optimistic, ...current]);
    try {
      if (form.item) await update.mutateAsync({ id: form.item.sourceId, input: payload });
      else await create.mutateAsync(payload);
      toast.success(form.item ? "Event updated" : "Event added to calendar");
      setForm(null);
    } catch {
      toast.error("Couldn’t save the event. Check your connection and workspace permissions.");
    } finally {
      if (optimistic) setPendingItems((current) => current.filter((item) => item.id !== optimistic.id));
    }
  };
  const reschedule = async (item: CalendarItem, date: Date) => {
    if (!item.editable) {
      toast.info("Linked work dates are managed from their source record.");
      return;
    }
    const duration = Math.max(30 * 60_000, item.end.getTime() - item.start.getTime());
    const start = new Date(date);
    start.setHours(item.start.getHours(), item.start.getMinutes());
    try {
      await update.mutateAsync({ id: item.sourceId, input: {
        start_at: start.toISOString(), start_date: start.toISOString(),
        end_at: new Date(start.getTime() + duration).toISOString(), end_date: new Date(start.getTime() + duration).toISOString(),
      } });
      toast.success("Event rescheduled");
    } catch { toast.error("Couldn’t reschedule event."); }
  };
  const deleteItem = async (item: CalendarItem) => {
    if (!item.editable) return toast.info("Linked work records can be managed in their source module.");
    try {
      await remove.mutateAsync(item.sourceId);
      setSelected(null);
      toast.success("Event deleted");
    } catch { toast.error("Couldn’t delete event."); }
  };
  const duplicate = (item: CalendarItem) => {
    const values = itemValues(item);
    setSelected(null);
    setForm({ item: null, values: { ...values, title: `${values.title} copy` } });
  };

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="cfy-calendar cfy-shell overflow-x-clip text-zinc-100 lg:flex">
      <DashboardSidebar email={email} />
      <div className="relative min-w-0 flex-1">
        <DashboardHeader workspaces={rows(data.workspaces.data)} />
        <main className="relative mx-auto w-full max-w-[1920px] px-2.5 pb-24 pt-4 sm:px-5 sm:pt-6 lg:px-6 lg:pb-10 xl:px-8">
          <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-[-.05em] text-white sm:text-3xl">Calendar</h1>
              <p className="mt-1 hidden text-sm text-zinc-500 sm:block">Deadlines, deliveries, team schedules, and milestones in one place.</p>
            </div>
            <button onClick={() => openNew()} className="cfy-primary-button hidden min-h-11 shrink-0 px-4 text-sm sm:inline-flex">
              <Plus className="size-4" />Add event
            </button>
          </header>

          <FilterBar
            filters={filters}
            open={filtersOpen}
            projects={projects}
            people={people}
            onOpen={() => setFiltersOpen((current) => !current)}
            onChange={setFilters}
          />

          <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(270px,1fr)] xl:gap-5">
            <section className={`${panel} min-w-0 overflow-clip`}>
              <CalendarToolbar
                cursor={cursor}
                view={view}
                onToday={() => { const today = new Date(); setCursor(today); setSelectedDay(today); }}
                onView={setView}
                onPrev={() => navigate(-1)}
                onNext={() => navigate(1)}
              />
              <SwipeSurface onPrevious={() => navigate(-1)} onNext={() => navigate(1)}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${view}-${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`}
                    initial={reduceMotion ? false : { opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    {busy ? <CalendarSkeleton /> : view === "month" ? (
                      <MonthGrid
                        cursor={cursor}
                        items={items}
                        selectedDay={selectedDay}
                        onSelect={chooseDay}
                        onOpen={setSelected}
                        onNew={openNew}
                        onDrop={reschedule}
                      />
                    ) : view === "agenda" ? (
                      <AgendaView cursor={cursor} items={items} onOpen={setSelected} onNew={openNew} />
                    ) : (
                      <ScheduleView cursor={cursor} view={view} items={items} onOpen={setSelected} onNew={openNew} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </SwipeSurface>
            </section>

            <aside className="hidden min-w-0 lg:block">
              <InsightPanel
                selectedDay={selectedDay}
                cursor={cursor}
                items={items}
                people={people}
                onOpen={setSelected}
                onSelectDay={setSelectedDay}
                onAdd={openNew}
              />
            </aside>
          </div>

          <div className="mt-4 hidden md:block lg:hidden">
            <button
              type="button"
              aria-expanded={tabletPanel}
              onClick={() => setTabletPanel((current) => !current)}
              className={`${panel} flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold`}
            >
              Agenda & insights <ChevronDown className={`size-4 transition ${tabletPanel ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {tabletPanel && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                  <InsightPanel selectedDay={selectedDay} cursor={cursor} items={items} people={people} onOpen={setSelected} onSelectDay={setSelectedDay} onAdd={openNew} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={() => openNew(selectedDay)}
        aria-label="Add calendar event"
        className="cfy-primary-button fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 size-14 rounded-full p-0 shadow-[0_18px_45px_rgba(105,86,221,.48)] sm:hidden"
      >
        <Plus className="size-5" />
      </button>

      <AnimatePresence>
        {daySheet && (
          <DayBottomSheet
            date={selectedDay}
            items={items.filter((item) => isSameDay(item.start, selectedDay))}
            onClose={() => setDaySheet(false)}
            onOpen={(item) => { setDaySheet(false); setSelected(item); }}
            onAdd={() => { setDaySheet(false); openNew(selectedDay); }}
          />
        )}
        {selected && (
          <DetailsPanel
            item={selected}
            projects={projects}
            clients={clients}
            people={people}
            attachments={rows(data.attachments.data)}
            comments={rows(data.comments.data)}
            activity={rows(data.activity.data)}
            onClose={() => setSelected(null)}
            onEdit={() => setForm({ item: selected, values: itemValues(selected) })}
            onDuplicate={() => duplicate(selected)}
            onDelete={() => void deleteItem(selected)}
          />
        )}
        {form && (
          <EventForm
            form={form}
            projects={projects}
            clients={clients}
            onChange={(values) => setForm({ ...form, values })}
            onClose={() => setForm(null)}
            onSubmit={save}
            busy={create.isPending || update.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterBar({ filters, open, projects, people, onOpen, onChange }: {
  filters: Filters; open: boolean; projects: DashboardRow[]; people: DashboardRow[];
  onOpen: () => void; onChange: (filters: Filters) => void;
}) {
  const active = [filters.project, filters.team, filters.status, filters.category].filter(Boolean).length;
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  return (
    <section className={`${panel} p-2.5 sm:p-3`} aria-label="Calendar filters">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search calendar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={filters.query} onChange={(event) => set("query", event.target.value)} className={`${input} pl-9`} placeholder="Search events, tasks, milestones…" />
        </label>
        <button type="button" onClick={onOpen} aria-expanded={open} className="cfy-icon-button relative min-h-11 shrink-0 gap-2 border border-[#3a4a65] px-3">
          <Filter className="size-4" /><span className="hidden sm:inline">Filters</span>
          {active > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">{active}</span>}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-2 pt-2 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect label="Project" value={filters.project} onChange={(value) => set("project", value)}>
              {projects.map((row) => <option key={idValue(row)} value={idValue(row)}>{stringValue(row, ["name", "title"], "Project")}</option>)}
            </FilterSelect>
            <FilterSelect label="Team" value={filters.team} onChange={(value) => set("team", value)}>
              {people.map((row, index) => <option key={idValue(row) || index} value={idValue(row)}>{stringValue(row, ["name", "full_name", "email"], "Team member")}</option>)}
            </FilterSelect>
            <FilterSelect label="Status" value={filters.status} onChange={(value) => set("status", value)}>
              <option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
            </FilterSelect>
            <FilterSelect label="Category" value={filters.category} onChange={(value) => set("category", value)}>
              <option value="event">Events</option><option value="assignment">Tasks</option><option value="delivery">Deliverables</option><option value="holiday">Holidays</option><option value="milestone">Milestones</option>
            </FilterSelect>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={input}><option value="">All {label.toLowerCase()}s</option>{children}</select></label>;
}

function CalendarToolbar({ cursor, view, onToday, onView, onPrev, onNext }: {
  cursor: Date; view: View; onToday: () => void; onView: (view: View) => void; onPrev: () => void; onNext: () => void;
}) {
  const title = view === "month"
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(cursor)
    : formatDay(cursor);
  return (
    <div className="sticky top-16 z-20 border-b border-[#27344d] bg-[#142039]/95 p-2.5 backdrop-blur-xl sm:static sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <button onClick={onPrev} aria-label="Previous period" className="cfy-icon-button size-11 shrink-0 border border-[#3a4a65]"><ChevronLeft className="size-4" /></button>
        <button onClick={onToday} className="cfy-icon-button min-h-11 shrink-0 border border-[#3a4a65] px-3 text-xs font-semibold">Today</button>
        <h2 className="min-w-0 flex-1 truncate px-1 text-center text-sm font-semibold text-zinc-100 sm:text-left sm:text-base">{title}</h2>
        <button onClick={onNext} aria-label="Next period" className="cfy-icon-button size-11 shrink-0 border border-[#3a4a65]"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-2 grid grid-cols-4 rounded-xl border border-[#2d3d58] bg-[#101b30] p-1 sm:ml-auto sm:mt-0">
        {views.map((item) => (
          <button key={item} onClick={() => onView(item)} aria-pressed={view === item} className={`min-h-9 rounded-lg px-2 text-[11px] font-semibold transition ${view === item ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(124,92,255,.3)]" : "text-zinc-400 hover:text-zinc-100"}`}>
            {labelize(item)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwipeSurface({ children, onPrevious, onNext }: { children: ReactNode; onPrevious: () => void; onNext: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => { if (event.pointerType === "touch") start.current = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || event.pointerType !== "touch") return;
    const deltaX = event.clientX - start.current.x;
    const deltaY = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) onNext();
      else onPrevious();
    }
  };
  return <div className="min-w-0 touch-pan-y" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>{children}</div>;
}

const MonthGrid = memo(function MonthGrid({ cursor, items, selectedDay, onSelect, onOpen, onNew, onDrop }: {
  cursor: Date; items: CalendarItem[]; selectedDay: Date; onSelect: (date: Date) => void;
  onOpen: (item: CalendarItem) => void; onNew: (date: Date) => void; onDrop: (item: CalendarItem, date: Date) => Promise<void>;
}) {
  const dates = useMemo(() => getMonthGrid(cursor, 0), [cursor]);
  const byDate = useMemo(() => groupItems(items), [items]);
  const dragged = useRef<CalendarItem | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelLongPress = () => { if (longPress.current) clearTimeout(longPress.current); longPress.current = null; };
  return (
    <div className="min-w-0" role="grid" aria-label={new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(cursor)}>
      <div className="grid grid-cols-7 border-b border-[#27344d]" role="row">
        {weekdays.map((day) => <div key={day} role="columnheader" className="py-2 text-center text-[9px] font-semibold uppercase tracking-[.08em] text-zinc-400 sm:py-3 sm:text-[10px]">{day}</div>)}
      </div>
      <div className="grid grid-cols-7" role="rowgroup">
        {dates.map((date) => {
          const dayItems = byDate.get(dateKey(date)) ?? [];
          const currentMonth = date.getMonth() === cursor.getMonth();
          const active = isSameDay(date, selectedDay);
          const today = isSameDay(date, new Date());
          const deadline = dayItems.some((item) => item.kind === "delivery" || item.priority === "urgent");
          return (
            <div
              key={dateKey(date)}
              role="gridcell"
              aria-selected={active}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragged.current) void onDrop(dragged.current, date); dragged.current = null; }}
              onDoubleClick={() => onNew(date)}
              onPointerDown={(event) => {
                if (event.pointerType === "touch") longPress.current = setTimeout(() => onNew(date), 650);
              }}
              onPointerUp={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onPointerMove={cancelLongPress}
              className={`group relative aspect-[.8] min-w-0 border-b border-r border-[#27344d] p-0.5 transition sm:aspect-auto sm:min-h-24 sm:p-1.5 xl:min-h-28 ${active ? "bg-violet-400/[.08]" : currentMonth ? "bg-[#101b30] hover:bg-[#142039]" : "bg-[#0d1729] hover:bg-[#111d32]"}`}
            >
              <button type="button" onClick={() => onSelect(date)} aria-label={`${formatDay(date)}, ${dayItems.length} items`} className="flex min-h-8 w-full flex-col items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:items-start">
                <span className={`flex size-7 items-center justify-center rounded-full text-[11px] transition ${today ? "bg-violet-500 font-semibold text-white shadow-[0_0_18px_rgba(124,92,255,.45)]" : active ? "ring-1 ring-violet-300 text-violet-100" : currentMonth ? "text-zinc-300" : "text-zinc-600"}`}>{date.getDate()}</span>
                <span className="mt-0.5 flex max-w-full items-center gap-0.5 sm:hidden">
                  {dayItems.slice(0, 3).map((item) => <span key={item.id} className={`size-1.5 rounded-full ${dots[item.color] ?? dots.violet}`} />)}
                  {dayItems.length > 3 && <span className="text-[8px] text-zinc-500">+{dayItems.length - 3}</span>}
                </span>
              </button>
              <div className="mt-1 hidden min-w-0 space-y-1 sm:block">
                {dayItems.slice(0, 2).map((item) => (
                  <button key={item.id} draggable={item.editable} onDragStart={() => { dragged.current = item; }} onClick={() => onOpen(item)} className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-medium ring-1 transition hover:brightness-125 ${colors[item.color] ?? colors.violet}`}>
                    <span className={`mr-1 inline-block size-1.5 rounded-full ${dots[item.color] ?? dots.violet}`} />{item.title}
                  </button>
                ))}
                {dayItems.length > 2 && <button onClick={() => onSelect(date)} className="block w-full px-1 text-left text-[9px] font-semibold text-zinc-500 hover:text-zinc-300">+{dayItems.length - 2} more</button>}
              </div>
              {deadline && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-rose-300 shadow-[0_0_8px_rgba(253,164,175,.7)]" aria-label="Deadline" />}
            </div>
          );
        })}
      </div>
    </div>
  );
});

function ScheduleView({ cursor, view, items, onOpen, onNew }: {
  cursor: Date; view: "week" | "day"; items: CalendarItem[]; onOpen: (item: CalendarItem) => void; onNew: (date: Date) => void;
}) {
  const days = view === "week" ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index)) : [cursor];
  return (
    <div className={`grid gap-px bg-[#27344d] ${view === "week" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-7" : "grid-cols-1"}`}>
      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(item.start, day)).sort((a, b) => a.start.getTime() - b.start.getTime());
        return (
          <section key={dateKey(day)} className="min-w-0 bg-[#101b30] p-3 sm:p-4">
            <button onClick={() => onNew(day)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
              <span><span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-500">{new Intl.DateTimeFormat("en", { weekday: "long" }).format(day)}</span><span className="mt-1 block text-sm font-semibold text-zinc-100">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(day)}</span></span>
              {isSameDay(day, new Date()) && <span className="cfy-badge text-[9px]">Today</span>}
            </button>
            <div className="mt-3 space-y-2">
              {dayItems.length ? dayItems.map((item) => <EventRow key={item.id} item={item} onOpen={onOpen} />) : <EmptyMini message="No events" onAdd={() => onNew(day)} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgendaView({ cursor, items, onOpen, onNew }: { cursor: Date; items: CalendarItem[]; onOpen: (item: CalendarItem) => void; onNew: (date: Date) => void }) {
  const range = Array.from({ length: 30 }, (_, index) => addDays(cursor, index));
  const populated = range.map((date) => ({ date, items: items.filter((item) => isSameDay(item.start, date)) })).filter((group) => group.items.length);
  return (
    <div className="space-y-5 p-3 sm:p-5">
      {populated.length ? populated.map((group) => (
        <section key={dateKey(group.date)} className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div><p className="text-xs font-semibold text-zinc-200">{formatDay(group.date)}</p><p className="mt-1 text-[10px] text-zinc-600">{isSameDay(group.date, new Date()) ? "Today" : relativeDate(group.date)}</p></div>
          <div className="space-y-2">{group.items.map((item) => <EventRow key={item.id} item={item} onOpen={onOpen} />)}</div>
        </section>
      )) : <EmptyState title="Your agenda is clear" message="No events are scheduled in the next 30 days." onAdd={() => onNew(cursor)} />}
    </div>
  );
}

function InsightPanel({ selectedDay, cursor, items, people, onOpen, onSelectDay, onAdd }: {
  selectedDay: Date; cursor: Date; items: CalendarItem[]; people: DashboardRow[];
  onOpen: (item: CalendarItem) => void; onSelectDay: (date: Date) => void; onAdd: (date?: Date) => void;
}) {
  const now = new Date();
  const today = items.filter((item) => isSameDay(item.start, selectedDay)).sort((a, b) => a.start.getTime() - b.start.getTime());
  const upcoming = items.filter((item) => item.start >= now && !isSameDay(item.start, selectedDay)).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 4);
  const deadlines = items.filter((item) => item.kind === "delivery" || item.priority === "urgent").sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 4);
  const milestones = items.filter((item) => item.category === "milestone").slice(0, 3);
  return (
    <div className="space-y-4">
      <InsightSection title={isSameDay(selectedDay, now) ? "Today’s agenda" : formatDay(selectedDay)} icon={<Clock3 className="size-4" />} items={today} onOpen={onOpen} empty="No events scheduled." />
      <InsightSection title="Upcoming events" icon={<CalendarDays className="size-4" />} items={upcoming} onOpen={onOpen} empty="Nothing upcoming." />
      <InsightSection title="Deadlines & deliverables" icon={<Flag className="size-4" />} items={deadlines} onOpen={onOpen} empty="No deadlines approaching." />
      {milestones.length > 0 && <InsightSection title="Milestones" icon={<Check className="size-4" />} items={milestones} onOpen={onOpen} empty="" />}
      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><Users className="size-4 text-violet-300" />Team availability</h3><span className="text-[10px] text-zinc-600">{people.length} members</span></div>
        <div className="mt-3 flex -space-x-2">
          {people.slice(0, 6).map((person, index) => <span key={idValue(person) || index} title={stringValue(person, ["name", "full_name", "email"], "Team member")} className="flex size-8 items-center justify-center rounded-full border-2 border-[#101b30] bg-[#24334f] text-[10px] font-semibold text-zinc-300">{initials(stringValue(person, ["name", "full_name", "email"], "T"))}</span>)}
          {!people.length && <p className="text-xs text-zinc-600">No team members found.</p>}
        </div>
      </section>
      <MiniCalendar cursor={cursor} selectedDay={selectedDay} items={items} onSelect={onSelectDay} />
      <button onClick={() => onAdd(selectedDay)} className="cfy-primary-button min-h-11 w-full text-sm"><Plus className="size-4" />Quick add event</button>
    </div>
  );
}

function InsightSection({ title, icon, items, onOpen, empty }: { title: string; icon: ReactNode; items: CalendarItem[]; onOpen: (item: CalendarItem) => void; empty: string }) {
  return <section className={`${panel} p-4`}><h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><span className="text-violet-300">{icon}</span>{title}</h3><div className="mt-3 space-y-2">{items.length ? items.map((item) => <EventRow key={item.id} item={item} onOpen={onOpen} compact />) : <p className="rounded-xl border border-dashed border-white/[.08] px-3 py-4 text-center text-xs text-zinc-600">{empty}</p>}</div></section>;
}

function MiniCalendar({ cursor, selectedDay, items, onSelect }: { cursor: Date; selectedDay: Date; items: CalendarItem[]; onSelect: (date: Date) => void }) {
  const dates = getMonthGrid(cursor);
  return <section className={`${panel} p-4`}><h3 className="text-xs font-semibold text-zinc-200">{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(cursor)}</h3><div className="mt-3 grid grid-cols-7">{weekdays.map((day) => <span key={day} className="py-1 text-center text-[8px] font-semibold text-zinc-600">{day[0]}</span>)}{dates.map((date) => <button key={dateKey(date)} onClick={() => onSelect(date)} className={`relative flex aspect-square items-center justify-center rounded-full text-[9px] outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${isSameDay(date, selectedDay) ? "bg-violet-500 text-white" : date.getMonth() === cursor.getMonth() ? "text-zinc-400 hover:bg-white/[.05]" : "text-zinc-700"}`}>{date.getDate()}{items.some((item) => isSameDay(item.start, date)) && <span className="absolute bottom-0.5 size-0.5 rounded-full bg-violet-300" />}</button>)}</div></section>;
}

function EventRow({ item, onOpen, compact = false }: { item: CalendarItem; onOpen: (item: CalendarItem) => void; compact?: boolean }) {
  return <button onClick={() => onOpen(item)} className={`flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] text-left transition hover:border-violet-300/20 hover:bg-white/[.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${compact ? "p-2.5" : "p-3.5"}`}><span className={`size-2.5 shrink-0 rounded-full ${dots[item.color] ?? dots.violet}`} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-200">{item.title}</span><span className="mt-0.5 block truncate text-[10px] text-zinc-500">{formatTime(item.start)} · {labelize(item.kind)} · {labelize(item.priority)}</span></span><ChevronRight className="size-3.5 shrink-0 text-zinc-600" /></button>;
}

function DayBottomSheet({ date, items, onClose, onOpen, onAdd }: { date: Date; items: CalendarItem[]; onClose: () => void; onOpen: (item: CalendarItem) => void; onAdd: () => void }) {
  useModalLock(onClose);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-[2px] md:hidden"><motion.section role="dialog" aria-modal="true" aria-labelledby="day-sheet-title" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} onMouseDown={(event) => event.stopPropagation()} className="max-h-[82svh] w-full overflow-y-auto rounded-t-[24px] border border-white/[.1] bg-[#101b30] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-25px_70px_rgba(0,0,0,.5)]"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" /><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-violet-300">Selected day</p><h2 id="day-sheet-title" className="mt-1 text-lg font-semibold text-white">{formatDay(date)}</h2></div><button onClick={onClose} aria-label="Close selected day" className="cfy-icon-button size-11"><X className="size-4" /></button></div><div className="mt-4 space-y-2">{items.length ? items.map((item) => <EventRow key={item.id} item={item} onOpen={onOpen} />) : <EmptyMini message="No events scheduled" onAdd={onAdd} />}</div><button onClick={onAdd} className="cfy-primary-button mt-4 min-h-12 w-full text-sm"><Plus className="size-4" />Add event</button></motion.section></motion.div>;
}

function DetailsPanel({ item, projects, clients, people, attachments, comments, activity, onClose, onEdit, onDuplicate, onDelete }: {
  item: CalendarItem; projects: DashboardRow[]; clients: DashboardRow[]; people: DashboardRow[]; attachments: DashboardRow[]; comments: DashboardRow[]; activity: DashboardRow[];
  onClose: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  useModalLock(onClose);
  const project = projects.find((row) => idValue(row) === item.projectId);
  const client = clients.find((row) => idValue(row) === item.clientId);
  const assignee = people.find((row) => idValue(row) === item.assigneeId);
  const related = (row: DashboardRow) => [row.event_id, row.calendar_event_id, row.assignment_id, row.entity_id, row.parent_id].some((value) => String(value ?? "") === item.sourceId);
  const meetingLink = stringValue(item.row, ["meeting_link", "video_link", "url", "link"], "") || extractUrl(item.description);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-[2px] md:items-stretch md:justify-end">
      <motion.aside role="dialog" aria-modal="true" aria-labelledby="event-detail-title" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onMouseDown={(event) => event.stopPropagation()} className="flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[24px] border border-white/[.1] bg-[#101b30]/98 shadow-[-28px_0_70px_rgba(0,0,0,.45)] backdrop-blur-2xl md:max-h-none md:max-w-xl md:rounded-none md:border-y-0 md:border-r-0">
        <header className="border-b border-white/[.08] p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className={`mt-1.5 size-3 rounded-full ${dots[item.color] ?? dots.violet}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 id="event-detail-title" className="min-w-0 break-words text-xl font-semibold tracking-[-.035em] text-white">{item.title}</h2><span className="cfy-badge py-0.5 text-[10px]">{labelize(item.kind)}</span></div><p className="mt-2 text-xs text-zinc-500">{formatDay(item.start)} · {formatTime(item.start)} – {formatTime(item.end)}</p></div><button onClick={onClose} aria-label="Close event details" className="cfy-icon-button size-11 shrink-0"><X className="size-4" /></button></div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-28 sm:p-5 sm:pb-28">
          <p className="break-words text-sm leading-6 text-zinc-400">{item.description || "No notes added to this calendar item."}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Client" value={client ? stringValue(client, ["name", "company", "title"], "Client") : "Not linked"} />
            <Info label="Project" value={project ? stringValue(project, ["name", "title"], "Project") : "Not linked"} />
            <Info label="Assignee" value={assignee ? stringValue(assignee, ["name", "full_name", "email"], "Team member") : "Unassigned"} />
            <Info label="Priority" value={labelize(item.priority)} />
            <Info label="Status" value={labelize(item.status)} />
            <Info label="Deadline" value={item.kind === "delivery" ? `${formatDay(item.start)} · ${formatTime(item.start)}` : "Not a deadline"} />
          </div>
          <section className="mt-6"><h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><Video className="size-4 text-violet-300" />Meeting link</h3>{meetingLink ? <a href={meetingLink} target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 items-center justify-between rounded-xl border border-white/[.08] bg-white/[.03] px-3 text-xs text-violet-200 hover:bg-white/[.05]"><span className="truncate">{meetingLink}</span><ExternalLink className="size-3.5 shrink-0" /></a> : <p className="mt-2 text-xs text-zinc-600">No meeting link attached.</p>}</section>
          <DetailList title="Attachments" icon={<Paperclip className="size-4" />} rows={attachments.filter(related)} fallback="No attachments linked." />
          <DetailList title="Comments & notes" icon={<MessageSquare className="size-4" />} rows={comments.filter(related)} fallback="No comments yet." />
          <DetailList title="Activity timeline" icon={<Clock3 className="size-4" />} rows={activity.filter(related)} fallback="No recorded activity yet." />
        </div>
        <footer className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-2 border-t border-white/[.08] bg-[#101b30]/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <button onClick={onEdit} disabled={!item.editable} className="cfy-icon-button min-h-11 gap-2 border border-white/[.09] text-xs disabled:opacity-40"><Pencil className="size-3.5" />Edit</button>
          <button onClick={onDuplicate} className="cfy-icon-button min-h-11 gap-2 border border-white/[.09] text-xs"><Copy className="size-3.5" />Duplicate</button>
          <button onClick={onDelete} disabled={!item.editable} className="cfy-icon-button min-h-11 gap-2 border border-red-300/[.16] text-xs text-red-200 disabled:opacity-40"><Trash2 className="size-3.5" />Delete</button>
        </footer>
      </motion.aside>
    </motion.div>
  );
}

function EventForm({ form, projects, clients, onChange, onClose, onSubmit, busy }: {
  form: { item: CalendarItem | null; values: Values }; projects: DashboardRow[]; clients: DashboardRow[];
  onChange: (values: Values) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean;
}) {
  useModalLock(onClose);
  const set = (key: keyof Values, value: string) => onChange({ ...form.values, [key]: value });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-end bg-black/60 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-5">
      <motion.form role="dialog" aria-modal="true" aria-labelledby="event-form-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onMouseDown={(event) => event.stopPropagation()} onSubmit={onSubmit} className="cfy-modal max-h-[94svh] w-full max-w-3xl overflow-y-auto rounded-b-none sm:rounded-[24px]">
        <div className="flex items-start justify-between"><div><h2 id="event-form-title" className="text-lg font-semibold text-white">{form.item ? "Edit event" : "Create event"}</h2><p className="mt-1 text-sm text-zinc-500">Schedule a meeting, review, delivery, reminder, or milestone.</p></div><button type="button" onClick={onClose} aria-label="Close event form" className="cfy-icon-button size-11"><X className="size-4" /></button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Event title" required><input autoFocus required value={form.values.title} onChange={(event) => set("title", event.target.value)} className={input} placeholder="Client creative review" /></Field>
          <Field label="Event type"><select value={form.values.type} onChange={(event) => set("type", event.target.value)} className={input}><option>Client Meeting</option><option>Review Session</option><option>Delivery Date</option><option>Internal Task</option><option>Holiday</option><option>Personal Reminder</option><option>Project Milestone</option></select></Field>
          <Field label="Start" required><input required type="datetime-local" value={form.values.start} onChange={(event) => set("start", event.target.value)} className={input} /></Field>
          <Field label="End" required><input required type="datetime-local" value={form.values.end} onChange={(event) => set("end", event.target.value)} className={input} /></Field>
          <Field label="Project"><select value={form.values.projectId} onChange={(event) => set("projectId", event.target.value)} className={input}><option value="">No project linked</option>{projects.map((row) => <option key={idValue(row)} value={idValue(row)}>{stringValue(row, ["name", "title"], "Project")}</option>)}</select></Field>
          <Field label="Client"><select value={form.values.clientId} onChange={(event) => set("clientId", event.target.value)} className={input}><option value="">No client linked</option>{clients.map((row) => <option key={idValue(row)} value={idValue(row)}>{stringValue(row, ["name", "company", "title"], "Client")}</option>)}</select></Field>
          <Field label="Priority"><select value={form.values.priority} onChange={(event) => set("priority", event.target.value)} className={input}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field>
          <Field label="Status"><select value={form.values.status} onChange={(event) => set("status", event.target.value)} className={input}><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></Field>
          <Field label="Recurrence"><select value={form.values.recurrence} onChange={(event) => set("recurrence", event.target.value)} className={input}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field>
          <Field label="Color label"><div className="flex min-h-11 items-center gap-2">{Object.keys(colors).map((color) => <button type="button" key={color} aria-label={`${color} label`} aria-pressed={form.values.color === color} onClick={() => set("color", color)} className={`size-9 rounded-full ${dots[color]} ${form.values.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#19191f]" : "opacity-60"}`} />)}</div></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea value={form.values.description} onChange={(event) => set("description", event.target.value)} className={`${input} min-h-24 py-3`} placeholder="Add context, a meeting URL, or delivery notes…" /></Field>
        </div>
        <div className="sticky -bottom-5 -mx-5 mt-6 flex gap-2 border-t border-white/[.08] bg-[#19191f]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:-mx-6 sm:-bottom-6 sm:justify-end sm:p-5">
          <button type="button" onClick={onClose} className="cfy-icon-button min-h-11 flex-1 px-4 text-sm sm:flex-none">Cancel</button>
          <button disabled={busy} className="cfy-primary-button min-h-11 flex-1 px-4 text-sm disabled:opacity-60 sm:flex-none">{busy ? "Saving…" : form.item ? "Save changes" : "Create event"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function DetailList({ title, icon, rows: list, fallback }: { title: string; icon: ReactNode; rows: DashboardRow[]; fallback: string }) {
  return <section className="mt-6"><h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><span className="text-violet-300">{icon}</span>{title}</h3>{list.length ? <div className="mt-3 space-y-2">{list.slice(0, 6).map((row, index) => <div key={String(row.id ?? index)} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="break-words text-xs text-zinc-300">{stringValue(row, ["name", "title", "content", "message", "description"], title.slice(0, -1))}</p><p className="mt-1 text-[10px] text-zinc-600">{relativeDate(dateValue(row, ["created_at", "updated_at"]))}</p></div>)}</div> : <p className="mt-2 text-xs text-zinc-600">{fallback}</p>}</section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-[16px] border border-white/[.07] bg-white/[.025] p-3.5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-zinc-500">{label}</p><p className="mt-2 break-words text-sm text-zinc-300">{value}</p></div>;
}
function Field({ label, children, required, className }: { label: string; children: ReactNode; required?: boolean; className?: string }) {
  return <label className={`auth-field min-w-0 ${className ?? ""}`}><span>{label}{required && <span className="ml-1 text-violet-300">*</span>}</span>{children}</label>;
}
function EmptyMini({ message, onAdd }: { message: string; onAdd: () => void }) {
  return <button onClick={onAdd} className="flex min-h-20 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/[.09] px-3 text-xs text-zinc-600 transition hover:border-violet-300/25 hover:text-zinc-300"><Plus className="mb-1 size-4" />{message}</button>;
}
function EmptyState({ title, message, onAdd }: { title: string; message: string; onAdd: () => void }) {
  return <div className="flex flex-col items-center px-4 py-16 text-center"><span className="flex size-12 items-center justify-center rounded-2xl border border-white/[.08] bg-white/[.03] text-violet-300"><List className="size-5" /></span><h3 className="mt-4 text-sm font-semibold text-zinc-200">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-zinc-600">{message}</p><button onClick={onAdd} className="cfy-primary-button mt-5 min-h-11 px-4"><Plus className="size-4" />Add event</button></div>;
}
function CalendarSkeleton() {
  return <div className="cfy-skeleton-group"><div className="grid grid-cols-7 border-b border-white/[.07]">{weekdays.map((day) => <div key={day} className="py-3 text-center text-[9px] text-zinc-600">{day}</div>)}</div><div className="grid grid-cols-7 gap-px bg-[#27344d]">{Array.from({ length: 42 }, (_, index) => <div key={index} className="aspect-[.8] bg-[#101b30] p-1 sm:aspect-auto sm:min-h-24"><div className="cfy-skeleton size-6 rounded-full" /></div>)}</div></div>;
}

function useModalLock(onClose: () => void) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
}

function calendarItems(events: DashboardRow[], assignments: DashboardRow[], deliverables: DashboardRow[]) {
  const eventItems = events.map((row, index) => itemFrom(row, "event", String(row.id ?? `event-${index}`), true));
  const assignmentItems = assignments.map((row, index) => itemFrom(row, "assignment", String(row.id ?? `assignment-${index}`), false));
  const deliveryItems = deliverables.map((row, index) => itemFrom(row, "delivery", String(row.id ?? `delivery-${index}`), false));
  return [...eventItems, ...assignmentItems, ...deliveryItems].filter((item): item is CalendarItem => item !== null);
}
function itemFrom(row: DashboardRow, kind: Kind, id: string, editable: boolean): CalendarItem | null {
  const start = dateValue(row, kind === "event" ? ["start_at", "start_date", "starts_at", "date", "due_date", "created_at"] : ["due_date", "delivery_date", "deadline", "end_date", "created_at"]);
  if (!start) return null;
  const end = dateValue(row, kind === "event" ? ["end_at", "end_date", "ends_at"] : []) ?? new Date(start.getTime() + 60 * 60 * 1000);
  const type = stringValue(row, ["event_type", "type", "category"], "").toLowerCase();
  const priority = stringValue(row, ["priority"], "medium").toLowerCase();
  const category = type.includes("holiday") ? "holiday" : type.includes("milestone") ? "milestone" : kind;
  const color = stringValue(row, ["color", "color_label", "label_color"], kind === "delivery" ? "amber" : kind === "assignment" ? priority === "urgent" ? "rose" : "cyan" : type.includes("personal") || type.includes("holiday") ? "emerald" : "violet").toLowerCase();
  return {
    id: `${kind}-${id}`, sourceId: id, kind, title: stringValue(row, ["title", "name", "event_name", "task_name", "deliverable_name"], "Untitled item"),
    start, end, color: colors[color] ? color : "violet", row, editable,
    description: stringValue(row, ["description", "notes", "details", "instructions", "brief"], ""),
    projectId: String(row.project_id ?? ""), clientId: String(row.client_id ?? ""),
    assigneeId: String(row.assignee_id ?? row.assigned_to ?? row.editor_id ?? row.user_id ?? ""),
    priority, status: stringValue(row, ["status", "state"], "scheduled").toLowerCase(), category,
  };
}
function optimisticItem(values: Values): CalendarItem {
  return {
    id: `pending-${Date.now()}`, sourceId: "", kind: "event", title: values.title.trim(), start: new Date(values.start), end: new Date(values.end),
    color: values.color, row: {}, editable: false, description: values.description, projectId: values.projectId, clientId: values.clientId,
    assigneeId: "", priority: values.priority, status: values.status, category: values.type.toLowerCase().includes("milestone") ? "milestone" : values.type.toLowerCase().includes("holiday") ? "holiday" : "event",
  };
}
function emptyValues(date: Date): Values {
  const start = new Date(date);
  start.setHours(start.getHours() < 8 ? 9 : start.getHours(), 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { title: "", description: "", start: localDateTime(start), end: localDateTime(end), type: "Client Meeting", color: "violet", projectId: "", clientId: "", priority: "medium", status: "scheduled", recurrence: "none" };
}
function itemValues(item: CalendarItem): Values {
  return { title: item.title, description: item.description, start: localDateTime(item.start), end: localDateTime(item.end), type: stringValue(item.row, ["event_type", "type", "category"], "Client Meeting"), color: item.color, projectId: item.projectId, clientId: item.clientId, priority: item.priority, status: item.status, recurrence: stringValue(item.row, ["recurrence", "repeat"], "none") };
}
function eventPayload(values: Values, workspace?: DashboardRow): Record<string, unknown> {
  const start = new Date(values.start);
  const end = new Date(values.end);
  return {
    title: values.title.trim(), description: values.description || null, event_type: values.type, type: values.type,
    start_at: start.toISOString(), end_at: end.toISOString(), start_date: start.toISOString(), end_date: end.toISOString(),
    project_id: values.projectId || null, client_id: values.clientId || null, priority: values.priority, status: values.status,
    color: values.color, color_label: values.color, recurrence: values.recurrence,
    workspace_id: workspace ? idValue(workspace) || null : null,
  };
}
function groupItems(items: CalendarItem[]) {
  const grouped = new Map<string, CalendarItem[]>();
  items.forEach((item) => grouped.set(dateKey(item.start), [...(grouped.get(dateKey(item.start)) ?? []), item]));
  return grouped;
}
function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function localDateTime(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function formatTime(date: Date) { return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date); }
function initials(value: string) { return value.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function extractUrl(value: string) { return value.match(/https?:\/\/[^\s]+/)?.[0] ?? ""; }
