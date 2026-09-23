import { writeFileSync } from "node:fs";

writeFileSync("dist/robots.txt", "User-agent: *\nDisallow: /\n");
