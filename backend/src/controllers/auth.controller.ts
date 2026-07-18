import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { AuthRequest } from "../middleware/auth";

export async function signupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(200).json({ message: "Signed out." });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  res.status(200).json({ userId: req.userId, email: req.userEmail });
}