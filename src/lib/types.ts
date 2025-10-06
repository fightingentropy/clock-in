export type UserRole = "admin" | "worker";

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Workplace {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  created_at: string;
  updated_at: string;
}

export interface WorkerAssignment {
  id: string;
  worker_id: string;
  workplace_id: string;
  assigned_at: string;
}

export interface TimeEntry {
  id: string;
  worker_id: string;
  workplace_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  created_by: string | null;
  method: string;
  notes: string | null;
  created_at: string;
}

export interface WorkerWithAssignments extends UserProfile {
  worker_assignments?: Array<{
    workplaces: Workplace | null;
  }> | null;
}

export interface TimeEntryWithRelations extends TimeEntry {
  workplaces?: Workplace | null;
  worker?: Pick<UserProfile, "full_name" | "email"> | null;
}
