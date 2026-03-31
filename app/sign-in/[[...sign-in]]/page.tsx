import { SignIn } from "@clerk/nextjs";

import { AuthSplitLayout } from "@/components/auth-layout";

export default function SignInPage() {
  return (
    <AuthSplitLayout mode="sign-in">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthSplitLayout>
  );
}
