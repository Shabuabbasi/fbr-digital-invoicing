import { useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { Badge } from "../../components/Badge";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { companyApi } from "../../services/api/companyApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { FbrSettings } from "../../types/company";

export function FbrConfiguration() {
  const { show } = useToast();
  const [settings, setSettings] = useState<FbrSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    companyApi
      .getFbrSettings()
      .then(setSettings)
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  async function handleEnvironmentChange(environment: "SANDBOX" | "PRODUCTION") {
    setIsSaving(true);
    try {
      const updated = await companyApi.updateFbrEnvironment(environment);
      setSettings(updated);
      show("FBR environment updated", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="FBR Configuration" description="Digital Invoicing integration settings" />
      {error && <ErrorState message={error} />}
      {!error && !settings && <LoadingState />}
      {!error && settings && (
        <Card className="max-w-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Credentials status</span>
              <Badge tone={settings.isConfigured ? "green" : "yellow"}>
                {settings.isConfigured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            {!settings.isConfigured && (
              <p className="rounded-lg bg-warning-50 p-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                FBR credentials are not set. Real submissions cannot be sent to FBR until{" "}
                <code className="rounded bg-warning-100 px-1 dark:bg-warning-500/20">FBR_API_BASE_URL</code> and{" "}
                <code className="rounded bg-warning-100 px-1 dark:bg-warning-500/20">FBR_API_TOKEN</code> are configured on the server —
                credentials are never entered through this UI or stored in the database. See the FBR Integration
                docs for what's still required from official FBR documentation.
              </p>
            )}
            <Select
              label="Environment"
              value={settings.environment}
              onChange={(e) => handleEnvironmentChange(e.target.value as "SANDBOX" | "PRODUCTION")}
              disabled={isSaving}
            >
              <option value="SANDBOX">Sandbox</option>
              <option value="PRODUCTION">Production</option>
            </Select>
            <p className="text-xs text-gray-400 dark:text-gray-500">Environment changes save automatically.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
