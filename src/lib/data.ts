import { subDays } from "date-fns";

import { getDb } from "./db";
import type {
  TimeEntryWithRelations,
  UserProfile,
  WorkerWithAssignments,
  Workplace,
} from "@/lib/types";

type OpenEntry = {
  worker_id: string;
  workplace_id: string | null;
  clock_in_at: string;
};

type UserProfileRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "worker";
  avatar_url: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

type AssignmentJoinedRow = {
  id: string;
  assigned_at: string;
  workplace_id: string;
  worker_id: string;
  w_id: string | null;
  w_name: string | null;
  w_description: string | null;
  w_latitude: number | null;
  w_longitude: number | null;
  w_radius_m: number | null;
  w_created_at: string | null;
  w_updated_at: string | null;
};

type TimeEntryJoinedRow = {
  id: string;
  worker_id: string;
  workplace_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  created_by: string | null;
  method: string;
  notes: string | null;
  created_at: string;
  w_id: string | null;
  w_name: string | null;
  w_description: string | null;
  w_latitude: number | null;
  w_longitude: number | null;
  w_radius_m: number | null;
  w_created_at: string | null;
  w_updated_at: string | null;
  worker_full_name: string | null;
  worker_email: string | null;
};

export type WorkerDetailStats = {
  totalHoursPastWeek: number;
  totalShiftsPastWeek: number;
  averageShiftDurationHours: number;
  lastClockInAt: string | null;
  lastClockOutAt: string | null;
};

export type WorkerDetailData = {
  profile: UserProfile | null;
  assignments: Array<{
    id: string;
    assigned_at: string;
    workplace_id: string;
    workplaces: Workplace | null;
  }>;
  workplaces: Workplace[];
  timeEntries: TimeEntryWithRelations[];
  activeEntry: TimeEntryWithRelations | null;
  stats: WorkerDetailStats;
};

const parseMetadata = (value: string | null): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : null;
  } catch (error) {
    console.warn("⚠️  Failed to parse metadata JSON", error);
    return null;
  }
};

const mapWorkplace = (row: AssignmentJoinedRow | TimeEntryJoinedRow): Workplace | null => {
  if (!row.w_id) {
    return null;
  }

  return {
    id: row.w_id,
    name: row.w_name ?? "",
    description: row.w_description ?? null,
    latitude: Number(row.w_latitude ?? 0),
    longitude: Number(row.w_longitude ?? 0),
    radius_m: Number(row.w_radius_m ?? 50),
    created_at: row.w_created_at ?? "",
    updated_at: row.w_updated_at ?? "",
  };
};

