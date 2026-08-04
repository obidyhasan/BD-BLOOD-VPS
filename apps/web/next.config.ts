import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Produces a minimal self-contained server (node_modules pruned to only
  // what's actually required at runtime) in .next/standalone — this is what
  // the production Dockerfile copies into the final image, instead of
  // shipping the entire node_modules tree. Vercel's builder does this
  // implicitly; a self-hosted VPS/Docker deployment needs it set explicitly.
  output: "standalone",
  // In an npm-workspaces monorepo, dependencies are hoisted to the repo
  // root's node_modules, not apps/web/node_modules. Without this, Next's
  // file tracing only looks inside apps/web and can silently omit hoisted
  // packages from the standalone build, breaking at runtime with "Cannot
  // find module" errors. Required per Next.js's own monorepo guidance.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  reactCompiler: true,
  experimental: {
    // Rewrites imports from these packages to only pull in the specific
    // modules actually used, instead of the whole package barrel — reduces
    // client bundle size on every route that imports from them. lucide-react
    // and the @radix-ui/* packages are already on Next's built-in default
    // list; these are the app's other heavy/barrel-style dependencies that
    // aren't.
    optimizePackageImports: ["react-icons", "recharts", "date-fns"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;
