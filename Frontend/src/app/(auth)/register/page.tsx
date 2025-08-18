import { Suspense } from "react";
import RegisterForm from "@/components/auth/Register-Form";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
