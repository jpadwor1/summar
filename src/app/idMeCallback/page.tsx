'use client';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../_trpc/client';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Page = () => {
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const { mutate: createMilitaryStripeSession } =
    trpc.createMilitaryStripeSession.useMutation({
      onSuccess: ({ url }) => {
        window.location.href = url ?? '/dashboard/billing';
      },
    });

  const { mutate } = trpc.getMilitaryUser.useMutation({
    onSuccess: (response) => {
      createMilitaryStripeSession();
    },
    onError: (err) => {
      setError(err.message);
      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/sign-in');
      }
    },
  });

  useEffect(() => {
    if (code) {
      mutate({ code }); // Call the tRPC procedure with the code
    }
  }, [code, mutate]);

  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' />
        <h3 className='font-semibold text-xl'>Setting up your account...</h3>
        <p>You will be redirected automatically.</p>

        {error ? (
          <AlertDialog defaultOpen={true}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Uh oh! Something went wrong.
                </AlertDialogTitle>
                <AlertDialogDescription>{error}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                >
                  Go Back
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
};

export default Page;
