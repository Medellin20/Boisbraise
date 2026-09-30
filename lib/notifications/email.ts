import 'server-only';
import nodemailer from 'nodemailer';

type AlertDetails = Record<string, string | number | null | undefined>;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] as string);
}

/** Envoie une alerte e-mail à l’équipe de gestion. */
export async function sendAdminAlert(subject: string, details: AlertDetails, recipientOverride?: string): Promise<boolean> {
  const user = process.env.GMAIL_USER?.trim();
  // Google affiche parfois les mots de passe d'application par groupes de caractères.
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/[\s-]/g, '');
  const recipient = recipientOverride?.trim() || process.env.ALERT_EMAIL?.trim();

  if (!user || !appPassword || !recipient) {
    console.error('Alerte e-mail non envoyée : configuration Gmail incomplète.');
    return false;
  }

  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([label, value]) => `<tr><td style="padding:6px 12px;color:#607078">${escapeHtml(label)}</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(String(value))}</td></tr>`)
    .join('');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail({
      from: `HolzNest <${user}>`,
      to: recipient,
      subject,
      text: Object.entries(details).map(([label, value]) => `${label}: ${value ?? '—'}`).join('\n'),
      html: `<div style="font-family:Arial,sans-serif;color:#263238"><h2>${escapeHtml(subject)}</h2><table>${rows}</table><p style="margin-top:20px">Connectez-vous à l’espace administrateur pour traiter cette demande.</p></div>`,
    });
    return true;
  } catch (error) {
    console.error('Échec de l’envoi de l’alerte Gmail :', error);
    return false;
  }
}
