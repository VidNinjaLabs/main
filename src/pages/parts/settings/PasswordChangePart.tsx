import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/buttons/Button";
import { supabase } from "@/lib/supabase";

export function PasswordChangePart() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-white font-medium mb-2">Change Password</p>
      <p className="text-sm text-type-secondary mb-3">
        Update your account password
      </p>
      <div className="space-y-3 max-w-md">
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-2 rounded bg-background-main border border-gray-700 text-white focus:outline-none focus:border-purple-500"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 rounded bg-background-main border border-gray-700 text-white focus:outline-none focus:border-purple-500"
        />
        <Button
          onClick={handlePasswordChange}
          disabled={isLoading}
          theme="purple"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </div>
  );
}
