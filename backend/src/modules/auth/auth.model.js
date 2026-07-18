import { z } from "zod";

// Reusable pieces
const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters") // bcrypt truncates at 72 bytes
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character");


// SIGNUP
const signupSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Confirm your password" }),
  })
  .strict() // reject unknown keys — important for auth endpoints
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // error attaches to this field
  });

// LOGIN — deliberately loose on password rules
const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  })
  .strict();

  
export { signupSchema, loginSchema };