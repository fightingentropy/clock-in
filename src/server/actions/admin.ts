"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { Workplace } from "@/lib/types";
import { getDb, nowIso } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
export type CreateWorkerActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const createWorkerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["worker", "admin"]).default("worker"),
  workplaceId: z.string().uuid().optional(),
});

export const createWorker = async (values: z.infer<typeof createWorkerSchema>) => {
  await requireAdmin();
  const input = createWorkerSchema.parse(values);
  const db = getDb();

  const existing = db
    .query<{ user_id: string }>(
      "SELECT user_id FROM user_profiles WHERE email = ? LIMIT 1",
    )
    .get(input.email);

  if (existing) {
    throw new Error("User with this email already exists");
  }

  const userId = randomUUID();
  const passwordHash = await Bun.password.hash(input.password);
  const timestamp = nowIso();

  const transaction = db.transaction(() => {
    db.query(
      "INSERT INTO user_profiles (user_id, email, password_hash, full_name, phone, role, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '{}', ?, ?)",
    ).run(userId, input.email, passwordHash, input.fullName, input.phone ?? null, input.role, timestamp, timestamp);

    if (input.workplaceId) {
      try {
        db.query(
          "INSERT INTO worker_assignments (id, worker_id, workplace_id, assigned_at) VALUES (?, ?, ?, ?)",
        ).run(randomUUID(), userId, input.workplaceId, timestamp);
      } catch (error) {
        if (!(error instanceof Error && "code" in error && (error as { code: string }).code === "SQLITE_CONSTRAINT")) {
          throw error;
        }
      }
    }
  });

  transaction();

  revalidatePath("/dashboard");
  return { success: true };
};

const upsertWorkplaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_m: z.number().min(10).default(50),
});

export const upsertWorkplace = async (values: z.infer<typeof upsertWorkplaceSchema>) => {
  await requireAdmin();
  const input = upsertWorkplaceSchema.parse(values);
  const db = getDb();
  const timestamp = nowIso();

  const payload = {
    name: input.name,
    description: input.description ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_m: input.radius_m,
  } satisfies Partial<Workplace>;

  if (input.id) {
    db.query(
      "UPDATE workplaces SET name = ?, description = ?, latitude = ?, longitude = ?, radius_m = ?, updated_at = ? WHERE id = ?",
    ).run(
      payload.name,
      payload.description,
      payload.latitude,
      payload.longitude,
      payload.radius_m,
      timestamp,
      input.id,
    );
  } else {
    db.query(
      "INSERT INTO workplaces (id, name, description, latitude, longitude, radius_m, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      randomUUID(),
      payload.name,
      payload.description,
      payload.latitude,
      payload.longitude,
      payload.radius_m,
      timestamp,
      timestamp,
    );
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const deleteWorkplaceSchema = z.object({ id: z.string().uuid() });

export const deleteWorkplace = async (values: z.infer<typeof deleteWorkplaceSchema>) => {
  await requireAdmin();
  const input = deleteWorkplaceSchema.parse(values);
  const db = getDb();

  db.query("DELETE FROM workplaces WHERE id = ?").run(input.id);

  revalidatePath("/dashboard");
  return { success: true };
};

const updateWorkerProfileSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["worker", "admin"]).optional(),
});

