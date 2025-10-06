"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Workplace } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";

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
  const supabase = getSupabaseAdmin();

  const { data: userResult, error: userError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role: input.role,
      full_name: input.fullName,
      phone: input.phone ?? null,
    },
  });

  if (userError || !userResult?.user) {
    throw new Error(userError?.message ?? "Failed to create worker");
  }

  const user = userResult.user;

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone ?? null,
      role: input.role,
    },
    {
      onConflict: "user_id",
    },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (input.workplaceId) {
    const { error: assignmentError } = await supabase.from("worker_assignments").insert({
      worker_id: user.id,
      workplace_id: input.workplaceId,
    });
    if (assignmentError && assignmentError.code !== "23505") {
      throw new Error(assignmentError.message);
    }
  }

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
  const supabase = getSupabaseAdmin();

  const payload = {
    name: input.name,
    description: input.description ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_m: input.radius_m,
  } satisfies Partial<Workplace>;

  if (input.id) {
    const { error } = await supabase
      .from("workplaces")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("workplaces").insert(payload);
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const deleteWorkplaceSchema = z.object({ id: z.string().uuid() });

export const deleteWorkplace = async (values: z.infer<typeof deleteWorkplaceSchema>) => {
  await requireAdmin();
  const input = deleteWorkplaceSchema.parse(values);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("workplaces").delete().eq("id", input.id);
  if (error) {
    throw new Error(error.message);
  }

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
  const supabase = getSupabaseAdmin();

  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.role !== undefined) payload.role = input.role;

  if (Object.keys(payload).length) {
    const { error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("user_id", input.userId);
    if (error) {
      throw new Error(error.message);
    }
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
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("worker_assignments").insert({
    worker_id: input.workerId,
    workplace_id: input.workplaceId,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
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
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("worker_assignments")
    .delete()
    .eq("worker_id", input.workerId)
    .eq("workplace_id", input.workplaceId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true };
};

const adminClockSchema = z.object({
  workerId: z.string().min(1),
  workplaceId: z.string().uuid(),
  action: z.enum(["clock-in", "clock-out"]),
});

export const adminClock = async (values: z.infer<typeof adminClockSchema>) => {
  const { session } = await requireAdmin();
  const input = adminClockSchema.parse(values);
  const supabase = getSupabaseAdmin();

  if (input.action === "clock-in") {
    const { error } = await supabase.from("time_entries").insert({
      worker_id: input.workerId,
      workplace_id: input.workplaceId,
      clock_in_at: new Date().toISOString(),
      method: "admin",
      created_by: session.user.id,
    });
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("time_entries")
      .select("id")
      .eq("worker_id", input.workerId)
      .eq("workplace_id", input.workplaceId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("No active shift found");
    }

    const { error: updateError } = await supabase
      .from("time_entries")
      .update({
        clock_out_at: new Date().toISOString(),
        created_by: session.user.id,
        method: "admin",
      })
      .eq("id", data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
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

export const createWorkerAction = async (formData: FormData) => {
  await createWorker({
    email: getString(formData.get("email")),
    password: getString(formData.get("password")),
    fullName: getString(formData.get("fullName")),
    phone: getOptionalString(formData.get("phone")),
    role: (getString(formData.get("role")) as "worker" | "admin") || "worker",
    workplaceId: getOptionalString(formData.get("workplaceId")),
  });
};

export const upsertWorkplaceAction = async (formData: FormData) => {
  await upsertWorkplace({
    id: getOptionalString(formData.get("id")),
    name: getString(formData.get("name")),
    description: getOptionalString(formData.get("description")),
    latitude: getNumber(formData.get("latitude")) ?? 0,
    longitude: getNumber(formData.get("longitude")) ?? 0,
    radius_m: getNumber(formData.get("radius_m")) ?? 50,
  });
};

export const deleteWorkplaceAction = async (formData: FormData) => {
  await deleteWorkplace({
    id: getString(formData.get("id")),
  });
};

export const assignWorkerAction = async (formData: FormData) => {
  await assignWorkerToWorkplace({
    workerId: getString(formData.get("workerId")),
    workplaceId: getString(formData.get("workplaceId")),
  });
};

export const removeAssignmentAction = async (formData: FormData) => {
  await removeWorkerAssignment({
    workerId: getString(formData.get("workerId")),
    workplaceId: getString(formData.get("workplaceId")),
  });
};

export const adminClockAction = async (formData: FormData) => {
  await adminClock({
    workerId: getString(formData.get("workerId")),
    workplaceId: getString(formData.get("workplaceId")),
    action: getString(formData.get("action")) as "clock-in" | "clock-out",
  });
};
