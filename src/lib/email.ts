import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendConfirmationEmail(email: string, confirmationLink: string) {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        confirmation_link: confirmationLink,
        subject: 'Welcome to Gamefolio - Confirm Your Account',
        user_email: email,
        site_name: 'Gamefolio',
        support_email: 'support@gamefolio.com',
        company_name: 'Gamefolio',
        company_address: 'Gaming Street 123, Esports City'
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );

    if (response.status === 200) {
      return response;
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
}