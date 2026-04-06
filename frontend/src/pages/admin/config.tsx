import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HiEnvelope, HiShieldCheck, HiUserPlus, HiBuildingOffice2, HiExclamationTriangle, HiCheck, HiChevronUpDown } from "react-icons/hi2";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";

interface ConfigSetting {
  key: string;
  value: string | null;
  description: string | null;
  category: string;
  isEncrypted: boolean;
}

// Default config structure with categories
const CONFIG_SCHEMA = {
  registration: {
    title: "User Registration",
    description: "Control who can create accounts on the platform",
    icon: HiUserPlus,
    fields: [
      {
        key: "registration_enabled",
        label: "Enable User Registration",
        description: "When disabled, only admins can create new user accounts via invitations",
        type: "toggle" as const,
        defaultValue: "true",
        category: "registration",
      },
      {
        key: "default_organization_id",
        label: "Default Organization",
        description: "New users will automatically join this organization instead of creating their own. Leave empty to require org creation on signup.",
        type: "org-select" as const,
        defaultValue: "",
        category: "registration",
      },
      {
        key: "allow_org_creation",
        label: "Allow Organization Creation",
        description: "When disabled, only Super Admins can create new organizations. Users will be assigned to the default organization.",
        type: "toggle" as const,
        defaultValue: "true",
        category: "registration",
      },
      {
        key: "allow_workspace_creation",
        label: "Allow Workspace Creation",
        description: "When disabled, only Organization Owners and Managers can create workspaces.",
        type: "toggle" as const,
        defaultValue: "true",
        category: "registration",
      },
      {
        key: "allow_project_creation",
        label: "Allow Project Creation",
        description: "When disabled, only Workspace Managers and above can create projects.",
        type: "toggle" as const,
        defaultValue: "true",
        category: "registration",
      },
    ],
  },
  smtp: {
    title: "Email / SMTP Configuration",
    description: "Configure outgoing email settings for notifications and password resets",
    icon: HiEnvelope,
    fields: [
      {
        key: "smtp_host",
        label: "SMTP Host",
        description: "e.g., smtp.gmail.com, smtp.sendgrid.net",
        type: "text" as const,
        defaultValue: "",
        category: "smtp",
      },
      {
        key: "smtp_port",
        label: "SMTP Port",
        description: "Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)",
        type: "text" as const,
        defaultValue: "587",
        category: "smtp",
      },
      {
        key: "smtp_user",
        label: "SMTP Username",
        description: "Usually your email address",
        type: "text" as const,
        defaultValue: "",
        category: "smtp",
      },
      {
        key: "smtp_pass",
        label: "SMTP Password",
        description: "App password or SMTP credential",
        type: "password" as const,
        defaultValue: "",
        category: "smtp",
        isEncrypted: true,
      },
      {
        key: "smtp_from",
        label: "From Address",
        description: "The sender email address for outgoing emails",
        type: "text" as const,
        defaultValue: "",
        category: "smtp",
      },
    ],
  },
  sso: {
    title: "Single Sign-On (SSO / OIDC)",
    description: "Configure OpenID Connect for external authentication (e.g., Authentik, Keycloak, Okta)",
    icon: HiShieldCheck,
    fields: [
      {
        key: "sso_enabled",
        label: "Enable SSO / OIDC Login",
        description: "Allow users to log in with an external identity provider",
        type: "toggle" as const,
        defaultValue: "false",
        category: "sso",
      },
      {
        key: "sso_provider_name",
        label: "Provider Display Name",
        description: "Shown on the login button, e.g., 'Login with Authentik'",
        type: "text" as const,
        defaultValue: "",
        category: "sso",
      },
      {
        key: "sso_issuer_url",
        label: "Issuer URL",
        description: "OIDC discovery URL, e.g., https://auth.example.com/application/o/taskosaur/",
        type: "text" as const,
        defaultValue: "",
        category: "sso",
      },
      {
        key: "sso_client_id",
        label: "Client ID",
        description: "OAuth2 client ID from your identity provider",
        type: "text" as const,
        defaultValue: "",
        category: "sso",
      },
      {
        key: "sso_client_secret",
        label: "Client Secret",
        description: "OAuth2 client secret",
        type: "password" as const,
        defaultValue: "",
        category: "sso",
        isEncrypted: true,
      },
      {
        key: "sso_auto_register",
        label: "Auto-Create Accounts via SSO",
        description: "When enabled, new users can be created through SSO even if public registration is disabled",
        type: "toggle" as const,
        defaultValue: "false",
        category: "sso",
      },
    ],
  },
};

interface FieldSource {
  source: "env" | "db" | "none";
  readonly: boolean;
}

