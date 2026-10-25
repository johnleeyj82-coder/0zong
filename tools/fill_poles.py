"""이어 붙인 360도 사진에서 비어 있는(검은) 천장·바닥 부분을 주변 색으로 메운다.
천장과 바닥은 무늬가 없어 사진끼리 잘 안 이어지기 때문에 자주 비어 있다.

사용: python3 tools/fill_poles.py <입력.jpg> <출력.jpg>
"""
import sys
import cv2
import numpy as np


def main(src, out):
    img = cv2.imread(src)
    h, w = img.shape[:2]
    hole = (img.max(axis=2) < 24).astype(np.uint8)
    # 위아래 끝에 붙은 빈 부분만 메운다. 사진 속 검은 물건(모니터 등)은 건드리지 않는다.
    n, labels = cv2.connectedComponents(hole)
    keep = set(labels[0]) | set(labels[-1])
    keep.discard(0)
    hole = np.isin(labels, list(keep)).astype(np.uint8)
    hole = cv2.dilate(hole, np.ones((9, 9), np.uint8))
    # 작게 줄여서 메운 뒤 다시 키워야 빠르고 부드럽다.
    s = 8
    small = cv2.resize(img, (w // s, h // s), interpolation=cv2.INTER_AREA)
    small_hole = cv2.resize(hole, (w // s, h // s), interpolation=cv2.INTER_NEAREST)
    filled = cv2.inpaint(small, small_hole, 12, cv2.INPAINT_TELEA)
    filled = cv2.GaussianBlur(filled, (0, 0), 6)
    big = cv2.resize(filled, (w, h), interpolation=cv2.INTER_CUBIC)
    mask = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 6)[..., None]
    result = (img * (1 - mask) + big * mask).astype(np.uint8)
    cv2.imwrite(out, result, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main(*sys.argv[1:])
