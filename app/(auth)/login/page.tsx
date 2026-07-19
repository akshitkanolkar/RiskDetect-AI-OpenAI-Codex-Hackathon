import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your RiskDetect AI account.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <div className="mb-8 text-center">
        <h1 className="text-page">Welcome back</h1>
        <p className="text-caption mt-2">Sign in to your account to continue</p>
      </div>
      <LoginForm />
    </div>
  );
}
