export type CreateWorkerActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialCreateWorkerState: CreateWorkerActionState = {
  status: "idle",
  message: null,
};

