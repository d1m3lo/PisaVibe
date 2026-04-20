import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

/**
 * POST /log-access
 *
 * Substitui: functions.https.onRequest → logAccess
 * Substitui: db.collection('access_logs').add({ timestamp }) no Firestore
 *
 * Grava um registro de acesso na tabela `access_logs` do Supabase.
 *
 * Crie a tabela no Supabase com:
 *   create table public.access_logs (
 *     id         uuid primary key default gen_random_uuid(),
 *     created_at timestamptz not null default now(),
 *     metadata   jsonb
 *   );
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from("access_logs")
      .insert({ metadata: req.body ?? null });

    if (error) throw error;

    res.status(200).send("Access logged");
  } catch (error) {
    console.error("Error logging access:", error);
    res.status(500).send("Error logging access");
  }
});

export default router;