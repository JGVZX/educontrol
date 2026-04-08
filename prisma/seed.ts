// prisma/seed.ts
import { 
  PrismaClient, Role, UserStatus, CourseType, 
  StudentStatus, GradeStatus, DayOfWeek, AttendanceStatus, TicketPriority, TicketStatus 
} from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =========================================================
// 1. DICCIONARIOS Y UTILIDADES DOMINICANAS (ENFOQUE LA VEGA)
// =========================================================
const maleNames = ["José", "Juan", "Luis", "Carlos", "Miguel", "Ramón", "Pedro", "Manuel", "Alejandro", "Víctor", "Francisco", "Anthony", "Kevin", "Brayan", "Christopher", "Junior", "Joel", "Ángel", "Emanuel", "Félix", "Diego", "Wander", "Yariel"];
const femaleNames = ["María", "Ana", "Carmen", "Laura", "Yudelka", "Altagracia", "Rosa", "Luz", "Teresa", "Paola", "Pamela", "Génesis", "Camila", "Valeria", "Estefany", "Nicole", "Ashley", "Daniela", "Carolina", "Giselle", "Yaritza", "Darianny"];
const lastNames = ["Pérez", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "García", "Sánchez", "Reyes", "Cruz", "Bautista", "Rosario", "Peña", "Méndez", "Guzmán", "Taveras", "Polanco", "Arias", "Valdez", "Concepción", "Quezada"];

