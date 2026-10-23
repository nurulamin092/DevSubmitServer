import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateProjectInput } from "./project.schema.js";

/**
 * Normalize repo URL for duplicate detection.
 * GitHub/GitLab/Bitbucket user/repo names are case-insensitive, so we lowercase
 * the path for those hosts. Trailing slash and query params stripped.
 * Stored value = normalized value (slight cosmetic loss, big safety gain).
 */
function normalizeRepoUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    if (
      /^(www\.)?(github\.com|gitlab\.com|bitbucket\.org)$/i.test(u.hostname)
    ) {
      u.hostname = u.hostname.toLowerCase();
      u.pathname = u.pathname.toLowerCase();
    }
    const path = u.pathname.replace(/\/+$/, ""); // strip trailing slash(es)
    return `${u.protocol}//${u.host}${path}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export async function createProject(
  studentId: string,
  input: CreateProjectInput,
) {
  const repoUrl = normalizeRepoUrl(input.repoUrl);

  // Pre-check duplicates for friendly errors (DB constraints are the real safety net)
  const [existingForStudent, existingRepo] = await Promise.all([
    prisma.project.findUnique({
      where: { studentId },
      select: { id: true, status: true },
    }),
    prisma.project.findUnique({
      where: { repoUrl },
      select: { id: true, student: { select: { name: true } } },
    }),
  ]);

  if (existingForStudent) {
    throw ApiError.conflict(
      `You have already submitted a project (status: ${existingForStudent.status}). Only one submission per student is allowed.`,
    );
  }
  if (existingRepo) {
    throw ApiError.conflict(
      "This repository has already been submitted by another student.",
    );
  }

  try {
    return await prisma.project.create({
      data: {
        name: input.name,
        repoUrl,
        liveLink: input.liveLink ?? null,
        description: input.description,
        studentId,
        status: "PENDING", // always — client cannot control this
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });
  } catch (err) {
    // Race condition fallback: someone inserted between our check and our write
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      const target =
        (err as { meta?: { target?: string[] } }).meta?.target?.join(", ") ??
        "field";
      throw ApiError.conflict(
        `Duplicate submission detected (${target}). Please refresh and try again.`,
      );
    }
    throw err;
  }
}

export async function getMyProject(studentId: string) {
  const project = await prisma.project.findUnique({
    where: { studentId },
    include: {
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  if (!project) {
    throw ApiError.notFound("You have not submitted a project yet");
  }
  return project;
}