function AdminConfigContent() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [fieldSources, setFieldSources] = useState<Record<string, FieldSource>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [ssoRedirectUri, setSsoRedirectUri] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const result = await adminApi.getConfig();
      const map: Record<string, string> = {};
      const sources: Record<string, FieldSource> = {};

      // Load global settings from DB
      const globalSettings = result?.settings || result;
      if (Array.isArray(globalSettings)) {
        globalSettings.forEach((s: ConfigSetting) => {
          if (s.value !== null) map[s.key] = s.value;
        });
      }

      // Load SMTP source info (env vs db)
      const smtpSources = result?.smtpSources;
      if (Array.isArray(smtpSources)) {
        smtpSources.forEach((s: { key: string; value: string; source: string; readonly: boolean }) => {
          if (s.value) map[s.key] = s.value;
          sources[s.key] = { source: s.source as "env" | "db" | "none", readonly: s.readonly };
        });
      }

      setSettings(map);
      setFieldSources(sources);

      // Load organizations for org-select fields
      try {
        const orgsData = await adminApi.getOrganizations({ limit: 100 });
        setOrganizations(orgsData.data || []);
      } catch {
        // Non-critical — org select will just be empty
      }

      // Load SSO redirect URI
      try {
        const { default: api } = await import("@/lib/api");
        const ssoRes = await api.get("/auth/oidc/config");
        if (ssoRes.data?.redirectUri) {
          setSsoRedirectUri(ssoRes.data.redirectUri);
        }
      } catch {
        // Non-critical
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const getValue = (key: string, defaultValue: string) => {
    return settings[key] ?? defaultValue;
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSection = async (sectionKey: string) => {
    const section = CONFIG_SCHEMA[sectionKey as keyof typeof CONFIG_SCHEMA];
    if (!section) return;

    setIsSaving(sectionKey);
    try {
      // Only save fields that are not set via env vars (readonly)
      const sectionSettings = section.fields
        .filter((field) => !fieldSources[field.key]?.readonly)
        .map((field) => ({
          key: field.key,
          value: getValue(field.key, field.defaultValue),
          description: field.description,
          category: field.category,
          isEncrypted: "isEncrypted" in field ? field.isEncrypted : false,
        }));

      await adminApi.saveConfig(sectionSettings);
      toast.success(`${section.title} saved successfully`);
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[var(--card)] border-none shadow-sm">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  const registrationEnabled = getValue("registration_enabled", "true") === "true";
  const allowOrgCreation = getValue("allow_org_creation", "true") === "true";
  const defaultOrgId = getValue("default_organization_id", "");
  const selectedOrgName = organizations.find((o) => o.id === defaultOrgId)?.name;

  // Warning: org creation disabled but no default org set
  const showOrgWarning = !allowOrgCreation && !defaultOrgId;

  const renderGenericSection = (sectionKey: string, section: (typeof CONFIG_SCHEMA)[keyof typeof CONFIG_SCHEMA]) => {
    const Icon = section.icon;
    return (
      <Card key={sectionKey} className="bg-[var(--card)] border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{section.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{section.description}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {section.fields.map((field) => {
              const source = fieldSources[field.key];
              const isReadonly = source?.readonly === true;

              return (
                <div key={field.key}>
                  {field.type === "toggle" ? (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <Label className="text-sm font-medium">{field.label}</Label>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{field.description}</p>
                      </div>
                      <Switch
                        checked={getValue(field.key, field.defaultValue) === "true"}
                        onCheckedChange={(checked) => handleChange(field.key, checked ? "true" : "false")}
                        disabled={isReadonly}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={field.key} className="text-sm font-medium">{field.label}</Label>
                        {source?.source === "env" && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            Set via .env
                          </span>
                        )}
                      </div>
                      <Input
                        id={field.key}
                        type={field.type === "password" ? "password" : "text"}
                        placeholder={field.description}
                        value={getValue(field.key, field.defaultValue)}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        readOnly={isReadonly}
                        className={`h-9 border-input ${isReadonly ? "bg-[var(--muted)] cursor-not-allowed opacity-70" : "bg-background"}`}
                      />
                      {isReadonly && (
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          This value is set via environment variable and cannot be changed here.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SSO Redirect URI (auto-generated, read-only) */}
          {sectionKey === "sso" && ssoRedirectUri && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Redirect URI</Label>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Auto-generated
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={ssoRedirectUri}
                    readOnly
                    className="h-9 border-input bg-[var(--muted)] cursor-default opacity-80 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 flex-shrink-0 border-none"
                    onClick={() => {
                      navigator.clipboard.writeText(ssoRedirectUri);
                      toast.success("Redirect URI copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Add this URL as the redirect/callback URI in your identity provider settings.
                </p>
              </div>
            </div>
          )}

          {/* Test SMTP (only for smtp section) */}
          {sectionKey === "smtp" && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Test Connection</Label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Verify SMTP server is reachable and credentials are valid
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-4 border-none bg-[var(--accent)] hover:bg-[var(--accent)]/80"
                  disabled={testingSmtp}
                  onClick={async () => {
                    setTestingSmtp(true);
                    try {
                      const result = await adminApi.testSmtp();
                      toast.success(result.message || "SMTP connection verified");
                    } catch (err: unknown) {
                      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "SMTP test failed";
                      toast.error(msg);
                    } finally {
                      setTestingSmtp(false);
                    }
                  }}
                >
                  {testingSmtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Testing...
                    </span>
                  ) : "Test Connection"}
                </Button>
              </div>
            </div>
          )}

          {section.fields.some((f) => !fieldSources[f.key]?.readonly) && (
            <div className="mt-5 flex justify-end">
              <Button
                className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium rounded-lg shadow-none border-none"
                onClick={() => handleSaveSection(sectionKey)}
                disabled={isSaving === sectionKey}
              >
                {isSaving === sectionKey ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : "Save"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* ── Registration Section (Custom Layout) ── */}
      <Card className="bg-[var(--card)] border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <HiUserPlus className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">User Registration</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Control who can create accounts and resources on the platform</p>
            </div>
          </div>

          {/* Registration Toggle */}
          <div className="mt-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Enable User Registration</Label>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  When disabled, only admins can create new user accounts via invitations
                </p>
              </div>
              <Switch
                checked={registrationEnabled}
                onCheckedChange={(checked) => handleChange("registration_enabled", checked ? "true" : "false")}
              />
            </div>
          </div>

          {/* Default Organization */}
          <div className="mt-4 flex items-center justify-between py-2">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2">
                <HiBuildingOffice2 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <Label className="text-sm font-medium">Default Organization</Label>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {defaultOrgId
                  ? `New users will automatically join "${selectedOrgName || "selected organization"}" on signup`
                  : "New users will need to create their own organization on signup"}
              </p>
            </div>
            <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={orgPopoverOpen}
                  className="h-9 w-[220px] justify-between border-none bg-background font-normal flex-shrink-0"
                >
                  <span className="truncate">
                    {selectedOrgName || "None"}
                  </span>
                  <HiChevronUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 border-none bg-[var(--popover)]" align="end">
                <Command>
                  <CommandInput placeholder="Search organizations..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No organization found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          handleChange("default_organization_id", "");
                          setOrgPopoverOpen(false);
                        }}
                      >
                        <HiCheck className={`mr-2 h-3.5 w-3.5 ${!defaultOrgId ? "opacity-100" : "opacity-0"}`} />
                        None
                      </CommandItem>
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.name}
                          onSelect={() => {
                            handleChange("default_organization_id", org.id);
                            setOrgPopoverOpen(false);
                          }}
                        >
                          <HiCheck className={`mr-2 h-3.5 w-3.5 ${defaultOrgId === org.id ? "opacity-100" : "opacity-0"}`} />
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Warning Banner */}
          {showOrgWarning && (
            <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <HiExclamationTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  Organization creation is disabled with no default organization set
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
                  New users will be unable to proceed after signup. Set a default organization above or enable organization creation below.
                </p>
              </div>
            </div>
          )}

          {/* Resource Creation Permissions */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Resource Creation Permissions
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">Allow Organization Creation</Label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    When disabled, only Super Admins can create new organizations
                  </p>
                </div>
                <Switch
                  checked={allowOrgCreation}
                  onCheckedChange={(checked) => handleChange("allow_org_creation", checked ? "true" : "false")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">Allow Workspace Creation</Label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    When disabled, only Organization Owners and Managers can create workspaces
                  </p>
                </div>
                <Switch
                  checked={getValue("allow_workspace_creation", "true") === "true"}
                  onCheckedChange={(checked) => handleChange("allow_workspace_creation", checked ? "true" : "false")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">Allow Project Creation</Label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    When disabled, only Workspace Managers and above can create projects
                  </p>
                </div>
                <Switch
                  checked={getValue("allow_project_creation", "true") === "true"}
                  onCheckedChange={(checked) => handleChange("allow_project_creation", checked ? "true" : "false")}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium rounded-lg shadow-none border-none"
              onClick={() => handleSaveSection("registration")}
              disabled={isSaving === "registration"}
            >
              {isSaving === "registration" ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Other Sections (Generic Layout) ── */}
      {Object.entries(CONFIG_SCHEMA)
        .filter(([key]) => key !== "registration")
        .map(([sectionKey, section]) => renderGenericSection(sectionKey, section))}
    </>
  );
}

export default function AdminConfigPage() {
  return (
    <AdminLayout>
      <AdminConfigContent />
    </AdminLayout>
  );
}
