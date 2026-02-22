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
};

export default nextConfig;
