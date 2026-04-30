// prisma/seed.ts
import { 
  PrismaClient, Role, UserStatus, CourseType, 
  StudentStatus, GradeStatus, DayOfWeek, TicketPriority, TicketStatus 
} from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =========================================================
// 1. DICCIONARIOS Y CONFIGURACIÓN DOMINICANA COMPLETA
// =========================================================
const maleNames = ["José", "Juan", "Luis", "Carlos", "Miguel", "Ramón", "Pedro", "Manuel", "Alejandro", "Víctor", "Francisco", "Anthony", "Kevin", "Brayan", "Christopher", "Junior", "Joel", "Ángel", "Emanuel", "Félix"];
const femaleNames = ["María", "Ana", "Carmen", "Laura", "Yudelka", "Altagracia", "Rosa", "Luz", "Teresa", "Paola", "Pamela", "Génesis", "Camila", "Valeria", "Estefany", "Nicole", "Ashley", "Daniela", "Carolina", "Giselle"];
const lastNames = ["Pérez", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "García", "Sánchez", "Reyes", "Cruz", "Bautista", "Rosario", "Peña", "Méndez", "Guzmán", "Taveras", "Polanco", "Arias", "Valdez"];

const bloodTypes = ["O+", "O+", "A+", "A+", "B+", "O-", "AB+", "A-"];
const arsList = ["ARS Senasa", "ARS Futuro", "Primera ARS (Humano)", "ARS Universal", "ARS Mapfre Salud", "ARS Monumental", "Seguro Nacional de Salud (Público)", "Ninguno"];
const tutorRelationships = ["Madre", "Padre", "Padre", "Madre", "Abuela", "Abuelo", "Tía", "Tío", "Hermano Mayor"];
const tutorOccupations = ["Comerciante", "Docente", "Enfermera", "Chofer Público", "Ingeniero", "Ama de casa", "Empleado Privado", "Servidor Público", "Agricultor", "Abogado", "Médico", "Estilista", "Mecánico", "Contable"];
const conditionsList = ["Ninguna", "Ninguna", "Ninguna", "Ninguna", "Asma", "Alergia al Polvo", "Alergia a la Penicilina", "Miopía", "Soplo Cardíaco Leve", "Diabetes Tipo 1"];
const sectors = ["Villa Rosa", "San Martín", "La Carmelita", "Palmarito", "Los Pomos", "Jeremías", "Bayamio", "Guaigüí", "Centro de la Ciudad", "Residencial Las Carolinas"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDominicanPhone = () => {
    const areaCode = getRandom(['809', '829', '849']);
    const mid = randomInt(200, 999);
    const last = randomInt(1000, 9999);
    return `${areaCode}-${mid}-${last}`;
};

const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getBirthDateForCourse = (courseName: string): string => {
    let year = 2010;
    if (courseName.includes('2do')) year = randomInt(2011, 2012);       
    else if (courseName.includes('3ro')) year = randomInt(2010, 2011); 
    else if (courseName.includes('4to')) year = randomInt(2009, 2010); 
    else if (courseName.includes('5to')) year = randomInt(2008, 2009); 
    else if (courseName.includes('6to')) year = randomInt(2007, 2008); 
    
    const month = randomInt(0, 11);
    const day = randomInt(1, 28);
    return new Date(Date.UTC(year, month, day)).toISOString();
};

const generateRNE = (nombre: string, apellido: string, isoDate: string, sequence: number) => {
    const n = nombre.charAt(0).toUpperCase();
    const a = apellido.charAt(0).toUpperCase();
    const date = new Date(isoDate);
    const yy = String(date.getUTCFullYear()).slice(-2);
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const seq = String(sequence).padStart(4, '0');
    return `${n}${a}${yy}${mm}${dd}${seq}`;
};

async function main() {
  console.log('🧹 Limpiando base de datos...');
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

  await prisma.user.createMany({
      data: [
          { email: 'admin@educontrol.do', password: defaultPassword, nombre: 'Super', apellido: 'Admin', role: Role.ADMIN_SISTEMA, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'director@educontrol.do', password: defaultPassword, nombre: 'Jose Junior', apellido: 'Guzmán Veloz', role: Role.DIRECTOR, estado: UserStatus.ACTIVO, isActive: true },
          { email: 'secretaria@educontrol.do', password: defaultPassword, nombre: 'Carmen', apellido: 'Rosario', role: Role.SECRETARIA, estado: UserStatus.ACTIVO, isActive: true }
      ]
  });

  const teachers: any[] = [];
  for (let i = 1; i <= 60; i++) {
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

  console.log('🏫 Configurando Cursos con Grado, Sección y Modalidad...');
  const courseStructure = [
      { grade: '2do', modality: 'Secundaria', sections: ['A', 'B', 'C', 'D'], type: CourseType.ACADEMICO },
      { grade: '3ro', modality: 'Secundaria', sections: ['A', 'B', 'C', 'D'], type: CourseType.ACADEMICO },
      
      { grade: '4to', modality: 'Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '5to', modality: 'Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '6to', modality: 'Informática', sections: ['A', 'B'], type: CourseType.TECNICO },
      
      { grade: '4to', modality: 'Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '5to', modality: 'Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '6to', modality: 'Gastronomía', sections: ['A', 'B'], type: CourseType.TECNICO },
      
      { grade: '4to', modality: 'Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '5to', modality: 'Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '6to', modality: 'Mercadeo', sections: ['A', 'B'], type: CourseType.TECNICO },
      
      { grade: '4to', modality: 'Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '5to', modality: 'Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
      { grade: '6to', modality: 'Electricidad', sections: ['A', 'B'], type: CourseType.TECNICO },
  ];

  const courses: any[] = [];
  for (const c of courseStructure) {
      for (const sec of c.sections) {
          const fullCourseName = `${c.grade} ${sec} ${c.modality}`; 
          courses.push({
              id: randomUUID(),
              name: fullCourseName, 
              section: sec,
              type: c.type,
              createdAt: new Date(),
              updatedAt: new Date()
          });
      }
  }
  await prisma.course.createMany({ data: courses });

  console.log('📚 Generando Asignaturas Basadas en el Diseño Curricular MINERD...');
  
  const commonSubjects = [
      'Lengua Española', 'Matemáticas', 'Ciencias Sociales', 
      'Ciencias de la Naturaleza', 'Formación Humana y Religión', 
      'Educación Física', 'Educación Artística', 'Inglés', 'Francés'
  ];

  const techModules: Record<string, string[]> = {
      'Informática': ['Ofimática Básica', 'Desarrollo de Aplicaciones', 'Bases de Datos', 'Ensamblaje', 'Redes Computacionales'],
      'Gastronomía': ['Nutrición', 'Elaboración Culinaria', 'Panadería y Repostería', 'Servicio de Alimentos', 'Administración Gastronómica'],
      'Mercadeo': ['Ventas y Promoción', 'Investigación de Mercados', 'Marketing Digital', 'Logística Comercial', 'Atención al Cliente'],
      'Electricidad': ['Instalaciones de Interior', 'Máquinas Eléctricas', 'Control Eléctrico', 'Automatismos Industriales', 'Seguridad Eléctrica']
  };

  const subjects: any[] = [];
  let teacherIndex = 0;

  for (const course of courses) {
      for (const subName of commonSubjects) {
          subjects.push({
              id: randomUUID(),
              name: `${subName} - ${course.name}`, 
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
                      name: `[Módulo] ${modName} - ${course.name}`,
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

  console.log('🎓 Matriculando Estudiantes con RNE, Folio y Expediente Médico Completo...');
  const students: any[] = [];
  let folioLibro = 1;
  let folioIndex = 1;
  
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
          
          const sNombre = getRandom(isMale ? maleNames : femaleNames);
          const sApellido1 = getRandom(lastNames);
          const sApellido2 = getRandom(lastNames);
          
          const tParentesco = getRandom(tutorRelationships);
          const tIsMale = tParentesco === 'Padre' || tParentesco === 'Abuelo' || tParentesco === 'Tío' || tParentesco === 'Hermano Mayor';
          const tNombre = getRandom(tIsMale ? maleNames : femaleNames);
          const tApellido = tParentesco === 'Padre' ? sApellido1 : getRandom(lastNames);

          const fechaNac = getBirthDateForCourse(course.name);
          const rneSequence = randomInt(1, 9999);
          const generatedRNE = generateRNE(sNombre, sApellido1, fechaNac, rneSequence);

          if(folioIndex > 50) {
              folioLibro++;
              folioIndex = 1;
          }
          const generatedFolio = `Libro ${String(folioLibro).padStart(2, '0')}, Folio ${String(folioIndex).padStart(2, '0')}, Reg ${String(i+1).padStart(2, '0')}`;
          folioIndex++;

          students.push({
              id: studentId,
              rne: generatedRNE,
              folio: generatedFolio,
              nombre: sNombre,
              apellido: `${sApellido1} ${sApellido2}`,
              genero: isMale ? "M" : "F",
              estatus: StudentStatus.ACTIVO,
              courseId: course.id,
              promedio: 0,
              nacionalidad: "Dominicana",
              
              // Datos Médicos Hiperrealistas
              fechaNacimiento: fechaNac,
              direccion: `Calle ${randomInt(1, 20)}, Casa #${randomInt(1, 150)}, ${getRandom(sectors)}`,
              tipoSangre: getRandom(bloodTypes),
              seguroMedico: getRandom(arsList),
              condiciones: getRandom(conditionsList),
              alergias: Math.random() > 0.75 ? getRandom(["Alergia a mariscos", "Alergia a la lactosa", "Alergia al maní", "Alergia al ibuprofeno", "Polvo"]) : "Ninguna",

              // Datos Tutor
              tutorNombre: `${tNombre} ${tApellido}`,
              tutorParentesco: tParentesco,
              tutorTelefono: generateDominicanPhone(),
              tutorOcupacion: getRandom(tutorOccupations),
              tutorCorreo: `${tNombre.toLowerCase().replace(' ', '')}${randomInt(50,999)}@gmail.com`,

              fotoUrl: null,
              actaNacimientoUrl: null,
              certificadoMedicoUrl: null,

              createdAt: new Date(),
              updatedAt: new Date()
          });
          
          studentProfiles.set(studentId, randomInt(65, 98));
      }
  }
  await prisma.student.createMany({ data: students });

  console.log('📝 Registrando Calificaciones (De Agosto a Mayo)...');
  // MODIFICACIÓN CLAVE: Meses lectivos desde Agosto hasta Mayo
  const months = ['AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO'];
  const grades: any[] = [];
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
              let score = baseProfile + randomInt(-7, 7);
              if (score > 100) score = 100;
              if (score < 0) score = 0;

              grades.push({
                  studentId: student.id,
                  subjectId: subject.id,
                  year: '2025-2026',
                  mes: month,
                  disciplina: Math.round(score * 0.10),
                  tarea: Math.round(score * 0.20),
                  practica: Math.round(score * 0.30),
                  teoria: Math.round(score * 0.40),
                  final: score,
                  status: score >= 70 ? GradeStatus.APROBADO : GradeStatus.REPROBADO,
                  updatedAt: new Date()
              });
              totalScore += score;
              totalEvals++;
          }
      }
      studentAverages.set(student.id, totalEvals > 0 ? parseFloat((totalScore / totalEvals).toFixed(2)) : 0);
  }

  // Batch insert para evitar saturar la memoria
  for (let i = 0; i < grades.length; i += 15000) {
      await prisma.grade.createMany({ data: grades.slice(i, i + 15000) });
  }

  for (const student of students) {
      await prisma.student.update({
          where: { id: student.id },
          data: { promedio: studentAverages.get(student.id) }
      });
  }

  console.log('⏰ Generando Itinerario de Horarios Estricto...');
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

  const schedules: any[] = [];
  const teacherBusyMap = new Set(); 

  for (const course of courses) {
      const mySubjects = subjectsByCourse.get(course.id) || [];
      if (mySubjects.length === 0) continue;

      let subjectPool: any[] = [];
      while(subjectPool.length < 40) {
          subjectPool.push(...mySubjects);
      }
      subjectPool = shuffle(subjectPool.slice(0, 40)); 

      for (const day of days) {
          for (const block of timeBlocks) {
              let assigned = false;
              let attempts = 0;
              
              while (!assigned && attempts < subjectPool.length) {
                  const candidateIndex = attempts;
                  const candidateSubject = subjectPool[candidateIndex];
                  
                  if (!candidateSubject) break;

                  const busyKey = `${candidateSubject.teacherId}-${day}-${block.p}`;
                  
                  if (!teacherBusyMap.has(busyKey)) {
                      teacherBusyMap.add(busyKey);
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
                      subjectPool.splice(candidateIndex, 1); 
                  } else {
                      attempts++; 
                  }
              }
          }
      }
  }
  await prisma.schedule.createMany({ data: schedules });

  console.log('🎫 Emitiendo Tickets...');
  await prisma.ticket.createMany({
      data: [
          { issue: "Error de Calificaciones: Alumno no aparece", description: "El estudiante no me aparece en mi lista al tratar de subir la nota.", status: TicketStatus.PENDIENTE, priority: TicketPriority.MEDIA, docenteId: teachers[0].id },
      ]
  });

  console.log('\n✅ ¡SEED COMPLETO! SISTEMA OPERATIVO Y CARGADO.');
  console.log(`===========================================`);
  console.log(`🏢 Total Estudiantes: ${students.length}`);
  console.log(`📚 Total Cursos: ${courses.length}`);
  console.log(`===========================================`);
}

main()
  .catch((e) => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });