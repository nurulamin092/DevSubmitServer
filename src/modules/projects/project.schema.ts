import { z } from "zod";

// Base HTTP/HTTPS URL check
const httpUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine(
    (v) => /^https?:\/\//i.test(v),
    "Must start with http:// or https://",
  );

// Only allow known git hosts for repo URL (prevents SSRF / arbitrary links)
const repoUrl = httpUrl.refine(
  (v) =>
    /^https?:\/\/(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\//i.test(v),
  "Must be a GitHub, GitLab or Bitbucket repository URL",
);

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be at most 120 characters"),

  repoUrl,

  liveLink: z
    .union([httpUrl, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters")
    .max(3000, "Description must be at most 3000 characters"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
