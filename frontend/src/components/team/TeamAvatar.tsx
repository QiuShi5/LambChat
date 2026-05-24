import { Users } from "lucide-react";
import {
  PersonaAvatarIcon,
  PersonaAvatarImage,
} from "../persona/PersonaAvatarIcon";
import {
  getEmojiAvatarUrl,
  isEmojiAvatar,
  isPersonaImageAvatar,
} from "../persona/personaAvatar";

interface TeamAvatarProps {
  avatar?: string | null;
  fallbackAvatar?: string | null;
  fallbackTag?: string;
  label?: string;
  className?: string;
  imgClassName?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export function TeamAvatar({
  avatar,
  fallbackAvatar,
  fallbackTag,
  label,
  className = "",
  imgClassName = "scb__avatar-img",
  iconSize = 16,
  style,
}: TeamAvatarProps) {
  const resolvedAvatar = avatar ?? fallbackAvatar;
  const avatarClassName = ["team-avatar", className].filter(Boolean).join(" ");

  return (
    <span className={avatarClassName} title={label} style={style}>
      {isEmojiAvatar(resolvedAvatar) ? (
        <PersonaAvatarImage
          avatar={getEmojiAvatarUrl(resolvedAvatar)}
          alt=""
          className={imgClassName}
        />
      ) : isPersonaImageAvatar(resolvedAvatar) ? (
        <PersonaAvatarImage
          avatar={resolvedAvatar}
          alt=""
          className={imgClassName}
        />
      ) : resolvedAvatar || fallbackTag ? (
        <PersonaAvatarIcon
          avatar={resolvedAvatar}
          primaryTag={fallbackTag}
          size={iconSize}
        />
      ) : (
        <Users size={iconSize} />
      )}
    </span>
  );
}
