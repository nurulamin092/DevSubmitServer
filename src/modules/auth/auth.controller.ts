import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as svc from "./auth.service";

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await svc.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const result = await svc.login(req.body);
  res.json({ success: true, data: result });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await svc.me(req.user.id);
  res.json({ success: true, data: { user } });
});
