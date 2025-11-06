import { subDays } from "date-fns";

import type { TimeEntryWithRelations, UserProfile, WorkerWithAssignments, Workplace } from "@/lib/types";
import { getSupabaseAdmin } from "./supabase";

type OpenEntry = {
  worker_id: string;
  workplace_id: string | null;
  clock_in_at: string;
};

type AssignmentRow = {
  id: string;
  assigned_at: string;
  workplace_id: string;
  workplaces: Workplace | null;
};

type RecentRow = TimeEntryWithRelations;

type WorkerRow = WorkerWithAssignments;

type ProfileRow = UserProfile;

export type WorkerDetailStats = {
  totalHoursPastWeek: number;
  totalShiftsPastWeek: number;
  averageShiftDurationHours: number;
  lastClockInAt: string | null;
  lastClockOutAt: string | null;
};

export type WorkerDetailData = {
  profile: ProfileRow | null;
  assignments: AssignmentRow[];
  workplaces: Workplace[];
  timeEntries: TimeEntryWithRelations[];
  activeEntry: TimeEntryWithRelations | null;
  stats: WorkerDetailStats;
};

export const fetchWorkerData = async (userId: string) => {
  const supabase = getSupabaseAdmin();

  const [profileRes, assignmentsRes, openEntryRes, recentRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle<ProfileRow>(),
    supabase
      .from("worker_assignments")
      .select("id, assigned_at, workplace_id, workplaces(*)")
      .eq("worker_id", userId)
      .returns<AssignmentRow[]>(),
    supabase
      .from("time_entries")
      .select(
        "id, worker_id, workplace_id, clock_in_at, clock_out_at, created_by, method, notes, created_at, workplaces(name), worker:worker_id(full_name, email)",
      )
      .eq("worker_id", userId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle<TimeEntryWithRelations>(),
    supabase
      .from("time_entries")
      .select(
        "id, workplace_id, clock_in_at, clock_out_at, method, workplaces(name), worker:worker_id(full_name, email)",
      )
      .eq("worker_id", userId)
      .order("clock_in_at", { ascending: false })
      .limit(20)
      .returns<RecentRow[]>(),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (assignmentsRes.error) throw new Error(assignmentsRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);
  if (openEntryRes.error) throw new Error(openEntryRes.error.message);

  const workplaces = (assignmentsRes.data ?? []).map((assignment) => assignment.workplaces).filter(Boolean) as Workplace[];

  return {
    profile: profileRes.data ?? null,
    assignments: assignmentsRes.data ?? [],
    workplaces,
    activeEntry: openEntryRes.data ?? null,
    recentEntries: recentRes.data ?? [],
  };
};

export const fetchAdminData = async () => {
  const supabase = getSupabaseAdmin();

  const [workersRes, workplacesRes, openEntriesRes, recentRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*, worker_assignments(id, workplace_id, workplaces(*))")
      .order("created_at", { ascending: true })
      .returns<WorkerRow[]>(),
    supabase.from("workplaces").select("*").order("name").returns<Workplace[]>(),
    supabase
      .from("time_entries")
      .select("worker_id, workplace_id, clock_in_at")
      .is("clock_out_at", null)
      .returns<OpenEntry[]>(),
    supabase
      .from("time_entries")
      .select(
        "id, worker_id, workplace_id, clock_in_at, clock_out_at, method, workplaces(name), worker:worker_id(full_name, email)",
      )
      .order("clock_in_at", { ascending: false })
      .limit(25)
      .returns<RecentRow[]>(),
  ]);

  if (workersRes.error) throw new Error(workersRes.error.message);
  if (workplacesRes.error) throw new Error(workplacesRes.error.message);
  if (openEntriesRes.error) throw new Error(openEntriesRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  return {
    workers: workersRes.data ?? [],
    workplaces: workplacesRes.data ?? [],
    openEntries: openEntriesRes.data ?? [],
    recentEntries: recentRes.data ?? [],
  };
};

export const fetchWorkerDetail = async (workerId: string): Promise<WorkerDetailData> => {
  const supabase = getSupabaseAdmin();

  const [profileRes, assignmentsRes, timeEntriesRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", workerId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("worker_assignments")
      .select("id, assigned_at, workplace_id, workplaces(*)")
      .eq("worker_id", workerId)
      .order("assigned_at", { ascending: true })
      .returns<AssignmentRow[]>(),
    supabase
      .from("time_entries")
      .select(
        "id, worker_id, workplace_id, clock_in_at, clock_out_at, created_by, method, notes, created_at, workplaces(*), worker:worker_id(full_name, email)",
      )
      .eq("worker_id", workerId)
      .order("clock_in_at", { ascending: false })
      .returns<TimeEntryWithRelations[]>(),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (assignmentsRes.error) throw new Error(assignmentsRes.error.message);
  if (timeEntriesRes.error) throw new Error(timeEntriesRes.error.message);

  const profile = profileRes.data ?? null;
  const assignments = assignmentsRes.data ?? [];
  const workplaces = assignments
    .map((assignment) => assignment.workplaces)
    .filter((item): item is Workplace => Boolean(item));
  const timeEntries = timeEntriesRes.data ?? [];

  const activeEntry = timeEntries.find((entry) => entry.clock_out_at === null) ?? null;

  const now = new Date();
  const weekStart = subDays(now, 7);

  let totalDurationMs = 0;
  let shiftCount = 0;
  const completedDurations: number[] = [];
  let lastClockInAt: string | null = null;
  let lastClockOutAt: string | null = null;

  for (const entry of timeEntries) {
    const clockIn = new Date(entry.clock_in_at);
    const clockOut = entry.clock_out_at ? new Date(entry.clock_out_at) : null;

    if (!lastClockInAt) {
      lastClockInAt = entry.clock_in_at;
      if (entry.clock_out_at) {
        lastClockOutAt = entry.clock_out_at;
      }
    }

    const entryEnd = clockOut ?? now;
    if (entryEnd < weekStart) {
      continue;
    }

    const overlapStart = clockIn > weekStart ? clockIn : weekStart;
    const overlapEnd = entryEnd;
    const durationMs = overlapEnd.getTime() - overlapStart.getTime();

    if (durationMs <= 0) {
      continue;
    }

    totalDurationMs += durationMs;
    shiftCount += 1;

    if (clockOut) {
      completedDurations.push(clockOut.getTime() - clockIn.getTime());
      if (!lastClockOutAt) {
        lastClockOutAt = entry.clock_out_at;
      }
    }
  }

  const totalHoursPastWeek = totalDurationMs / (1000 * 60 * 60);
  const averageShiftDurationHours = completedDurations.length
    ? completedDurations.reduce((acc, duration) => acc + duration, 0) /
      completedDurations.length /
      (1000 * 60 * 60)
    : 0;

  return {
    profile,
    assignments,
    workplaces,
    timeEntries,
    activeEntry,
    stats: {
      totalHoursPastWeek,
      totalShiftsPastWeek: shiftCount,
      averageShiftDurationHours,
      lastClockInAt,
      lastClockOutAt,
    },
  };
};
