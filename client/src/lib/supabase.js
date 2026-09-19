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
      // เปิดเก็บ session เพื่อให้นักศึกษาไม่ต้อง login ใหม่ทุกครั้งที่ refresh หน้า
      // Supabase Auth ใช้สำหรับ student login จริง — ต้องเก็บ session ข้ามการ refresh
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabase;
