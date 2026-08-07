-- CreateTable
CREATE TABLE "_AircraftResponsibles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AircraftResponsibles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AircraftResponsibles_B_index" ON "_AircraftResponsibles"("B");

-- AddForeignKey
ALTER TABLE "_AircraftResponsibles" ADD CONSTRAINT "_AircraftResponsibles_A_fkey" FOREIGN KEY ("A") REFERENCES "Aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AircraftResponsibles" ADD CONSTRAINT "_AircraftResponsibles_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
