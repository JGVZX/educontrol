'use client';

import React, { useState, useEffect } from "react";
// 1. AÑADIMOS 'Variants' A LA IMPORTACIÓN DE FRAMER MOTION
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, Save, 
  User, Calendar, MapPin, Heart, Activity, 
  Phone, Mail, Briefcase, GraduationCap, 
  CheckCircle2, AlertCircle, Sparkles, Loader2
} from 'lucide-react';

// --- TIPOS CORREGIDOS (Alineados con el Schema) ---
export type StudentForm = {
  id?: string;
  nombre: string;
  apellido: string;
  matricula: string;
  fechaNacimiento: string;
  genero: string;
  nacionalidad: string;
  direccion: string;
  // Salud
  alergias: string;
  condiciones: string;
  tipoSangre: string;
  seguroMedico: string;
  observaciones: string;
  // Tutor (Aplanado, no anidado)
  tutorNombre: string;
  tutorTelefono: string;
  tutorParentesco: string;
  tutorCorreo: string;
  tutorOcupacion: string;
  // Académico
  cursoId: string;
  estatus: "ACTIVO" | "INACTIVO" | "RETIRADO" | "SUSPENDIDO" | "EGRESADO"; 
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: StudentForm) => Promise<{ success: boolean; message?: string }>; 
  initialData?: Partial<StudentForm> | null;
  courses?: { id: string; name: string }[];
};

// --- COMPONENTES UI REUTILIZABLES ---
const InputGroup = ({ label, error, children }: { label: string; error?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className={`text-xs font-semibold uppercase tracking-wider ${error ? 'text-red-500' : 'text-slate-500'}`}>
      {label}
    </label>
    {children}
    {error && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Campo requerido</span>}
  </div>
);

const Input: React.FC<{
  label: string; icon?: React.ReactNode; value: string; onChange: (val: string) => void;
  type?: string; required?: boolean; placeholder?: string; error?: boolean;
}> = ({ label, icon, value, onChange, type = "text", placeholder, error }) => (
  <InputGroup label={label} error={error}>
    <div className="relative group">
      {icon && (<div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`}>{icon}</div>)}
      <input
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-sm outline-none transition-all duration-200
          ${error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-100'} text-slate-700 dark:text-slate-200`}
        value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
      />
    </div>
  </InputGroup>
);

const Select: React.FC<{
  label: string; icon?: React.ReactNode; value: string; onChange: (val: string) => void;
  options: { value: string; label: string }[]; error?: boolean;
}> = ({ label, icon, value, onChange, options, error }) => (
  <InputGroup label={label} error={error}>
    <div className="relative group">
      {icon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500">{icon}</div>)}
      <select 
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-8 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-sm outline-none appearance-none cursor-pointer
        ${error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-100'} text-slate-700 dark:text-slate-200`}
        value={value} onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccione...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 rotate-90" size={14} />
    </div>
  </InputGroup>
);

// --- STEPS COMPONENTS ---

// 2. ASIGNAMOS EL TIPO 'Variants' EXPLÍCITAMENTE PARA QUITAR EL ERROR ROJO
const stepVariants: Variants = {
  hidden: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (direction: number) => ({ x: direction > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2 } })
};

const Step1Student = ({ form, setForm, errors }: any) => (
  <motion.div variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <Input label="Nombres" icon={<User size={16}/>} value={form.nombre} onChange={(v: string) => setForm({ nombre: v })} error={errors.nombre} />
    <Input label="Apellidos" icon={<User size={16}/>} value={form.apellido} onChange={(v: string) => setForm({ apellido: v })} error={errors.apellido} />
    <Input label="Fecha Nacimiento" type="date" icon={<Calendar size={16}/>} value={form.fechaNacimiento} onChange={(v: string) => setForm({ fechaNacimiento: v })} />
    <Select label="Género" icon={<User size={16}/>} value={form.genero} onChange={(v: string) => setForm({ genero: v })} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }]} />
    <Input label="Nacionalidad" icon={<MapPin size={16}/>} value={form.nacionalidad} onChange={(v: string) => setForm({ nacionalidad: v })} />
    <Input label="Dirección" icon={<MapPin size={16}/>} value={form.direccion} onChange={(v: string) => setForm({ direccion: v })} />
  </motion.div>
);

