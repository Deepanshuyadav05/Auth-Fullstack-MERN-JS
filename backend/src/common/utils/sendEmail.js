import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, verificationLink) => {
  const { data, error } = await resend.emails.send({
    from: 'Iron Gate <verify@mail.iamdeepanshu.dev>',
    to: [email],
    subject: 'Verify your email',
    html: `<strong>Click <a href="${verificationLink}">here</a> to verify your email.</strong>`,
  });

  if (error) {
    console.error({ error });
    throw new Error('Failed to send verification email');
  }

  return console.log('Email sent successfully:', data);
};

export { sendVerificationEmail };