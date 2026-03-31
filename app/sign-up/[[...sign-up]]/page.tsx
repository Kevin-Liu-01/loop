import { SignUp } from "@clerk/nextjs";

import { AuthSplitLayout } from "@/components/auth-layout";

export default function SignUpPage() {
  return (
    <AuthSplitLayout mode="sign-up">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthSplitLayout>
  );
}
