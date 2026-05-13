import { useState } from "react";
import type { PersonaPreset } from "../../types";
import {
  PersonaAvatarIcon,
  PersonaAvatarImage,
} from "../persona/PersonaAvatarIcon";
import { isPersonaImageAvatar } from "../persona/personaAvatar";

interface PersonaAvatarWithLoadingProps {
  preset: PersonaPreset;
  className?: string;
  imgClassName?: string;
  iconSize?: number;
  fallbackIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

export function PersonaAvatarWithLoading({
  preset,
  className,
  imgClassName,
  iconSize = 14,
  fallbackIcon,
  style,
}: PersonaAvatarWithLoadingProps) {
  const isImage = isPersonaImageAvatar(preset.avatar);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={className}
      style={style}
      data-avatar-state={
        isImage && !imgLoaded && !imgError
          ? "loading"
          : isImage && imgLoaded
            ? "loaded"
            : "ready"
      }
    >
      {isImage ? (
        !imgError ? (
          <PersonaAvatarImage
            avatar={preset.avatar}
            alt=""
            className={imgClassName}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <PersonaAvatarIcon
            avatar={null}
            primaryTag={preset.tags?.[0]}
            size={iconSize}
          />
        )
      ) : preset.avatar ? (
        <PersonaAvatarIcon
          avatar={preset.avatar}
          primaryTag={preset.tags?.[0]}
          size={iconSize}
        />
      ) : (
        fallbackIcon
      )}
    </div>
  );
}
