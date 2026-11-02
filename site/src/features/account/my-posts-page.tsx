import { SignOutIcon } from "@phosphor-icons/react";
import { getRouteApi, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button, buttonClass } from "@/components/button.tsx";
import { PageShell } from "@/components/page-shell.tsx";
import { SectionBand } from "@/components/section-band.tsx";
import { signOut } from "@/lib/auth-client.ts";
import { errorText } from "@/lib/error-text.ts";

import { PostRow } from "./components/post-row.tsx";
import { SignInBlock } from "./components/sign-in-block.tsx";
import type { MyPost, MyPosts } from "./server/my-posts.ts";

import styles from "./my-posts-page.module.css";

const route = getRouteApi("/me");

function Account({ viewer }: { viewer: NonNullable<MyPosts["viewer"]> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leave = async () => {
    setPending(true);
    setError(null);
    try {
      await signOut();
      await router.invalidate();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.account}>
      <p className={styles.who}>
        Signed in as
        <span className={styles.name}>{viewer.login ? `@${viewer.login}` : viewer.name}</span>
      </p>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Button variant="tonal" disabled={pending} onClick={() => void leave()}>
        <SignOutIcon weight="bold" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}

function Posts({ posts }: { posts: MyPost[] }) {
  if (posts.length === 0) {
    return (
      <div className={styles.posts}>
        <div className={styles.empty}>
          <p>No posts yet.</p>
          <Link to="/share" className={buttonClass()}>
            Share a diagram
          </Link>
        </div>
      </div>
    );
  }
  return (
    <ul className={styles.posts}>
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </ul>
  );
}

export function MyPostsPage() {
  const { viewer, posts } = route.useLoaderData();

  return (
    <PageShell active="me">
      <SectionBand
        title="My posts"
        description="Posts shared with your GitHub login. You can delete them here."
      />
      {viewer ? (
        <>
          <Account viewer={viewer} />
          <Posts posts={posts} />
        </>
      ) : (
        <SignInBlock />
      )}
    </PageShell>
  );
}
