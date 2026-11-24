-- Order panel: 11 statuses (Processing becomes Ready for delivery), notes, activity, block list,
-- incomplete checkouts, and order source / assignee / advance / alternative phone.

-- AlterEnum
BEGIN;
CREATE TYPE "order_status_new" AS ENUM ('PENDING', 'CONFIRMED', 'NO_ANSWER', 'FOLLOW_UP', 'READY', 'SHIPPED', 'DELIVERED', 'PARTIAL', 'RETURNED', 'FAKE', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_new" USING ((CASE "status"::text WHEN 'PROCESSING' THEN 'READY' ELSE "status"::text END)::"order_status_new");
ALTER TYPE "order_status" RENAME TO "order_status_old";
ALTER TYPE "order_status_new" RENAME TO "order_status";
DROP TYPE "public"."order_status_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "advance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "alt_phone" VARCHAR(20),
ADD COLUMN     "assigned_to_id" UUID,
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "recovered_from_id" UUID,
ADD COLUMN     "source" VARCHAR(30) NOT NULL DEFAULT 'Website';

-- CreateTable
CREATE TABLE "order_notes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "author_id" UUID,
    "author_name" VARCHAR(100) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(100),
    "kind" VARCHAR(30) NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_contacts" (
    "id" UUID NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "value" VARCHAR(45) NOT NULL,
    "reason" VARCHAR(300),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomplete_checkouts" (
    "id" UUID NOT NULL,
    "session_key" VARCHAR(64) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "address" VARCHAR(500),
    "district" VARCHAR(40),
    "items" JSONB NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "step" VARCHAR(40) NOT NULL,
    "state" VARCHAR(20) NOT NULL DEFAULT 'new',
    "handled_by_id" UUID,
    "handled_at" TIMESTAMPTZ(3),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "incomplete_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_notes_order_id_created_at_idx" ON "order_notes"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_contacts_kind_value_key" ON "blocked_contacts"("kind", "value");

-- CreateIndex
CREATE UNIQUE INDEX "incomplete_checkouts_session_key_key" ON "incomplete_checkouts"("session_key");

-- CreateIndex
CREATE INDEX "incomplete_checkouts_state_created_at_idx" ON "incomplete_checkouts"("state", "created_at");

-- CreateIndex
CREATE INDEX "incomplete_checkouts_phone_idx" ON "incomplete_checkouts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "orders_recovered_from_id_key" ON "orders"("recovered_from_id");

-- CreateIndex
CREATE INDEX "orders_ip_address_idx" ON "orders"("ip_address");

-- CreateIndex
CREATE INDEX "orders_assigned_to_id_idx" ON "orders"("assigned_to_id");

-- CreateIndex
CREATE INDEX "orders_source_idx" ON "orders"("source");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_recovered_from_id_fkey" FOREIGN KEY ("recovered_from_id") REFERENCES "incomplete_checkouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_contacts" ADD CONSTRAINT "blocked_contacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomplete_checkouts" ADD CONSTRAINT "incomplete_checkouts_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing data: internal notes become the first note; POS sales are source POS.
INSERT INTO "order_notes" ("id", "order_id", "author_name", "body", "created_at")
SELECT gen_random_uuid(), "id", 'Staff', LEFT("admin_note", 2000), "updated_at"
FROM "orders" WHERE "admin_note" IS NOT NULL AND "admin_note" <> '';
UPDATE "orders" SET "source" = 'POS' WHERE "channel" = 'POS';
