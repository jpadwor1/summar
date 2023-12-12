'use client';

import { getUserSubscriptionPlan } from '@/lib/stripe';
import { useToast } from './ui/use-toast';
import { trpc } from '@/app/_trpc/client';
import MaxWidthWrapper from './MaxWidthWrapper';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import UpgradeButton from './UpgradeButton';

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
  userId: boolean;
}

const BillingForm = ({ subscriptionPlan, userId }: BillingFormProps) => {
  const { toast } = useToast();

  const { mutate: createStripeSession, isLoading } =
    trpc.createStripeSession.useMutation({
      onSuccess: ({ url }) => {
        if (url) window.location.href = url;
        if (!url) {
          toast({
            title: 'There was a problem...',
            description: 'Please try again in a moment',
            variant: 'destructive',
          });
        }
      },
    });

  return (
    <MaxWidthWrapper className='max-w-5xl'>
      <form
        className='mt-12'
        onSubmit={(e) => {
          e.preventDefault();
          createStripeSession();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              You are currently on the{' '}
              <strong>
                {subscriptionPlan.name ? subscriptionPlan.name : 'Free'}
              </strong>{' '}
              plan
            </CardDescription>
          </CardHeader>
          <CardFooter className='flex flex-col items-center space-y-2 md:flex-row md:justify-between md:space-x-0'>
            <div className='flex flex-col place-items-center md:flex-row space-x-2'>
              <Button type='submit'>
                {isLoading ? (
                  <Loader2 className='animate-spin mr-4 h-4 w-4' />
                ) : null}
                {subscriptionPlan.isSubscribed
                  ? 'Manage Subscription'
                  : 'Upgrade to PRO'}
                <ArrowRight className='h-5 w-5 ml-1.5' />
              </Button>
              {!subscriptionPlan.isSubscribed ? (
                <>
                  <p className='text-slate-600 font-medium'>or</p>
                  <UpgradeButton
                    planName='Military'
                    userId={userId}
                    className=' bg-teal-600'
                  />
                </>
              ) : null}
            </div>
            {subscriptionPlan.isSubscribed ? (
              <p className='rounded-full text-xs font-medium'>
                {subscriptionPlan.isCanceled
                  ? 'Your plan will expire on '
                  : 'Your plan will renew on '}
                {format(
                  subscriptionPlan.stripeCurrentPeriodEnd!,
                  'MMM do,yyyy'
                )}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </form>
    </MaxWidthWrapper>
  );
};

export default BillingForm;
