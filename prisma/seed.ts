import { randomUUID } from "node:crypto"

import { PrismaPg } from "@prisma/adapter-pg"

import { auth } from "@/lib/auth"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/** Shared password for every seeded user — dev/demo only, never used in production. */
const SEED_PASSWORD = "Passw0rd!"

async function createSeedUser(input: {
  name: string
  email: string
  role: "ADMIN" | "BATTALION_CMD" | "PLATOON_CMD" | "VIEWER"
  platoonId?: string
}) {
  const { user } = await auth.api.signUpEmail({
    body: { name: input.name, email: input.email, password: SEED_PASSWORD },
  })
  return prisma.user.update({
    where: { id: user.id },
    data: { role: input.role, platoonId: input.platoonId },
  })
}

function atDay(base: Date, dayOffset: number, hour: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, 0, 0, 0)
  return d
}

async function createAssignment(input: {
  boardId: string
  title: string
  type: "MISSION" | "GUARD" | "SHIFT" | "TRANSPORT" | "STANDBY" | "ATTENDANCE" | "TASK"
  startAt: Date
  endAt: Date
  requiredManpower: number
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  location?: string
  requiredRole?: string
  requiresWeapon?: boolean
  requiresVehicle?: boolean
  difficultyScore?: number
  requiredCertificationIds?: string[]
  recurring?: { dayStartHour: number; shiftHours: number; shiftsPerDay: number; manpowerPerShift: number }
  recurringGroupId?: string
}) {
  return prisma.assignment.create({
    data: {
      title: input.title,
      type: input.type,
      startAt: input.startAt,
      endAt: input.endAt,
      requiredManpower: input.requiredManpower,
      priority: input.priority,
      location: input.location,
      requiredRole: input.requiredRole,
      requiresWeapon: input.requiresWeapon ?? false,
      requiresVehicle: input.requiresVehicle ?? false,
      difficultyScore: input.difficultyScore ?? 1,
      boardId: input.boardId,
      recurring: input.recurring,
      recurringGroupId: input.recurringGroupId,
      requiredCertifications: {
        connect: (input.requiredCertificationIds ?? []).map((id) => ({ id })),
      },
      slots: {
        create: Array.from({ length: input.requiredManpower }, () => ({
          boardId: input.boardId,
          status: "EMPTY" as const,
        })),
      },
    },
    include: { slots: true },
  })
}

