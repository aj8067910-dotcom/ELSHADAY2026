-- CreateTable
CREATE TABLE "DevotionalBankEntry" (
    "id" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "verse" TEXT NOT NULL,
    "verseRef" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "question" TEXT NOT NULL,

    CONSTRAINT "DevotionalBankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalBankEntry_dayIndex_key" ON "DevotionalBankEntry"("dayIndex");
