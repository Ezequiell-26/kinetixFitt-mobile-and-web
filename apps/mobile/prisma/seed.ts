import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * El seed actual reconstruye fixtures completas para desarrollo/CI.
 * Por seguridad, un proceso configurado como producción nunca puede ejecutar
 * el borrado destructivo accidentalmente.
 */
const isCi = process.env.GITHUB_ACTIONS === "true";
const isTest = process.env.NODE_ENV === "test";
const isExplicitlyAllowed = process.env.ALLOW_DEMO_SEED === "true";

if (!isCi && !isTest && !isExplicitlyAllowed) {
  console.error("Refusing to run destructive demo seed. Use NODE_ENV=test or set ALLOW_DEMO_SEED=true explicitly.");
  process.exit(1);
}

async function main(){
  const hashedTrainer = await bcrypt.hash("Admin123!",10);
  const hashedClient = await bcrypt.hash("cliente123",10);
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.progressPhoto.deleteMany();
  await prisma.progressMeasurement.deleteMany();
  await prisma.exerciseSetLog.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.programWeek.deleteMany();
  await prisma.program.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.client.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.user.deleteMany();

  const trainer = await prisma.user.create({data:{email:"ezequiel@kinetixfitt.com", password:hashedTrainer, name:"KinetixFitt", role:"TRAINER"}});
  await prisma.trainerProfile.create({data:{userId:trainer.id, bio:"Coach certificado • 8 años transformando físicos", specialty:"Hipertrofia & Recomposición"}});

  // Carga desde Free Exercise DB (Unlicense, 876 ejercicios) - top 50 diversos
  const fs = await import("fs");
  let top50: Array<{name:string; muscleGroup:string; equipment:string; level:string; instructions:string; image:string|null; id:string}> | null = null;
  try{ const raw = fs.readFileSync("public/data/exercises_100.json","utf-8"); top50 = JSON.parse(raw); }catch{ try{ const raw2 = fs.readFileSync("public/data/exercises_top50.json","utf-8"); top50 = JSON.parse(raw2); }catch{ top50 = null; } }
  const fallback = [
    {name:"Press Banca con Barra", primaryMuscles:["chest"], equipment:"barbell", level:"beginner", instructions:["Acuéstate, retrae escápulas"], id:"fallback1", images:[], force:"push"},
  ];
  const exercisesDataRaw = top50 || fallback;
  const exercisesData = exercisesDataRaw.map(e=>({
    name: e.name,
    muscleGroup: (e as {muscleGroup?:string}).muscleGroup || "General",
    pattern: (e as {force?:string}).force || "General",
    equipment: e.equipment || "Desconocido",
    level: e.level ? e.level.charAt(0).toUpperCase()+e.level.slice(1) : "Intermedio",
    instructions: (e as {instructions?:string}).instructions || "Controla la técnica, respira y progresa.",
    image: (e as {image?:string|null}).image || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  }));
  const exercises = [];
  for(const e of exercisesData){ const ex = await prisma.exercise.create({data:e}); exercises.push(ex); }

  const program = await prisma.program.create({data:{name:"Hipertrofia 12 Semanas", description:"Programa insignia KINETIXFITT — 4 días, progresión ondulante, RIR controlado.", durationWeeks:12, frequency:4}});
  for(let w=1; w<=4; w++){
    const week = await prisma.programWeek.create({data:{programId:program.id, weekNumber:w}});
    const workouts = [
      {dayNumber:1, name:"Tren Superior — Fuerza", estimatedMin:60},
      {dayNumber:2, name:"Tren Inferior — Cuádriceps", estimatedMin:65},
      {dayNumber:3, name:"Tren Superior — Hipertrofia", estimatedMin:55},
      {dayNumber:4, name:"Tren Inferior — Glúteo/Isquios", estimatedMin:60},
    ];
    for(const wk of workouts){
      const workout = await prisma.workout.create({data:{weekId:week.id, dayNumber:wk.dayNumber, name:wk.name, description:`Semana ${w} — ${wk.name}`, estimatedMin:wk.estimatedMin}});
      const pick = exercises.slice(0,5);
      let order=0;
      for(const ex of pick){
        await prisma.workoutExercise.create({data:{workoutId:workout.id, exerciseId:ex.id, order:order++, sets:4, reps: w===1?"6-8": w===2?"8-10":"10-12", rir:2, restSec:90, tempo:"3-1-1-0", load: w===1?"80%":"75%"}});
      }
    }
  }

  const demoClients = [
    {name:"Martín Fernández", email:"martin@demo.com", goal:"PERDIDA_GRASA", plan:"PERSONALIZADO", age:28, weight:88, height:178, status:"ACTIVO"},
    {name:"Lucas Gómez", email:"lucas@demo.com", goal:"HIPERTROFIA", plan:"PREMIUM", age:24, weight:76, height:182, status:"ACTIVO"},
    {name:"Sofía Rodríguez", email:"sofia@demo.com", goal:"FUERZA", plan:"BASICO", age:26, weight:62, height:168, status:"ACTIVO"},
  ];
  for(const dc of demoClients){
    const u = await prisma.user.create({data:{email:dc.email, password:hashedClient, name:dc.name, role:"CLIENT"}});
    await prisma.profile.create({data:{userId:u.id, age:dc.age, goal:dc.goal as "PERDIDA_GRASA", weight:dc.weight, height:dc.height, availability:4, equipment:"Gimnasio"}});
    const client = await prisma.client.create({data:{name:dc.name, email:dc.email, userId:u.id, trainerId:trainer.id, goal:dc.goal as "PERDIDA_GRASA", status:dc.status as "ACTIVO", plan:dc.plan as "PERSONALIZADO", age:dc.age, weight:dc.weight, height:dc.height, assignedProgramId:program.id, notes: dc.name==="Martín Fernández" ? "Demo — pérdida de grasa. Prioridad adherencia." : dc.name==="Lucas Gómez" ? "Demo — hipertrofia. 4 días, volumen alto." : "Demo — fuerza. Progresión 5x5."}});
    await prisma.subscription.create({data:{clientId:client.id, plan:dc.plan as "PERSONALIZADO", status:"ACTIVA", nextPayment: new Date(Date.now()+ (dc.name==="Lucas Gómez"? 3: 12)*24*60*60*1000), price: dc.plan==="PREMIUM"?25000: dc.plan==="PERSONALIZADO"?18000:12000}});
    await prisma.payment.create({data:{clientId:client.id, email:dc.email, amount: dc.plan==="PREMIUM"?25000: dc.plan==="PERSONALIZADO"?18000:12000, status:"PAGADO", method:"Mercado Pago", description:"Suscripción mensual"}});
    await prisma.progressMeasurement.create({data:{userId:u.id, clientId:client.id, weight: dc.weight, chest: dc.name==="Sofía Rodríguez"?88:102, waist: dc.name==="Martín Fernández"?96:82, arm: dc.name==="Lucas Gómez"?38:34}});
    await prisma.progressMeasurement.create({data:{userId:u.id, clientId:client.id, weight: dc.weight! -1.2, chest:99, waist:94, arm:34, date: new Date(Date.now()-7*24*60*60*1000)}});
    await prisma.checkIn.create({data:{userId:u.id, clientId:client.id, energia:8, sueno:7, estres:4, entrenos:4, rendimiento:8, molestias:"Ninguna", alimentacion:"Bien", progreso:8, comentario:"Semana muy buena, con energía. Demo."}});
    await prisma.message.create({data:{senderId:trainer.id, receiverId:u.id, clientId:client.id, content: dc.name==="Martín Fernández" ? "Vamos muy bien Martín, seguimos con el déficit controlado. Subimos 2.5kg en prensa." : dc.name==="Lucas Gómez" ? "Lucas, técnica impecable en sentadilla. Próxima semana subimos RIR 1." : "Sofía, excelente RM en peso muerto. Seguimos progresando.", read:false}});
    await prisma.message.create({data:{senderId:u.id, receiverId:trainer.id, clientId:client.id, content:"Gracias Eze! Motivado 💪", read:true}});
    await prisma.notification.create({data:{userId:trainer.id, title:"Nuevo check-in: "+dc.name, body:"Completó su check-in semanal", type:"checkin", link:"/trainer/checkins"}});
  }

  // extra checkin pendiente for Martín
  const martin = await prisma.client.findUnique({where:{email:"martin@demo.com"}});
  if(martin) await prisma.checkIn.create({data:{clientId:martin.id, energia:6, sueno:6, estres:7, entrenos:3, rendimiento:6, molestias:"Molestia leve rodilla", alimentacion:"Regular", progreso:6, comentario:"Semana con más estrés laboral.", reviewed:false}});

  console.log("Seed OK");
}
main().catch(e=>{console.error(e); process.exit(1)}).finally(()=>prisma.$disconnect());