async function main() {
  console.log("זורע נתונים...")

  await prisma.assignmentSlot.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.shavzakBoard.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.soldier.deleteMany()
  await prisma.platoon.deleteMany()
  await prisma.certification.deleteMany()
  await prisma.constraintRule.deleteMany()

  // Certifications
  const [medic, driver, comms] = await Promise.all([
    prisma.certification.create({ data: { code: "MEDIC", name: "חובש קרבי" } }),
    prisma.certification.create({ data: { code: "DRIVER_C", name: "רישיון נהיגה C" } }),
    prisma.certification.create({ data: { code: "COMMS", name: "קשר" } }),
  ])

  // Platoons
  const platoonA = await prisma.platoon.create({ data: { name: "מחלקה א׳" } })
  const platoonB = await prisma.platoon.create({ data: { name: "מחלקה ב׳" } })

  // Soldiers (8)
  const soldiers = await Promise.all([
    prisma.soldier.create({
      data: {
        fullName: "יוסי כהן",
        personalNumber: "7200001",
        rank: "SERGEANT_FIRST_CLASS",
        platoonId: platoonA.id,
        role: "מפקד כיתה",
        phone: "050-1234567",
        homeCity: "תל אביב",
        travelDistanceKm: 20,
        hasDrivingLicense: true,
        preferredShifts: ["morning"],
        blockedShifts: [],
        maxConsecutiveDuties: 3,
        certifications: { connect: [{ id: comms.id }] },
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "נועם לוי",
        personalNumber: "7200002",
        rank: "CORPORAL",
        platoonId: platoonA.id,
        role: "לוחם",
        phone: "050-2345678",
        homeCity: "חיפה",
        travelDistanceKm: 90,
        hasDrivingLicense: true,
        preferredShifts: ["evening"],
        blockedShifts: ["morning"],
        maxConsecutiveDuties: 2,
        certifications: { connect: [{ id: medic.id }] },
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "תומר מזרחי",
        personalNumber: "7200003",
        rank: "PRIVATE",
        platoonId: platoonA.id,
        role: "לוחם",
        phone: "050-3456789",
        homeCity: "ירושלים",
        travelDistanceKm: 60,
        hasDrivingLicense: true,
        preferredShifts: ["night"],
        blockedShifts: [],
        maxConsecutiveDuties: 3,
        certifications: {},
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "עידו פרץ",
        personalNumber: "7200004",
        rank: "STAFF_SERGEANT",
        platoonId: platoonA.id,
        role: "נהג",
        phone: "050-4567890",
        homeCity: "באר שבע",
        travelDistanceKm: 120,
        hasDrivingLicense: true,
        preferredShifts: ["morning"],
        blockedShifts: [],
        maxConsecutiveDuties: 3,
        certifications: { connect: [{ id: driver.id }] },
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "ליאור ביטון",
        personalNumber: "7200005",
        rank: "MASTER_SERGEANT",
        platoonId: platoonB.id,
        role: "מפקד כיתה",
        phone: "050-5678901",
        homeCity: "אשדוד",
        travelDistanceKm: 45,
        hasDrivingLicense: true,
        preferredShifts: ["morning"],
        blockedShifts: [],
        maxConsecutiveDuties: 4,
        certifications: { connect: [{ id: comms.id }] },
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "יובל דהן",
        personalNumber: "7200006",
        rank: "PRIVATE",
        platoonId: platoonB.id,
        role: "חובש",
        phone: "050-6789012",
        homeCity: "נתניה",
        travelDistanceKm: 55,
        hasDrivingLicense: true,
        preferredShifts: ["noon"],
        blockedShifts: [],
        maxConsecutiveDuties: 3,
        certifications: { connect: [{ id: medic.id }] },
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "ניב אברהם",
        personalNumber: "7200007",
        rank: "CORPORAL",
        platoonId: platoonB.id,
        role: "לוחם",
        phone: "050-7890123",
        homeCity: "ראשון לציון",
        travelDistanceKm: 15,
        hasDrivingLicense: true,
        preferredShifts: ["evening"],
        blockedShifts: ["morning"],
        maxConsecutiveDuties: 2,
        medicalLimitations: ["פטור משמירה לילית"],
        certifications: {},
      },
    }),
    prisma.soldier.create({
      data: {
        fullName: "עמית חדד",
        personalNumber: "7200008",
        rank: "LIEUTENANT",
        platoonId: platoonB.id,
        role: "קצין תורן",
        phone: "050-8901234",
        homeCity: "תל אביב",
        travelDistanceKm: 25,
        hasDrivingLicense: true,
        preferredShifts: ["morning"],
        blockedShifts: [],
        maxConsecutiveDuties: 4,
        certifications: { connect: [{ id: comms.id }] },
      },
    }),
  ])

  // Platoon commanders
  await prisma.platoon.update({ where: { id: platoonA.id }, data: { commanderId: soldiers[0].id } })
  await prisma.platoon.update({ where: { id: platoonB.id }, data: { commanderId: soldiers[4].id } })

  // Users — real Better Auth accounts (email/password), all sharing SEED_PASSWORD.
  await createSeedUser({ name: "מנהל מערכת", email: "admin@shavzak.idf", role: "ADMIN" })
  await createSeedUser({ name: "מפקד הגדוד", email: "battalion@shavzak.idf", role: "BATTALION_CMD" })
  await createSeedUser({
    name: "מפקד מחלקה א׳",
    email: "platoon-a@shavzak.idf",
    role: "PLATOON_CMD",
    platoonId: platoonA.id,
  })
  await createSeedUser({ name: "צופה", email: "viewer@shavzak.idf", role: "VIEWER" })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Published board (current week)
  const pubStart = atDay(today, -3, 0)
  const pubEnd = atDay(today, 4, 0)
  const publishedBoard = await prisma.shavzakBoard.create({
    data: {
      name: `שבצ״ק שבועי - ${pubStart.toISOString().slice(0, 10)}`,
      scope: "BATTALION",
      startDate: pubStart,
      endDate: pubEnd,
      status: "PUBLISHED",
    },
  })

  const a1 = await createAssignment({
    boardId: publishedBoard.id,
    title: "שמירה שער ראשי",
    type: "GUARD",
    startAt: atDay(pubStart, 1, 8),
    endAt: atDay(pubStart, 1, 14),
    requiredManpower: 2,
    priority: "HIGH",
    location: "שער ראשי",
    requiresWeapon: true,
    difficultyScore: 2,
  })

  const a2 = await createAssignment({
    boardId: publishedBoard.id,
    title: "הסעת אספקה",
    type: "TRANSPORT",
    startAt: atDay(pubStart, 2, 9),
    endAt: atDay(pubStart, 2, 12),
    requiredManpower: 1,
    priority: "MEDIUM",
    location: "מחסן",
    requiresVehicle: true,
    requiredCertificationIds: [driver.id],
    difficultyScore: 1,
  })

  // Fill a slot for realism
  await prisma.assignmentSlot.update({
    where: { id: a1.slots[0].id },
    data: { soldierId: soldiers[2].id, status: "FILLED", isManual: true },
  })
  await prisma.assignmentSlot.update({
    where: { id: a2.slots[0].id },
    data: { soldierId: soldiers[3].id, status: "LOCKED", isManual: true, isLocked: true },
  })

  // Draft board (next week)
  const draftStart = atDay(today, 4, 0)
  const draftEnd = atDay(today, 11, 0)
  const draftBoard = await prisma.shavzakBoard.create({
    data: {
      name: `שבצ״ק טיוטה - ${draftStart.toISOString().slice(0, 10)}`,
      scope: "BATTALION",
      startDate: draftStart,
      endDate: draftEnd,
      status: "DRAFT",
    },
  })

  await createAssignment({
    boardId: draftBoard.id,
    title: "סיור לילי",
    type: "MISSION",
    startAt: atDay(draftStart, 1, 22),
    endAt: atDay(draftStart, 2, 2),
    requiredManpower: 3,
    priority: "HIGH",
    location: "גזרה צפונית",
    requiresWeapon: true,
    difficultyScore: 4,
  })

  await createAssignment({
    boardId: draftBoard.id,
    title: "כוננות חובש",
    type: "STANDBY",
    startAt: atDay(draftStart, 0, 18),
    endAt: atDay(draftStart, 1, 6),
    requiredManpower: 1,
    priority: "MEDIUM",
    location: "מרפאה",
    requiredCertificationIds: [medic.id],
    difficultyScore: 2,
  })

  // Recurring shift series (3 days × 2 shifts)
  const recurringGroupId = randomUUID()
  const recurringPattern = { dayStartHour: 0, shiftHours: 12, shiftsPerDay: 2, manpowerPerShift: 1 }
  for (let d = 0; d < 3; d++) {
    for (let s = 0; s < 2; s++) {
      await createAssignment({
        boardId: draftBoard.id,
        title: "תורנות חמ״ל",
        type: "SHIFT",
        startAt: atDay(draftStart, d, s * 12),
        endAt: atDay(draftStart, d, s * 12 + 12),
        requiredManpower: 1,
        priority: "LOW",
        location: "חמ״ל",
        recurring: recurringPattern,
        recurringGroupId,
        difficultyScore: 1,
      })
    }
  }

  // Constraint rules
  await prisma.constraintRule.createMany({
    data: [
      { key: "no-overlap", kind: "HARD", weight: 0, params: {} },
      { key: "rest-time", kind: "HARD", weight: 0, params: {} },
      { key: "certification", kind: "HARD", weight: 0, params: {} },
      { key: "medical", kind: "HARD", weight: 0, params: {} },
      { key: "availability", kind: "HARD", weight: 0, params: {} },
      { key: "locked", kind: "HARD", weight: 0, params: {} },
      { key: "equipment", kind: "HARD", weight: 0, params: {} },
      { key: "max-consecutive", kind: "HARD", weight: 0, params: {} },
      { key: "workload-balance", kind: "SOFT", weight: 3, params: {} },
      { key: "anti-repetition", kind: "SOFT", weight: 2, params: {} },
      { key: "distance-before-release", kind: "SOFT", weight: 2, params: {} },
      { key: "shift-preference", kind: "SOFT", weight: 1, params: {} },
      { key: "qualification-preference", kind: "SOFT", weight: 1.5, params: {} },
    ],
  })

  const [sc, bc, ac] = await Promise.all([
    prisma.soldier.count(),
    prisma.shavzakBoard.count(),
    prisma.assignment.count(),
  ])
  console.log(`הזריעה הושלמה: ${sc} חיילים, ${bc} לוחות, ${ac} משימות.`)
  console.log(`התחברות: admin@shavzak.idf / battalion@shavzak.idf / platoon-a@shavzak.idf / viewer@shavzak.idf — סיסמה: ${SEED_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
