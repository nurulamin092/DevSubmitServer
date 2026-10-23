import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import * as svc from "./project.service.js";
import { ListProjectsQuery, ReviewProjectInput } from "./project.schema.js";

export const create: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const project = await svc.createProject(req.user.id, req.body);
  res.status(201).json({ success: true, data: project });
});

export const mine: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const project = await svc.getMyProject(req.user.id);
  res.json({ success: true, data: project });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  // validate() middleware overwrote req.query with parsed values
  const params = req.query as unknown as ListProjectsQuery;
  const result = await svc.listProjects(params);
  res.json({ success: true, ...result });
});

export const review: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const projectId = (req.params as { id: string }).id;
  const body = req.body as ReviewProjectInput;
  const updated = await svc.reviewProject(projectId, req.user.id, body);
  res.json({ success: true, data: updated });
});

export const getStats: RequestHandler = asyncHandler(async (_req, res) => {
  const data = await svc.stats();
  res.json({ success: true, data });
});
