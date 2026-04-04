// prisma/seed.ts
import { 
  PrismaClient, Role, UserStatus, CourseType, 
  StudentStatus, GradeStatus, DayOfWeek, AttendanceStatus, TicketPriority, TicketStatus 
} from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =========================================================
// 1. DICCIONARIOS Y CONFIGURACIÓN DOMINICANA COMPLETA
// =========================================================
const maleNames = ["José", "Juan", "Luis", "Carlos", "Miguel", "Ramón", "Pedro", "Manuel", "Alejandro", "Víctor", "Francisco", "Anthony", "Kevin", "Brayan", "Christopher", "Junior", "Joel", "Ángel", "Emanuel", "Félix"];
const femaleNames = ["María", "Ana", "Carmen", "Laura", "Yudelka", "Altagracia", "Rosa", "Luz", "Teresa", "Paola", "Pamela", "Génesis", "Camila", "Valeria", "Estefany", "Nicole", "Ashley", "Daniela", "Carolina", "Giselle"];
const lastNames = ["Pérez", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "García", "Sánchez", "Reyes", "Cruz", "Bautista", "Rosario", "Peña", "Méndez", "Guzmán", "Taveras", "Polanco", "Arias", "Valdez"];

// Diccionarios para expedientes completos
const bloodTypes = ["O+", "O+", "A+", "A+", "B+", "O-", "AB+", "A-"]; // O+ y A+ más comunes
const arsList = ["ARS Senasa", "ARS Futuro", "Primera ARS (Humano)", "ARS Universal", "ARS Mapfre Salud", "ARS Monumental", "Seguro Nacional de Salud (Público)", "Ninguno"];
const tutorRelationships = ["Madre", "Padre", "Padre", "Madre", "Abuela", "Abuelo", "Tía", "Tío", "Hermano Mayor"];
const tutorOccupations = ["Comerciante", "Docente", "Enfermera", "Chofer Público", "Ingeniero", "Ama de casa", "Empleado Privado", "Servidor Público", "Agricultor", "Abogado", "Médico", "Estilista", "Mecánico", "Contable"];
const conditionsList = ["Ninguna", "Ninguna", "Ninguna", "Ninguna", "Ninguna", "Asma", "Alergia al Polvo", "Alergia a la Penicilina", "Miopía", "Soplo Cardíaco Leve"];
const sectors = ["Villa Rosa", "San Martín", "La Carmelita", "Palmarito", "Los Pomos", "Jeremías", "Bayamio", "Guaigüí", "Centro de la Ciudad", "Residencial Las Carolinas"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
// Generador de números dominicanos (809, 829, 849)
const generateDominicanPhone = () => {
    const areaCode = getRandom(['809', '829', '849']);
    const mid = randomInt(200, 999);
    const last = randomInt(1000, 9999);
    return `${areaCode}-${mid}-${last}`;
};

// Algoritmo de mezcla aleatoria (Fisher-Yates)
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function main() {
  console.log('🧹 Limpiando base de datos (Esto puede tomar unos segundos)...');
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

  console.log('👤 Creando personal administrativo y docente...');
  const defaultPassword = "password123"; 

  // ADMINISTRATIVOS
  await prisma.user.createMany({
      data: [
          { email: 'admin@educontrol.do', password: defaultPassword, nombre: 'Super', apellido: 'Admin', role: Role.ADMIN_SISTEMA, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'director@educontrol.do', password: defaultPassword, nombre: 'Jose Junior', apellido: 'Guzmán Veloz', role: Role.DIRECTOR, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'secretaria@educontrol.do', password: defaultPassword, nombre: 'Carmen', apellido: 'Rosario', role: Role.SECRETARIA, estado: UserStatus.ACTIVO, isActive: true }
      ]
  });

  // DOCENTES (50 docentes)
  const teachers = [];
  for (let i = 1; i <= 50; i++) {
      const isMale = Math.random() > 0.5;
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
          direccion: `Calle ${randomInt(1, 15)}, ${getRandom(sectors)}`
      });
  }
  await prisma.user.createMany({ data: teachers });

  console.log('🏫 Configurando Cursos y Modalidades (MINERD)...');
  const courseStructure = [
      { name: '1ro Secundaria', sections: ['A', 'B', 'C', 'D'], type: CourseType.ACADEMICO },
      { name: '2do Secundaria', sections: ['A', 'B', 'C', 'D'], type: CourseType.ACADEMICO },
      { name: '3ro Secundaria', sections: ['A', 'B', 'C', 'D'], type: CourseType.ACADEMICO },
      { name: '4to Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '5to Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '6to Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '4to Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '5to Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '6to Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '4to Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '5to Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '6to Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '4to Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '5to Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
      { name: '6to Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
  ];

  const courses = [];
  for (const c of courseStructure) {
      for (const sec of c.sections) {
          courses.push({
              id: randomUUID(),
              name: c.name,
              section: sec,
              type: c.type,
              createdAt: new Date(),
              updatedAt: new Date()
          });
      }
  }
  await prisma.course.createMany({ data: courses });

  console.log('📚 Generando Asignaturas y distribuyéndolas a Docentes...');
  const commonSubjects = ['Lengua Española', 'Matemáticas', 'Ciencias Sociales', 'Ciencias de la Naturaleza', 'Inglés', 'Educación Física', 'Formación Integral y Religiosa', 'Educación Artística'];
  const techModules: Record<string, string[]> = {
      'Informática': ['Ofimática Básica', 'Programación Web', 'Bases de Datos', 'Ensamblaje y Redes'],
      'Gastronomía': ['Nutrición', 'Arte Culinario', 'Panadería', 'Servicio de Bar'],
      'Mercadeo': ['Ventas', 'Publicidad', 'Marketing Digital', 'Contabilidad Básica'],
      'Electricidad': ['Circuitos Eléctricos', 'Instalaciones Residenciales', 'Mantenimiento de Motores', 'Electrónica']
  };

  const subjects = [];
  let teacherIndex = 0;

  for (const course of courses) {
      for (const subName of commonSubjects) {
          subjects.push({
              id: randomUUID(),
              name: `${subName} - ${course.name} ${course.section}`,
              isTechnical: false,
              courseId: course.id,
              teacherId: teachers[teacherIndex % teachers.length].id
          });
          teacherIndex++;
      }
      if (course.type === CourseType.TECNICO) {
          let spec = Object.keys(techModules).find(k => course.name.includes(k));
          if (spec) {
              for (const modName of techModules[spec]) {
                  subjects.push({
                      id: randomUUID(),
                      name: `[MT] ${modName} - ${course.name} ${course.section}`,
                      isTechnical: true,
                      courseId: course.id,
                      teacherId: teachers[teacherIndex % teachers.length].id
                  });
                  teacherIndex++;
              }
          }
      }
  }
  await prisma.subject.createMany({ data: subjects });

  console.log('🎓 Matriculando Estudiantes con Expediente Médico y Familiar Completo...');
  const students = [];
  let matriculaCounter = 1000;
  
  const studentProfiles = new Map();

  for (const course of courses) {
      const numStudents = randomInt(25, 32); 
      let maleProb = 0.5;
      if (course.name.includes('Electricidad')) maleProb = 0.85;
      if (course.name.includes('Informática')) maleProb = 0.65;
      if (course.name.includes('Gastronomía')) maleProb = 0.30;
      if (course.name.includes('Mercadeo')) maleProb = 0.40;

      for (let i = 0; i < numStudents; i++) {
          const isMale = Math.random() < maleProb;
          const studentId = randomUUID();
          
          // Datos del estudiante
          const sNombre = getRandom(isMale ? maleNames : femaleNames);
          const sApellido1 = getRandom(lastNames);
          const sApellido2 = getRandom(lastNames);
          
          // Datos del tutor
          const tParentesco = getRandom(tutorRelationships);
          const tIsMale = tParentesco === 'Padre' || tParentesco === 'Abuelo' || tParentesco === 'Tío' || tParentesco === 'Hermano Mayor';
          const tNombre = getRandom(tIsMale ? maleNames : femaleNames);
          // Si es el padre, lleva el primer apellido; si es la madre, puede variar.
          const tApellido = tParentesco === 'Padre' ? sApellido1 : getRandom(lastNames);

          students.push({
              id: studentId,
              matricula: `2025-${matriculaCounter++}`,
              nombre: sNombre,
              apellido: `${sApellido1} ${sApellido2}`,
              genero: isMale ? "M" : "F",
              estatus: StudentStatus.ACTIVO,
              courseId: course.id,
              promedio: 0,
              nacionalidad: "Dominicana",
              
              // EXPEDIENTE MÉDICO Y UBICACIÓN
              fechaNacimiento: new Date(randomInt(2005, 2010), randomInt(0, 11), randomInt(1, 28)).toISOString(),
              direccion: `Calle ${randomInt(1, 20)}, Casa #${randomInt(1, 150)}, ${getRandom(sectors)}, La Vega`,
              tipoSangre: getRandom(bloodTypes),
              seguroMedico: getRandom(arsList),
              condiciones: getRandom(conditionsList),
              alergias: Math.random() > 0.85 ? "Alergia a mariscos" : "Ninguna",

               // DATOS DEL TUTOR
              tutorNombre: `${tNombre} ${tApellido}`,
              tutorParentesco: tParentesco,
              tutorTelefono: generateDominicanPhone(),
              tutorOcupacion: getRandom(tutorOccupations),
              tutorCorreo: `${tNombre.toLowerCase().replace(' ', '')}${randomInt(50,99)}@gmail.com`,

              createdAt: new Date(),
              updatedAt: new Date()
          });
          
          studentProfiles.set(studentId, randomInt(65, 95));
      }
  }
  await prisma.student.createMany({ data: students });

  console.log('📝 Registrando Calificaciones Mensuales (Septiembre - Febrero)...');
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
      let totalScore = 0;
      let totalEvals = 0;

      for (const subject of mySubjects) {
          for (const month of months) {
              let score = baseProfile + randomInt(-8, 8);
              if (score > 100) score = 100;
              if (score < 0) score = 0;

              const finalScore = score;
              grades.push({
                  studentId: student.id,
                  subjectId: subject.id,
                  year: '2025-2026',
                  mes: month,
                  disciplina: Math.round(score * 0.10),
                  tarea: Math.round(score * 0.20),
                  practica: Math.round(score * 0.30),
                  teoria: Math.round(score * 0.40),
                  final: finalScore,
                  status: finalScore >= 70 ? GradeStatus.APROBADO : GradeStatus.REPROBADO,
                  updatedAt: new Date()
              });
              totalScore += finalScore;
              totalEvals++;
          }
      }
      studentAverages.set(student.id, totalEvals > 0 ? parseFloat((totalScore / totalEvals).toFixed(2)) : 0);
  }

  // Insertar en lotes
  for (let i = 0; i < grades.length; i += 15000) {
      await prisma.grade.createMany({ data: grades.slice(i, i + 15000) });
  }

  // Actualizar promedios
  for (const student of students) {
      await prisma.student.update({
          where: { id: student.id },
          data: { promedio: studentAverages.get(student.id) }
      });
  }

  console.log('⏰ Generando Itinerario de Horarios sin choques (Algoritmo Inteligente)...');
  const days = [DayOfWeek.LUNES, DayOfWeek.MARTES, DayOfWeek.MIERCOLES, DayOfWeek.JUEVES, DayOfWeek.VIERNES];
  const timeBlocks = [
      { p: 1, start: '2025-01-01T08:00:00Z', end: '2025-01-01T08:45:00Z' },
      { p: 2, start: '2025-01-01T08:45:00Z', end: '2025-01-01T09:30:00Z' },
      { p: 3, start: '2025-01-01T09:30:00Z', end: '2025-01-01T10:15:00Z' },
      { p: 4, start: '2025-01-01T10:30:00Z', end: '2025-01-01T11:15:00Z' },
      { p: 5, start: '2025-01-01T11:15:00Z', end: '2025-01-01T12:00:00Z' },
      { p: 6, start: '2025-01-01T13:00:00Z', end: '2025-01-01T13:45:00Z' },
      { p: 7, start: '2025-01-01T13:45:00Z', end: '2025-01-01T14:30:00Z' },
      { p: 8, start: '2025-01-01T14:30:00Z', end: '2025-01-01T15:15:00Z' }
  ];

  const schedules = [];
  const teacherBusy = new Set(); 

  for (const course of courses) {
      const mySubjects = subjectsByCourse.get(course.id) || [];
      let subjectPool: any[] = [];
      while(subjectPool.length < 40) {
          subjectPool.push(...mySubjects);
      }
      subjectPool = shuffle(subjectPool.slice(0, 40)); 

      let poolIndex = 0;

      for (const day of days) {
          for (const block of timeBlocks) {
              let assigned = false;
              let attempts = 0;
              
              while (!assigned && attempts < mySubjects.length) {
                  const candidateSubject = subjectPool[poolIndex % subjectPool.length];
                  const busyKey = `${candidateSubject.teacherId}-${day}-${block.p}`;
                  
                  if (!teacherBusy.has(busyKey)) {
                      teacherBusy.add(busyKey);
                      schedules.push({
                          day: day,
                          period: block.p,
                          startTime: new Date(block.start),
                          endTime: new Date(block.end),
                          subjectId: candidateSubject.id,
                          courseId: course.id,
                          teacherId: candidateSubject.teacherId,
                      });
                      assigned = true;
                      subjectPool.splice(poolIndex % subjectPool.length, 1);
                  } else {
                      poolIndex++;
                      attempts++;
                  }
              }
          }
      }
  }
  await prisma.schedule.createMany({ data: schedules });

  console.log('🎫 Emitiendo Tickets de Soporte IT Simulados...');
  await prisma.ticket.createMany({
      data: [
          { issue: "Error de Calificaciones: Alumno no aparece", description: "El estudiante no me aparece en mi lista al tratar de subir la nota de Enero.", status: TicketStatus.PENDIENTE, priority: TicketPriority.MEDIA, docenteId: teachers[0].id },
          { issue: "Fallo del Sistema: Lentitud Extrema", description: "El sistema de EduControl no me deja entrar desde la sala de profesores. Tarda mucho en cargar.", status: TicketStatus.REVISION, priority: TicketPriority.ALTA, docenteId: teachers[1].id },
      ]
  });

  console.log('\n✅ ¡SEED COMPLETO! SISTEMA OPERATIVO Y CARGADO.');
  console.log(`===========================================`);
  console.log(`🏢 Total Estudiantes: ${students.length}`);
  console.log(`📚 Total Cursos: ${courses.length}`);
  console.log(`👨‍🏫 Total Docentes: ${teachers.length}`);
  console.log(`📝 Calificaciones: ${grades.length}`);
  console.log(`⏰ Bloques de Horario: ${schedules.length}`);
  console.log(`===========================================`);
  console.log(`🔑 Accesos Generados:`);
  console.log(`Super Admin: admin@educontrol.do / password123`);
  console.log(`Director: director@educontrol.do / password123`);
  console.log(`Docente 1: docente1@educontrol.do / password123`);
}

main()
  .catch((e) => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });