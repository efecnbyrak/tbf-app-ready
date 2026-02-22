import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Verify session - only admins can upload
                const session = await getSession();

                if (!session || session.role !== 'ADMIN') {
                    console.error("[BLOB AUTH] Unauthorized attempt by:", session?.userId || 'Unknown');
                    throw new Error('Yetkisiz işlem: Sadece adminler dosya yükleyebilir.');
                }

                console.log("[BLOB AUTH] Token generation allowed for:", session.userId, "path:", pathname);

                return {
                    allowedContentTypes: ['application/pdf'],
                    tokenPayload: JSON.stringify({
                        userId: session.userId,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Blob upload completed', blob, tokenPayload);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error: any) {
        console.error("[BLOB AUTH ERROR]:", error.message);
        return NextResponse.json(
            { error: error.message || "Token retrieval failed" },
            { status: 400 },
        );
    }
}
