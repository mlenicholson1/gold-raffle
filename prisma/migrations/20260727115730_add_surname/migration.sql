-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_visitors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "personal_code" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_visitors" ("created_at", "email", "id", "name", "personal_code") SELECT "created_at", "email", "id", "name", "personal_code" FROM "visitors";
DROP TABLE "visitors";
ALTER TABLE "new_visitors" RENAME TO "visitors";
CREATE UNIQUE INDEX "visitors_email_key" ON "visitors"("email");
CREATE UNIQUE INDEX "visitors_personal_code_key" ON "visitors"("personal_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
