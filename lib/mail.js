import nodemailer from 'nodemailer';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

let transporter = null;
if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: String(EMAIL_PORT) === '465',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const message = {
    from: EMAIL_FROM || EMAIL_USER || 'noreply@iksana.tech',
    to,
    subject,
    text,
    html,
  };

  if (transporter) {
    try {
      await transporter.sendMail(message);
      return { success: true };
    } catch (error) {
      console.error('Email send failed', error);
      return { success: false, error: error.message };
    }
  }

  console.log('Email fallback:', message);
  return { success: true, fallback: true };
}
