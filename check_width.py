import sys
from PIL import Image

def get_body_bbox(img, threshold=200, margin=15):
    gray = img.convert('L')
    pixels = gray.load()
    w, h = gray.size
    
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(margin, h - margin):
        for x in range(margin, w - margin):
            if pixels[x, y] < threshold:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if max_x < min_x:
        return None
    return (min_x, min_y, max_x, max_y)

sheet = Image.open('ezgif-54c016148ad4d8bf.png').convert('RGBA')
w, h = sheet.size
rows, cols = 5, 5
fw, fh = w // cols, h // rows

for i in range(25):
    r = i // cols
    c = i % cols
    box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
    frame = sheet.crop(box)
    bbox = get_body_bbox(frame)
    if bbox is not None:
        min_x, min_y, max_x, max_y = bbox
        width = max_x - min_x
        print(f"Frame {i}: min_x={min_x}, max_x={max_x}, width={width}")
