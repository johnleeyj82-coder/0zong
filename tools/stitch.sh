#!/usr/bin/env bash
# 의자에서 찍은 사진 여러 장을 360도 사진(equirectangular) 한 장으로 이어 붙인다. Hugin 명령줄 도구가 필요하다.
#   apt-get install hugin-tools enblend
# 사용: tools/stitch.sh <사진폴더> <출력.jpg> [가로화각(도), EXIF가 없을 때만]
set -euo pipefail
dir=$1; out=$2; fov=${3:-}
work=$(mktemp -d)
shopt -s nullglob nocaseglob
imgs=("$dir"/*.jpg "$dir"/*.jpeg "$dir"/*.png)
pto_gen -o "$work/a.pto" ${fov:+-f "$fov"} "${imgs[@]}"
cpfind --multirow --celeste -o "$work/a.pto" "$work/a.pto"
cpclean -o "$work/a.pto" "$work/a.pto"
linefind -o "$work/a.pto" "$work/a.pto"
autooptimiser -a -m -l -s -o "$work/a.pto" "$work/a.pto"
pano_modify --projection=2 --fov=360x180 --canvas=8192x4096 --ldr-file=JPG --ldr-compression=90 -o "$work/a.pto" "$work/a.pto"
hugin_executor --stitching --prefix="$work/pano" "$work/a.pto"
python3 "$(dirname "$0")/fill_poles.py" "$work/pano.jpg" "$out"
echo "만든 파일: $out"
