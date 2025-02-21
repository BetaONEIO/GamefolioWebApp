import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(email: string, confirmationLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Gamefolio <noreply@gamefolio.com>',
      to: email,
      subject: 'Confirm your Gamefolio account',
      html: `
        <div>
          <h1>Welcome to Gamefolio!</h1>
          <p>Please click the link below to confirm your email address:</p>
          <a href="${confirmationLink}">Confirm Email</a>
          <p>If you didn't create a Gamefolio account, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
}