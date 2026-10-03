import type { NextApiRequest, NextApiResponse } from "next";

import { authenticate } from "./auth";
import { methodNotAllowed, notFound, runController } from "./nextApi";
import type { ApiController, RoutedApiRequest } from "../types/api";

type RouteDefinition = {
  controller: ApiController<RoutedApiRequest>;
  method: string;
  path: string;
};

type RouteMatch = RouteDefinition & {
  paramNames: string[];
  pattern: RegExp;
};

type MatchedRoute = {
  controller: ApiController<RoutedApiRequest>;
  params: Record<string, string>;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileRoute({ method, path, controller }: RouteDefinition): RouteMatch {
  const paramNames: string[] = [];
  const source = path
    .split("/")
    .map((segment) => {
      if (!segment.startsWith(":")) return escapeRegex(segment);
      paramNames.push(segment.slice(1));
      return "([^/]+)";
    })
    .join("\\/");

  return {
    controller,
    method,
    path,
    pattern: new RegExp(`^${source}$`),
    paramNames,
  };
}

function getCatchAllPath(req: NextApiRequest) {
  const value = req.query.path;
  return Array.isArray(value) ? value.join("/") : String(value ?? "");
}

function matchRoute(req: NextApiRequest, routes: RouteMatch[]): MatchedRoute | null {
  const path = getCatchAllPath(req);
  for (const route of routes) {
    if (route.method !== req.method) continue;

    const match = route.pattern.exec(path);
    if (!match) continue;

    return {
      controller: route.controller,
      params: Object.fromEntries(route.paramNames.map((key, index) => [key, match[index + 1]])),
    };
  }

  return null;
}

function hasRoutePath(req: NextApiRequest, routes: RouteMatch[]) {
  const path = getCatchAllPath(req);
  return routes.some((route) => route.pattern.test(path));
}

function createAuthenticatedRoutedApiHandler(routeDefinitions: RouteDefinition[]) {
  const routes = routeDefinitions.map(compileRoute);

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const route = matchRoute(req, routes);
    if (!route) return hasRoutePath(req, routes) ? methodNotAllowed(res) : notFound(res);

    const routedReq = req as RoutedApiRequest;
    routedReq.params = route.params;
    return authenticate(routedReq, res, () => runController(route.controller, routedReq, res));
  };
}

export { createAuthenticatedRoutedApiHandler };
export type { RouteDefinition };
