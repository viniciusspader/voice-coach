"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mounted on the public landing page (`/`). If a session is already valid,
 * forward straight into the app instead of showing marketing copy.
 */
export function RedirectIfAuthed() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/practice");
  }, [user, isLoading, router]);

  return null;
}
