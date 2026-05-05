import emailjs from '@emailjs/browser';

// ─── EmailJS Config ──────────────────────────────────────────────────────────
// Fill these in from your EmailJS dashboard (https://www.emailjs.com)
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

const configured = () => SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY;

/**
 * Send a task assignment notification email.
 * @param {object} params
 * @param {string} params.to_email     - Recipient email
 * @param {string} params.to_name      - Recipient name
 * @param {string} params.task_title   - Task title
 * @param {string} params.task_status  - Task status
 * @param {string} params.project_name - Project name
 * @param {string} params.due_date     - Due date string
 * @param {string} params.assigned_by  - Name of person who assigned
 */
export async function sendTaskAssignmentEmail(params) {
  if (!configured()) {
    console.warn('[EmailJS] Not configured — skipping email. Add VITE_EMAILJS_* keys to .env');
    return { skipped: true };
  }
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
}
