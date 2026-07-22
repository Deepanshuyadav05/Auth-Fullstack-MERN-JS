import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, verificationLink) => {
  //Resend's SDK doesn't throw on failure — instead it returns an object with data (on success) and error (on failure)
  const { data, error } = await resend.emails.send({
    from: 'Iron Gate <verify@mail.iamdeepanshu.dev>',     //this 'verify' is just a arbitary name, you can use any name, it will be displayed in the email as the sender's name
    to: [email],         //an array, since Resend supports multiple recipients.
    subject: 'Verify your email',
    html: `<strong>Click <a href="${verificationLink}">here</a> to verify your email.</strong>`,
  });

  if (error) {
    console.error({ error });
    throw new Error('Failed to send verification email');
  }

  return console.log('Email sent successfully:', data);
};

const sendForgotPasswordEmail = async (email, resetLink) => {
  const { data, error } = await resend.emails.send({
    from: 'Iron Gate <noreply@mail.iamdeepanshu.dev>',
    to: [email],
    subject: 'Reset your password',
    html: `<strong>Click <a href="${resetLink}">here</a> to reset your password.</strong>`,
  });

  if (error) {
    console.error({ error });
    throw new Error('Failed to send forgot password email');
  }

  return console.log('Email sent successfully:', data);
};

export { sendVerificationEmail, sendForgotPasswordEmail };