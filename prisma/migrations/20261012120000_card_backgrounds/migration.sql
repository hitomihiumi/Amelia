-- Pictures behind the rank, profile and level-up cards, and how much they are darkened.
ALTER TABLE "User" ADD COLUMN "rankDim" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "User" ADD COLUMN "profileDim" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "User" ADD COLUMN "levelupDim" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "CardBackground" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardBackground_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CardBackground_userId_kind_idx" ON "CardBackground"("userId", "kind");

-- Banner pictures are now either a background (cut to the banner) or a layer (scaled to fit).
ALTER TABLE "BannerImage" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'layer';
