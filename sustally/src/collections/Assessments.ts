import type { CollectionConfig } from 'payload'
import {
  buildAssessmentStartLink,
  generateAssessmentId,
  normalizeEmail,
} from '../lib/assessment-utils'

const Assessments: CollectionConfig = {
  slug: 'assessments',
  admin: {
    useAsTitle: 'assessmentId',
    description:
      'All bookings (Scope 1 and Scope 2). Filter status = SUBMITTED for pending review; APPROVED records can use dashboard OTP.',
    defaultColumns: [
      'assessmentId',
      'assessmentType',
      'status',
      'email',
      'company',
      'assignmentDate',
      'submittedAt',
      'createdAt',
    ],
    group: 'Assessments',
    listSearchableFields: ['assessmentId', 'email', 'company', 'name'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (typeof window !== 'undefined' || !data) return data

        if (operation === 'create') {
          if (!data.assessmentId) {
            data.assessmentId = generateAssessmentId()
          }
          if (!data.status) {
            data.status = 'BOOKED'
          }
          if (data.email) {
            data.email = normalizeEmail(String(data.email))
          }
          if (!data.assessmentLink && data.assessmentId && data.email) {
            data.assessmentLink = buildAssessmentStartLink(
              String(data.assessmentId),
              String(data.email),
            )
          }
        }

        if (operation === 'update' && data.email) {
          data.email = normalizeEmail(String(data.email))
        }

        // Keep legacy slot-bookings in sync for Scope 2 rejection/retry flows
        if (operation === 'create' && data.assessmentId && data.email) {
          try {
            const existing = await req.payload.find({
              collection: 'slot-bookings',
              where: { assessmentId: { equals: data.assessmentId } },
              limit: 1,
            })
            if (existing.totalDocs === 0) {
              await req.payload.create({
                collection: 'slot-bookings',
                data: {
                  name: data.name,
                  email: data.email,
                  mobile: data.mobile,
                  company: data.company,
                  sector: data.sector,
                  natureOfBusiness: data.natureOfBusiness,
                  country: data.country,
                  assignmentDate: data.assignmentDate,
                  assignmentSlot: data.assignmentSlot,
                  assignmentTime: data.assignmentTime,
                  assessmentId: data.assessmentId,
                  assessmentLink: data.assessmentLink,
                },
                req,
              })
            }
          } catch (err) {
            console.error('[Assessments] Failed to mirror slot-booking:', err)
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'assessmentId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Public reference sent in assessment invitation links',
      },
    },
    {
      name: 'assessmentType',
      type: 'select',
      required: true,
      options: [
        { label: 'Scope 1', value: 'SCOPE_1' },
        { label: 'Scope 2', value: 'SCOPE_2' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'BOOKED',
      options: [
        { label: 'Booked', value: 'BOOKED' },
        { label: 'Invited', value: 'INVITED' },
        { label: 'In progress', value: 'IN_PROGRESS' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'mobile',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'sector',
      type: 'text',
    },
    {
      name: 'natureOfBusiness',
      type: 'text',
    },
    {
      name: 'country',
      type: 'text',
      defaultValue: 'India',
    },
    {
      name: 'legalEntityId',
      type: 'text',
      admin: {
        description: 'CIN, PAN, or other legal identifier from booking',
      },
    },
    {
      name: 'siteCount',
      type: 'text',
    },
    {
      name: 'siteCountNumber',
      type: 'text',
    },
    {
      name: 'conditionalApproach',
      type: 'select',
      options: [
        { label: 'Operational Control', value: 'Operational Control' },
        { label: 'Equity Share', value: 'Equity Share' },
        { label: 'Financial Control', value: 'Financial Control' },
      ],
    },
    {
      name: 'assignmentDate',
      type: 'text',
      admin: { description: 'Booked slot date (display string)' },
    },
    {
      name: 'assignmentSlot',
      type: 'text',
      admin: { description: 'Shift label e.g. Morning' },
    },
    {
      name: 'assignmentTime',
      type: 'text',
      admin: { description: 'Specific time slot' },
    },
    {
      name: 'assessmentLink',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Magic link for the applicant to start the assessment',
      },
    },
    {
      name: 'invitedAt',
      type: 'date',
    },
    {
      name: 'submittedAt',
      type: 'date',
    },
    {
      name: 'approvedAt',
      type: 'date',
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.status === 'REJECTED',
      },
    },
    {
      name: 'otp',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'otpExpiresAt',
      type: 'date',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}

export default Assessments
