import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "@tanstack/react-router";

import { Button } from "@/components/button.tsx";
import { ConfirmDialog } from "@/components/confirm-dialog.tsx";
import { refocusMain } from "@/components/page-shell.tsx";
import { StackRow } from "@/components/stack-row.tsx";

import { deleteMyPost, type MyPost } from "../server/my-posts.ts";
import { postMeta } from "../utils/labels.ts";

export function PostRow({ post }: { post: MyPost }) {
  const router = useRouter();

  return (
    <StackRow
      stack={post}
      status={post.status}
      meta={postMeta(post)}
      actions={
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <TrashIcon weight="bold" aria-hidden />
              Delete
            </Button>
          }
          title="Delete this post?"
          description="This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteMyPost({ data: { id: post.id } })}
          onDone={() => void router.invalidate().then(refocusMain)}
        />
      }
    />
  );
}
