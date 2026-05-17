import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import App from "./App";
import Akinator from "./pages/Akinator";

const rootRoute = createRootRoute({
    notFoundComponent: () => {
        return (
            <span className="not-found">You are lost</span>
        )
    }
})

const indexRoute = createRoute({
    path: "/",
    getParentRoute: () => rootRoute,
    component: App
})

const gameRoute = createRoute({
    getParentRoute: () => rootRoute,
    "path": "/game/$gameId",
    component: Akinator,
})

const emptyGameRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/game",
    component: () => {
        return (
            <span className="no-game">No Game ID</span>
        )
    }
})

const routeTree = rootRoute.addChildren([indexRoute, gameRoute, emptyGameRoute])

export const router = createRouter({"routeTree": routeTree})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}