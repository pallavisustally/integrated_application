
import { getPayload } from 'payload'
import config from './payload.config'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcode secrets for this test script
process.env.PAYLOAD_SECRET = '7700374eb3ee327ceb058675';
process.env.DATABASE_URL = 'mongodb+srv://lagisettipallavi607:pallavi@cluster0.bfzhbf8.mongodb.net/';

const run = async () => {
    const payload = await getPayload({ config })

    const email = 'scope2test@example.com';

    // Check if exists
    const existing = await payload.find({
        collection: 'scope2-applications',
        where: {
            email: { equals: email }
        }
    });

    if (existing.docs.length > 0) {
        console.log('Test user already exists:', existing.docs[0].id);
        process.exit(0);
    }

    const result = await payload.create({
        collection: 'scope2-applications',
        data: {
            email: email,
            facilityName: "Test Facility Scope 2",
            state: "California",
            siteCount: "5",
            status: "APPROVED",
            reportingYear: "2023-2024",
            reportingPeriod: "Annually",
            renewableProcurement: "No",
            netMeteringApplicable: "No",
            energyActivityInput: "Yearly",
            energyCategory: "Electricity",
            trackingType: "Unit consumption",
            hasRenewableElectricity: "No",
            gridEmissionFactor: 0.5,
            locationBasedEmissions: 100,
            marketBasedEmissions: 120,
            energyGrid_kJ: 3600000000, // 1 GWh
            energyRenew_kJ: 0,
            energyTotal_kJ: 3600000000,
            conditionalApproach: "Operational Control",
        },
    })

    console.log('Created test user:', result.id)
    process.exit(0)
}

run()
