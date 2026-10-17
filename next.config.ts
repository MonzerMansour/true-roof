import type { NextConfig } from "next"

// Site photos staff upload in the portal are served from this project's
// public Supabase Storage bucket. Only that path is allowed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig: NextConfig = {
  images: {
    // MarketingPhoto asks for 80. Without this Next allows only its default
    // 75 and warns on every image it renders, which the 109 site photographs
    // turned into a wall of log noise.
    qualities: [75, 80],
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/site-photos/**`)]
      : [],
  },
}

export default nextConfig
