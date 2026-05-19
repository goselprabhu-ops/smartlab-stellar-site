import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/student/courses")({
  head: () => ({ meta: [{ title: "Courses — Smart Lab Online" }] }),
  component: () => <Outlet />,
});
