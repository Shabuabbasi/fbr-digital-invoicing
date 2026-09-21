import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import { Badge } from "../../components/Badge";
import { Avatar } from "../../components/Avatar";
import { Modal } from "../../components/Modal";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";
import { userApi } from "../../services/api/userApi";
import { usePaginatedList } from "../../utils/usePaginatedList";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import { useAuth } from "../../context/AuthContext";
import type { ManagedUser } from "../../types/user";
import type { Role } from "../../types/auth";

export function UsersSettings() {
  const { user: currentUser } = useAuth();
  const { show } = useToast();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ACCOUNTANT" as Role });

  const { data, isLoading, error, reload } = usePaginatedList(userApi.list, { page, limit: 20 });

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      await userApi.create(form);
      show("User created", "success");
      setIsCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "ACCOUNTANT" });
      reload();
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(u: ManagedUser) {
    try {
      await userApi.update(u._id, { isActive: !u.isActive });
      show(u.isActive ? "User deactivated" : "User reactivated", "success");
      reload();
    } catch (err) {
      show(extractErrorMessage(err), "error");
    }
  }

  const columns: Column<ManagedUser>[] = [
    {
      header: "Name",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatarUrl} alt={u.name} size={28} />
          <span>{u.name}</span>
        </div>
      ),
    },
    { header: "Email", cell: (u) => u.email },
    { header: "Role", cell: (u) => u.role },
    { header: "Status", cell: (u) => <Badge tone={u.isActive ? "green" : "gray"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
    {
      header: "",
      cell: (u) =>
        u._id !== currentUser?.id && (
          <div className="flex justify-end">
            <button onClick={() => toggleActive(u)} className={u.isActive ? "text-error-600 hover:underline dark:text-error-400" : "text-brand-600 hover:underline dark:text-brand-400"}>
              {u.isActive ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        ),
      className: "px-4 py-3 text-right",
    },
  ];

  return (
    <div>
      <PageHeader title="Users" description="Manage who can access your Intelgency Digital Invoicing account" actions={<Button onClick={() => setIsCreateOpen(true)}>New User</Button>} />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && data && (
        <>
          <Table columns={columns} rows={data.items} rowKey={(u) => u._id} />
          <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New User">
        <div className="flex flex-col gap-4">
          <Input id="userName" label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input id="userEmail" label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input
            id="userPassword"
            label="Temporary Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Select id="userRole" label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <div className="flex justify-end pt-2">
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
