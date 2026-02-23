import { getPayload } from 'payload';
import configPromise from '../src/payload.config';
import fs from 'fs';

async function main() {
    try {
        const payload = await getPayload({ config: configPromise });
        console.log("payload initialized");

        const result = await payload.create({
            collection: 'media',
            data: {
                alt: 'test.pdf',
            },
            file: {
                data: Buffer.from('%PDF-1.4\n%EOF'),
                name: 'test.pdf',
                mimetype: 'application/pdf',
                size: Buffer.from('%PDF-1.4\n%EOF').length
            } as any
        });

        console.log("Created successfully", result.id);
    } catch (err: any) {
        console.error("Error creating payload media:", err?.data || err?.message || err);
    }
}
main();
