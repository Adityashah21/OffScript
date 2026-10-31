import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const ADMIN_LOGIN_URL = "https://offscript-admin.vercel.app/login";

export const Route = createFileRoute("/login")({
  component: LoginRedirect,
});

function LoginRedirect() {
  useEffect(() => {
    window.location.href = ADMIN_LOGIN_URL;
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
      <div className="animate-spin h-7 w-7 border-2 border-foreground border-t-transparent rounded-full mb-4" />
      <h1 className="display-md">Redirecting to Admin Login...</h1>
      <p className="mt-4 text-muted-foreground">
        If you are not redirected automatically,{" "}
        <a href={ADMIN_LOGIN_URL} className="underline text-foreground font-medium">
          click here to sign in
        </a>.
      </p>
    </div>
  );
}
