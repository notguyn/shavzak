import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().min(1).email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  })
export type RegisterInput = z.infer<typeof registerSchema>
