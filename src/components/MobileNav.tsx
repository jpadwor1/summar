'use client';

import { ArrowRight, Gem, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserSubscriptionPlan } from '@/lib/stripe';

interface MobileNavProps {
  isAuth: boolean;
  isSubscribed: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const MobileNav = ({ isAuth, isSubscribed }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const pathName = usePathname();

  useEffect(() => {
    if (isOpen) toggleOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathName]);

  const closeOnCurrent = (href: string) => {
    if (pathName === href) {
      toggleOpen();
    }
  };

  return (
    <div className='cursor-pointer sm:hidden'>
      <Menu
        onClick={toggleOpen}
        className='relative z-40 w-5 h-5 text-zinc-700'
      />

      {isOpen ? (
        <div className='fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full'>
          <ul className='absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8'>
            {!isAuth ? (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/sign-up')}
                    className='flex items-center w-full font-semibold text-green-600'
                    href='/sign-up'
                  >
                    Get Started <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300'></li>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/sign-in')}
                    className='flex items-center w-full font-semibold '
                    href='/sign-in'
                  >
                    Sign in
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300'></li>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/pricing')}
                    className='flex items-center w-full font-semibold '
                    href='/pricing'
                  >
                    Pricing
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/dashboard')}
                    className='flex items-center w-full font-semibold '
                    href='/dashboard'
                  >
                    Dashboard
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300'></li>

                {isSubscribed ? (
                  <li>
                    <Link
                      onClick={() => closeOnCurrent('/dashboard/billing')}
                      className='flex items-center w-full font-semibold '
                      href='/dashboard/billing'
                    >
                      Manage Subscription
                    </Link>
                  </li>
                ) : (
                  <li>
                    <Link
                      onClick={() => closeOnCurrent('/pricing')}
                      className='flex items-center w-full font-semibold '
                      href='/pricing'
                    >
                      Upgrade <Gem className='text-green-600 ml-2 h-5 w-5' />
                    </Link>
                  </li>
                )}
                <li className='my-3 h-px w-full bg-gray-300'></li>

                <li>
                  {/* <Link
                    className='flex items-center w-full font-semibold '
                    href='/api/auth/logout'
                  >
                    Sign out
                  </Link> */}
                  <a
                    className='flex items-center w-full font-semibold '
                    href='/sign-out'
                  >
                    Logout
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MobileNav;
