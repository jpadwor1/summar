import Link from "next/link";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { buttonVariants } from "./ui/button";
import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight } from "lucide-react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const Navbar = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="sticky h-14 inset-x-0 top-0 z-30 w-flow border-b border-gray-200 bg-white/75 backdrop-blur-lg transtion-all">
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Link href="/" className="flex z-40 font-semibold">
            <span className="text-2xl text-zinc-700">Summan.</span>
          </Link>

          {/* TODO: add mobile navbar */}
          <div className="hidden items-center space-x-4 sm:flex">
            <>
              <Link
                href="/pricing"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Pricing
              </Link>
              {user?.id ? (
                <LogoutLink
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Logout
                </LogoutLink>
              ) : (
                <LoginLink
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Login
                </LoginLink>
              )}
              <RegisterLink className={buttonVariants({ size: "sm" })}>
                Get Started <ArrowRight className="ml-1.5 h-5 w-5" />
              </RegisterLink>
            </>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
