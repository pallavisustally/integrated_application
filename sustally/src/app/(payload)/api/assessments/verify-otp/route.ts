import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Scope1Application, Scope1Assessment, Scope2Application } from '@/payload-types'

import {
  findAssessmentByIdAndEmail,
  otpIsValid,
} from '../../../../../lib/assessment-otp'
import { normalizeEmail } from '../../../../../lib/assessment-utils'
import { corsHeaders, jsonResponse } from '../../../../../lib/cors'

export const OPTIONS = async (request: Request) => {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const email = normalizeEmail(
      typeof body.email === 'string' ? body.email : String(body.email || ''),
    )
    const otp = (typeof body.otp === 'string' ? body.otp : String(body.otp || '')).trim()
    const assessmentId = (
      typeof body.assessmentId === 'string' ? body.assessmentId : ''
    ).trim()

    if (!email || !otp || !assessmentId) {
      return jsonResponse(
        request,
        { error: 'email, otp, and assessmentId are required' },
        400,
      )
    }

    const payload = await getPayload({ config: configPromise })
    const assessment = await findAssessmentByIdAndEmail(payload, assessmentId, email)

    if (!assessment) {
      return jsonResponse(request, { error: 'Assessment not found' }, 404)
    }

    if (assessment.status !== 'APPROVED') {
      return jsonResponse(request, { error: 'Assessment not approved' }, 403)
    }

    if (!otpIsValid(assessment.otp, assessment.otpExpiresAt, otp)) {
      return jsonResponse(request, { error: 'Invalid or expired OTP' }, 401)
    }

    await payload.update({
      collection: 'assessments',
      id: assessment.id,
      data: { otp: null, otpExpiresAt: null },
      overrideAccess: true,
    })

    if (assessment.assessmentType === 'SCOPE_2') {
      const apps = await payload.find({
        collection: 'scope2-applications',
        where: {
          and: [
            { email: { equals: email } },
            { assessmentId: { equals: assessmentId } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })

      if (apps.totalDocs === 0) {
        const byEmail = await payload.find({
          collection: 'scope2-applications',
          where: { email: { equals: email } },
          sort: '-createdAt',
          limit: 1,
          overrideAccess: true,
        })
        if (byEmail.totalDocs === 0) {
          return jsonResponse(request, { error: 'Scope 2 submission not found' }, 404)
        }
        const application = byEmail.docs[0]
        return jsonResponse(request, {
          success: true,
          assessmentType: 'SCOPE_2',
          user: buildScope2User(application),
        })
      }

      return jsonResponse(request, {
        success: true,
        assessmentType: 'SCOPE_2',
        user: buildScope2User(apps.docs[0]),
      })
    }

    const apps = await payload.find({
      collection: 'scope1-applications',
      where: {
        and: [
          { email: { equals: email } },
          { assessmentId: { equals: assessmentId } },
          { status: { equals: 'APPROVED' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    let application = apps.totalDocs > 0 ? apps.docs[0] : null
    if (!application) {
      const byEmail = await payload.find({
        collection: 'scope1-applications',
        where: {
          and: [{ email: { equals: email } }, { status: { equals: 'APPROVED' } }],
        },
        sort: '-updatedAt',
        limit: 1,
        overrideAccess: true,
      })
      if (byEmail.totalDocs === 0) {
        return jsonResponse(request, { error: 'Scope 1 submission not found' }, 404)
      }
      application = byEmail.docs[0]
    }

    const rel = application.scope1Assessment
    const scope1AssessmentId =
      typeof rel === 'string' || typeof rel === 'number'
        ? String(rel)
        : rel && typeof rel === 'object' && 'id' in rel
          ? String((rel as { id: string | number }).id)
          : null

    let scope1Doc = null
    if (scope1AssessmentId) {
      scope1Doc = await payload.findByID({
        collection: 'scope1-assessments',
        id: scope1AssessmentId,
        depth: 0,
        overrideAccess: true,
      })
    }

    return jsonResponse(request, {
      success: true,
      assessmentType: 'SCOPE_1',
      user: buildScope1User(application, scope1Doc, assessment),
    })
  } catch (error) {
    console.error('[assessments/verify-otp]', error)
    return jsonResponse(request, { error: 'Internal server error' }, 500)
  }
}

function buildScope1User(
  application: Scope1Application,
  scope1Doc: Scope1Assessment | null,
  assessment: {
    assessmentId?: string | null
    email?: string | null
    name?: string | null
    company?: string | null
    sector?: string | null
  },
) {
  const inputPayload = scope1Doc?.inputPayload
  return {
    assessmentId: application.assessmentId || assessment.assessmentId,
    email: application.email || assessment.email,
    name: application.userName || assessment.name || scope1Doc?.name,
    company: application.userCompany || assessment.company,
    sector: assessment.sector,
    calculationId: scope1Doc?.id,
    sectorCode: application.sectorCode || scope1Doc?.sectorCode,
    reportingYear: application.reportingYear ?? scope1Doc?.reportingYear,
    grossScope1Tonnes: application.grossScope1Tonnes ?? scope1Doc?.grossScope1Tonnes,
    gwpSet: scope1Doc?.gwpSet,
    facilityName:
      application.facilityName ||
      (inputPayload as { facility?: { name?: string } } | undefined)?.facility?.name ||
      scope1Doc?.name,
    reportUrl: scope1Doc?.reportUrl,
    result: scope1Doc?.result,
    inputPayload: scope1Doc?.inputPayload,
    applicationId: application.id,
  }
}

function buildScope2User(application: Scope2Application) {
  return {
    facilityName: application.facilityName,
    userCompany: application.userCompany,
    email: application.email,
    id: application.id,
    certificateId: application.certificateId,
    sector: application.sector,
    natureOfBusiness: application.natureOfBusiness,
    state: application.state,
    siteCount: application.siteCount,
    energyIntensityPerRupee: application.energyIntensityPerRupee,
    reportingYear: application.reportingYear,
    reportingPeriod: application.reportingPeriod,
    scopeBoundaryNotes: application.scopeBoundaryNotes,
    energyConsumption: application.energyConsumption,
    renewableElectricity: application.renewableElectricity,
    renewableEnergyConsumption: application.renewableEnergyConsumption,
    onsiteExportedKwh: application.onsiteExportedKwh,
    gridEmissionFactor: application.gridEmissionFactor,
    locationBasedEmissions: application.locationBasedEmissions,
    marketBasedEmissions: application.marketBasedEmissions,
    energyGrid_kJ: application.energyGrid_kJ,
    energyRenew_kJ: application.energyRenew_kJ,
    energyTotal_kJ: application.energyTotal_kJ,
    monthlyData: application.monthlyData,
    renewableMonthlyData: application.renewableMonthlyData,
    renewableEnergyActivityInput: application.renewableEnergyActivityInput,
    dataSourceType: application.dataSourceType,
    renewableDataSourceType: application.renewableDataSourceType,
    electricityPurchased: application.electricityPurchased,
    spendAmount: application.spendAmount,
    trackingType: application.trackingType,
    energyActivityInput: application.energyActivityInput,
    assessmentId: application.assessmentId,
  }
}
