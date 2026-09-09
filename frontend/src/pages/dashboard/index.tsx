import { OrganizationAnalytics } from "@/components/organizations/OrganizationAnalytics";
import { TokenManager } from "@/lib/api";
import { SEO } from "@/components/common/SEO";
import { useOrganization } from "@/contexts/organization-context";
import SplashScreen from "@/components/common/SplashScreen";

export default function DashboarPage() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id || TokenManager.getCurrentOrgId() || "";

  return (
    <>
      <SEO title="Dashboard" />
      <div className="dashboard-container">
        {orgId ? (
          <OrganizationAnalytics organizationId={orgId} />
        ) : (
          <SplashScreen statusText="Loading dashboard..." />
        )}
      </div>
    </>
  );
}
