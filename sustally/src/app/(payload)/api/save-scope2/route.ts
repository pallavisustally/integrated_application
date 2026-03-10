import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { APIError } from 'payload'
import { sendAdminNotification, Scope2Submission } from '../../../../lib/email'

export const OPTIONS = async (request: Request) => {
  // Handle CORS preflight
  const origin = request.headers.get('origin')
  const corsOriginsEnv = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,https://sustally.vercel.app'
  const allowedOrigins = corsOriginsEnv.split(',').map(origin => origin.trim())

  const headers = new Headers()
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')

  return new Response(null, { status: 200, headers })
}

export const POST = async (request: Request) => {
  try {
    const payload = await getPayload({
      config: configPromise,
    })

    const contentType = request.headers.get('content-type') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {}
    const files: Record<string, File> = {}

    // Check if it's FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Parse FormData
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files[key] = value
        } else {
          data[key] = value
        }
      }
    } else {
      // Fallback to JSON (for testing or legacy calls)
      data = await request.json()
    }

    const parsePossiblyDoubleEncodedJSON = (value: unknown) => {
      if (value == null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      if (!trimmed) return null
      try {
        let parsed: unknown = JSON.parse(trimmed)
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed)
        }
        return parsed
      } catch {
        return null
      }
    }

    // Validate required fields
    if (!data.facilityName) {
      throw new APIError('Facility Name is required', 400)
    }

    // Helper to upload file to Media collection
    const uploadFile = async (file: File) => {
      try {
        if (!file) return null

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await payload.create({
          collection: 'media',
          data: {
            alt: file.name || 'uploaded_evidence',
          },
          file: {
            data: buffer,
            name: file.name || 'evidence_file',
            mimetype: file.type || 'application/octet-stream',
            size: file.size || buffer.length,
          },
        })
        return result.id
      } catch (uploadErr) {
        console.warn('Could not upload file to media collection:', uploadErr)
        return null // Return null so the main submission still succeeds instead of 500 crashing
      }
    }

    // Handle File Uploads
    let energyEvidenceId = null
    let renewableEvidenceId = null

    if (files.energySupportingEvidenceFile) {
      energyEvidenceId = await uploadFile(files.energySupportingEvidenceFile)
    }
    if (files.renewableSupportingEvidenceFile) {
      renewableEvidenceId = await uploadFile(files.renewableSupportingEvidenceFile)
    }

    // Prepare the data for Payload
    const scope2Data = {
      userName: data.userName || '',
      userMobile: data.userMobile || '',
      userCompany: data.userCompany || '',
      userEmail: data.userEmail || '',
      sector: data.sector || '',
      natureOfBusiness: data.natureOfBusiness || '',
      state: data.state || '',
      utilityProvider: data.utilityProvider || '',
      siteCount: data.siteCount || '',
      facilityName: data.facilityName || '',
      energyIntensityPerRupee: data.energyIntensityPerRupee || '',
      email: data.userEmail || '',
      renewableProcurement: data.renewableProcurement || '',
      onsiteExportedKwh: data.onsiteExportedKwh || '',
      netMeteringApplicable: data.netMeteringApplicable || '',
      reportingYear: data.reportingYear || '',
      reportingPeriod: data.reportingPeriod || '',
      conditionalApproach: data.conditionalApproach || '',
      scopeBoundaryNotes: data.scopeBoundaryNotes || '',
      energyActivityInput: data.energyActivityInput || '',
      energyCategory: data.energyCategory || '',
      trackingType: data.trackingType || '',
      energyConsumption: data.energyConsumption || '',
      dataSourceType: data.dataSourceType || '',
      // Assign uploaded Media IDs
      energySupportingEvidenceFile: energyEvidenceId,
      energySupportingEvidenceFileUrl: data.energySupportingEvidenceFileUrl || '',
      energySupportingEvidenceFileName: data.energySupportingEvidenceFileName || '',
      energySourceDescription: data.energySourceDescription || '',
      hasRenewableElectricity: data.hasRenewableElectricity || '',
      renewableElectricity: data.renewableElectricity || '',
      renewableEnergyConsumption: data.renewableEnergyConsumption || '',
      renewableDataSourceType: data.renewableDataSourceType || '',
      renewableEnergyActivityInput: data.renewableEnergyActivityInput || 'Yearly',
      // Assign uploaded Media IDs
      renewableSupportingEvidenceFile: renewableEvidenceId,
      renewableSupportingEvidenceFileUrl: data.renewableSupportingEvidenceFileUrl || '',
      renewableSupportingEvidenceFileName: data.renewableSupportingEvidenceFileName || '',
      renewableEnergySourceDescription: data.renewableEnergySourceDescription || '',
      monthlyData: parsePossiblyDoubleEncodedJSON(data.monthlyData),
      renewableMonthlyData: parsePossiblyDoubleEncodedJSON(data.renewableMonthlyData),
      // Energy inputs for Cost Saving Card (grid consumption / spend)
      electricityPurchased: data.electricityPurchased != null && data.electricityPurchased !== ''
        ? parseFloat(String(data.electricityPurchased))
        : null,
      spendAmount: data.spendAmount != null && data.spendAmount !== ''
        ? parseFloat(String(data.spendAmount))
        : null,
      // Calculated Fields
      gridEmissionFactor: parseFloat(String(data.gridEmissionFactor)) || null,
      locationBasedEmissions: parseFloat(String(data.locationBasedEmissions)) || null,
      marketBasedEmissions: parseFloat(String(data.marketBasedEmissions)) || null,
      energyGrid_kJ: parseFloat(String(data.energyGrid_kJ)) || null,
      energyRenew_kJ: parseFloat(String(data.energyRenew_kJ)) || null,
      energyTotal_kJ: parseFloat(String(data.energyTotal_kJ)) || null,
      status: 'PENDING' as const,
    }

    // Create the scope2 application in Payload
    const created = await payload.create({
      collection: 'scope2-applications',
      data: scope2Data,
    })

    // Prepare submission object for email
    const submission: Scope2Submission = {
      id: String(created.id),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      data: scope2Data,
    }

    // Send Admin Notification
    console.log(`[API] Triggering admin notification for submission ${created.id}`);
    await sendAdminNotification(submission)

    // Get origin for CORS
    const origin = request.headers.get('origin')
    const corsOriginsEnv = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,https://sustally.vercel.app'
    const allowedOrigins = corsOriginsEnv.split(',').map(origin => origin.trim())

    const headers = new Headers({
      'Content-Type': 'application/json',
    })

    // Add CORS headers
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Access-Control-Allow-Credentials', 'true')
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return Response.json({
      success: true,
      message: 'Scope 2 application saved successfully',
      id: created.id,
    }, { headers })
  } catch (error) {
    console.error('Error saving scope2 application:', error)

    const origin = request.headers.get('origin')
    const corsOriginsEnv = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,https://sustally.vercel.app'
    const allowedOrigins = corsOriginsEnv.split(',').map(origin => origin.trim())

    const errorHeaders = new Headers({
      'Content-Type': 'application/json',
    })

    if (origin && allowedOrigins.includes(origin)) {
      errorHeaders.set('Access-Control-Allow-Origin', origin)
      errorHeaders.set('Access-Control-Allow-Credentials', 'true')
    }
    errorHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    errorHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (error instanceof APIError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.status, headers: errorHeaders }
      )
    }

    let errorMessage = 'Failed to save scope 2 application'
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String(error.message) || errorMessage
    }

    return Response.json(
      { success: false, error: errorMessage },
      { status: 500, headers: errorHeaders }
    )
  }
}
