import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            token: process.env.BLOB_READ_WRITE_TOKEN,
            onBeforeGenerateToken: async (pathname: string) => {
                // Here you can verify user authentication if needed.
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                    maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
                    allowOverwrite: true, // Allow replacing files with the exact same name
                    tokenPayload: JSON.stringify({
                        // Optional data
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Upload completed:', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("Vercel Blob Backend Error inside `/api/evidence/upload`:", error);
        return NextResponse.json(
            { error: (error as Error).message, details: error },
            { status: 400 }
        );
    }
}
