import { Prisma } from "../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";

import type {
  CreateProjectInput,
  ListProjectsQuery,
  ReviewProjectInput,
} from "./project.schema";
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

export async function listProjects(params: ListProjectsQuery) {
  const { page, limit, status, search, sortBy, sortOrder } = params;

  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { student: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

// ---------------- Review (approve / reject) — race-safe ----------------
export async function reviewProject(
  projectId: string,
  reviewerId: string,
  input: ReviewProjectInput,
) {
  // Atomic update: only succeeds if status is still PENDING.
  // Prevents two mentors reviewing the same project simultaneously.
  const result = await prisma.project.updateMany({
    where: { id: projectId, status: "PENDING" },
    data: {
      status: input.status,
      rejectionReason:
        input.status === "REJECTED" ? (input.rejectionReason ?? null) : null,
      reviewedAt: new Date(),
      reviewedById: reviewerId,
    },
  });

  if (result.count === 0) {
    // Distinguish "not found" from "already reviewed"
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });
    if (!existing) throw ApiError.notFound("Project not found");
    throw ApiError.conflict(
      `Project already ${existing.status.toLowerCase()}; cannot re-review.`,
    );
  }

  // Fetch full updated row with includes
  const updated = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  // Should never be null (we just updated it), but TS wants the guard
  if (!updated) throw ApiError.internal("Project disappeared after update");
  return updated;
}

export async function stats() {
  const grouped = await prisma.project.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
  }

  return {
    pending: counts.PENDING,
    approved: counts.APPROVED,
    rejected: counts.REJECTED,
    total: counts.PENDING + counts.APPROVED + counts.REJECTED,
  };
}
