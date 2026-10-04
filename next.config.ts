import type { NextConfig } from "next"

// Site photos staff upload in the portal are served from this project's
// public Supabase Storage bucket. Only that path is allowed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/site-photos/**`)]
      : [],
  },
}

export default nextConfig
