import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import * as svc from "./project.service.js";

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