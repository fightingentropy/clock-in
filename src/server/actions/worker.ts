"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { Workplace } from "@/lib/types";
import { getDb, nowIso } from "@/lib/db";
import { requireProfile } from "@/lib/session";
import { distanceInMeters } from "@/lib/geo";

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type AssignmentRow = {
  workplace_id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  created_at: string;
  updated_at: string;
};

export const workerClockIn = async (values: z.infer<typeof coordinateSchema>) => {
  const { profile } = await requireProfile();
  const input = coordinateSchema.parse(values);
  const db = getDb();

  const assignments = db
    .query<AssignmentRow>(
      `SELECT
        wa.workplace_id,
        w.name,
        w.description,
        w.latitude,
        w.longitude,
        w.radius_m,
        w.created_at,
        w.updated_at
      FROM worker_assignments wa
      JOIN workplaces w ON wa.workplace_id = w.id
      WHERE wa.worker_id = ?`,
    )
    .all(profile.user_id);

  if (!assignments || assignments.length === 0) {
    throw new Error("No assigned workplaces");
  }

  const matched = assignments
    .map((assignment) => {
      const distance = distanceInMeters(
        Number(assignment.latitude),
        Number(assignment.longitude),
        input.latitude,
        input.longitude,
      );
      return {
        workplace: assignment,
        distance,
      };
    })
    .filter((entry): entry is { workplace: AssignmentRow; distance: number } => {
      if (!entry) return false;
      const radius = Number(entry.workplace.radius_m ?? 50);
      return entry.distance <= radius;
    })
    .sort((a, b) => a.distance - b.distance)[0];

  if (!matched) {
    throw new Error("You are outside of your workplace radius");
  }

  const activeEntry = db
    .query<{ id: string }>(
      "SELECT id FROM time_entries WHERE worker_id = ? AND clock_out_at IS NULL ORDER BY clock_in_at DESC LIMIT 1",
    )
    .get(profile.user_id);

  if (activeEntry) {
    throw new Error("You are already clocked in");
  }

  const timestamp = nowIso();

  db.query(
    "INSERT INTO time_entries (id, worker_id, workplace_id, clock_in_at, method, created_by, created_at) VALUES (?, ?, ?, ?, 'self', ?, ?)",
  ).run(
    randomUUID(),
    profile.user_id,
    matched.workplace.workplace_id,
    timestamp,
    profile.user_id,
    timestamp,
  );

  revalidatePath("/dashboard");
  return {
    success: true,
    workplace: {
      id: matched.workplace.workplace_id,
      name: matched.workplace.name,
      description: matched.workplace.description,
      latitude: matched.workplace.latitude,
      longitude: matched.workplace.longitude,
      radius_m: matched.workplace.radius_m,
      created_at: matched.workplace.created_at,
      updated_at: matched.workplace.updated_at,
    } satisfies Workplace,
  };
};

export const workerClockOut = async () => {
  const { profile } = await requireProfile();
  const db = getDb();

  const activeEntry = db
    .query<{ id: string }>(
      "SELECT id FROM time_entries WHERE worker_id = ? AND clock_out_at IS NULL ORDER BY clock_in_at DESC LIMIT 1",
    )
    .get(profile.user_id);

  if (!activeEntry) {
    throw new Error("You are not clocked in");
  }

  db.query(
    "UPDATE time_entries SET clock_out_at = ?, method = 'self' WHERE id = ?",
  ).run(nowIso(), activeEntry.id);

  revalidatePath("/dashboard");
  return { success: true };
};

const updateSelfSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export const updateSelfProfile = async (values: z.infer<typeof updateSelfSchema>) => {
  const { profile } = await requireProfile();
  const input = updateSelfSchema.parse(values);
  const db = getDb();
  const timestamp = nowIso();

  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.phone !== undefined) payload.phone = input.phone;

  if (!Object.keys(payload).length) {
    return { success: true };
  }

  const assignments = Object.entries(payload);
  const columns = assignments.map(([key]) => `${key} = ?`).join(", ");
  const valuesToBind = assignments.map(([, value]) => value);
  db.query(
    `UPDATE user_profiles SET ${columns}, updated_at = ? WHERE user_id = ?`,
  ).run(...valuesToBind, timestamp, profile.user_id);

  revalidatePath("/dashboard");
  return { success: true };
};

const numberFromForm = (value: FormDataEntryValue | null) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const workerClockInAction = async (formData: FormData) => {
  await workerClockIn({
    latitude: numberFromForm(formData.get("latitude")) ?? 0,
    longitude: numberFromForm(formData.get("longitude")) ?? 0,
  });
};

export const workerClockOutAction = async () => {
  await workerClockOut();
};

export const updateSelfProfileAction = async (formData: FormData) => {
  await updateSelfProfile({
    fullName: formData.get("fullName") ? String(formData.get("fullName")) : undefined,
    phone: formData.get("phone") ? String(formData.get("phone")) : undefined,
  });
};
