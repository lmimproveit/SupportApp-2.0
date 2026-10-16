CREATE TYPE "InternalTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE "InternalTask" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "customerName" TEXT,
  "priority" "InternalTaskPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" INTEGER NOT NULL,
  "createdById" INTEGER NOT NULL,
  "assignedToId" INTEGER,
  CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalTask_companyId_status_idx" ON "InternalTask"("companyId", "status");
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
