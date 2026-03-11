import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://daqzshzstzatrksdbauk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcXpzaHpzdHphdHJrc2RiYXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODMwMjAsImV4cCI6MjA4ODc1OTAyMH0.MoSG5OvxX_1E-MbxN6eNw7ES2Dw74w1czKpYcdicF_s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
