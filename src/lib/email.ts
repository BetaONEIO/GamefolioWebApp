import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const RESET_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize emailjs with the public key
emailjs.init({ publicKey: PUBLIC_KEY });

export async function sendConfirmationEmail(email: string, confirmationLink: string) {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        confirmation_link: confirmationLink,
        subject: 'Welcome to Gamefolio - Please Verify Your Email',
        user_email: email,
        site_name: 'Gamefolio',
        support_email: 'support@gamefolio.com',
        company_name: 'Gamefolio',
        company_address: 'Gaming Street 123, Esports City',
        verification_message: `
          Welcome to Gamefolio! We're excited to have you join our gaming community.
          
          To start sharing your gaming moments, please verify your email address by clicking the button below.
          
          Important: You won't be able to upload clips or interact with other users until your email is verified.
        `,
        verification_button_text: 'Verify Email Address',
        verification_note: 'This link will expire in 24 hours. If you did not create this account, please ignore this email.',
        logo_url: 'https://i.imgur.com/YourLogoURL.png',
        primary_color: '#9FE64F',
        background_color: '#000000',
        text_color: '#FFFFFF',
        accent_color: '#8FD63F',
        social_links: {
          twitter: 'https://twitter.com/gamefolio',
          discord: 'https://discord.gg/gamefolio',
          twitch: 'https://twitch.tv/gamefolio'
        }
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

export async function sendPasswordResetEmail(email: string) {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      RESET_TEMPLATE_ID,
      {
        to_email: email,
        subject: 'Reset Your Gamefolio Password',
        user_email: email,
        site_name: 'Gamefolio',
        support_email: 'support@gamefolio.com',
        company_name: 'Gamefolio',
        company_address: 'Gaming Street 123, Esports City',
        reset_message: `
          We received a request to reset your password. Click the button below to choose a new password.
          
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        `,
        reset_button_text: 'Reset Password',
        reset_note: 'This link will expire in 24 hours for security reasons.',
        logo_url: 'https://i.imgur.com/YourLogoURL.png',
        primary_color: '#9FE64F',
        background_color: '#000000',
        text_color: '#FFFFFF',
        accent_color: '#8FD63F'
      }
    );

    if (response.status === 200) {
      return response;
    } else {
      throw new Error('Failed to send password reset email');
    }
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}