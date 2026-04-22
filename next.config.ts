import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ==========================================
    // PERFORMANCE
    // ==========================================

    // Enable gzip/brotli compression for all responses
    compress: true,

    // Hide "X-Powered-By: Next.js" header for security
    poweredByHeader: false,

    serverExternalPackages: [
        "exceljs",
        "unzipper",
        "@aws-sdk/client-s3",
        "pdf-parse",
        "pdfjs-dist",
    ],
    // Ensure PDF files in data/ are included in Vercel's output bundle
    outputFileTracingIncludes: {
        '/api/rules/pdf-search': ['./data/gameRules/**'],
        '/api/rules/pdf-view': ['./data/gameRules/**'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
        // Client-side router cache — keep pages cached longer to reduce re-fetches
        staleTimes: {
            dynamic: 30,  // Cache dynamic pages for 30 seconds on the client
            static: 180,  // Cache static pages for 3 minutes on the client
        },
        // Tree-shake large barrel imports to reduce JS bundle size
        optimizePackageImports: [
            "lucide-react",
            "recharts",
            "date-fns",
            "react-hot-toast",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "zod",
        ],
    },
    images: {
        // Optimize image quality vs size tradeoff
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400, // Cache images for 24 hours
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
