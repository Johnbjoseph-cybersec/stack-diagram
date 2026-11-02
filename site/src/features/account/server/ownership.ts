export const ownsPost = (post: { githubId: string | null }, viewer: { githubId: string }) =>
  post.githubId === viewer.githubId;
