-- Add a dedicated preference so check-in reminders can be controlled independently.
ALTER TABLE "NotificationPreference"
ADD COLUMN "checkinReminders" BOOLEAN NOT NULL DEFAULT true;
