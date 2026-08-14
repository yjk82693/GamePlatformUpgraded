-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'KICKED');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('ORG', 'PROJECT', 'SERVICE');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'INVITE', 'GRANT_ROLE', 'REVOKE_ROLE', 'REVOKE_MEMBER', 'SUSPEND_MEMBER', 'UNSUSPEND_MEMBER', 'RESET_PASSWORD', 'REQUEST', 'APPROVE', 'REJECT', 'CANCEL', 'REFUND', 'PUBLISH', 'EXPORT', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "Target" AS ENUM ('ORG', 'PROJECT', 'APP_SERVICE', 'APP', 'PRODUCT', 'MEMBER', 'ROLE', 'SECRET_KEY', 'SETTING', 'PAYMENT_PROJECT', 'MERCHANT', 'PAYMENT_METHOD', 'PAYMENT_SERVICE', 'TRANSACTION', 'SETTLEMENT', 'ANALYTICS', 'UI_GUIDE', 'NOTIFICATION_SETTING', 'CATEGORY', 'WEBSHOP_SCREEN', 'AUTH_IDP', 'AUTH_API', 'WEBSHOP_SETTING');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppService" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "AppService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AppStatus" NOT NULL DEFAULT 'DRAFT',
    "releaseDate" TIMESTAMP(3),
    "ownerOrgId" TEXT NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountApp" (
    "accountId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    CONSTRAINT "AccountApp_pkey" PRIMARY KEY ("accountId","appId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarRef" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "friendCode" TEXT NOT NULL,
    "selectedPersonaId" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orgId" TEXT,
    "projectId" TEXT,
    "appServiceId" TEXT,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "RoleLevel" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRole" (
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "MemberRole_pkey" PRIMARY KEY ("memberId","roleId")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "targetType" "Target" NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretKey" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_friendCode_key" ON "PlayerProfile"("friendCode");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppService" ADD CONSTRAINT "AppService_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "App" ADD CONSTRAINT "App_ownerOrgId_fkey" FOREIGN KEY ("ownerOrgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountApp" ADD CONSTRAINT "AccountApp_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountApp" ADD CONSTRAINT "AccountApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_appServiceId_fkey" FOREIGN KEY ("appServiceId") REFERENCES "AppService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRole" ADD CONSTRAINT "MemberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRole" ADD CONSTRAINT "MemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
