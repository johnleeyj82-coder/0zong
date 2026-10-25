import type { NextConfig } from "next";

// EXPORT_STATIC=1 builds a static copy with relative asset paths (used for the hosted preview).
const staticExport = process.env.EXPORT_STATIC === "1";

const nextConfig: NextConfig = staticExport
  ? { output: "export", assetPrefix: "./", images: { unoptimized: true }, trailingSlash: true }
  : {};

export default nextConfig;
