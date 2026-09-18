import { notificationMutationSchema } from "../src/lib/notification-validation";

const validId = "cmj7r0x8s0000k1a8j1gq5j3m";

if (!notificationMutationSchema.safeParse({}).success) {
  throw new Error("Expected an empty payload to mean 'mark all as read'");
}

if (!notificationMutationSchema.safeParse({ id: validId }).success) {
  throw new Error("Expected a valid notification id to pass validation");
}

if (notificationMutationSchema.safeParse({ id: "   " }).success) {
  throw new Error("Expected a blank notification id to be rejected");
}

if (notificationMutationSchema.safeParse({ id: validId, unexpected: true }).success) {
  throw new Error("Expected unknown payload keys to be rejected");
}

if (notificationMutationSchema.safeParse({ id: 123 }).success) {
  throw new Error("Expected non-string notification ids to be rejected");
}

console.log("notification-validation tests passed");
