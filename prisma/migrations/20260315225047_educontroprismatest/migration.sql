-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'SECRETARIA', 'DOCENTE', 'ADMIN_SISTEMA');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVO', 'PENDIENTE', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('ACADEMICO', 'TECNICO');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVO', 'RETIRADO', 'SUSPENDIDO', 'EGRESADO');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDIA', 'EXCUSA');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('EN_CURSO', 'APROBADO', 'REPROBADO', 'COMPLETIVO', 'EXTRAORDINARIO');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('ACADEMICA', 'DISCIPLINARIA', 'PSICOLOGICA', 'MEDICA', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TEXT,
    "genero" TEXT DEFAULT 'M',
    "role" "Role" NOT NULL DEFAULT 'DOCENTE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estado" "UserStatus" NOT NULL DEFAULT 'PENDIENTE',
    "verificationToken" TEXT,
    "tokenExpires" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "type" "CourseType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RA" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "RA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "estatus" "StudentStatus" NOT NULL DEFAULT 'ACTIVO',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "promedio" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TEXT,
    "genero" TEXT,
    "nacionalidad" TEXT DEFAULT 'Dominicana',
    "direccion" TEXT,
    "fotoUrl" TEXT,
    "alergias" TEXT,
    "condiciones" TEXT,
    "tipoSangre" TEXT,
    "seguroMedico" TEXT,
    "tutorNombre" TEXT,
    "tutorParentesco" TEXT,
    "tutorTelefono" TEXT,
    "tutorCorreo" TEXT,
    "tutorOcupacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "titulo" TEXT,
    "contenido" TEXT NOT NULL,
    "tipo" "ObservationType" NOT NULL DEFAULT 'GENERAL',
    "studentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL DEFAULT '2025-2026',
    "p1" INTEGER NOT NULL DEFAULT 0,
    "p2" INTEGER NOT NULL DEFAULT 0,
    "p3" INTEGER NOT NULL DEFAULT 0,
    "p4" INTEGER NOT NULL DEFAULT 0,
    "final" INTEGER,
    "completivo" INTEGER,
    "extraordinario" INTEGER,
    "status" "GradeStatus" NOT NULL DEFAULT 'EN_CURSO',
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAScore" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "studentId" TEXT NOT NULL,
    "raId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RAScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "period" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_section_key" ON "Course"("name", "section");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricula_key" ON "Student"("matricula");

-- CreateIndex
CREATE INDEX "Student_nombre_apellido_idx" ON "Student"("nombre", "apellido");

-- CreateIndex
CREATE INDEX "Student_isDeleted_estatus_idx" ON "Student"("isDeleted", "estatus");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_year_key" ON "Grade"("studentId", "subjectId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "RAScore_studentId_raId_key" ON "RAScore"("studentId", "raId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_day_startTime_courseId_key" ON "Schedule"("day", "startTime", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_day_startTime_teacherId_key" ON "Schedule"("day", "startTime", "teacherId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RA" ADD CONSTRAINT "RA_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAScore" ADD CONSTRAINT "RAScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAScore" ADD CONSTRAINT "RAScore_raId_fkey" FOREIGN KEY ("raId") REFERENCES "RA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
