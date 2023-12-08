'use client';

import Link from 'next/link';
import Messages from './Messages';
import ChatInput from './ChatInput';
import { trpc } from '@/app/_trpc/client';
import { Loader2, XCircle, ChevronLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChatContextProvider } from './ChatContext';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
interface ChatWrapperProps {
  fileId: string;
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const ChatWrapper = ({ fileId, subscriptionPlan }: ChatWrapperProps) => {
  const [currentlyDeletingFile, setCurrentlyDeletingFile] =
    useState<boolean>(false);
  const utils = trpc.useUtils();
  const router = useRouter();
  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
      router.push('/dashboard');
    },
    onMutate() {
      setCurrentlyDeletingFile(true);
    },
  });
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    {
      fileId,
    },
    {
      refetchInterval: (data) =>
        data?.status === 'SUCCESS' || data?.status === 'FAILED' ? false : 500,
    }
  );

  const ProPagesAmount = PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf;

  const freePagesAmount = PLANS.find(
    (plan) => plan.name === 'Free'
  )!.pagesPerPdf;

  const militaryPagesAmount = PLANS.find(
    (plan) => plan.name === 'Military'
  )!.pagesPerPdf;
  
  if (isLoading)
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>Loading...</h3>
            <p className='text-zinc-500 text-sm'>
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  if (data?.status === 'PROCESSING')
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>Processing PDF...</h3>
            <p className='text-zinc-500 text-sm'>This won&apos;t take long.</p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  if (data?.status === 'FAILED')
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <XCircle className='h-8 w-8 text-red-500' />
            <h3 className='font-semibold text-xl'>Too many pages in PDF</h3>
            <p className='text-zinc-500 text-sm'>
              Your{' '}
              <span className='font-medium'>
                {subscriptionPlan.name === 'Pro' ? 'Pro' : 'Free'}
              </span>{' '}
              plan supports up to{' '}
              {subscriptionPlan.name === 'Pro'
                ? ProPagesAmount
                : freePagesAmount}{' '}
              pages per PDF.
            </p>

            <Button
              onClick={() => deleteFile({ id: fileId })}
              variant='secondary'
              className='mt-4'
            >
              {currentlyDeletingFile ? (
                <Loader2 className='h-4 w-4 mr-1 animate-spin' />
              ) : (
                <ChevronLeft className='h-3 w-3 mr-1.5' />
              )}
              Back
            </Button>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  return (
    <ChatContextProvider fileId={fileId}>
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 justify-between gap-2'>
        <div className='flex-1 justify-between flex flex-col mb-28'>
          <Messages fileId={fileId} />
        </div>

        <ChatInput />
      </div>
    </ChatContextProvider>
  );
};

export default ChatWrapper;
