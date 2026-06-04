/**
 * One-time migration: copy slot-bookings ? assessments (SCOPE_2).
 *
 * Usage (from sustally/):
 *   npx tsx scripts/migrate-slot-bookings-to-assessments.ts
 *   npx tsx scripts/migrate-slot-bookings-to-assessments.ts --dry-run
 *
 * Requires DATABASE_URL and PAYLOAD_SECRET in .env
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const dryRun = process.argv.includes('--dry-run')

async function main() {
  const payload = await getPayload({ config })
  const bookings = await payload.find({
    collection: 'slot-bookings',
    limit: 5000,
  })

  let created = 0
  let skipped = 0
  let wouldCreate = 0

  for (const booking of bookings.docs) {
    const assessmentId = booking.assessmentId
    if (!assessmentId || !booking.email) {
      skipped++
      continue
    }

    const existing = await payload.find({
      collection: 'assessments',
      where: { assessmentId: { equals: assessmentId } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      skipped++
      continue
    }

    const data = {
      assessmentId,
      assessmentType: 'SCOPE_2' as const,
      status: 'BOOKED' as const,
      name: booking.name,
      email: booking.email,
      mobile: booking.mobile,
      company: booking.company,
      sector: booking.sector,
      natureOfBusiness: booking.natureOfBusiness,
      country: booking.country,
      assignmentDate: booking.assignmentDate,
      assignmentSlot: booking.assignmentSlot,
      assignmentTime: booking.assignmentTime,
      assessmentLink: booking.assessmentLink,
    }

    if (dryRun) {
      wouldCreate++
      console.log(`[dry-run] would create assessment ${assessmentId} for ${booking.email}`)
      continue
    }

    await payload.create({
      collection: 'assessments',
      data,
    })
    created++
  }

  if (dryRun) {
    console.log(
      `Dry run complete. Would create: ${wouldCreate}, skipped: ${skipped}, total bookings: ${bookings.totalDocs}`,
    )
  } else {
    console.log(
      `Migration complete. Created: ${created}, skipped: ${skipped}, total bookings: ${bookings.totalDocs}`,
    )
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
