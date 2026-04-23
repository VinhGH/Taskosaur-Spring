import WorkspacesPageContent from "@/components/workspace/WorkspacesPageContent";
import { TokenManager } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/common/SEO";

export default function WorkspacesPage() {
  const { t, i18n } = useTranslation("workspaces");
  const orgId = TokenManager.getCurrentOrgId();

  return (
    <>
      <SEO title={t("title", "Workspaces")} />
      <WorkspacesPageContent organizationId={orgId} />
    </>
  );
}


