/**
 * NEXORA Global Configuration
 * 
 * Replace the values below with your Supabase Project URL and Anon Public Key.
 * You can find these in your Supabase Dashboard: Project Settings -> API.
 * 
 * Alternatively, you can configure them interactively in the web UI.
 */
window.NEXORA_CONFIG = {
  // Replace with your real Supabase project URL (e.g. 'https://xyzcompany.supabase.co')
  SUPABASE_URL: window.SUPABASE_URL || localStorage.getItem('NEXORA_SUPABASE_URL') || 'https://plhuhkpkondfzkhgtxuf.supabase.co',
  
  // Replace with your real Supabase anon public API key
  SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY || localStorage.getItem('NEXORA_SUPABASE_ANON_KEY') || 'sb_publishable_1TVCn-VUewFc-L52L_sCEA_q-rzqcjt',
  
  // App metadata
  APP_NAME: 'NEXORA',
  APP_TAGLINE: 'Connect Beyond Boundaries',
  VERSION: '1.0.0',
  DEFAULT_AVATAR: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  DEFAULT_BANNER: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop'
};
