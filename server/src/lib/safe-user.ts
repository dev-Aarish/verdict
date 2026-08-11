type UserRow = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  passwordHash: string | null;
  createdAt: Date | null;
};

export function toSafeUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}
