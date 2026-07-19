import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your SafeLens AI account and start protecting yourself.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-page">Create an account</h1>
        <p className="mt-2 text-caption">Start protecting your digital life today</p>
      </div>
      <RegisterForm />
    </div>
  );
}