const bloodTypes = ["O+", "O+", "A+", "A+", "B+", "B+", "O-", "AB+", "A-"];
const arsList = ["ARS Senasa", "ARS Senasa", "ARS Futuro", "Primera ARS (Humano)", "Primera ARS (Humano)", "ARS Universal", "ARS Mapfre Salud", "Ninguno"];
const tutorRelationships = ["Madre", "Madre", "Padre", "Abuela", "Tía", "Tío", "Hermano Mayor"];
const tutorOccupations = ["Comerciante", "Docente", "Enfermera", "Chofer Público", "Ingeniero", "Ama de casa", "Empleado Privado", "Agricultor", "Mecánico", "Contable", "Albañil", "Estilista", "Comerciante Independiente"];
const sectors = ["Villa Rosa", "San Martín", "La Carmelita", "Palmarito", "Los Pomos", "Jeremías", "Centro de la Ciudad", "Villa Lora", "Soto", "Guaigüí", "Las Carolinas", "Nibaje", "Pontón"];

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateDominicanPhone = () => `${getRandom(['809', '829', '849'])}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
const shuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function main() {
  console.log('🧹 Limpiando base de datos (Restableciendo de fábrica)...');
  await prisma.ticket.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.rAScore.deleteMany();
  await prisma.rA.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Configurando Perfiles Administrativos y Equipo Docente...');
  const defaultPassword = "password123"; 

  // Creación del perfil del Director usando tus datos de usuario
  await prisma.user.createMany({
      data: [
          { email: 'admin@educontrol.do', password: defaultPassword, nombre: 'Super', apellido: 'Admin', role: Role.ADMIN_SISTEMA, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'JGVZX@educontrol.do', password: defaultPassword, nombre: 'Jose Junior', apellido: 'Guzmán Veloz', role: Role.DIRECTOR, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'secretaria@educontrol.do', password: defaultPassword, nombre: 'Carmen', apellido: 'Rosario', role: Role.SECRETARIA, estado: UserStatus.ACTIVO, isActive: true }
      ]
  });

  const teachers = [];
  for (let i = 1; i <= 60; i++) {
      const isMale = Math.random() > 0.45; // 55% mujeres en el sector docente general
      teachers.push({
          id: randomUUID(),
          email: `docente${i}@educontrol.do`,
          password: defaultPassword,
          nombre: getRandom(isMale ? maleNames : femaleNames),
          apellido: getRandom(lastNames),
          role: Role.DOCENTE,
          estado: UserStatus.ACTIVO,
          isActive: true,
          genero: isMale ? "M" : "F",
          telefono: generateDominicanPhone(),
          direccion: `Calle ${randomInt(1, 20)}, ${getRandom(sectors)}`
      });
  }
  await prisma.user.createMany({ data: teachers });

  console.log('🏫 Armando Estructura de Cursos y Secciones Oficiales...');
  const courses = [];
  
  // PRIMER CICLO (Académico: 1ro, 2do, 3ro)
  const basicGrades = ['1ro', '2do', '3ro'];
  const basicSections = ['A', 'B', 'C', 'D', 'E'];
  for (const grade of basicGrades) {
      for (const sec of basicSections) {
          courses.push({
              id: randomUUID(),
              name: grade,
              section: sec,
              type: CourseType.ACADEMICO,
              createdAt: new Date(), updatedAt: new Date()
          });
      }
  }

  // SEGUNDO CICLO (Técnico: 4to, 5to, 6to)
  const techGrades = ['4to', '5to', '6to'];
  const techSpecialties = [
      { spec: 'Informática', secs: ['A', 'B', 'C'] },
      { spec: 'Electricidad', secs: ['A', 'B'] },
      { spec: 'Gastronomía', secs: ['A'] },
      { spec: 'Mercadeo', secs: ['A', 'B'] }
  ];

  for (const grade of techGrades) {
      for (const tech of techSpecialties) {
          for (const sec of tech.secs) {
              courses.push({
                  id: randomUUID(),
                  name: `${grade} ${tech.spec}`, // Ej: "4to Informática"
                  section: sec,                  // Ej: "A"
                  type: CourseType.TECNICO,
                  createdAt: new Date(), updatedAt: new Date()
              });
          }
      }
  }
  await prisma.course.createMany({ data: courses });

  console.log('📚 Asignando Carga Académica (Materias y Módulos Formativos)...');
  const subjects = [];
  let tIndex = 0;
  const getTeacher = () => teachers[(tIndex++) % teachers.length].id;

  const generalSubjects = ['Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza', 'Inglés', 'Educación Física', 'Educación Artística', 'Formación Humana'];
  
  for (const course of courses) {
      const fullCourseName = `${course.name} ${course.section}`; // Ej: "1ro A" o "4to Informática B"

      if (course.type === CourseType.ACADEMICO) {
          for (const sub of generalSubjects) {
              subjects.push({ id: randomUUID(), name: `${sub} - ${fullCourseName}`, isTechnical: false, courseId: course.id, teacherId: getTeacher() });
          }
      } else {
          // Materias comunes para el ciclo técnico
          ['Lengua Española', 'Matemática', 'Inglés Técnico', 'Formación Humana'].forEach(sub => 
              subjects.push({ id: randomUUID(), name: `${sub} - ${fullCourseName}`, isTechnical: false, courseId: course.id, teacherId: getTeacher() })
          );

          // Módulos Técnicos según especialidad (4to a 6to)
          if (course.name.includes('Informática')) {
              ['Programación de Software', 'Bases de Datos', 'Redes de Datos', 'Diseño Web', 'Soporte TI'].forEach(sub => 
                  subjects.push({ id: randomUUID(), name: `[MT] ${sub} - ${fullCourseName}`, isTechnical: true, courseId: course.id, teacherId: getTeacher() })
              );
          } else if (course.name.includes('Electricidad')) {
              ['Instalaciones Residenciales', 'Mantenimiento Eléctrico', 'Automatismos', 'Sistemas Fotovoltaicos', 'Electrónica'].forEach(sub => 
                  subjects.push({ id: randomUUID(), name: `[MT] ${sub} - ${fullCourseName}`, isTechnical: true, courseId: course.id, teacherId: getTeacher() })
              );
          } else if (course.name.includes('Gastronomía')) {
              ['Cocina Dominicana', 'Alta Cocina', 'Repostería y Panadería', 'Servicios de Bar', 'Nutrición'].forEach(sub => 
                  subjects.push({ id: randomUUID(), name: `[MT] ${sub} - ${fullCourseName}`, isTechnical: true, courseId: course.id, teacherId: getTeacher() })
              );
          } else if (course.name.includes('Mercadeo')) {
              ['Comercio y Ventas', 'Marketing Digital', 'Contabilidad Básica', 'Logística', 'Servicio al Cliente'].forEach(sub => 
                  subjects.push({ id: randomUUID(), name: `[MT] ${sub} - ${fullCourseName}`, isTechnical: true, courseId: course.id, teacherId: getTeacher() })
              );
          }
      }
  }
  await prisma.subject.createMany({ data: subjects });

  console.log('🎓 Generando Población Estudiantil (Expedientes Realistas)...');
  const students = [];
  let matriculaCounter = 1000;
  const studentProfiles = new Map();

  for (const course of courses) {
      const numStudents = randomInt(30, 36); 
      
      // Demografía de género realista
      let maleProb = 0.52; // Promedio general
      if (course.name.includes('Electricidad')) maleProb = 0.85;
      if (course.name.includes('Informática')) maleProb = 0.65;
      if (course.name.includes('Gastronomía')) maleProb = 0.25;
      if (course.name.includes('Mercadeo')) maleProb = 0.35;

      // Calcular edad basada en el curso (1ro = ~12, 6to = ~17)
      let baseAge = 12;
      if (course.name.includes('2do')) baseAge = 13;
      if (course.name.includes('3ro')) baseAge = 14;
      if (course.name.includes('4to')) baseAge = 15;
      if (course.name.includes('5to')) baseAge = 16;
      if (course.name.includes('6to')) baseAge = 17;

      for (let i = 0; i < numStudents; i++) {
          const isMale = Math.random() < maleProb;
          const studentId = randomUUID();
          
          const sNombre = getRandom(isMale ? maleNames : femaleNames);
          const sApellido1 = getRandom(lastNames);
          
          const tParentesco = getRandom(tutorRelationships);
          const tIsMale = ['Padre', 'Abuelo', 'Tío', 'Hermano Mayor'].includes(tParentesco);
          const tNombre = getRandom(tIsMale ? maleNames : femaleNames);

          // Generación de fecha de nacimiento basada en el grado
          const birthYear = 2026 - baseAge - (Math.random() > 0.8 ? 1 : 0); // 20% de probabilidad de tener un año más (repitente o entró tarde)
          const birthDate = new Date(birthYear, randomInt(0, 11), randomInt(1, 28));

          students.push({
              id: studentId,
              matricula: `2025-${matriculaCounter++}`,
              nombre: sNombre,
              apellido: `${sApellido1} ${getRandom(lastNames)}`,
              genero: isMale ? "M" : "F",
              estatus: StudentStatus.ACTIVO,
              courseId: course.id,
              promedio: 0,
              fechaNacimiento: birthDate.toISOString(),
              direccion: `Calle ${randomInt(1, 25)}, Casa #${randomInt(1, 200)}, ${getRandom(sectors)}`,
              tipoSangre: getRandom(bloodTypes),
              seguroMedico: getRandom(arsList),
              condiciones: Math.random() > 0.92 ? "Asma" : (Math.random() > 0.95 ? "Alergia a mariscos" : "Ninguna"),
              tutorNombre: `${tNombre} ${tParentesco === 'Padre' ? sApellido1 : getRandom(lastNames)}`,
              tutorParentesco: tParentesco,
              tutorTelefono: generateDominicanPhone(),
              tutorOcupacion: getRandom(tutorOccupations),
              createdAt: new Date(), updatedAt: new Date()
          });
          studentProfiles.set(studentId, randomInt(68, 97)); // Rango de calificaciones promedio
      }
  }
  await prisma.student.createMany({ data: students });

  console.log('📝 Subiendo Calificaciones Históricas (Septiembre - Febrero)...');
  const months = ['SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE', 'ENERO', 'FEBRERO'];
  const grades = [];
  const studentAverages = new Map();

  const subjectsByCourse = new Map();
  subjects.forEach(s => {
      if (!subjectsByCourse.has(s.courseId)) subjectsByCourse.set(s.courseId, []);
      subjectsByCourse.get(s.courseId).push(s);
  });

  for (const student of students) {
      const mySubjects = subjectsByCourse.get(student.courseId) || [];
      const baseProfile = studentProfiles.get(student.id);
      let totalScore = 0; let totalEvals = 0;

      for (const subject of mySubjects) {
          for (const month of months) {
              let score = baseProfile + randomInt(-7, 7);
              if (score > 100) score = 100; if (score < 0) score = 0;

              grades.push({
                  studentId: student.id, subjectId: subject.id, year: '2025-2026', mes: month,
                  disciplina: Math.round(score * 0.10), tarea: Math.round(score * 0.20),
                  practica: Math.round(score * 0.30), teoria: Math.round(score * 0.40),
                  final: score, status: score >= 70 ? GradeStatus.APROBADO : GradeStatus.REPROBADO, updatedAt: new Date()
              });
              totalScore += score; totalEvals++;
          }
      }
      studentAverages.set(student.id, totalEvals > 0 ? parseFloat((totalScore / totalEvals).toFixed(2)) : 0);
  }

  for (let i = 0; i < grades.length; i += 15000) await prisma.grade.createMany({ data: grades.slice(i, i + 15000) });
  for (const student of students) await prisma.student.update({ where: { id: student.id }, data: { promedio: studentAverages.get(student.id) } });

  console.log('📅 Generando Registros de Asistencia (Módulo de Tesis)...');
  const attendanceRecords = [];
  // Generaremos asistencia para un mes típico reciente (20 días laborables)
  for (const student of students) {
      for(let day = 1; day <= 20; day++) {
          const rand = Math.random();
          let status = AttendanceStatus.PRESENTE;
          if (rand > 0.95) status = AttendanceStatus.AUSENTE;
          else if (rand > 0.90) status = AttendanceStatus.TARDIA;
          else if (rand > 0.88) status = AttendanceStatus.EXCUSA;

          attendanceRecords.push({
              id: randomUUID(),
              date: new Date(2026, 2, day), // Marzo 2026
              status: status,
              studentId: student.id,
              createdAt: new Date()
          });
      }
  }
  for (let i = 0; i < attendanceRecords.length; i += 15000) await prisma.attendance.createMany({ data: attendanceRecords.slice(i, i + 15000) });


  console.log('⏰ Armando Cuadrícula de Horarios por Sección...');
  const days = [DayOfWeek.LUNES, DayOfWeek.MARTES, DayOfWeek.MIERCOLES, DayOfWeek.JUEVES, DayOfWeek.VIERNES];
  const timeBlocks = [
      { p: 1, s: '08:00:00Z', e: '08:45:00Z' }, { p: 2, s: '08:45:00Z', e: '09:30:00Z' },
      { p: 3, s: '09:30:00Z', e: '10:15:00Z' }, { p: 4, s: '10:30:00Z', e: '11:15:00Z' },
      { p: 5, s: '11:15:00Z', e: '12:00:00Z' }, { p: 6, s: '13:00:00Z', e: '13:45:00Z' },
      { p: 7, s: '13:45:00Z', e: '14:30:00Z' }, { p: 8, s: '14:30:00Z', e: '15:15:00Z' }
  ];

  const schedules = [];
  const teacherBusy = new Set(); 

  for (const course of courses) {
      const mySubjects = subjectsByCourse.get(course.id) || [];
      let subjectPool: any[] = [];
      while(subjectPool.length < 40) subjectPool.push(...mySubjects);
      subjectPool = shuffle(subjectPool.slice(0, 40)); 

      let poolIndex = 0;

      for (const day of days) {
          for (const block of timeBlocks) {
              let assigned = false; let attempts = 0;
              while (!assigned && attempts < mySubjects.length) {
                  const candidateSubject = subjectPool[poolIndex % subjectPool.length];
                  const busyKey = `${candidateSubject.teacherId}-${day}-${block.p}`;
                  
                  if (!teacherBusy.has(busyKey)) {
                      teacherBusy.add(busyKey);
                      schedules.push({
                          day, period: block.p,
                          startTime: new Date(`2026-01-01T${block.s}`), endTime: new Date(`2026-01-01T${block.e}`),
                          subjectId: candidateSubject.id, courseId: course.id, teacherId: candidateSubject.teacherId,
                      });
                      assigned = true;
                      subjectPool.splice(poolIndex % subjectPool.length, 1);
                  } else {
                      poolIndex++; attempts++;
                  }
              }
          }
      }
  }
  await prisma.schedule.createMany({ data: schedules });

  console.log('🎫 Emitiendo Tickets de Soporte IT...');
  await prisma.ticket.createMany({
      data: [
          { issue: "Estudiante Faltante: No aparece en plataforma", description: "El estudiante de 5to Informática B, apellido Guzmán, no aparece en mi registro de asistencia.", status: TicketStatus.PENDIENTE, priority: TicketPriority.MEDIA, docenteId: teachers[0].id },
      ]
  });

  console.log('\n✅ ¡SEED COMPLETO! SISTEMA OPERATIVO Y CARGADO.');
  console.log(`===========================================`);
  console.log(`🏢 Estudiantes: ${students.length} | Cursos: ${courses.length}`);
  console.log(`🙋‍♂️ Asistencias Registradas: ${attendanceRecords.length}`);
  console.log(`📝 Calificaciones: ${grades.length}`);
  console.log(`===========================================`);
  console.log(`🔑 Accesos:`);
  console.log(`Director: JGVZX@educontrol.do / password123`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => await prisma.$disconnect());