const Step2Health = ({ form, setForm }: any) => (
  <motion.div variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <Input label="Alergias" icon={<AlertCircle size={16}/>} value={form.alergias} onChange={(v: string) => setForm({ alergias: v })} placeholder="Ninguna conocida" />
    <Input label="Condiciones Médicas" icon={<Activity size={16}/>} value={form.condiciones} onChange={(v: string) => setForm({ condiciones: v })} />
    <Input label="Tipo de Sangre" icon={<Heart size={16}/>} value={form.tipoSangre} onChange={(v: string) => setForm({ tipoSangre: v })} />
    <Input label="Seguro Médico" icon={<Activity size={16}/>} value={form.seguroMedico} onChange={(v: string) => setForm({ seguroMedico: v })} placeholder="Nombre de la ARS" />
    <div className="md:col-span-2 space-y-1.5">
       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observaciones Médicas</label>
       <textarea 
         className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm min-h-[80px]" 
         value={form.observaciones} onChange={(e) => setForm({ observaciones: e.target.value })} placeholder="Detalles adicionales..."
       />
    </div>
  </motion.div>
);

const Step3Tutor = ({ form, setForm, errors }: any) => (
  <motion.div variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <Input label="Nombre Completo Tutor" icon={<User size={16}/>} value={form.tutorNombre} onChange={(v: string) => setForm({ tutorNombre: v })} error={errors.tutorNombre} />
    <Input label="Teléfono Tutor" type="tel" icon={<Phone size={16}/>} value={form.tutorTelefono} onChange={(v: string) => setForm({ tutorTelefono: v })} error={errors.tutorTelefono} />
    <Select label="Parentesco" icon={<User size={16}/>} value={form.tutorParentesco} onChange={(v: string) => setForm({ tutorParentesco: v })} options={[{value:'PADRE', label:'Padre'}, {value:'MADRE', label:'Madre'}, {value:'TUTOR', label:'Tutor Legal'}]} />
    <Input label="Correo Tutor" type="email" icon={<Mail size={16}/>} value={form.tutorCorreo} onChange={(v: string) => setForm({ tutorCorreo: v })} />
    <Input label="Ocupación" icon={<Briefcase size={16}/>} value={form.tutorOcupacion} onChange={(v: string) => setForm({ tutorOcupacion: v })} />
  </motion.div>
);

const Step4Academic = ({ form, setForm, courses, errors }: any) => (
  <motion.div variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
            <Select 
                label="Asignar a Curso" icon={<GraduationCap size={16}/>}
                value={form.cursoId} onChange={(v: string) => setForm({ cursoId: v })} 
                options={courses.map((c: any) => ({ value: c.id, label: c.name }))}
                error={errors.cursoId}
            />
        </div>
        <Input label="Matrícula (ID)" icon={<User size={16}/>} value={form.matricula} onChange={(v: string) => setForm({ matricula: v })} required error={errors.matricula} />
        <Select 
            label="Estatus Académico" icon={<Activity size={16}/>}
            value={form.estatus} onChange={(v: string) => setForm({ estatus: v as any })} 
            options={[
              { value: "ACTIVO", label: "🟢 Activo" }, 
              { value: "SUSPENDIDO", label: "🟡 Suspendido" },
              { value: "RETIRADO", label: "🔴 Retirado" },
              { value: "EGRESADO", label: "🎓 Egresado" }
            ]}
        />
    </div>
    
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 flex gap-4 items-start">
        <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1"><Sparkles size={20} /></div>
        <div>
            <h4 className="font-bold text-blue-800 text-sm mb-1">Resumen de Inscripción</h4>
            <p className="text-xs text-blue-600/80">Estás a punto de registrar/editar a <span className="font-bold">{form.nombre || "..."} {form.apellido}</span>. Asegúrate de que los datos son correctos.</p>
        </div>
    </div>
  </motion.div>
);

// --- MAIN COMPONENT ---

