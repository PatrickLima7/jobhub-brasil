import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/AvatarUpload';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { Users, MapPin, Briefcase, Star, SearchX } from 'lucide-react';

interface FreelancerOnline {
  id: string;
  user_id: string;
  nome: string;
  funcoes: string[];
  cidade: string;
  experiencia: number;
  completed_jobs: number;
  avgRating: number;
}

export default function FreelancersDisponiveis() {
  const [freelancers, setFreelancers] = useState<FreelancerOnline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnline = async () => {
      setLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('freelancer_profiles')
          .select('*')
          .eq('is_online', true);

        if (error || !profiles) {
          console.error(error);
          return;
        }

        // Fetch ratings for these freelancers
        const userIds = profiles.map(p => p.user_id);
        const { data: reviews } = userIds.length > 0 
          ? await supabase.from('reviews').select('reviewee_id, rating').in('reviewee_id', userIds)
          : { data: [] };

        const ratingsMap = new Map<string, number[]>();
        reviews?.forEach(r => {
          const arr = ratingsMap.get(r.reviewee_id) || [];
          arr.push(r.rating);
          ratingsMap.set(r.reviewee_id, arr);
        });

        const enriched = profiles.map(p => {
          const ratings = ratingsMap.get(p.user_id) || [];
          const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          return {
            id: p.id,
            user_id: p.user_id,
            nome: p.nome || 'Sem nome',
            funcoes: (p.funcoes as string[]) || [],
            cidade: p.cidade || '',
            experiencia: p.experiencia || 0,
            completed_jobs: (p as any).completed_jobs || 0,
            avgRating: avg
          };
        });

        setFreelancers(enriched);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOnline();
    
    // Set up realtime to listen for freelancers going online/offline
    const channel = supabase
      .channel('public:freelancer_profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'freelancer_profiles' },
        (payload) => {
          fetchOnline(); // re-fetch when anyone updates their profile
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-display font-bold">Freelancers Disponíveis Agora</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estes freelancers estão online e prontos para trampar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="h-24 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FloatingIcon><SearchX className="h-10 w-10 mb-3" /></FloatingIcon>
          <p className="text-sm">Nenhum freelancer online no momento.</p>
        </div>
      ) : (
        <StaggerContainer className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((c) => (
            <StaggerItem key={c.id}>
              <div className="border rounded-lg p-4 md:p-5 flex flex-col justify-between card-hover min-h-[140px]">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <UserAvatar type="freelancer" userId={c.user_id} name={c.nome} size={48} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{c.nome}</p>
                      {c.avgRating >= 4.5 && <Badge variant="contratado" className="text-[10px]">Recomendado</Badge>}
                    </div>
                    {c.avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="text-[11px] font-medium">{c.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.funcoes.slice(0, 3).map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-4 text-[12px] text-muted-foreground flex-wrap">
                  {c.cidade && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {c.cidade}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {c.experiencia} ano{c.experiencia !== 1 ? 's' : ''} exp.
                  </span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
