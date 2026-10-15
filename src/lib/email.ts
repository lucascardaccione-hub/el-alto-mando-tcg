import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

/**
 * Low-level dispatch supporting:
 * 1. Resend API (HTTP POST to https://api.resend.com/emails)
 * 2. Nodemailer SMTP (Gmail, Zoho, SendGrid, custom cPanel/Hostinger SMTP, etc.)
 * 3. Safe fallback logging when credentials are not yet configured
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'El Alto Mando TCG <soporte@elaltomando.com>';

  // 1. Check Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      if (res.ok) {
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      console.error('[EMAIL RESEND ERROR]', errData);
      return { success: false, error: errData.message || 'Error enviando correo vía Resend' };
    } catch (err: any) {
      console.error('[EMAIL RESEND EXCEPTION]', err);
      return { success: false, error: err.message || 'Error de conexión con Resend' };
    }
  }

  // 2. Check SMTP (Nodemailer)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      return { success: true };
    } catch (err: any) {
      console.error('[EMAIL SMTP ERROR]', err);
      return { success: false, error: err.message || 'Error enviando correo vía SMTP' };
    }
  }

  // 3. Simulated / Log Mode (Credentials not configured yet)
  console.log('====================================================');
  console.log('[EMAIL SERVICE - SIMULATED / CREDENTIALS NEEDED]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Summary: ${text || html.slice(0, 150)}...`);
  console.log('Para envío real, configura SMTP_HOST, SMTP_USER, SMTP_PASS en .env.local');
  console.log('====================================================');

  return { success: true, simulated: true };
}

/**
 * Branded HTML wrapper for El Alto Mando TCG emails
 */
function wrapEmailTemplate(contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>El Alto Mando TCG</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #060913; width: 100%; margin: 0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #0c1322; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #090e1c 0%, #111a33 100%); border-bottom: 1px solid #1e293b; text-align: center;">
              <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                EL ALTO MANDO <span style="display: inline-block; padding: 2px 6px; font-size: 11px; background: #eab308; color: #020617; border-radius: 6px; font-weight: 900; vertical-align: middle; margin-left: 4px;">TCG</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; letter-spacing: 0.5px;">
                MERCADO & COMUNIDAD DE CARTAS POKÉMON
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; text-align: left; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #080c16; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">Este es un correo automático de seguridad de <strong>El Alto Mando TCG</strong>.</p>
              <p style="margin: 0;">Por favor no respondas directamente a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Email de Verificación de Cuenta al Registrarse
 */
export async function sendVerificationEmail({
  to,
  username,
  code,
  token,
}: {
  to: string;
  username: string;
  code: string;
  token?: string;
}) {
  const appUrl = getAppUrl();
  const directUrl = token
    ? `${appUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`
    : `${appUrl}/verify-email?email=${encodeURIComponent(to)}`;

  const html = wrapEmailTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">¡Bienvenido, ${username}!</h2>
    <p style="margin-bottom: 20px; color: #94a3b8;">
      Gracias por unirte a <strong>El Alto Mando TCG</strong>. Para confirmar tu cuenta de entrenador y habilitar todas las funciones (creación de mazos, pedidos y comunidad), utiliza el siguiente código de verificación:
    </p>

    <!-- Code Display Box -->
    <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #070b16; border: 1px solid #2563eb; border-radius: 16px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #60a5fa; margin-bottom: 8px;">
        Código de Verificación
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
        Válido por 24 horas
      </div>
    </div>

    <!-- Direct Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${directUrl}" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
        Verificar Mi Cuenta
      </a>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
      Si tú no creaste esta cuenta, puedes desestimar este mensaje con total seguridad.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Tu código de verificación: ${code} - El Alto Mando TCG`,
    html,
    text: `¡Bienvenido a El Alto Mando TCG, ${username}!\n\nTu código de verificación de 6 dígitos es: ${code}\n\nIngrésalo en la web o visita: ${directUrl}\n\nVálido por 24 horas.`,
  });
}

/**
 * 2. Email de Recuperación de Contraseña
 */
export async function sendPasswordResetEmail({
  to,
  username,
  code,
  token,
}: {
  to: string;
  username: string;
  code: string;
  token?: string;
}) {
  const appUrl = getAppUrl();
  const directUrl = token
    ? `${appUrl}/recuperar-contrasena?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`
    : `${appUrl}/recuperar-contrasena?email=${encodeURIComponent(to)}`;

  const html = wrapEmailTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">Recuperación de Contraseña</h2>
    <p style="margin-bottom: 20px; color: #94a3b8;">
      Hola <strong>${username}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>El Alto Mando TCG</strong>.
    </p>

    <!-- Code Display Box -->
    <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #070b16; border: 1px solid #ca8a04; border-radius: 16px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #facc15; margin-bottom: 8px;">
        Código de Recuperación
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
        Expira en 1 hora por seguridad
      </div>
    </div>

    <!-- Direct Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${directUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #020617; text-decoration: none; font-size: 13px; font-weight: 800; border-radius: 12px; box-shadow: 0 4px 14px rgba(234,179,8,0.3);">
        Restablecer Mi Contraseña
      </a>
    </div>

    <div style="padding: 14px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; font-size: 12px; color: #fca5a5;">
      <strong>⚠️ Nota de Seguridad:</strong> Si tú no solicitaste este cambio, no te preocupes: tu cuenta sigue estando protegida y nadie puede acceder a ella sin este código. Puedes ignorar este correo.
    </div>
  `);

  return sendEmail({
    to,
    subject: `Código de recuperación de contraseña: ${code} - El Alto Mando TCG`,
    html,
    text: `Hola ${username},\n\nRecibimos una solicitud para restablecer tu contraseña en El Alto Mando TCG.\n\nTu código de recuperación es: ${code}\n\nO ingresa directamente a: ${directUrl}\n\nEste código expira en 1 hora. Si no lo solicitaste, puedes ignorar este mensaje.`,
  });
}

/**
 * 3. Email de Notificación de Contraseña Actualizada
 */
export async function sendPasswordChangedNotificationEmail({
  to,
  username,
}: {
  to: string;
  username: string;
}) {
  const dateStr = new Date().toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const html = wrapEmailTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">Contraseña Actualizada</h2>
    <p style="margin-bottom: 16px; color: #94a3b8;">
      Hola <strong>${username}</strong>, te confirmamos que la contraseña de tu cuenta en <strong>El Alto Mando TCG</strong> ha sido modificada correctamente.
    </p>

    <div style="padding: 14px 18px; background-color: #070b16; border: 1px solid #10b981; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #6ee7b7;">
      <strong>✓ Cambio registrado:</strong> ${dateStr} (Hora de Argentina)
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
      Ya puedes iniciar sesión en la plataforma con tu nueva contraseña.
    </p>

    <div style="padding: 14px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; font-size: 12px; color: #fca5a5; margin-top: 20px;">
      <strong>⚠️ ¿No fuiste tú?</strong> Si no realizaste esta acción, por favor comunícate de inmediato con los administradores de El Alto Mando TCG para asegurar tu cuenta.
    </div>
  `);

  return sendEmail({
    to,
    subject: `Tu contraseña ha sido actualizada - El Alto Mando TCG`,
    html,
    text: `Hola ${username},\n\nTe confirmamos que la contraseña de tu cuenta en El Alto Mando TCG ha sido modificada el ${dateStr}.\n\nSi no realizaste este cambio, contáctanos de inmediato.`,
  });
}
