import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client สำหรับระบบตรวจสอบการชำระเงิน สาขาจุลชีววิทยา
 * ใช้ env variables จาก .env.local — ถ้าไม่มีจะ throw error ตอน dev
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false,   // ไม่ใช้ Supabase Auth — จัดการ session เองผ่าน localStorage
      autoRefreshToken: false,
    },
  }
);

export default supabase;
