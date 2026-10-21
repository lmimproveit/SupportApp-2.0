CREATE TABLE "UserInvitation" (
 "id" SERIAL NOT NULL,
 "email" TEXT NOT NULL,
 "firstName" TEXT NOT NULL,
 "lastName" TEXT NOT NULL,
 "role" "UserRole" NOT NULL DEFAULT 'USER',
 "tokenHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "acceptedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "companyId" INTEGER NOT NULL,
 "issuedById" INTEGER NOT NULL,
 CONSTRAINT "UserInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserInvitation_tokenHash_key" ON "UserInvitation"("tokenHash");
CREATE INDEX "UserInvitation_companyId_email_idx" ON "UserInvitation"("companyId", "email");
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
