import type { TestAccount } from 'nodemailer'; // Type only

export interface Scope2Submission {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    data: Record<string, unknown>; // The form data
}

let testAccountPromise: Promise<TestAccount> | null = null;

// Helper to get transporter - either from ENV or auto-generated Ethereal account
async function getTransporter() {
    const nodemailer = (await import('nodemailer')).default;

    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback to Ethereal for Development
    if (!testAccountPromise) {
        testAccountPromise = nodemailer.createTestAccount();
    }

    const testAccount = await testAccountPromise;

    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sustally.com';

export async function sendAdminNotification(submission: Scope2Submission) {
    const transporter = await getTransporter();
    const PAYLOAD_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://render-beryl.vercel.app';
    // Update review link to point to the correct admin URL in Sustally
    const reviewLink = `${PAYLOAD_URL}/admin/collections/scope2-applications/${submission.id}`;

    const facilityName = (submission.data.facilityName as string) || 'Unknown Facility';

    const mailOptions = {
        from: '"Sustally System" <no-reply@sustally.com>',
        to: ADMIN_EMAIL,
        subject: `New Scope 2 Assessment Submission: ${facilityName}`,
        html: `
      <h1>New Submission Received</h1>
      <p>A new Scope 2 assessment has been submitted.</p>
      <ul>
        <li><strong>Facility Name:</strong> ${facilityName}</li>
        <li><strong>Submitted At:</strong> ${new Date(submission.submittedAt).toLocaleString()}</li>
      </ul>
      <p>Please review the submission by clicking the link below:</p>
      <a href="${reviewLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Review Submission</a>
    `,
    };

    try {
        console.log(`[Email] Sending admin notification for submission ${submission.id} to ${ADMIN_EMAIL}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Admin notification sent:', info.messageId);
        if (!process.env.SMTP_HOST) {
            const nodemailer = (await import('nodemailer')).default;
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending admin email:', error);
    }
}

export async function sendApprovalEmail(userEmail: string, submission: Scope2Submission) {
    console.log(`[Email] Preparing approval email for ${userEmail}`);
    const transporter = await getTransporter();
    const facilityName = (submission.data.facilityName as string) || 'Unknown Facility';

    // Construct Dashboard URL with params
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sustally.vercel.app';
    const params = new URLSearchParams({
        id: submission.id,
        facilityName: facilityName,
        state: (submission.data.state as string) || '',
        siteCount: (submission.data.siteCount as string) || '',
        reportingYear: (submission.data.reportingYear as string) || '',
        reportingPeriod: (submission.data.reportingPeriod as string) || '',
        scopeBoundaryNotes: (submission.data.scopeBoundaryNotes as string) || '',
        renewableElectricity: (submission.data.renewableElectricity as string) || '',
        renewableEnergyConsumption: (submission.data.renewableEnergyConsumption as string) || '',
        onsiteExportedKwh: (submission.data.onsiteExportedKwh as string) || '',
        energyCategory: (submission.data.energyCategory as string) || '',
        // Calculated fields
        gridEmissionFactor: String(submission.data.gridEmissionFactor || ''),
        locationBasedEmissions: String(submission.data.locationBasedEmissions || ''),
        marketBasedEmissions: String(submission.data.marketBasedEmissions || ''),
        energyGrid_kJ: String(submission.data.energyGrid_kJ || ''),
        energyRenew_kJ: String(submission.data.energyRenew_kJ || ''),
        energyTotal_kJ: String(submission.data.energyTotal_kJ || ''),
    });

    const dashboardLink = `${baseUrl}/scope/certificate?${params.toString()}`;

    const mailOptions = {
        from: '"Sustally Team" <no-reply@sustally.com>',
        to: userEmail,
        subject: 'Scope 2 Assessment Approved - View Dashboard',
        html: `
      <h1>Congratulations!</h1>
      <p>Your Scope 2 assessment for <strong>${facilityName}</strong> has been approved.</p>
      <p>You can now view your emissions dashboard and download your certificate using the link below:</p>
      <br />
      <a href="${dashboardLink}" style="padding: 12px 24px; background-color: #3D5F2B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
      <br /><br />
      <p>Best regards,<br/>Sustally Team</p>
    `,
    };

    try {
        console.log(`[Email] Sending approval email to ${userEmail} with link ${dashboardLink}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent to:', userEmail, 'ID:', info.messageId);
        if (!process.env.SMTP_HOST) {
            const nodemailer = (await import('nodemailer')).default;
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
}

export async function sendRejectionEmail(userEmail: string, submission: Scope2Submission, reason?: string) {
    console.log(`[Email] Preparing rejection email for ${userEmail}`);
    const transporter = await getTransporter();
    const facilityName = (submission.data.facilityName as string) || 'Unknown Facility';
    const mailOptions = {
        from: '"Sustally Team" <no-reply@sustally.com>',
        to: userEmail,
        subject: 'Action Required: Scope 2 Assessment Update',
        html: `
      <h1>Assessment Update Required</h1>
      <p>Thank you for submitting your Scope 2 assessment for <strong>${facilityName}</strong>.</p>
      <p>After review, we have identified areas that need further clarification or correction.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please log in to your dashboard to retry your assessment.</p>
      <br />
      <p>Best regards,<br/>Sustally Team</p>
    `,
    };

    try {
        console.log(`[Email] Sending rejection email to ${userEmail}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Rejection email sent to:', userEmail, 'ID:', info.messageId);
        if (!process.env.SMTP_HOST) {
            const nodemailer = (await import('nodemailer')).default;
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
}
