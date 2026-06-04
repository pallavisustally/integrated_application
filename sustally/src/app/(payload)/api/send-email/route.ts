import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { APIError } from 'payload'
import { corsPreflightResponse, jsonResponse } from '../../../../lib/cors'

function formatAssessmentTypeLabel(assessmentType?: string): string {
  if (assessmentType === 'SCOPE_1') return 'Scope 1 — Direct emissions inventory'
  if (assessmentType === 'SCOPE_2') return 'Scope 2 — Purchased electricity'
  return 'Assessment'
}

function formatAssessmentTypeShort(assessmentType?: string): string {
  if (assessmentType === 'SCOPE_1') return 'Scope 1 Assessment'
  if (assessmentType === 'SCOPE_2') return 'Scope 2 Assessment'
  return 'Assessment'
}

export const OPTIONS = async (request: Request) => corsPreflightResponse(request)

export const POST = async (request: Request) => {
  try {
    const payload = await getPayload({
      config: configPromise,
    })

    const data = await request.json()

    // Validate required fields
    if (!data.email) {
      throw new APIError('Email address is required', 400)
    }

    // Assessments are created via POST /api/assessments/book before send-email.
    // Mirror slot-bookings only if missing (legacy / email-only path).
    const isSlotBooking = data.assignmentDate || data.assignmentSlot || data.assignmentTime
    if (isSlotBooking && data.assessmentId) {
      try {
        const existingBooking = await payload.find({
          collection: 'slot-bookings',
          where: { assessmentId: { equals: data.assessmentId } },
          limit: 1,
        })
        if (existingBooking.totalDocs === 0) {
          await payload.create({
            collection: 'slot-bookings',
            data: {
              name: data.name || '',
              email: data.email || '',
              mobile: data.mobile || '',
              company: data.company || '',
              sector: data.sector || '',
              natureOfBusiness: data.natureOfBusiness || '',
              country: data.country || '',
              assignmentDate: data.assignmentDate || '',
              assignmentSlot: data.assignmentSlot || '',
              assignmentTime: data.assignmentTime || '',
              assessmentId: data.assessmentId || '',
              assessmentLink: data.assessmentLink || '',
            },
          })
        }
      } catch (saveErr) {
        console.warn('[send-email] Failed to save slot booking:', saveErr)
      }
    }

    // Extract review details from request
    // const renewableEnergyStr = data.renewableEnergy || '0';
    // const totalEnergyStr = data.totalEnergy || '0';

    // // Extract numeric values (remove units like "kWh" if present)
    // const renewableEnergy = parseFloat(String(renewableEnergyStr).replace(/[^\d.]/g, '')) || 0;
    // const totalEnergy = parseFloat(String(totalEnergyStr).replace(/[^\d.]/g, '')) || 0;

    // // Calculate renewable energy percentage: (Renewable Energy / Total Energy) × 100
    // const renewablePercentage = totalEnergy > 0 
    //   ? ((renewableEnergy / totalEnergy) * 100).toFixed(2)
    //   : '0.00';

    const reviewDetails = {
      name: data.name || '-',
      mobile: data.mobile || '-',
      email: data.email || '-',
      company: data.company || '-',
      sector: data.sector || '-',
      natureOfBusiness: data.natureOfBusiness || '-',
      assessmentType: data.assessmentType || '',
      assessmentTypeLabel: formatAssessmentTypeLabel(data.assessmentType),
      assessmentTypeShort: formatAssessmentTypeShort(data.assessmentType),

      assignmentDate: data.assignmentDate || "-",
      assignmentSlot: data.assignmentSlot || "-",
      assignmentTime: data.assignmentTime || "-",

      country: data.country || '-',
      // renewableEnergy: renewableEnergyStr || '-',
      // totalEnergy: totalEnergyStr || '-',
      // renewablePercentage: `${renewablePercentage}%`,
      assessmentLink: data.assessmentLink || '#',
      expireTime: data.expireTime || 'Standard expiration applies'
    }

    // Create email HTML content with all review details
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #0b0909;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #686565;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-label {
              font-weight: 600;
              color: #050505;
            }
            .detail-value {
              color: #333;
              text-align: right;
            }
            .footer {
              background-color: #f4f0f0;
              color: #0c0c0c;
              padding: 15px;
              text-align: center;
              border-radius: 0 0 8px 8px;
              font-size: 12px;
            }
            .action-button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .action-container {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .expire-info {
              font-size: 12px;
              color: #d9534f;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Slot Booking Details</h1>
            </div>
            <div class="content">
              
              <div class="action-container">
                <p>Your assessment slot is confirmed. Please use the link below to access your assessment.</p>
                <a href="${reviewDetails.assessmentLink}" class="action-button">Start Assessment</a>
                <p class="expire-info">Link Valid Until: ${reviewDetails.expireTime}</p>
              </div>

              <h2>Application Information</h2>
              <div class="detail-row">
                <span class="detail-label">Name: &nbsp;</span>
                <span class="detail-value">${reviewDetails.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile: &nbsp;</span>
                <span class="detail-value">${reviewDetails.mobile}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email: &nbsp;</span>
                <span class="detail-value">${reviewDetails.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company: &nbsp;</span>
                <span class="detail-value">${reviewDetails.company}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Assessment Type: &nbsp;</span>
                <span class="detail-value">${reviewDetails.assessmentTypeLabel}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Country: &nbsp;</span>
                <span class="detail-value">${reviewDetails.country}</span>
              </div>
              

              <div class="detail-row">
              <span class="detail-label">Assignment Date: &nbsp;</span>
              <span class="detail-value">${reviewDetails.assignmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Assignment Slot: &nbsp;</span>
                <span class="detail-value">${reviewDetails.assignmentSlot}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Assignment Time: &nbsp;</span>
                <span class="detail-value">${reviewDetails.assignmentTime}</span>
              </div>

              
            </div>
            <div class="footer">
              <p>This email was sent from Sustally Application System</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Create plain text version
    const emailText = `
Review Details

Your assessment slot is confirmed.
Access Link: ${reviewDetails.assessmentLink}
Expires: ${reviewDetails.expireTime}

Application Information:

Name: ${reviewDetails.name}
Mobile: ${reviewDetails.mobile}
Email: ${reviewDetails.email}
Company: ${reviewDetails.company}
Assessment Type: ${reviewDetails.assessmentTypeLabel}
Country: ${reviewDetails.country}

${reviewDetails.assessmentTypeShort}:

Assignment Date: ${reviewDetails.assignmentDate}
Assignment Slot: ${reviewDetails.assignmentSlot}
Assignment Time: ${reviewDetails.assignmentTime}

---
This email was sent from Sustally Application System
    `.trim()

    if (!data.skipEmail) {
      // Check if email adapter is configured
      if (!payload.email) {
        throw new APIError('Email service is not configured. Please set SMTP_USER and SMTP_PASS environment variables.', 503)
      }

      // Send email using Payload's email adapter
      await payload.sendEmail({
        to: reviewDetails.email,
        subject: `Your ${reviewDetails.assessmentTypeShort} Slot Confirmation`,
        html: emailHtml,
        text: emailText,
      })
    }

    return jsonResponse(request, {
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error) {
    console.error('Error sending email:', error)

    if (error instanceof APIError) {
      return jsonResponse(request, { success: false, error: error.message }, error.status)
    }

    // Extract error message from the error object
    let errorMessage = 'Failed to send email'
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage

      // Provide user-friendly error messages for common SMTP errors
      if (error.message.includes('EAUTH') || error.message.includes('BadCredentials')) {
        errorMessage = 'SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS credentials. For Gmail, use an App Password instead of your regular password.'
      } else if (error.message.includes('Missing credentials')) {
        errorMessage = 'SMTP credentials are missing. Please configure SMTP_USER and SMTP_PASS environment variables.'
      } else if (error.message.includes('ECONNECTION') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Could not connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT settings.'
      }
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String(error.message) || errorMessage
    }

    return jsonResponse(request, { success: false, error: errorMessage }, 500)
  }
}
