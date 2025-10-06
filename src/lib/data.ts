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
      .select("id, workplace_id, clock_in_at")
      .eq("worker_id", userId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle<OpenEntry>(),
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
