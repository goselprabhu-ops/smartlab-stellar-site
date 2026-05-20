import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/m")({
  head: () => ({ meta: [
    { title: "Smart Lab Mobile" },
    { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
  ]}),
  component: () => <Outlet />,
});
