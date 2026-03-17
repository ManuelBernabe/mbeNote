import { z } from "zod";
import { NotificationChannel, ReminderPriority } from "../types";

// ── Reminder ───────────────────────────────────────────────────────────────────

export const reminderSchema = z
  .object({
    title: z
      .string()
      .min(1, "El título es obligatorio")
      .max(200, "El título no puede exceder 200 caracteres"),
    description: z
      .string()
      .max(2000, "La descripción no puede exceder 2000 caracteres")
      .optional()
      .or(z.literal("")),
    startDateTime: z.string().min(1, "La fecha de inicio es obligatoria"),
    endDateTime: z.string().optional().or(z.literal("")),
    priority: z.nativeEnum(ReminderPriority).default(ReminderPriority.Medium),
    recurrenceRule: z.string().optional().or(z.literal("")),
    notificationChannels: z
      .nativeEnum(NotificationChannel)
      .default(NotificationChannel.InApp),
    notifyMinutesBefore: z.coerce.number().min(0).default(15),
    categoryId: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).optional().default([]),
    isAllDay: z.boolean().optional().default(false),
    location: z.string().max(300).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.endDateTime && data.startDateTime) {
        return new Date(data.endDateTime) >= new Date(data.startDateTime);
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["endDateTime"],
    },
  );

export type ReminderFormValues = z.infer<typeof reminderSchema>;

// ── Category ───────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .optional()
    .or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  displayName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
