'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/app/_trpc/client';
import { absoluteUrl } from '@/lib/utils';

interface UpgradeButtonProps {
  planName: string;
  userId: boolean;
}

const UpgradeButton = ({ planName, userId }: UpgradeButtonProps) => {
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? '/dashboard/billing';
    },
  });

  const handleIdMeAuthorization = async () => {
    const clientId = process.env.NEXT_PUBLIC_IDME_CLIENT_ID;
    console.log(clientId);
    const redirectUri = 'https://summarai.io/idMeCallback?origin=pricing'; // Replace with your callback URL
    const scope = 'military';
    const state = encodeURIComponent(
      JSON.stringify({ originUrl: window.location.pathname })
    );
    const authUrl = `https://api.id.me/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    console.log(authUrl);
    window.location.href = authUrl;
  };

  let buttonLabel = '';
  if (!userId) {
    buttonLabel = planName === 'Pro' ? 'Sign up' : 'Sign Up';
  } else {
    buttonLabel = planName === 'Military' ? 'Verify now' : 'Verify Now';
  }

  return (
    <Button
      onClick={() => {
        planName === 'Pro' ? createStripeSession() : handleIdMeAuthorization();
      }}
      className='w-full'
    >
      {buttonLabel}
      <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  );
};

export default UpgradeButton;
