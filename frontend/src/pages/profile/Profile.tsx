import { useRef, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Avatar } from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../services/api/authApi";
import { extractErrorMessage } from "../../services/api/http";
import { fileToResizedDataUrl } from "../../utils/image";

export function Profile() {
  const { user, company, updateUser } = useAuth();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      show("Please select an image file", "error");
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const updated = await authApi.updateAvatar(dataUrl);
      updateUser(updated);
      show("Profile picture updated", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setIsUploading(true);
    try {
      const updated = await authApi.updateAvatar("");
      updateUser(updated);
      show("Profile picture removed", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <Card className="max-w-md">
        <div className="mb-6 flex items-center gap-4">
          <Avatar src={user.avatarUrl} alt={user.name} size={72} />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
                Change Picture
              </Button>
              {user.avatarUrl && (
                <Button variant="ghost" onClick={handleRemove} disabled={isUploading}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">JPG or PNG, resized automatically.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Name</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">{user.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">{user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Role</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">{user.role}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Company</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">{company?.name ?? "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
