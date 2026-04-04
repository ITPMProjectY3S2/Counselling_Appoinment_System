import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('\n--- EMAIL MOCK (No SMTP configuration found in .env) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        console.log('----------------------------------------------------------\n');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"MindBridge Counseling" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export default sendEmail;
