import webpush from "web-push";

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO } = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_MAILTO) {
  throw new Error(
    "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_MAILTO devem estar definidas no .env\n" +
    "Gere as chaves com: npx web-push generate-vapid-keys"
  );
}

webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { webpush };