import type { CollectionConfig } from 'payload'
import type { Scope1Application, Scope1Assessment } from '@/payload-types'

const Scope1Applications: CollectionConfig = {
  slug: 'scope1-applications',
  admin: {
    useAsTitle: 'facilityName',
    description:
      'Scope 1 submissions for admin review. Filter status = PENDING. Approve syncs scope1-assessments and parent assessment (same flow as Scope 2).',
    group: 'Assessments',
    defaultColumns: [
      'facilityName',
      'email',
      'assessmentId',
      'sectorCode',
      'status',
      'createdAt',
    ],
    listSearchableFields: ['email', 'facilityName', 'assessmentId', 'inventoryName'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (typeof window !== 'undefined' || operation !== 'update' || !doc) return doc

        const scope1AssessmentId =
          typeof doc.scope1Assessment === 'string' || typeof doc.scope1Assessment === 'number'
            ? String(doc.scope1Assessment)
            : undefined
        if (!scope1AssessmentId) return doc

        if (doc.status === 'APPROVED' && previousDoc?.status !== 'APPROVED') {
          await req.payload.update({
            collection: 'scope1-assessments',
            id: scope1AssessmentId,
            data: { reviewStatus: 'approved' },
            req,
          })
        }

        if (doc.status === 'REJECTED' && previousDoc?.status !== 'REJECTED') {
          await req.payload.update({
            collection: 'scope1-assessments',
            id: scope1AssessmentId,
            data: {
              reviewStatus: 'rejected',
              rejectionReason: (doc.rejectionReason as string) || '',
            },
            req,
          })
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'assessmentId',
      type: 'text',
      index: true,
      admin: { description: 'Public assessment reference from booking' },
    },
    {
      name: 'assessment',
      type: 'relationship',
      relationTo: 'assessments',
      admin: { description: 'Parent unified assessment booking' },
    },
    {
      name: 'scope1Assessment',
      type: 'relationship',
      relationTo: 'scope1-assessments',
      required: true,
      admin: { description: 'Linked Scope 1 inventory calculation' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'userName',
      type: 'text',
    },
    {
      name: 'userMobile',
      type: 'text',
    },
    {
      name: 'userCompany',
      type: 'text',
    },
    {
      name: 'facilityName',
      type: 'text',
      required: true,
    },
    {
      name: 'inventoryName',
      type: 'text',
      admin: { description: 'Display label from scope1-assessments.name' },
    },
    {
      name: 'sectorCode',
      type: 'select',
      options: [
        { label: 'Cement', value: 'CEMENT' },
        { label: 'Oil & Gas', value: 'OIL_GAS' },
        { label: 'Pulp & Paper', value: 'PULP_PAPER' },
        { label: 'Power', value: 'POWER' },
        { label: 'Iron & Steel', value: 'IRON_STEEL' },
      ],
    },
    {
      name: 'reportingYear',
      type: 'number',
    },
    {
      name: 'grossScope1Tonnes',
      type: 'number',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
      defaultValue: 'PENDING',
      required: true,
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        condition: (data, siblingData) => siblingData?.status === 'REJECTED',
      },
    },
    {
      name: 'otp',
      type: 'text',
      hidden: true,
    },
    {
      name: 'otpExpiresAt',
      type: 'date',
      hidden: true,
    },
  ],
  endpoints: [
    {
      path: '/generate-otp',
      method: 'post',
      handler: async (req) => {
        const body = req.json ? await req.json() : {}
        const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase()

        if (!email) {
          return Response.json({ error: 'Email is required' }, { status: 400 })
        }

        try {
          const result = await req.payload.find({
            collection: 'scope1-applications',
            overrideAccess: true,
            showHiddenFields: true,
            where: { email: { equals: email } },
            sort: '-updatedAt',
            limit: 1,
          })

          if (result.totalDocs === 0) {
            return Response.json({ error: 'Email not found' }, { status: 404 })
          }

          const application = result.docs[0]
          if (application.status !== 'APPROVED') {
            return Response.json(
              { error: 'Application pending or rejected. Please contact admin.' },
              { status: 403 },
            )
          }

          const otp = Math.floor(100000 + Math.random() * 900000).toString()
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

          await req.payload.update({
            collection: 'scope1-applications',
            id: application.id,
            data: { otp, otpExpiresAt: otpExpiresAt.toISOString() },
          })

          try {
            await req.payload.sendEmail({
              to: email,
              subject: 'Your Dashboard Login OTP',
              html: `<p>Your OTP for dashboard access is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
            })
          } catch (err) {
            console.error(`[Scope1 OTP] Email failed for ${email}:`, err)
          }

          return Response.json({ success: true, message: 'OTP sent to email' })
        } catch (error) {
          console.error('Error generating Scope 1 OTP:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
    {
      path: '/verify-otp',
      method: 'post',
      handler: async (req) => {
        const body = req.json ? await req.json() : {}
        const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase()
        const otp = (typeof body.otp === 'string' ? body.otp : String(body.otp || '')).trim()

        if (!email || !otp) {
          return Response.json(
            { error: 'Email and OTP are required' },
            { status: 400 },
          )
        }

        try {
          const result = await req.payload.find({
            collection: 'scope1-applications',
            overrideAccess: true,
            showHiddenFields: true,
            where: { email: { equals: email } },
            sort: '-updatedAt',
            limit: 1,
          })

          if (result.totalDocs === 0) {
            return Response.json({ error: 'Email not found' }, { status: 404 })
          }

          const application = result.docs[0]
          const storedOtp = String(application.otp || '').trim()

          if (
            storedOtp !== otp ||
            !application.otpExpiresAt ||
            new Date(application.otpExpiresAt) < new Date()
          ) {
            return Response.json({ error: 'Invalid or expired OTP' }, { status: 401 })
          }

          await req.payload.update({
            collection: 'scope1-applications',
            id: application.id,
            data: { otp: null, otpExpiresAt: null },
          })

          const scope1AssessmentId =
            typeof application.scope1Assessment === 'string' ||
            typeof application.scope1Assessment === 'number'
              ? String(application.scope1Assessment)
              : null

          let scope1Doc = null
          if (scope1AssessmentId) {
            scope1Doc = await req.payload.findByID({
              collection: 'scope1-assessments',
              id: scope1AssessmentId,
              depth: 0,
            })
          }

          return Response.json({
            success: true,
            assessmentType: 'SCOPE_1',
            user: buildScope1UserFromApplication(application, scope1Doc),
          })
        } catch (error) {
          console.error('Error verifying Scope 1 OTP:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  ],
}

function buildScope1UserFromApplication(
  application: Scope1Application,
  scope1Doc: Scope1Assessment | null,
) {
  const inputPayload = scope1Doc?.inputPayload
  const facilityName =
    application.facilityName ||
    (inputPayload as { facility?: { name?: string } } | undefined)?.facility?.name ||
    scope1Doc?.name

  return {
    assessmentId: application.assessmentId,
    email: application.email,
    name: application.userName || scope1Doc?.name,
    company: application.userCompany,
    facilityName,
    calculationId: scope1Doc?.id,
    sectorCode: application.sectorCode || scope1Doc?.sectorCode,
    reportingYear: application.reportingYear ?? scope1Doc?.reportingYear,
    grossScope1Tonnes: application.grossScope1Tonnes ?? scope1Doc?.grossScope1Tonnes,
    gwpSet: scope1Doc?.gwpSet,
    reportUrl: scope1Doc?.reportUrl,
    result: scope1Doc?.result,
    inputPayload: scope1Doc?.inputPayload,
    applicationId: application.id,
  }
}

export default Scope1Applications
