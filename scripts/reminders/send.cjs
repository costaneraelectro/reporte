/* Envía los recordatorios push del día.
   Lo corre GitHub Actions cada 10 min. Lee config/app (horas + mensajes) y la
   colección pushSubs (dispositivos suscritos) desde Firestore, y envía Web Push.
   Secrets requeridos (en el repo → Settings → Secrets → Actions):
     FIREBASE_SA     = JSON de una cuenta de servicio de Firebase (Admin SDK)
     VAPID_PRIVATE   = clave privada VAPID
     VAPID_SUBJECT   = mailto:tu-correo (opcional, default mailto:admin@reporte)
   La clave pública VAPID va en la app (index.html) y aquí abajo. */
const admin = require('firebase-admin');
const webpush = require('web-push');

const VAPID_PUBLIC = 'BGmv6ZyFcpcRLWh9HUXP8FrDcGf466Qbje6NPoTcGsuyVgyhNJG-J-zbdEi9rr1vV2yvzEmmqy5MfRxDfSfvwyA';
const WINDOW_MIN = 15; // ventana de disparo (cron corre cada 10 min)

function santiagoNow() {
  const s = new Date().toLocaleString('en-US', { timeZone: 'America/Santiago', hour12: false });
  const d = new Date(s);
  return { min: d.getHours() * 60 + d.getMinutes(), date: d.toISOString().slice(0, 10) };
}

(async () => {
  const sa = JSON.parse(process.env.FIREBASE_SA || '{}');
  if (!sa.project_id) { console.error('Falta FIREBASE_SA'); process.exit(0); }
  if (!process.env.VAPID_PRIVATE) { console.error('Falta VAPID_PRIVATE'); process.exit(0); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = admin.firestore();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@reporte', VAPID_PUBLIC, process.env.VAPID_PRIVATE);

  const cfgSnap = await db.collection('config').doc('app').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() : {};
  if (!cfg.remindOn || !cfg.pushOn) { console.log('Recordatorios/push desactivados.'); return; }
  const rems = (cfg.reminders && cfg.reminders.length) ? cfg.reminders : [{ hora: '19:00', msg: 'Recuerda subir el reporte del día' }];

  const now = santiagoNow();
  const stRef = db.collection('config').doc('pushState');
  const sent = (await stRef.get()).data()?.sent || {};

  const dueMsgs = [];
  for (const r of rems) {
    const [hh, mm] = String(r.hora || '19:00').split(':').map(Number);
    const rmin = (hh || 0) * 60 + (mm || 0);
    const diff = now.min - rmin;
    const key = r.hora;
    if (diff >= 0 && diff < WINDOW_MIN && sent[key] !== now.date) {
      dueMsgs.push(r.msg || 'Recuerda subir el reporte del día');
      sent[key] = now.date;
    }
  }
  if (!dueMsgs.length) { console.log('Nada que enviar a las', now.min); return; }

  const subsSnap = await db.collection('pushSubs').get();
  const payload = JSON.stringify({ title: 'Reporte Electro', body: dueMsgs.join(' · ') });
  let ok = 0, dead = 0;
  await Promise.all(subsSnap.docs.map(async d => {
    const s = d.data();
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
      ok++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await d.ref.delete(); dead++; }
      else console.error('push err', e.statusCode || e.message);
    }
  }));
  await stRef.set({ sent }, { merge: true });
  console.log(`Enviados ${ok}, dados de baja ${dead}, mensajes: ${dueMsgs.join(' | ')}`);
})().catch(e => { console.error(e); process.exit(1); });
