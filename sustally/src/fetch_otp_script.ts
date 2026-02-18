
import { getPayload } from 'payload'
import config from './payload.config'
import path from 'path'

// dotenv loaded via command line or not needed if passed directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const run = async () => {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: 'scope2-applications',
        where: {
            email: {
                equals: 'scope2test@example.com',
            },
        },
        showHiddenFields: true,
    })

    if (result.docs.length > 0) {
        console.log('OTP:', result.docs[0].otp)
    } else {
        console.log('User not found')
    }

    process.exit(0)
}

run()
