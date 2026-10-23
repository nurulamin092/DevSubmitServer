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

// ---- List query schema (server-side filters) ----
export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(["createdAt", "reviewedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

// ---- Review (approve / reject) schema ----
export const reviewProjectSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectionReason: z.string().trim().max(1000).optional(),
  })
  .refine(
    (d) =>
      d.status !== "REJECTED" ||
      (d.rejectionReason !== undefined && d.rejectionReason.length >= 5),
    {
      message: "rejectionReason (min 5 chars) is required when rejecting",
      path: ["rejectionReason"],
    },
  );

export type ReviewProjectInput = z.infer<typeof reviewProjectSchema>;

// ---- URL param schema ----
export const projectIdParamSchema = z.object({
  id: z.string().cuid("Invalid project ID format"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
