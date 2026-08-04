import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { chatWithAssistant } from "../services/ai.service";

export async function chat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, history } = req.body;
    const reply = await chatWithAssistant(req.userId!, message, history);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}