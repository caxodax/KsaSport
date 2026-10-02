import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import BentoFeatures from '@/components/landing/BentoFeatures';
import EventShowcase from '@/components/landing/EventShowcase';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

import { getServiceSupabase } from '@/lib/supabase';

export const metadata = {
  title: 'Kasa Sports | Ecosistema Deportivo Inteligente',
  description: 'Plataforma integral para la gestión de ligas de béisbol y kickingball, captación de nuevos talentos y estadísticas en tiempo real.',
};

export default async function PublicLandingPage() {
  const supabase = getServiceSupabase();
  const { data: settings } = await supabase
    .from('club_settings')
    .select('*')
    .eq('id', 1)
    .single();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-kasa-dorado selection:text-kasa-vinotinto">
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        <Hero />
        <SocialProof />
        <BentoFeatures />
        <EventShowcase settings={settings} />
        <CallToAction />
      </main>

      <Footer settings={settings} />
    </div>
  );
}
