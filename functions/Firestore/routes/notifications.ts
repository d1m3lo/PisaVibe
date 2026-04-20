import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { webpush } from "../lib/webpush";

const router = Router();

/* ---------------------------------------------------------------
 * Tipos
 * ------------------------------------------------------------- */
interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface OrderData {
  customerInfo: { name: string };
  totalAmount: number;
}

/* ---------------------------------------------------------------
 * POST /notifications/subscribe
 *
 * Salva uma subscription Web Push do browser do admin.
 * Substitui: db.collection('fcmTokens') do Firebase.
 *
 * Crie a tabela no Supabase com:
 *   create table public.push_subscriptions (
 *     endpoint   text primary key,
 *     keys       jsonb not null,
 *     created_at timestamptz not null default now()
 *   );
 * ------------------------------------------------------------- */
router.post("/subscribe", async (req: Request, res: Response) => {
  const subscription: PushSubscription = req.body;

  if (!subscription?.endpoint || !subscription?.keys) {
    res.status(400).json({ error: "Subscription inválida." });
    return;
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: subscription.endpoint, keys: subscription.keys });

  if (error) {
    console.error("Erro ao salvar subscription:", error);
    res.status(500).json({ error: "Erro ao salvar subscription." });
    return;
  }

  res.status(201).json({ message: "Subscription salva com sucesso." });
});

/* ---------------------------------------------------------------
 * POST /notifications/order-created
 *
 * Substitui: functions.firestore.document('unverified-orders/{orderId}').onCreate
 *
 * Antes era um trigger automático do Firestore. Agora é um webhook
 * chamado explicitamente ao criar um pedido (no checkout ou via
 * Supabase Database Webhook apontando para esta rota).
 *
 * Body: { customerInfo: { name: string }, totalAmount: number }
 *
 * Para usar com Supabase Webhook automático:
 *   Dashboard → Database → Webhooks → New Webhook
 *   Table: unverified_orders | Event: INSERT | URL: /notifications/order-created
 * ------------------------------------------------------------- */
router.post("/order-created", async (req: Request, res: Response) => {
  const orderData: OrderData = req.body?.record ?? req.body;

  if (!orderData?.customerInfo?.name || orderData?.totalAmount === undefined) {
    res.status(400).json({ error: "Dados do pedido inválidos." });
    return;
  }

  // 1. Buscar todas as subscriptions salvas (substitui fcmTokens collection)
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys");

  if (error) {
    console.error("Erro ao buscar subscriptions:", error);
    res.status(500).json({ error: "Erro interno." });
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log("Nenhuma subscription de notificação encontrada.");
    res.status(200).json({ message: "Sem subscriptions registradas." });
    return;
  }

  // 2. Payload da notificação (substitui MessagingPayload do FCM)
  const notificationPayload = JSON.stringify({
    title: "Novo Pedido Pendente!",
    body: `Cliente: ${orderData.customerInfo.name} - Valor: R$ ${orderData.totalAmount
      .toFixed(2)
      .replace(".", ",")}`,
    icon: process.env.NOTIFICATION_ICON_URL ?? "",
    url: process.env.ADMIN_PANEL_URL ?? "/",
  });

  // 3. Enviar para todas as subscriptions e limpar inválidas
  const invalidEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys } as PushSubscription,
          notificationPayload
        );
      } catch (err: unknown) {
        const pushError = err as { statusCode?: number };
        console.error("Falha ao enviar notificação para", sub.endpoint, err);

        // Status 404 ou 410 = subscription inválida/expirada → remover
        if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
          invalidEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // 4. Remover subscriptions inválidas (substitui limpeza dos fcmTokens)
  if (invalidEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", invalidEndpoints);

    console.log(`${invalidEndpoints.length} subscription(s) inválida(s) removida(s).`);
  }

  res.status(200).json({
    message: "Notificações enviadas.",
    total: subscriptions.length,
    failed: invalidEndpoints.length,
  });
});

export default router;