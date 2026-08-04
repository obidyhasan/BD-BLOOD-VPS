"use client";

import Link from "next/link";
import LoginForm from "./LoginForm";
import { FaGoogle } from "react-icons/fa";
import AuthWrapper from "@/components/shared/AuthWrapper/AuthWrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getGoogleAuthUrl } from "@/components/shared/DashboardSearch/DashboardSearch";

const Login = () => {
  return (
    <AuthWrapper
      title="Welcome Back"
      subtitle="Sign in to continue your journey of saving lives."
      visualTitle={"Connected \n By Blood."}
      visualSubtitle="The finest gesture one can offer is the gift of life. Join our verified network of thousands saving lives daily across Bangladesh."
    >
      <div className="flex flex-col gap-6">
        <LoginForm />

        <div className="relative mt-5">
          <Separator />
          <span className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-950 px-3 text-[10px] font-black uppercase  text-muted-foreground">
            Or continue with
          </span>
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full h-14 rounded-2xl font-black text-xs uppercase  border-border/40"
        >
          <a href={getGoogleAuthUrl()}>
            <FaGoogle className="mr-2 size-4" />
            Continue with Google
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <p className="text-center text-sm font-bold text-muted-foreground">
          No account yet?
          <Link
            className="ml-2 text-primary hover:underline decoration-2 underline-offset-4"
            href="/register"
          >
            Create your profile
          </Link>
        </p>
      </div>
    </AuthWrapper>
  );
};

export default Login;