const mapUserProfile = (row: UserProfileRow): UserProfile => ({
  user_id: row.user_id,
  email: row.email,
  full_name: row.full_name,
  phone: row.phone,
  role: row.role,
  avatar_url: row.avatar_url,
  metadata: parseMetadata(row.metadata),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapAssignmentRow = (row: AssignmentJoinedRow) => ({
  id: row.id,
  assigned_at: row.assigned_at,
  workplace_id: row.workplace_id,
  workplaces: mapWorkplace(row),
});

const mapTimeEntryRow = (row: TimeEntryJoinedRow): TimeEntryWithRelations => ({
  id: row.id,
  worker_id: row.worker_id,
  workplace_id: row.workplace_id,
  clock_in_at: row.clock_in_at,
  clock_out_at: row.clock_out_at,
  created_by: row.created_by,
  method: row.method,
  notes: row.notes,
  created_at: row.created_at,
  workplaces: mapWorkplace(row),
  worker:
    row.worker_full_name || row.worker_email
      ? {
          full_name: row.worker_full_name,
          email: row.worker_email ?? "",
        }
      : null,
});

export const fetchWorkerData = async (userId: string) => {
  const db = getDb();

  const profileRow = db
    .query<UserProfileRow>(
      "SELECT user_id, email, full_name, phone, role, avatar_url, metadata, created_at, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1",
    )
    .get(userId);

  const assignments = db
    .query<AssignmentJoinedRow>(
      `SELECT
        wa.id,
        wa.assigned_at,
        wa.workplace_id,
        wa.worker_id,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at
      FROM worker_assignments wa
      LEFT JOIN workplaces w ON wa.workplace_id = w.id
      WHERE wa.worker_id = ?
      ORDER BY wa.assigned_at ASC`,
    )
    .all(userId)
    .map(mapAssignmentRow);

  const activeEntryRow = db
    .query<TimeEntryJoinedRow>(
      `SELECT
        te.id,
        te.worker_id,
        te.workplace_id,
        te.clock_in_at,
        te.clock_out_at,
        te.created_by,
        te.method,
        te.notes,
        te.created_at,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at,
        u.full_name AS worker_full_name,
        u.email AS worker_email
      FROM time_entries te
      LEFT JOIN workplaces w ON te.workplace_id = w.id
      LEFT JOIN user_profiles u ON te.worker_id = u.user_id
      WHERE te.worker_id = ? AND te.clock_out_at IS NULL
      ORDER BY te.clock_in_at DESC
      LIMIT 1`,
    )
    .get(userId);

  const recentEntries = db
    .query<TimeEntryJoinedRow>(
      `SELECT
        te.id,
        te.worker_id,
        te.workplace_id,
        te.clock_in_at,
        te.clock_out_at,
        te.created_by,
        te.method,
        te.notes,
        te.created_at,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at,
        u.full_name AS worker_full_name,
        u.email AS worker_email
      FROM time_entries te
      LEFT JOIN workplaces w ON te.workplace_id = w.id
      LEFT JOIN user_profiles u ON te.worker_id = u.user_id
      WHERE te.worker_id = ?
      ORDER BY te.clock_in_at DESC
      LIMIT 20`,
    )
    .all(userId)
    .map(mapTimeEntryRow);

  const workplaces = assignments
    .map((assignment) => assignment.workplaces)
    .filter((item): item is Workplace => Boolean(item));

  return {
    profile: profileRow ? mapUserProfile(profileRow) : null,
    assignments,
    workplaces,
    activeEntry: activeEntryRow ? mapTimeEntryRow(activeEntryRow) : null,
    recentEntries,
  };
};

export const fetchAdminData = async () => {
  const db = getDb();

  const workerRows = db
    .query<UserProfileRow>(
      "SELECT user_id, email, full_name, phone, role, avatar_url, metadata, created_at, updated_at FROM user_profiles ORDER BY created_at ASC",
    )
    .all();

  const assignmentRows = db
    .query<AssignmentJoinedRow>(
      `SELECT
        wa.id,
        wa.worker_id,
        wa.workplace_id,
        wa.assigned_at,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at
      FROM worker_assignments wa
      LEFT JOIN workplaces w ON wa.workplace_id = w.id`,
    )
    .all();

  const assignmentsByWorker = new Map<string, WorkerWithAssignments["worker_assignments"]>();

  for (const row of assignmentRows) {
    const collection = assignmentsByWorker.get(row.worker_id) ?? [];
    collection.push({ workplaces: mapWorkplace(row) });
    assignmentsByWorker.set(row.worker_id, collection);
  }

  const workers = workerRows.map((row) => ({
    ...mapUserProfile(row),
    worker_assignments: assignmentsByWorker.get(row.user_id) ?? [],
  }));

  const workplaces = db
    .query<Workplace>(
      "SELECT id, name, description, latitude, longitude, radius_m, created_at, updated_at FROM workplaces ORDER BY name ASC",
    )
    .all();

  const openEntries = db
    .query<OpenEntry>(
      "SELECT worker_id, workplace_id, clock_in_at FROM time_entries WHERE clock_out_at IS NULL",
    )
    .all();

  const recentEntries = db
    .query<TimeEntryJoinedRow>(
      `SELECT
        te.id,
        te.worker_id,
        te.workplace_id,
        te.clock_in_at,
        te.clock_out_at,
        te.created_by,
        te.method,
        te.notes,
        te.created_at,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at,
        u.full_name AS worker_full_name,
        u.email AS worker_email
      FROM time_entries te
      LEFT JOIN workplaces w ON te.workplace_id = w.id
      LEFT JOIN user_profiles u ON te.worker_id = u.user_id
      ORDER BY te.clock_in_at DESC
      LIMIT 25`,
    )
    .all()
    .map(mapTimeEntryRow);

  return {
    workers,
    workplaces,
    openEntries,
    recentEntries,
  };
};

export const fetchWorkerDetail = async (workerId: string): Promise<WorkerDetailData> => {
  const db = getDb();

  const profileRow = db
    .query<UserProfileRow>(
      "SELECT user_id, email, full_name, phone, role, avatar_url, metadata, created_at, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1",
    )
    .get(workerId);

  const assignments = db
    .query<AssignmentJoinedRow>(
      `SELECT
        wa.id,
        wa.assigned_at,
        wa.workplace_id,
        wa.worker_id,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at
      FROM worker_assignments wa
      LEFT JOIN workplaces w ON wa.workplace_id = w.id
      WHERE wa.worker_id = ?
      ORDER BY wa.assigned_at ASC`,
    )
    .all(workerId)
    .map(mapAssignmentRow);

  const timeEntries = db
    .query<TimeEntryJoinedRow>(
      `SELECT
        te.id,
        te.worker_id,
        te.workplace_id,
        te.clock_in_at,
        te.clock_out_at,
        te.created_by,
        te.method,
        te.notes,
        te.created_at,
        w.id AS w_id,
        w.name AS w_name,
        w.description AS w_description,
        w.latitude AS w_latitude,
        w.longitude AS w_longitude,
        w.radius_m AS w_radius_m,
        w.created_at AS w_created_at,
        w.updated_at AS w_updated_at,
        u.full_name AS worker_full_name,
        u.email AS worker_email
      FROM time_entries te
      LEFT JOIN workplaces w ON te.workplace_id = w.id
      LEFT JOIN user_profiles u ON te.worker_id = u.user_id
      WHERE te.worker_id = ?
      ORDER BY te.clock_in_at DESC`,
    )
    .all(workerId)
    .map(mapTimeEntryRow);

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
    profile: profileRow ? mapUserProfile(profileRow) : null,
    assignments,
    workplaces: assignments
      .map((assignment) => assignment.workplaces)
      .filter((item): item is Workplace => Boolean(item)),
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
