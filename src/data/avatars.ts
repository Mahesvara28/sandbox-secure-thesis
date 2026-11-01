import avatar1 from '../assets/avatar 1.webp';
import avatar2 from '../assets/avatar 2.webp';
import avatar3 from '../assets/avatar 3.webp';
import avatar4 from '../assets/avatar 4.webp';
import avatar5 from '../assets/avatar 5.webp';

export const AVATARS = [
  { id: 'avatar-1', label: 'Avatar 1', src: avatar1 },
  { id: 'avatar-2', label: 'Avatar 2', src: avatar2 },
  { id: 'avatar-3', label: 'Avatar 3', src: avatar3 },
  { id: 'avatar-4', label: 'Avatar 4', src: avatar4 },
  { id: 'avatar-5', label: 'Avatar 5', src: avatar5 }
] as const;

export type AvatarId = (typeof AVATARS)[number]['id'];
export const DEFAULT_AVATAR_ID: AvatarId = AVATARS[0].id;

export const getAvatarById = (id?: string) =>
  AVATARS.find(avatar => avatar.id === id) ?? AVATARS[0];
