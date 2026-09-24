import { rmSync, writeFileSync } from "node:fs";

writeFileSync("dist/robots.txt", "User-agent: *\nDisallow: /\n");
rmSync("dist/sitemap.xml", { force: true });
