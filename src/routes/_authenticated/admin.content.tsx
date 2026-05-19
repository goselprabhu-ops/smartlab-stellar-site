import { createFileRoute } from "@tanstack/react-router";
import { FolderTree, FileText, Sparkles, GitBranch, Layers, Upload } from "lucide-react";
import { FeatureShell } from "@/components/FeatureShell";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  return (
    <FeatureShell
      eyebrow="Content management"
      title="Curriculum, chapters, and micro-concepts"
      description="Browse and curate the knowledge graph that powers every adaptive learning path."
      status="beta"
      groups={[
        {
          title: "Content operations",
          items: [
            { icon: FolderTree, title: "Curriculum tree", description: "Browse subjects → chapters → topics → micro-concepts." },
            { icon: FileText, title: "Lesson editor", description: "Edit, draft, and publish lesson content with versioning." },
            { icon: Sparkles, title: "AI authoring", description: "Generate first drafts of summaries, MCQs, and flashcards." },
            { icon: GitBranch, title: "Publish workflows", description: "Draft → review → publish with rollback support." },
            { icon: Layers, title: "Concept linking", description: "Map prerequisites and related concepts across subjects." },
            { icon: Upload, title: "Bulk import", description: "CSV and JSON ingestion for partner content." },
          ],
        },
      ]}
    />
  );
}
