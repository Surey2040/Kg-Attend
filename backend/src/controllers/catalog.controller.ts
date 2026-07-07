import { Request, Response, NextFunction } from 'express';
import { listSubjects, listRooms, listBatches } from '../services/catalog.service';

export async function listSubjectsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await listSubjects() });
  } catch (err) {
    next(err);
  }
}

export async function listRoomsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await listRooms() });
  } catch (err) {
    next(err);
  }
}

export async function listBatchesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await listBatches() });
  } catch (err) {
    next(err);
  }
}
