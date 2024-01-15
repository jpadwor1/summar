import Link from 'next/link';
import MaxWidthWrapper from './MaxWidthWrapper';
import { buttonVariants } from './ui/button';
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/server';
import { ArrowRight } from 'lucide-react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import UserAccountNav from './UserAccountNav';
import MobileNav from './MobileNav';
import { getUserSubscriptionPlan } from '@/lib/stripe';

const Navbar = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const isSubscribed = await getUserSubscriptionPlan();
  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-flow border-b border-gray-200 bg-white/75 backdrop-blur-lg transtion-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            <span className='text-2xl text-zinc-700'>SummarAi.</span>
          </Link>

          <MobileNav isAuth={!!user} isSubscribed={isSubscribed} />

          <div className='hidden items-center space-x-4 sm:flex'>
            {!user ? (
              <>
                <Link
                  href='/pricing'
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  Pricing
                </Link>

                <LoginLink
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  Login
                </LoginLink>

                <RegisterLink className={buttonVariants({ size: 'sm' })}>
                  Get Started <ArrowRight className='ml-1.5 h-5 w-5' />
                </RegisterLink>
              </>
            ) : (
              <>
                <Link
                  href='/dashboard'
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  Dashboard
                </Link>

                <UserAccountNav
                  name={
                    !user.given_name || !user.family_name
                      ? 'Your Account'
                      : `${user.given_name} ${user.family_name}`
                  }
                  imageUrl={user.picture ?? ''}
                  email={user.email ?? ''}
                />
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
