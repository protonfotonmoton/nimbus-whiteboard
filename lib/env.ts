export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  get hasSupabase() {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },
};
