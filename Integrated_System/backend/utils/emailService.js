import nodemailer from 'nodemailer';

/**
 * Sends a generic email using nodemailer.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"MindBridge Team" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

/**
 * Sends a specific welcome email to new counselors.
 */
const sendWelcomeEmail = async (counselorEmail, counselorName, username, password) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0a0808; max-width: 600px; margin: auto;">
            <h2>Welcome to MindBridge!</h2>
            <p>Dear <strong>${counselorName}</strong>,</p>
            <p>We are delighted to have you join our team. Your expertise and dedication will play a vital role in supporting individuals on their journey toward better mental well-being.</p>
            <p>Your account has been successfully created. Please find your login details below:</p>
            <div style="background: #c2c8dd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
            </div>
            <p>You can access the system using the credentials above. For security purposes, we strongly recommend that you change your password after your first login.</p>
            <p>If you encounter any issues or need assistance, please do not hesitate to reach out to our support team.</p>
            <p>We're excited to have you with us and look forward to working together!</p>
            <p>Warm regards,<br><strong>MindBridge Team</strong></p>
        </div>
    `;

    return await sendEmail({
        to: counselorEmail,
        subject: 'Welcome to MindBridge',
        html,
    });
};

export { sendEmail, sendWelcomeEmail };
export default sendEmail;
