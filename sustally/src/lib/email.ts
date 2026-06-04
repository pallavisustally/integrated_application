import type { TestAccount } from 'nodemailer'; // Type only
import { getFnAppUrl } from './app-urls'

export interface Scope2Submission {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    data: Record<string, unknown>; // The form data
}

export interface Scope1Submission {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    data: Record<string, unknown>;
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

export async function sendScope1AdminNotification(submission: Scope1Submission) {
    const transporter = await getTransporter();
    const { buildAdminAssessmentReviewUrl } = await import('./admin-dashboard-url');
    const reviewLink = buildAdminAssessmentReviewUrl(submission.id, 'SCOPE_1');
    const facilityName = (submission.data.facilityName as string) || 'Unknown Facility';
    const sectorCode = (submission.data.sectorCode as string) || '';

    const mailOptions = {
        from: '"Sustally System" <no-reply@sustally.com>',
        to: ADMIN_EMAIL,
        subject: `New Scope 1 Assessment Submission: ${facilityName}`,
        html: `
      <h1>New Scope 1 Submission Received</h1>
      <p>A new Scope 1 inventory has been submitted for review.</p>
      <ul>
        <li><strong>Facility:</strong> ${facilityName}</li>
        ${sectorCode ? `<li><strong>Sector:</strong> ${sectorCode}</li>` : ''}
        <li><strong>Submitted At:</strong> ${new Date(submission.submittedAt).toLocaleString()}</li>
      </ul>
      <p>Please review the submission:</p>
      <a href="${reviewLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Review Scope 1 Submission</a>
    `,
    };

    try {
        console.log(`[Email] Sending Scope 1 admin notification ${submission.id} to ${ADMIN_EMAIL}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Scope 1 admin notification sent:', info.messageId);
        if (!process.env.SMTP_HOST) {
            const nodemailer = (await import('nodemailer')).default;
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending Scope 1 admin email:', error);
    }
}

export async function sendAdminNotification(submission: Scope2Submission) {
    const transporter = await getTransporter();
    const { buildAdminAssessmentReviewUrl } = await import('./admin-dashboard-url');
    const reviewLink = buildAdminAssessmentReviewUrl(submission.id, 'SCOPE_2');
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
      <a href="${reviewLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Review Scope 2 Submission</a>
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

export async function sendAssessmentApprovalEmail(
    userEmail: string,
    info: {
        assessmentId: string
        assessmentType: 'SCOPE_1' | 'SCOPE_2'
        name?: string
        company?: string
    },
) {
    const transporter = await getTransporter()
    const baseUrl = getFnAppUrl()
    const params = new URLSearchParams({
        email: userEmail,
        assessmentId: info.assessmentId,
    })
    const dashboardLink = `${baseUrl}/dashboard?${params.toString()}`
    const label =
        info.assessmentType === 'SCOPE_1' ? 'Scope 1 inventory' : 'Scope 2 assessment'
    const display = info.company || info.name || 'your facility'

    const mailOptions = {
        from: '"Sustally Team" <no-reply@sustally.com>',
        to: userEmail,
        subject: `${label} approved — view your dashboard`,
        html: `
      <h1>Congratulations!</h1>
      <p>Your ${label} for <strong>${display}</strong> has been approved.</p>
      <p>Use the secure link below to verify your email and download your report:</p>
      <br />
      <a href="${dashboardLink}" style="padding: 12px 24px; background-color: #3D5F2B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Open dashboard</a>
      <br /><br />
      <p>Best regards,<br/>Sustally Team</p>
    `,
    }

    try {
        const infoMsg = await transporter.sendMail(mailOptions)
        console.log('[Email] Assessment approval sent:', userEmail, infoMsg.messageId)
        if (!process.env.SMTP_HOST) {
            const nodemailer = (await import('nodemailer')).default
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(infoMsg))
        }
    } catch (error) {
        console.error('Error sending assessment approval email:', error)
    }
}

export async function sendApprovalEmail(
    userEmail: string,
    submission: Scope2Submission,
    assessmentId?: string,
) {
    console.log(`[Email] Preparing approval email for ${userEmail}`);
    const transporter = await getTransporter();
    const facilityName = (submission.data.facilityName as string) || 'Unknown Facility';

    const baseUrl = getFnAppUrl();
    const params = new URLSearchParams({ email: userEmail });
    if (assessmentId) params.set('assessmentId', assessmentId);
    const dashboardLink = `${baseUrl}/dashboard?${params.toString()}`;

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

export async function sendScope1RejectionEmail(
    userEmail: string,
    facilityLabel: string,
    reason?: string,
    assessmentLink?: string,
) {
    const transporter = await getTransporter()
    const mailOptions = {
        from: '"Sustally Team" <no-reply@sustally.com>',
        to: userEmail,
        subject: 'Action Required: Scope 1 Assessment Update',
        html: `
      <h1>Scope 1 assessment update required</h1>
      <p>Your Scope 1 inventory for <strong>${facilityLabel}</strong> needs changes after review.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${
          assessmentLink
              ? `<p><a href="${assessmentLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Retry assessment</a></p>`
              : '<p>Please contact support for a new assessment link.</p>'
      }
      <p>Best regards,<br/>Sustally Team</p>
    `,
    }
    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error('Error sending Scope 1 rejection email:', error)
    }
}

export async function sendRejectionEmail(userEmail: string, submission: Scope2Submission, reason?: string, assessmentLink?: string) {
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
      ${reason ? `<p><strong>Reason (also attached):</strong> ${reason}</p>` : ''}
      ${assessmentLink ? `
        <p>Please use the link below to retry your assessment with your previous slot details:</p>
        <p><a href="${assessmentLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 10px;">Retry Assessment</a></p>
        <p>Or copy this link: ${assessmentLink}</p>
      ` : '<p>Please log in to your dashboard to retry your assessment.</p>'}
      <br />
      <p>Best regards,<br/>Sustally Team</p>
    `,
        attachments: reason ? [
            {
                filename: 'Feedback.txt',
                content: reason
            }
        ] : []
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
