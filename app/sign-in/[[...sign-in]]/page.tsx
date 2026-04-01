import type { Metadata } from "next";

import { SignIn } from "@clerk/nextjs";

import { AuthSplitLayout } from "@/components/auth-layout";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Loop – the operator desk for self-updating agent skills.",
};

export default function SignInPage() {
  return (
    <AuthSplitLayout mode="sign-in">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthSplitLayout>
  );
}