export const updateWorkerProfile = async (
  values: z.infer<typeof updateWorkerProfileSchema>,
) => {
  await requireAdmin();
  const input = updateWorkerProfileSchema.parse(values);
  const db = getDb();
  const timestamp = nowIso();

  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.role !== undefined) payload.role = input.role;

  if (Object.keys(payload).length) {
    const assignments: [string, unknown][] = Object.entries(payload);
    const columns = assignments.map(([key]) => `${key} = ?`).join(", ");
    const valuesToBind = assignments.map(([, value]) => value);
    db.query(
      `UPDATE user_profiles SET ${columns}, updated_at = ? WHERE user_id = ?`,
    ).run(...valuesToBind, timestamp, input.userId);
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const assignmentSchema = z.object({
  workerId: z.string().min(1),
  workplaceId: z.string().uuid(),
});

export const assignWorkerToWorkplace = async (
  values: z.infer<typeof assignmentSchema>,
) => {
  await requireAdmin();
  const input = assignmentSchema.parse(values);
  const db = getDb();

  try {
    db.query(
      "INSERT INTO worker_assignments (id, worker_id, workplace_id, assigned_at) VALUES (?, ?, ?, ?)",
    ).run(randomUUID(), input.workerId, input.workplaceId, nowIso());
  } catch (error) {
    if (!(error instanceof Error && "code" in error && (error as { code: string }).code === "SQLITE_CONSTRAINT")) {
      throw error;
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const removeAssignmentSchema = z.object({
  workerId: z.string().min(1),
  workplaceId: z.string().uuid(),
});

export const removeWorkerAssignment = async (
  values: z.infer<typeof removeAssignmentSchema>,
) => {
  await requireAdmin();
  const input = removeAssignmentSchema.parse(values);
  const db = getDb();

  db.query(
    "DELETE FROM worker_assignments WHERE worker_id = ? AND workplace_id = ?",
  ).run(input.workerId, input.workplaceId);

  revalidatePath("/dashboard");
  return { success: true };
};

const adminClockSchema = z.object({
  workerId: z.string().min(1),
  workplaceId: z.string().uuid(),
  action: z.enum(["clock-in", "clock-out"]),
});

export const adminClock = async (values: z.infer<typeof adminClockSchema>) => {
  const { profile } = await requireAdmin();
  const input = adminClockSchema.parse(values);
  const db = getDb();
  const timestamp = nowIso();

  if (input.action === "clock-in") {
    db.query(
      "INSERT INTO time_entries (id, worker_id, workplace_id, clock_in_at, method, created_by, created_at) VALUES (?, ?, ?, ?, 'admin', ?, ?)",
    ).run(
      randomUUID(),
      input.workerId,
      input.workplaceId,
      timestamp,
      profile.user_id,
      timestamp,
    );
  } else {
    const activeEntry = db
      .query<{ id: string }>(
        "SELECT id FROM time_entries WHERE worker_id = ? AND workplace_id = ? AND clock_out_at IS NULL ORDER BY clock_in_at DESC LIMIT 1",
      )
      .get(input.workerId, input.workplaceId);

    if (!activeEntry) {
      throw new Error("No active shift found");
    }

    db.query(
      "UPDATE time_entries SET clock_out_at = ?, created_by = ?, method = 'admin' WHERE id = ?",
    ).run(timestamp, profile.user_id, activeEntry.id);
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const getString = (value: FormDataEntryValue | null) => (value ? String(value) : "");
const getOptionalString = (value: FormDataEntryValue | null) => (value ? String(value) : undefined);
const getNumber = (value: FormDataEntryValue | null) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const createWorkerAction = async (
  _prevState: CreateWorkerActionState,
  formData: FormData,
): Promise<CreateWorkerActionState> => {
  try {
    await createWorker({
      email: getString(formData.get("email")),
      password: getString(formData.get("password")),
      fullName: getString(formData.get("fullName")),
      phone: getOptionalString(formData.get("phone")),
      role: (getString(formData.get("role")) as "worker" | "admin") || "worker",
      workplaceId: getOptionalString(formData.get("workplaceId")),
    });

    return {
      status: "success",
      message: "Worker created successfully.",
    };
  } catch (error) {
    console.error("Failed to create worker:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "An unexpected error occurred while creating the worker.",
    };
  }
};

export const upsertWorkplaceAction = async (formData: FormData) => {
  const latitude = getNumber(formData.get("latitude"));
  const longitude = getNumber(formData.get("longitude"));
  const radius_m = getNumber(formData.get("radius_m"));

  if (latitude === undefined || longitude === undefined || radius_m === undefined) {
    throw new Error("Invalid workplace coordinates or radius");
  }

  await upsertWorkplace({
    id: getOptionalString(formData.get("id")),
    name: getString(formData.get("name")),
    description: getOptionalString(formData.get("description")),
    latitude,
    longitude,
    radius_m,
  });
};

export const deleteWorkplaceAction = async (formData: FormData) => {
  await deleteWorkplace({
    id: getString(formData.get("id")),
  });
};

export const assignWorkerAction = async (formData: FormData) => {
  const workplaceId = getOptionalString(formData.get("workplaceId"));

  if (!workplaceId) {
    throw new Error("Select a workplace before assigning.");
  }

  await assignWorkerToWorkplace({
    workerId: getString(formData.get("workerId")),
    workplaceId,
  });
};

export const removeAssignmentAction = async (formData: FormData) => {
  await removeWorkerAssignment({
    workerId: getString(formData.get("workerId")),
    workplaceId: getString(formData.get("workplaceId")),
  });
};

export const adminClockAction = async (formData: FormData) => {
  const workplaceId = getOptionalString(formData.get("workplaceId"));

  if (!workplaceId) {
    throw new Error("Select a workplace before clocking in or out.");
  }

  await adminClock({
    workerId: getString(formData.get("workerId")),
    workplaceId,
    action: getString(formData.get("action")) as "clock-in" | "clock-out",
  });
};
