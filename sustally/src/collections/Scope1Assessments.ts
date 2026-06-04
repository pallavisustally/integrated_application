import type { CollectionConfig } from 'payload'

/**
 * Scope 1 inventory submission linked to a parent assessment booking.
 * Stores engine input/result snapshots for admin review and post-approval reports.
 */
const Scope1Assessments: CollectionConfig = {
  slug: 'scope1-assessments',
  admin: {
    useAsTitle: 'name',
    description:
      'Scope 1 inventories. Filter reviewStatus = pending for the review queue. Approve to generate PDF and email the applicant.',
    defaultColumns: [
      'assessmentId',
      'sectorCode',
      'reportingYear',
      'reviewStatus',
      'grossScope1Tonnes',
      'submittedAt',
      'updatedAt',
    ],
    group: 'Assessments',
    listSearchableFields: ['assessmentId', 'name'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (typeof window !== 'undefined' || !doc) return

        const prevStatus = previousDoc?.reviewStatus
        const nextStatus = doc.reviewStatus
        if (prevStatus === nextStatus) return

        const publicId = doc.assessmentId as string | undefined
        if (!publicId) return

        const parents = await req.payload.find({
          collection: 'assessments',
          where: { assessmentId: { equals: publicId } },
          limit: 1,
        })
        if (parents.totalDocs === 0) return
        const parent = parents.docs[0]

        if (nextStatus === 'approved' && prevStatus !== 'approved') {
          await req.payload.update({
            collection: 'assessments',
            id: parent.id,
            data: {
              status: 'APPROVED',
              approvedAt: new Date().toISOString(),
            },
            req,
          })

          const { onScope1Approved } = await import('../lib/assessment-workflow')
          await onScope1Approved(req.payload, doc as never, parent as never)
        }

        if (nextStatus === 'rejected' && prevStatus !== 'rejected') {
          const reason = (doc.rejectionReason as string) || ''
          await req.payload.update({
            collection: 'assessments',
            id: parent.id,
            data: { status: 'REJECTED', rejectionReason: reason },
            req,
          })

          const { onScope1Rejected } = await import('../lib/assessment-workflow')
          await onScope1Rejected(
            req.payload,
            doc as never,
            {
              email: parent.email,
              assessmentType: parent.assessmentType,
              assessmentId: publicId,
            },
            reason,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'assessmentId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Matches assessments.assessmentId' },
    },
    {
      name: 'assessment',
      type: 'relationship',
      relationTo: 'assessments',
      admin: { description: 'Parent booking record' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Display label e.g. Facility FY2026' },
    },
    {
      name: 'sectorCode',
      type: 'select',
      required: true,
      defaultValue: 'CEMENT',
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
      required: true,
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'engineStatus',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'calculated', 'success_with_warnings', 'blocked'],
      admin: { description: 'Last engine run status' },
    },
    {
      name: 'gwpSet',
      type: 'text',
      defaultValue: 'AR6',
    },
    {
      name: 'grossScope1Tonnes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'biomassMemoTonnes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'supportingScope2Tonnes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'supportingScope3Tonnes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'inputPayload',
      type: 'json',
      required: true,
    },
    {
      name: 'result',
      type: 'json',
    },
    {
      name: 'calculationTrace',
      type: 'json',
    },
    {
      name: 'factorSnapshots',
      type: 'json',
    },
    {
      name: 'calculatedAt',
      type: 'date',
    },
    {
      name: 'submittedAt',
      type: 'date',
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.reviewStatus === 'rejected',
      },
    },
    {
      name: 'reportUrl',
      type: 'text',
      admin: { description: 'URL to approved PDF/workbook after generation' },
    },
    {
      name: 'dashboardUrl',
      type: 'text',
      admin: { description: 'URL to approved dashboard view' },
    },
  ],
  timestamps: true,
}

export default Scope1Assessments
