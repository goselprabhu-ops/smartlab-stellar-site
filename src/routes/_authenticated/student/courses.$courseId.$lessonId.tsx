import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/states/EmptyState";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/courses/$courseId/$lessonId")({
  component: LessonReader,
});

function LessonReader() {
  const { courseId, lessonId } = Route.useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Courses", to: "/student/courses" },
          { label: "Course", to: "/student/courses" },
          { label: "Lesson" },
        ]}
      />
      <PageHeader
        eyebrow="Lesson"
        title="Lesson reader"
        description="Lesson content rendering will be wired in Phase 5."
      />
      <EmptyState
        icon={BookOpen}
        title="Lesson not loaded yet"
        description={`Reader for course ${courseId} · lesson ${lessonId} ships in Phase 5 with markdown + video embed.`}
      />
    </div>
  );
}
