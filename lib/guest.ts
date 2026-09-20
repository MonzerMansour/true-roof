// A guest has no account and no Supabase session. The flag is a cookie on this
// device only, so guest access works without any database setup.
export const GUEST_COOKIE = "true-roof-guest"
export const GUEST_MAX_AGE = 60 * 60 * 24 * 30
