import type { CollectionConfig } from 'payload'

const Feedback: CollectionConfig = {
    slug: 'feedback',
    admin: {
        useAsTitle: 'email',
    },
    access: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: ({ req: { user } }) => !!user,
    },
    fields: [
        {
            name: 'email',
            type: 'text',
            required: false,
        },
        {
            name: 'experience',
            type: 'number',
        },
        {
            name: 'ease',
            type: 'number',
        },
        {
            name: 'usefulness',
            type: 'number',
        },
        {
            name: 'recommend',
            type: 'number',
        },
        {
            name: 'comment',
            type: 'textarea',
        },
    ],
}

export default Feedback
