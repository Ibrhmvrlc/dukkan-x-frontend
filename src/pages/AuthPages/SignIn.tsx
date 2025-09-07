import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Dükkan-Mes"
        description="Dükkan-Mes Firma Yönetim Sistemi"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
