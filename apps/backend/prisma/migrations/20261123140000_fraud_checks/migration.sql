-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "total_parcels" INTEGER NOT NULL DEFAULT 0,
    "success_parcels" INTEGER NOT NULL DEFAULT 0,
    "cancelled_parcels" INTEGER NOT NULL DEFAULT 0,
    "success_ratio" SMALLINT,
    "couriers" JSONB,
    "checked_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fraud_checks_phone_key" ON "fraud_checks"("phone");

