-- CreateTable
CREATE TABLE "Intervenant" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "schoolEndDate" DATE NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Intervenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intervenant_email_key" ON "Intervenant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Intervenant_userId_key" ON "Intervenant"("userId");

-- AddForeignKey
ALTER TABLE "Intervenant" ADD CONSTRAINT "Intervenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
