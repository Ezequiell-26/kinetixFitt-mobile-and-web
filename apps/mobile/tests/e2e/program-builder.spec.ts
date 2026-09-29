import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

test.describe("KinetixFitt E2E — program builder real backend", () => {
  test("crea un programa desde Studio y lo asigna a un cliente real", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const trainerEmail = `e2e-builder-trainer-${suffix}@test.invalid`;
    const clientEmail = `e2e-builder-client-${suffix}@test.invalid`;
    const password = `BuilderE2E!${suffix}`;
    const programName = `E2E Builder ${suffix}`;

    let trainerId = "";
    let clientId = "";\n    let clientUserId = "";

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const trainer = await prisma.user.create({
        data: {
          name: "E2E Builder Trainer",
          email: trainerEmail,
          password: passwordHash,
          role: "TRAINER",
        },
      });
      trainerId = trainer.id;

      await prisma.trainerProfile.create({
        data: {
          userId: trainer.id,
          bio: "E2E",
          specialty: "E2E",
        },
      });

      const clientUser = await prisma.user.create({
        data: {
          name: "E2E Builder Client",
          email: clientEmail,
          password: passwordHash,
          role: "CLIENT",
        },
      });

      clientUserId = clientUser.id;\n\n      const client = await prisma.client.create({
        data: {
          name: clientUser.name,
          email: clientUser.email,
          userId: clientUser.id,
          trainerId: trainer.id,
          status: "ACTIVO",
          plan: "PERSONALIZADO",
          goal: "HIPERTROFIA",
        },
      });
      clientId = client.id;

      await page.goto("/login");
      await page.fill("#email", trainerEmail);
      await page.fill("#password", password);
      await page.getByRole("button", { name: /INGRESAR/i }).click();
      await page.waitForURL("**/trainer/dashboard", { timeout: 15000 });

      await page.goto("/trainer/studio");
      await page.getByRole("button", { name: "Plataformas" }).click();

      await expect(page.getByText("Everfit UX Builder")).toBeVisible();
      await expect(page.getByText("Biblioteca")).toBeVisible();
      await expect(page.getByPlaceholder("Nombre del programa")).toHaveValue("Programa nuevo");

      const clientSelector = page.getByRole("button", { name: /E2E Builder Client/ });
      await expect(clientSelector).toBeVisible({ timeout: 15000 });
      await clientSelector.click();

      await page.getByPlaceholder("Nombre del programa").fill(programName);

      const saveButton = page.getByRole("button", { name: /Crear y asignar a 1 cliente/i });
      await expect(saveButton).toBeEnabled({ timeout: 15000 });
      await saveButton.click();

      await expect(page.getByRole("status")).toContainText(
        "creado y asignado a 1 cliente",
        { timeout: 20000 }
      );

      const clientFromDb = await prisma.client.findUnique({
        where: { id: clientId },
        select: { assignedProgramId: true },
      });

      expect(clientFromDb?.assignedProgramId).toBeTruthy();

      const program = await prisma.program.findUnique({
        where: { id: clientFromDb?.assignedProgramId || "" },
        include: {
          weeks: {
            include: {
              workouts: {
                include: { exercises: true },
              },
            },
          },
        },
      });

      expect(program?.name).toBe(programName);
      expect(program?.weeks).toHaveLength(1);
      expect(program?.weeks[0]?.workouts).toHaveLength(2);
      expect(
        program?.weeks[0]?.workouts.reduce(
          (sum, workout) => sum + workout.exercises.length,
          0
        )
      ).toBeGreaterThan(0);
    } finally {
      if (trainerId) {
        await prisma.client.deleteMany({ where: { id: clientId } }).catch(() => {});
        await prisma.user.delete({ where: { id: trainerId } }).catch(() => {});
      }
      await prisma.$disconnect();
    }
  });
});
