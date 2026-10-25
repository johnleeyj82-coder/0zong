#!/usr/bin/env bash
# Builds a static, server-less copy into ./out for a hosted preview.
# API routes can't be statically exported, so they are moved aside for the build, and the client runs in demo mode
# (data kept in the viewer's browser, demo owner password "demo"). Do not deploy this build as the real site.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
mv app/api "$TMP/api"
trap 'mv "$TMP/api" app/api' EXIT
rm -rf out
EXPORT_STATIC=1 NEXT_PUBLIC_DEMO=1 npx next build
# Some static hosts reserve names starting with "_": rename _next to assets and point the chunk loader at it.
mv out/_next out/assets
grep -rl "_next/static" out --include=*.html --include=*.js --include=*.css --include=*.txt | xargs sed -i 's#_next/static#assets/static#g'
sed -i 's#r.p="./_next/"#r.p="./assets/"#' out/assets/static/chunks/webpack-*.js
# Escape literal U+FFFD characters inside bundled strings (some uploaders reject them); the code is unchanged.
node -e 'const fs=require("fs"),p=require("path");const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);for(const f of walk("out/assets").filter(f=>f.endsWith(".js"))){const s=fs.readFileSync(f,"utf8");if(s.includes("\uFFFD"))fs.writeFileSync(f,s.split("\uFFFD").join("\\uFFFD"))}'
echo "Preview built in ./out"
