import { getAvatarById, type AvatarId } from '../data/avatars';

interface AvatarProps {
  avatarId?: AvatarId | string;
  size?: 'small' | 'large';
}

export const Avatar = ({ avatarId, size = 'small' }: AvatarProps) => {
  const avatar = getAvatarById(avatarId);
  const dimension = size === 'large' ? 112 : 40;
  const sizeClass = size === 'large' ? 'h-28 w-28' : 'h-10 w-10';

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--game-border)] bg-[var(--game-track)] ${sizeClass}`}>
      <img
        src={avatar.src}
        alt={`Your avatar: ${avatar.label}`}
        width={dimension}
        height={dimension}
        draggable={false}
        className="h-full w-full select-none object-cover"
      />
    </span>
  );
};
