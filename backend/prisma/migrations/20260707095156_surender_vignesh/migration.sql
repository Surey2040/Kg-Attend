-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'REJECTED_DUPLICATE', 'REJECTED_EXPIRED', 'REJECTED_GEOFENCE', 'REJECTED_INVALID_SIGNATURE');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('FACULTY', 'STUDENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roll_no" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "device_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geofence_radius_m" INTEGER NOT NULL DEFAULT 120,
    "wifi_bssid_whitelist" TEXT[],

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_session" (
    "session_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "current_qr_token_hash" TEXT,
    "current_qr_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "attendance_qr_history" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "used_by_student_id" TEXT,

    CONSTRAINT "attendance_qr_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_record" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "scan_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gps_lat" DOUBLE PRECISION NOT NULL,
    "gps_lng" DOUBLE PRECISION NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "device_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" "ActorType" NOT NULL,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "reason_code" TEXT,
    "session_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_email_key" ON "faculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_roll_no_key" ON "student"("roll_no");

-- CreateIndex
CREATE UNIQUE INDEX "student_email_key" ON "student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "batch_name_key" ON "batch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_code_key" ON "subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "room_name_key" ON "room"("name");

-- CreateIndex
CREATE INDEX "attendance_session_status_idx" ON "attendance_session"("status");

-- CreateIndex
CREATE INDEX "attendance_qr_history_session_id_expires_at_idx" ON "attendance_qr_history"("session_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_qr_history_token_hash_key" ON "attendance_qr_history"("token_hash");

-- CreateIndex
CREATE INDEX "attendance_record_session_id_idx" ON "attendance_record"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_record_student_id_session_id_key" ON "attendance_record"("student_id", "session_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_created_at_idx" ON "audit_log"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_action_created_at_idx" ON "audit_log"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_session_id_idx" ON "audit_log"("session_id");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_qr_history" ADD CONSTRAINT "attendance_qr_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
