import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { PLANS } from '@/config/stripe';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, HelpCircle, Minus } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import UpgradeButton from '@/components/UpgradeButton';
import { getUserSubscriptionPlan } from '@/lib/stripe';
const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const userId = user?.id;
  const subscriptionPlan = await getUserSubscriptionPlan();
  const pricingItems = [
    {
      plan: 'Free',
      tagline: 'Ideal for Personal Projects and Small Tasks.',
      quota: 10,
      features: [
        {
          text: '5 pages per PDF',
          footnote: 'The maximum amount of pages per PDF-file.',
        },
        {
          text: '4MB file size limit',
          footnote: 'The largest size for a single PDF.',
        },
        {
          text: 'Mobile-friendly interface',
        },
        {
          text: 'Premium Content Quality',
          footnote: 'Enhanced algorithmic responses for better results',
          negative: true,
        },
        {
          text: 'Priority support',
          negative: true,
        },
      ],
    },
    {
      plan: 'Pro',
      tagline: 'The Perfect Solution for Growing Businesses and Professionals.',
      quota: PLANS.find((p) => p.slug === 'pro')!.quota,
      features: [
        {
          text: '225 Pages per PDF',
          footnote: 'The maximum amount of pages per PDF-file.',
        },
        {
          text: '16MB file size limit',
          footnote: 'The maximum file size of a single PDF file.',
        },
        {
          text: 'Mobile-friendly interface',
        },
        {
          text: 'Premium Content Quality',
          footnote: 'Enhanced algorithmic responses for better results',
        },
        {
          text: 'Priority support',
        },
      ],
    },
    {
      plan: 'Military',
      tagline: 'Honoring Service with Premium Access at No Cost.',
      quota: PLANS.find((p) => p.slug === 'pro')!.quota,
      features: [
        {
          text: '1025 Pages per PDF',
          footnote: 'The maximum amount of pages per PDF-file.',
        },
        {
          text: '16MB file size limit',
          footnote: 'The maximum file size of a single PDF file.',
        },
        {
          text: 'Mobile-friendly interface',
        },
        {
          text: 'Premium Content Quality',
          footnote: 'Enhanced algorithmic responses for better results',
        },
        {
          text: 'Priority support',
        },
      ],
    },
  ];
  return (
    <>
      <MaxWidthWrapper className='mb-8 mt-24 text-center max-w-7xl'>
        <div className='mx-auto mb-10 sm:m-w-lg'>
          <h1 className='text-6xl font-bold sm:text-7xl'>Pricing</h1>
          <p className='mt-5 text-gray-600 sm:text-lg'>
            Whether you&apos;re just trying out our service or need more,
            we&apos;ve got you covered.
          </p>
        </div>
        <div className='px-12 pt-12 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:px-0'>
          <TooltipProvider>
            {pricingItems.map(({ plan, tagline, quota, features }) => {
              const price =
                PLANS.find((p) => p.slug === plan.toLowerCase())?.price
                  .amount || 0;

              return (
                <div
                  key={plan}
                  className={cn('relative rounded-2xl bg-white shadow-lg', {
                    'border-2 border-blue-600 shadow-blue-200': plan === 'Pro',
                    'border-2 border-green-600 shadow-green-200':
                      plan === 'Military',
                    'border border-gray-200': plan === 'Free',
                  })}
                >
                  {plan === 'Military' && (
                    <div className='absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-green-600 to-teal-600 px-3 py-2 text-sm font-medium text-white'>
                      Upgrade Now
                    </div>
                  )}
                  {plan === 'Pro' && (
                    <div className='absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white'>
                      Upgrade Now
                    </div>
                  )}

                  <div className='p-5'>
                    <h3 className='my-3 text-center font-display text-3xl font-bold'>
                      {plan}
                    </h3>
                    <p className='text-gray-500'>{tagline}</p>
                    <p className='my-5 font-display text-6xl font-semibold'>
                      ${price}
                    </p>
                    <p className='text-gray-500'>per month</p>
                  </div>

                  <div className='flex h-20 items-center justify-center border-b border-t border-gray-200bg-gray-50'>
                    <div className='flex items-center space-x-1'>
                      <p>{quota.toLocaleString()} PDFs/ month included</p>

                      <Tooltip delayDuration={300}>
                        <TooltipTrigger className='cursor-default ml-1.5'>
                          <HelpCircle className='h-4 w-4 text-zinc-500' />
                        </TooltipTrigger>
                        <TooltipContent className='w-80 p-2'>
                          How many PDFs you can upload each month.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <ul className='my-10 space-y-5 px-6'>
                    {features.map(({ text, footnote, negative }) => (
                      <li className='flex space-x-5' key={text}>
                        <div className='flex-shrink-0'>
                          {negative ? (
                            <Minus className='h-6 w-6 text-gray-500' />
                          ) : (
                            <Check className='h-6 w-6 text-green-500' />
                          )}
                        </div>

                        {footnote ? (
                          <div className='flex items-center space-x-1'>
                            <p
                              className={cn('text-gray-400', {
                                'text-gray-600': negative,
                              })}
                            >
                              {text}
                            </p>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger className='cursor-default ml-1.5'>
                                <HelpCircle className='h-4 w-4 text-zinc-500' />
                              </TooltipTrigger>
                              <TooltipContent className='w-80 p-2'>
                                {footnote}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <p
                            className={cn('text-gray-400', {
                              'text-gray-600': negative,
                            })}
                          >
                            {text}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className='border-t border-gray-200' />
                  <div className='p-5'>
                    {plan === 'Free' ? (
                      <Link
                        href={userId ? '/dashboard' : '/api/auth/register?'}
                        className={buttonVariants({
                          className: 'w-full',
                          variant: 'secondary',
                        })}
                      >
                        {userId ? 'Try it out' : 'Sign up'}
                        <ArrowRight className='ml-1.5 h-5 w-5' />
                      </Link>
                    ) : plan === 'Pro' && !subscriptionPlan.isSubscribed ? (
                      <Link
                        href='/api/auth/register?'
                        className={buttonVariants({
                          className: 'w-full',
                        })}
                      >
                        Sign up
                        <ArrowRight className='ml-1.5 h-5 w-5' />
                      </Link>
                    ) : plan === 'Military' &&
                      !subscriptionPlan.isSubscribed ? (
                      <Link
                        href='/api/auth/register?'
                        className={buttonVariants({
                          className: 'w-full',
                        })}
                      >
                        Sign up
                        <ArrowRight className='ml-1.5 h-5 w-5' />
                      </Link>
                    ) : plan === 'Pro' && subscriptionPlan.isSubscribed ? (
                      <Link
                        href={userId ? '/dashboard' : '/api/auth/register?'}
                        className={buttonVariants({
                          className: 'w-full',
                        })}
                      >
                        Try it out
                        <ArrowRight className='ml-1.5 h-5 w-5' />
                      </Link>
                    ) : plan === 'Pro' || plan === 'Military' ? (
                      <UpgradeButton planName={plan} userId={!!userId} />
                    ) : (
                      <Link
                        href='/sign-in'
                        className={buttonVariants({
                          className: 'w-full',
                        })}
                      >
                        {userId ? 'Upgrade Now' : 'Sign in'}
                        <ArrowRight className='ml-1.5 h-5 w-5' />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default Page;
