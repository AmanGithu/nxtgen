import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const sendPasswordSetEmail = async (email: string, token: string, firstName: string) => {
  if (!resend) return console.log(`Skipping email to ${email} (no API key). Token: ${token}`);
  const url = `${env.CLIENT_URL}/set-password?token=${token}`;
  
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to: email,
    subject: 'Set your password - NxtGen Academy',
    html: `<p>Hi ${firstName},</p><p>Please set your password by clicking <a href="${url}">here</a>.</p>`,
  });
};

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  if (!resend) return console.log(`Skipping welcome email to ${email}`);
  
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to: email,
    subject: 'Welcome to NxtGen Academy!',
    html: `<p>Hi ${firstName},</p><p>Welcome to NxtGen Academy! We're excited to have you on board.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  if (!resend) return console.log(`Skipping reset email to ${email}. Token: ${token}`);
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to: email,
    subject: 'Reset your password - NxtGen Academy',
    html: `<p>You requested a password reset. Click <a href="${url}">here</a> to reset your password.</p>`,
  });
};
