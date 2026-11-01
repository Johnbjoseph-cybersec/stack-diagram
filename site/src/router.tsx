import { createRouter } from "@tanstack/react-router";

import { PageMessage } from "@/components/page-message.tsx";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: () => <PageMessage message="This page isn't here." />,
    // Fixed text: server function errors can carry SQL and its parameters.
    defaultErrorComponent: () => <PageMessage message="Something went wrong." />,
  });
}
