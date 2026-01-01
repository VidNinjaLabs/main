/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-globals */
/* eslint-disable react/button-has-type */
import { Edit, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/buttons/Button";
import { SolidSettingsCard } from "@/components/layout/SettingsCard";
import { Heading1 } from "@/components/utils/Text";
import { supabase } from "@/lib/supabase";
import { BackendTestPart } from "@/pages/parts/admin/BackendTestPart";
import { ConfigValuesPart } from "@/pages/parts/admin/ConfigValuesPart";
import { M3U8TestPart } from "@/pages/parts/admin/M3U8TestPart";
import { WorkerTestPart } from "@/pages/parts/admin/WorkerTestPart";

interface User {
  id: string;
  email: string;
  role: string;
  is_premium: boolean;
  createdAt: string;
}

export function AdminDashboardPart() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, is_premium, createdAt")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePremium = async (user: User) => {
    const newStatus = !user.is_premium;

    try {
      // Update in database
      const { error: dbError } = await supabase
        .from("users")
        .update({ is_premium: newStatus })
        .eq("id", user.id);

      if (dbError) throw dbError;

      // Update in auth metadata
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (authUser?.user) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...authUser.user.user_metadata,
            is_premium: newStatus,
          },
        });
      }

      toast.success(
        `User ${newStatus ? "promoted to" : "demoted from"} Premium`,
      );
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`))
      return;

    try {
      // Delete from users table
      const { error: dbError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (dbError) throw dbError;

      // Delete from auth (requires service role - will fail on client)
      try {
        await supabase.auth.admin.deleteUser(user.id);
      } catch (authError) {
        console.warn(
          "Could not delete auth user (needs service role):",
          authError,
        );
      }

      toast.success("User deleted");
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const saveUserEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          role: selectedUser.role,
          is_premium: selectedUser.is_premium,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      // Update auth metadata
      await supabase.auth.admin.updateUserById(selectedUser.id, {
        user_metadata: {
          role: selectedUser.role,
          is_premium: selectedUser.is_premium,
        },
      });

      toast.success("User updated");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-type-secondary">Loading users...</p>
      </div>
    );
  }

  const premiumCount = users.filter((u) => u.is_premium).length;
  const freeCount = users.length - premiumCount;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div>
      <Heading1 border className="!mb-6">
        <Shield className="inline w-6 h-6 mr-2" />
        Admin Dashboard
      </Heading1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SolidSettingsCard paddingClass="px-4 py-3">
          <p className="text-sm text-type-secondary">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </SolidSettingsCard>
        <SolidSettingsCard paddingClass="px-4 py-3">
          <p className="text-sm text-type-secondary">Premium Users</p>
          <p className="text-2xl font-bold text-green-500">{premiumCount}</p>
        </SolidSettingsCard>
        <SolidSettingsCard paddingClass="px-4 py-3">
          <p className="text-sm text-type-secondary">Free Users</p>
          <p className="text-2xl font-bold text-gray-500">{freeCount}</p>
        </SolidSettingsCard>
        <SolidSettingsCard paddingClass="px-4 py-3">
          <p className="text-sm text-type-secondary">Admins</p>
          <p className="text-2xl font-bold text-purple-500">{adminCount}</p>
        </SolidSettingsCard>
      </div>

      {/* Users Table */}
      <SolidSettingsCard paddingClass="px-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-type-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-type-secondary uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-type-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-type-secondary uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-type-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-background-main transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded ${
                        user.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.is_premium ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-white text-sm">
                        {user.is_premium ? "Premium" : "Free"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-type-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 hover:bg-purple-500/20 rounded text-purple-400 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePremium(user)}
                        className="p-1 hover:bg-green-500/20 rounded text-green-400 transition-colors"
                        title={
                          user.is_premium ? "Revoke Premium" : "Grant Premium"
                        }
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SolidSettingsCard>

      {/* Admin Tools - Testing */}
      <div className="mt-12 space-y-8">
        <BackendTestPart />
        <WorkerTestPart />
        <M3U8TestPart />
        <ConfigValuesPart />
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-background-main border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-type-secondary mb-2 block">
                  Email
                </label>
                <p className="text-white">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm text-type-secondary mb-2 block">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded bg-background-main border border-gray-700 text-white"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUser.is_premium}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      is_premium: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-white">Premium User</label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button theme="purple" onClick={saveUserEdit}>
                  Save Changes
                </Button>
                <Button
                  theme="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
