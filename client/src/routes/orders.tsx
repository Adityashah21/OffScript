import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/orders")({
  component: OrdersRedirect,
});

function OrdersRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/profile" });
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
      <div className="animate-spin h-7 w-7 border-2 border-foreground border-t-transparent rounded-full mb-4" />
      <h1 className="display-md">Opening Profile & Orders...</h1>
      <p className="mt-4 text-muted-foreground">
        If you are not redirected automatically,{" "}
        <Link to="/profile" className="underline text-foreground font-medium">
          click here to view your Profile and Orders
        </Link>.
      </p>
    </div>
  );
}
