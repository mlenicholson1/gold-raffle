-- CreateTable
CREATE TABLE "vegas_fix_window" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" DATETIME,
    "closed_at" DATETIME
);
