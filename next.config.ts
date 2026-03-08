import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: [
        "exceljs",
        "unzipper",
        "@aws-sdk/client-s3",
        "pdf-parse",
    ],
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
                port: '',
                pathname: '/vi/**',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
