"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function SignOutButton({
  variant = "outline",
  size = "default",
  className = ""
}: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
