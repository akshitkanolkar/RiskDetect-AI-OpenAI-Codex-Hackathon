import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your RiskDetect AI account and start protecting yourself.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <div className="mb-8 text-center">
        <h1 className="text-page">Create an account</h1>
        <p className="text-caption mt-2">Start protecting your digital life today</p>
      </div>
      <RegisterForm />
    </div>
  );
}
