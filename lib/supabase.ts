import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twasfqaluwevvulxxqqq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YXNmcWFsdXdldnZ1bHh4cXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NjE1NDQsImV4cCI6MjEwODUzNzU0NH0.P7vnXPoqgPYV6vntBI41BgNbl3Xqy1AmNK9Cx_aL-gA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
