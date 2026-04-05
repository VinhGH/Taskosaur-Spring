import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { HiEnvelope, HiShieldCheck, HiUserPlus } from "react-icons/hi2";
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
        key: "sso_redirect_uri",
        label: "Redirect URI",
        description: "Callback URL configured in your identity provider",
        type: "text" as const,
        defaultValue: "",
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

  return (
    <>
      {Object.entries(CONFIG_SCHEMA).map(([sectionKey, section]) => {
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

              {/* Only show save if at least one field is editable */}
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
      })}
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
