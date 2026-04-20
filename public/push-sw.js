// ============================================================
// PISA VIBE — Service Worker de Notificações Push
// Migrado de: Firebase Messaging SDK (FCM)
// Substituído por: Web Push API nativa (sem dependências externas)
// ============================================================

// Nenhum importScripts necessário — Web Push é nativo no browser

// ------------------------------------------------------------
// BACKGROUND PUSH
// Recebe notificações enviadas pelo backend via web-push (VAPID)
// Substitui: messaging.onBackgroundMessage(...)
// ------------------------------------------------------------
self.addEventListener("push", function (event) {
  if (!event.data) {
    console.warn("[SW] Push recebido sem dados.");
    return;
  }

  let payload;
 
  try {
    payload = event.data.json();
  } catch {
    console.error("[SW] Falha ao parsear payload do push:", event.data.text());
    return;
  }

  const title = payload.title ?? "PISA VIBE";
  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      url: payload.url ?? "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ------------------------------------------------------------
// CLIQUE NA NOTIFICAÇÃO
// Abre a URL definida no payload (ex: painel admin)
// ------------------------------------------------------------
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Se já tem uma aba aberta na URL, foca nela
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Senão abre uma nova aba
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ------------------------------------------------------------
// ATIVAÇÃO DO SERVICE WORKER
// ------------------------------------------------------------
self.addEventListener("activate", function (event) {
  console.log("[SW] PISA VIBE push service worker ativado.");
  event.waitUntil(clients.claim());
});