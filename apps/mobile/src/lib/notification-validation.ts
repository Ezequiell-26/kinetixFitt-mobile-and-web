import { z } from "zod";

/**
 * Payload for the notification read endpoint.
 * Strict parsing prevents silently accepting unrelated fields and keeps the
 * route contract stable for clients.
 */
export const notificationMutationSchema = z
  .object({
    id: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

export type NotificationMutation = z.infer<typeof notificationMutationSchema>;
