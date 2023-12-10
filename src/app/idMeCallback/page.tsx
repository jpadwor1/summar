'use client';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../_trpc/client';
import { useEffect } from 'react';

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const origin = searchParams.get('origin');
  const { mutate: createMilitaryStripeSession } =
    trpc.createMilitaryStripeSession.useMutation({
      onSuccess: ({ url }) => {
        window.location.href = url ?? '/dashboard/billing';
      },
    });
  // Use the useMutation hook to call the tRPC procedure
  const { mutate, isSuccess, isError, error } =
    trpc.getMilitaryUser.useMutation({
      onSuccess: () => {
        createMilitaryStripeSession();
        // Redirect after successful verification
        router.push('/dashboard');
      },
      onError: (err) => {
        if (err.data?.code === 'UNAUTHORIZED') {
          router.push('/api/auth/login?');
        }
      },
    });

  useEffect(() => {
    if (code) {
      mutate({ code }); // Call the tRPC procedure with the extracted code
    }
  }, [code, mutate]);

  if (isSuccess) {
    // Handle success state if needed
  }

  if (isError) {
    // Handle error state, e.g., show error message
    console.error('Error:', error);
  }

  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' />
        <h3 className='font-semibold text-xl'>Setting up your account...</h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  );
};

export default Page;
