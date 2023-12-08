'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/app/_trpc/client';

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
  // const { mutate: createMilitaryStripeSession } =
  //   trpc.createMilitaryStripeSession.useMutation({
  //     onSuccess: ({ url }) => {
  //       window.location.href = url ?? '/dashboard/billing';
  //     },
  //   });

  let buttonLabel = '';
  if (!userId) {
    buttonLabel = planName === 'Pro' ? 'Sign up' : 'Sign Up';
  } else {
    buttonLabel = planName === 'Pro' ? 'Upgrade now' : 'Verify Now';
  }

  return (
    <Button
      onClick={() => {
        createStripeSession();
        // planName === 'Pro'
        //   ? createStripeSession()
        //   : createMilitaryStripeSession({ planName });
      }}
      className='w-full'
    >
      {buttonLabel}
      <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  );
};

export default UpgradeButton;
