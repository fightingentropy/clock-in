"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Workplace } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireProfile } from "@/lib/session";
import { distanceInMeters } from "@/lib/geo";

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type AssignmentRow = {
  workplace_id: string;
  workplaces: Workplace | null;
};

export const workerClockIn = async (values: z.infer<typeof coordinateSchema>) => {
  const { profile } = await requireProfile();
  const input = coordinateSchema.parse(values);
  const supabase = getSupabaseAdmin();

  const { data: assignments, error: assignmentsError } = await supabase
    .from("worker_assignments")
    .select("workplace_id, workplaces(*)")
    .eq("worker_id", profile.user_id)
    .returns<AssignmentRow[]>();

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  if (!assignments || assignments.length === 0) {
    throw new Error("No assigned workplaces");
  }

  const matched = assignments
    .map((assignment) => {
      const workplace = assignment.workplaces;
      if (!workplace) return null;
      const distance = distanceInMeters(
        Number(workplace.latitude),
        Number(workplace.longitude),
        input.latitude,
        input.longitude,
      );
      return {
        workplace,
        distance,
      };
    })
    .filter((entry): entry is { workplace: Workplace; distance: number } => {
      if (!entry) return false;
      const radius = Number(entry.workplace.radius_m ?? 50);
      return entry.distance <= radius;
    })
    .sort((a, b) => a.distance - b.distance)[0];

  if (!matched) {
    throw new Error("You are outside of your workplace radius");
  }

  const { data: activeEntry, error: activeError } = await supabase
    .from("time_entries")
    .select("id")
    .eq("worker_id", profile.user_id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (activeError) {
    throw new Error(activeError.message);
  }

  if (activeEntry) {
    throw new Error("You are already clocked in");
  }

  const { error } = await supabase.from("time_entries").insert({
    worker_id: profile.user_id,
    workplace_id: matched.workplace.id,
    clock_in_at: new Date().toISOString(),
    method: "self",
    created_by: profile.user_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true, workplace: matched.workplace };
};

export const workerClockOut = async () => {
  const { profile } = await requireProfile();
  const supabase = getSupabaseAdmin();

  const { data: activeEntry, error: activeError } = await supabase
    .from("time_entries")
    .select("id")
    .eq("worker_id", profile.user_id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (activeError) {
    throw new Error(activeError.message);
  }

  if (!activeEntry) {
    throw new Error("You are not clocked in");
  }

  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_out_at: new Date().toISOString(),
      method: "self",
    })
    .eq("id", activeEntry.id);

  if (error) {
    throw new Error(error.message);
  }

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
  const supabase = getSupabaseAdmin();

  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.phone !== undefined) payload.phone = input.phone;

  if (!Object.keys(payload).length) {
    return { success: true };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("user_id", profile.user_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const numberFromForm = (value: FormDataEntryValue | null) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const workerClockInAction = async (formData: FormData) => {
  return workerClockIn({
    latitude: numberFromForm(formData.get("latitude")) ?? 0,
    longitude: numberFromForm(formData.get("longitude")) ?? 0,
  });
};

export const workerClockOutAction = async () => {
  return workerClockOut();
};

export const updateSelfProfileAction = async (formData: FormData) => {
  return updateSelfProfile({
    fullName: formData.get("fullName") ? String(formData.get("fullName")) : undefined,
    phone: formData.get("phone") ? String(formData.get("phone")) : undefined,
  });
};
