import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // Fetch the private blob stream securely
        const response = await get(url, {
            access: 'private',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        if (response && response.statusCode === 200) {
            // Proxy the stream back to the client directly
            return new NextResponse(response.stream, {
                headers: {
                    'Content-Type': response.blob.contentType,
                    'Content-Disposition': response.blob.contentDisposition,
                },
            });
        }

        return NextResponse.json({ error: 'Failed to fetch blob from storage' }, { status: 500 });
    } catch (error) {
        console.error('Error downloading vercel blob proxy:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
