-- Pictures uploaded in the dashboard for server banners.
CREATE TABLE "BannerImage" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BannerImage_guildId_idx" ON "BannerImage"("guildId");

ALTER TABLE "BannerImage" ADD CONSTRAINT "BannerImage_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
