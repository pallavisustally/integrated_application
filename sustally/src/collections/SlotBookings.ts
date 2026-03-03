import type { CollectionConfig } from 'payload'

const SlotBookings: CollectionConfig = {
  slug: 'slot-bookings',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'company', 'assignmentDate', 'assignmentSlot', 'assignmentTime'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'mobile',
      type: 'text',
      required: false,
    },
    {
      name: 'company',
      type: 'text',
      required: false,
    },
    {
      name: 'sector',
      type: 'text',
      required: false,
    },
    {
      name: 'natureOfBusiness',
      type: 'text',
      required: false,
    },
    {
      name: 'country',
      type: 'text',
      required: false,
    },
    {
      name: 'assignmentDate',
      type: 'text',
      required: false,
      admin: {
        description: 'Date of the booked assessment slot',
      },
    },
    {
      name: 'assignmentSlot',
      type: 'text',
      required: false,
      admin: {
        description: 'Shift (e.g. Morning, Afternoon, Evening)',
      },
    },
    {
      name: 'assignmentTime',
      type: 'text',
      required: false,
      admin: {
        description: 'Specific time slot',
      },
    },
    {
      name: 'assessmentId',
      type: 'text',
      required: false,
    },
    {
      name: 'assessmentLink',
      type: 'text',
      required: false,
      admin: {
        description: 'Link to access the assessment',
      },
    },
  ],
}

export default SlotBookings
