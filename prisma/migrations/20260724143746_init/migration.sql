-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "personal_code" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitor_id" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "collected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tokens_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raffle_draws" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawn_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winning_visitor_id" TEXT NOT NULL,
    "draw_label" TEXT NOT NULL,
    CONSTRAINT "raffle_draws_winning_visitor_id_fkey" FOREIGN KEY ("winning_visitor_id") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "visitors_email_key" ON "visitors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_personal_code_key" ON "visitors"("personal_code");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_visitor_id_station_key" ON "tokens"("visitor_id", "station");
