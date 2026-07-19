import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your RiskDetect AI account.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-page">Welcome back</h1>
        <p className="text-caption mt-2">Sign in to your account to continue</p>
      </div>
      <LoginForm />
    </div>
  );
}
