import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import Applications from "./collections/Applications";
import Scope2Applications from "./collections/Scope2Applications";
import SlotBookings from "./collections/SlotBookings";
import Feedback from "./collections/Feedback";
import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Applications, Scope2Applications, SlotBookings, Feedback],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  email: (() => {
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = process.env.SMTP_PASS?.trim()
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')

    // Only configure email if credentials are provided
    if (!smtpUser || !smtpPass) {
      console.warn('⚠️  SMTP credentials not configured. Email functionality will be disabled.')
      return undefined
    }

    return nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS || smtpUser,
      defaultFromName: process.env.SMTP_FROM_NAME || 'Sustally',
      transportOptions: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        requireTLS: smtpPort === 587, // true for 587 (STARTTLS)
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      },
    })
  })(),
  sharp,
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000', // Explicitly adding localhost:3000 for dev
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://sustally.vercel.app',
    'https://new-rho-plum.vercel.app',
    '*',
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://sustally.vercel.app',
    'https://new-rho-plum.vercel.app',
    '*',
  ].filter(Boolean),
  plugins: [],
})
