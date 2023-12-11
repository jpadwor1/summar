'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/app/_trpc/client';

interface UpgradeButtonProps {
  planName: string;
  userId: boolean;
  className?: string;
}

const UpgradeButton = ({ planName, userId, className }: UpgradeButtonProps) => {
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? '/dashboard/billing';
    },
  });

  const handleIdMeAuthorization = async () => {
    const clientId = process.env.NEXT_PUBLIC_IDME_CLIENT_ID;
    const redirectUri = 'https://localhost:3000/idMeCallback?origin=pricing'; // Replace with your callback URL
    const scope = 'military';
    const state = encodeURIComponent(
      JSON.stringify({ originUrl: window.location.pathname })
    );
    const authUrl = `https://api.id.me/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  let buttonLabel = '';
  if (!userId) {
    buttonLabel = planName === 'Pro' ? 'Sign up' : 'Sign Up';
  } else {
    buttonLabel = planName === 'Military' ? 'Verify Military' : 'Verify Now';
  }

  return (
    <Button
      onClick={() => {
        planName === 'Pro' ? createStripeSession() : handleIdMeAuthorization();
      }}
      className={className}
    >
      {buttonLabel}
      <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  );
};

export default UpgradeButton;
