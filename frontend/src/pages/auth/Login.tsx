import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export function Login() {
  return (
    <>
      <PageMeta
        title="Sign In | Intelgency Digital Invoicing"
        description="Sign in to Intelgency Digital Invoicing"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
