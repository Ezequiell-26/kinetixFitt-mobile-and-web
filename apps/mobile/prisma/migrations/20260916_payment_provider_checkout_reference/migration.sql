-- Historical compatibility migration.
-- The preceding migration creates this column and index already; keeping this
-- migration idempotent preserves migration history and also supports databases
-- that may have received the column from an earlier deployment.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerCheckoutId" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_providerCheckoutId_idx"
  ON "Payment"("providerCheckoutId");
