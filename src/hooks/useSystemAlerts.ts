import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  cnpj?: string | null;
  telefone?: string | null;
  endereco_rua?: string | null;
  funcoes?: string[] | null;
  cidade?: string | null;
}

export function useSystemAlerts() {
  const { toast } = useToast();
  const applicationTimestamps = useRef<number[]>([]);

  const checkCompanyProfile = useCallback(async (userId: string): Promise<{ valid: boolean; message: string }> => {
    const { data } = await supabase
      .from('company_profiles')
      .select('cnpj, telefone, endereco_rua')
      .eq('user_id', userId)
      .maybeSingle();

    const profile = data as ProfileData | null;
    if (!profile?.cnpj || !profile?.telefone || !profile?.endereco_rua) {
      return {
        valid: false,
        message: 'Complete seu perfil antes de publicar vagas',
      };
    }
    return { valid: true, message: '' };
  }, []);

  const checkFreelancerProfile = useCallback(async (userId: string): Promise<{ valid: boolean; message: string }> => {
    const { data } = await supabase
      .from('freelancer_profiles')
      .select('funcoes, cidade')
      .eq('user_id', userId)
      .maybeSingle();

    const profile = data as ProfileData | null;
    if (!profile?.funcoes?.length || !profile?.cidade) {
      return {
        valid: false,
        message: 'Complete seu perfil para se candidatar',
      };
    }
    return { valid: true, message: '' };
  }, []);

  const checkSpamProtection = useCallback((): boolean => {
    const now = Date.now();
    const recentTimestamps = applicationTimestamps.current.filter(
      (t) => now - t < 60000
    );
    applicationTimestamps.current = recentTimestamps;

    if (recentTimestamps.length >= 5) {
      toast({
        title: 'Muitas candidaturas em pouco tempo. Aguarde alguns instantes.',
        variant: 'destructive',
      });
      return false;
    }

    applicationTimestamps.current.push(now);
    return true;
  }, [toast]);

  return {
    checkCompanyProfile,
    checkFreelancerProfile,
    checkSpamProtection,
  };
}
