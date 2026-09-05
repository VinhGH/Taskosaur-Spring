import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  if (/^https?:\/\//.test(avatar) || avatar.startsWith("data:")) return avatar;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
  const cleanPath = avatar.startsWith("/") ? avatar.slice(1) : avatar;
  if (cleanPath.startsWith("uploads/")) {
    return `${baseUrl}/${cleanPath}`;
  }
  return `${baseUrl}/uploads/${cleanPath}`;
}

