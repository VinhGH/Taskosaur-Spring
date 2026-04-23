import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import ProjectsContent from "@/components/projects/ProjectsContent";
import { SEO } from "@/components/common/SEO";

// Only allow safe slugs - letters, numbers, dashes, underscores
const isSafeSlug = (slug?: string) => typeof slug === "string" && /^[a-zA-Z0-9_-]+$/.test(slug);

export default function WorkspaceProjectsPage() {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { t } = useTranslation("projects");

  return (
    <>
      <SEO title={t("title")} description={t("description")} />
      <ProjectsContent
        contextType="workspace"
        contextId={workspaceSlug as string}
        workspaceSlug={workspaceSlug as string}
        title={t("title")}
        description={t("description")}
        emptyStateTitle={t("empty_state_title")}
        emptyStateDescription={t("empty_state_description")}
        enablePagination={true}
        generateProjectLink={(project, ws) =>
          isSafeSlug(ws) && isSafeSlug(project?.slug)
            ? `/${ws}/${project.slug}`
            : undefined
        }
      />
    </>
  );
}
