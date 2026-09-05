import Image from "next/image";
import { useState } from "react";
import { usePresence } from "@/contexts/presence-context";

interface UserAvatarProps {
  user:
    | string
    | {
        name?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        id?: string;
      };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
  className?: string;
  showPresence?: boolean;
}

export default function UserAvatar({
  user,
  size = "md",
  color = "primary",
  className,
  showPresence = false,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { isUserOnline } = usePresence();

  const sizeStyles = {
    xs: { width: "1.5rem", height: "1.5rem", fontSize: "0.75rem" },
    sm: { width: "2rem", height: "2rem", fontSize: "0.875rem" },
    md: { width: "2.5rem", height: "2.5rem", fontSize: "1rem" },
    lg: { width: "3rem", height: "3rem", fontSize: "1.125rem" },
    xl: { width: "4rem", height: "4rem", fontSize: "1.5rem" },
  };

  const badgeSizes = {
    xs: "w-1.5 h-1.5 border-[1px]",
    sm: "w-2 h-2 border-[1.5px]",
    md: "w-2.5 h-2.5 border-2",
    lg: "w-3 h-3 border-2",
    xl: "w-3.5 h-3.5 border-2",
  };

  const colorStyles = {
    primary: { backgroundColor: "#3b82f6", color: "#ffffff" },
    secondary: { backgroundColor: "#6b7280", color: "#ffffff" },
    success: { backgroundColor: "#10b981", color: "#ffffff" },
    danger: { backgroundColor: "#ef4444", color: "#ffffff" },
    warning: { backgroundColor: "#f59e0b", color: "#ffffff" },
    info: { backgroundColor: "#06b6d4", color: "#ffffff" },
  };

  const sizeStyle = sizeStyles[size];
  const colorStyle = colorStyles[color];
  const badgeSizeClass = badgeSizes[size];

  const userId = typeof user !== "string" && user ? user.id : undefined;
  const online = userId ? isUserOnline(userId) : false;

  const getUserName = () => {
    if (typeof user === "string") {
      return user;
    }

    if (!user) {
      return "User";
    }

    if (user.name) {
      return user.name;
    }

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if (user.firstName) {
      return user.firstName;
    }

    if (user.lastName) {
      return user.lastName;
    }

    return "User";
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (error_) {
      return string.startsWith("/");
    }
  };

  const userName = getUserName();
  const initial = userName ? userName.charAt(0).toUpperCase() : "U";
  const avatarImage = typeof user !== "string" && user ? user.avatar : undefined;

  // Only show image if we have a valid URL/path and no error occurred
  const shouldShowImage =
    avatarImage &&
    !imageError &&
    !avatarImage.includes("/api/placeholder") &&
    isValidUrl(avatarImage);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className || ""}`} style={sizeStyle} title={`${userName}${userId ? (online ? " (Online)" : " (Offline)") : ""}`}>
      <div
        style={{
          width: "100%",
          height: "100%",
          ...colorStyle,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "500",
          overflow: "hidden",
        }}
      >
        {shouldShowImage ? (
          <Image
            src={avatarImage}
            alt={userName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
            width={100}
            height={100}
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {showPresence && userId && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-white dark:border-gray-900 transition-colors duration-200 ${badgeSizeClass} ${
            online ? "bg-emerald-500" : "bg-gray-400"
          }`}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