export default function AddStudentModal({ open, onClose, onSave, initialData, courses = [] }: Props) {
  const isEditing = !!initialData;
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const initialFormState: StudentForm = {
    nombre: "", apellido: "", matricula: "", fechaNacimiento: "", genero: "M", nacionalidad: "Dominicana", direccion: "",
    alergias: "", condiciones: "", tipoSangre: "", seguroMedico: "", observaciones: "",
    tutorNombre: "", tutorTelefono: "", tutorParentesco: "PADRE", tutorCorreo: "", tutorOcupacion: "",
    cursoId: courses.length > 0 ? courses[0].id : "", estatus: "ACTIVO"
  };

  const [form, setFormState] = useState<StudentForm>(initialFormState);

  useEffect(() => {
     if (open) {
         if (initialData) {
            // Aseguramos que los valores null de Prisma no rompan los inputs (los cambiamos por strings vacíos)
            setFormState({ 
              ...initialFormState, 
              ...initialData,
              nombre: initialData.nombre || "",
              apellido: initialData.apellido || "",
              matricula: initialData.matricula || "",
              cursoId: initialData.cursoId || courses[0]?.id || "",
              tutorNombre: initialData.tutorNombre || "",
              tutorTelefono: initialData.tutorTelefono || "",
              tutorCorreo: initialData.tutorCorreo || "",
              tutorOcupacion: initialData.tutorOcupacion || "",
              fechaNacimiento: initialData.fechaNacimiento || "",
              direccion: initialData.direccion || "",
              alergias: initialData.alergias || "",
              condiciones: initialData.condiciones || "",
              tipoSangre: initialData.tipoSangre || "",
              seguroMedico: initialData.seguroMedico || ""
            });
         } else {
            const year = new Date().getFullYear();
            const randomId = `${year}-${Math.floor(1000 + Math.random() * 9000)}`;
            setFormState({ ...initialFormState, matricula: randomId, cursoId: courses[0]?.id || "" });
         }
         setStep(1);
         setErrors({});
     }
  }, [initialData, courses, open]);

  const setForm = (patch: Partial<StudentForm>) => setFormState((s) => ({ ...s, ...patch }));

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, boolean> = {};
    if (currentStep === 1) {
        if (!form.nombre?.trim()) newErrors.nombre = true;
        if (!form.apellido?.trim()) newErrors.apellido = true;
    }
    if (currentStep === 3) {
        if (!form.tutorNombre?.trim()) newErrors.tutorNombre = true;
        if (!form.tutorTelefono?.trim()) newErrors.tutorTelefono = true;
    }
    if (currentStep === 4) {
        if (!form.cursoId) newErrors.cursoId = true;
        if (!form.matricula?.trim()) newErrors.matricula = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeStep = (newStep: number) => {
    const goingForward = newStep > step;
    if (goingForward && !validateStep(step)) return;
    setDirection(goingForward ? 1 : -1);
    setStep(newStep);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    
    try {
      const result = await onSave(form); 
      
      if (result && !result.success) {
         alert("Error al guardar: " + result.message);
      } else {
         onClose(); 
      }
    } catch (error) {
       alert("Ocurrió un error inesperado al procesar el expediente.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const stepsInfo = [
    { title: "Personal", icon: <User size={18}/> },
    { title: "Salud", icon: <Heart size={18}/> },
    { title: "Tutor", icon: <User size={18}/> },
    { title: "Académico", icon: <GraduationCap size={18}/> }
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* HEADER CON STEPPER */}
            <div className="bg-white pt-6 px-8 pb-0 border-b border-slate-100">
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">{isEditing ? "Editar Expediente" : "Nuevo Ingreso"}</h2>
                 </div>
                 <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
               </div>
               
               <div className="flex justify-between relative px-2">
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2 rounded"></div>
                 {stepsInfo.map((s, i) => {
                     const isActive = step === i + 1;
                     const isCompleted = step > i + 1;
                     return (
                       <div key={i} className="flex flex-col items-center gap-2 bg-white px-2 cursor-pointer" onClick={() => i + 1 < step && changeStep(i + 1)}>
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 
                               ${isActive ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 bg-white'}`}>
                               {isCompleted ? <CheckCircle2 size={18}/> : s.icon}
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{s.title}</span>
                       </div>
                     )
                 })}
               </div>
            </div>

            {/* BODY ANIMADO */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-slate-50/50">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div key={step} custom={direction}>
                        {step === 1 && <Step1Student form={form} setForm={setForm} errors={errors} />}
                        {step === 2 && <Step2Health form={form} setForm={setForm} />}
                        {step === 3 && <Step3Tutor form={form} setForm={setForm} errors={errors} />}
                        {step === 4 && <Step4Academic form={form} setForm={setForm} courses={courses} errors={errors} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
                <button onClick={() => changeStep(step - 1)} disabled={step === 1} className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <ChevronLeft size={18} /> Anterior
                </button>

                {step < 4 ? (
                     <button onClick={() => changeStep(step + 1)} className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        Siguiente <ChevronRight size={18} />
                     </button>
                ) : (
                     <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:cursor-wait">
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Procesando...</> : <><Save size={18} /> Finalizar</>}
                     </button>
                )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}