-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cod_settled_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(60) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "admin_login_events" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "user_id" UUID,
    "success" BOOLEAN NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_login_events_created_at_idx" ON "admin_login_events"("created_at");

