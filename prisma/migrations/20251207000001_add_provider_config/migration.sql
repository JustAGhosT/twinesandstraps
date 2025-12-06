-- CreateTable
CREATE TABLE "ProviderConfig" (
    "id" SERIAL NOT NULL,
    "provider_type" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "config_data" JSONB NOT NULL DEFAULT '{}',
    "credentials" JSONB,
    "feature_flags" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderConfig_provider_type_provider_name_key" ON "ProviderConfig"("provider_type", "provider_name");

-- CreateIndex
CREATE INDEX "ProviderConfig_provider_type_idx" ON "ProviderConfig"("provider_type");

-- CreateIndex
CREATE INDEX "ProviderConfig_provider_name_idx" ON "ProviderConfig"("provider_name");

-- CreateIndex
CREATE INDEX "ProviderConfig_is_enabled_idx" ON "ProviderConfig"("is_enabled");

-- CreateIndex
CREATE INDEX "ProviderConfig_is_active_idx" ON "ProviderConfig"("is_active");

