import "dotenv/config";
import express from "express";
import cors from "cors";

import pixRouter          from "./routes/pix";
import logAccessRouter    from "./routes/logAccess";
import notificationsRouter from "./routes/notifications";

const app = express();
const PORT = process.env.PORT ?? 3001;

/* ================================
   MIDDLEWARES GLOBAIS
================================ */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================================
   ROTAS
   Mapeamento das Firebase Functions:
   createPixPayment      → POST /pix
   logAccess             → POST /log-access
   sendOrderNotification → POST /notifications/order-created  (webhook)
                           POST /notifications/subscribe      (registro de push)
================================ */
app.use("/pix",           pixRouter);
app.use("/log-access",    logAccessRouter);
app.use("/notifications", notificationsRouter);

/* ================================
   HEALTH CHECK
================================ */
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ================================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`✅  PISA VIBE backend rodando em http://localhost:${PORT}`);
});

export default app;