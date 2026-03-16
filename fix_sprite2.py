import os
from PIL import Image

def get_body_bbox(img, threshold=200):
    gray = img.convert('L')
    pixels = gray.load()
    w, h = gray.size
    
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if pixels[x, y] < threshold:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if max_x < min_x:
        return None
    return (min_x, min_y, max_x, max_y)

def process_sprite():
    sheet = Image.open('ezgif-54c016148ad4d8bf.png').convert('RGBA')
    w, h = sheet.size
    rows, cols = 5, 5
    fw, fh = w // cols, h // rows
    
    new_sheet = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    
    for i in range(25):
        r = i // cols
        c = i % cols
        box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
        frame = sheet.crop(box)
        bbox = get_body_bbox(frame)
        
        if bbox is not None:
            min_x, min_y, max_x, max_y = bbox
            man = frame.crop(bbox)
            
            # Make white transparent
            man_data = man.getdata()
            new_data = []
            for item in man_data:
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            man.putdata(new_data)
            
            # Center horizontally
            mw = max_x - min_x
            paste_x = c * fw + (fw - mw) // 2
            
            # Preserve original vertical offset!
            # The man's top was at `min_y` in the original frame.
            paste_y = r * fh + min_y
            
            new_sheet.paste(man, (paste_x, paste_y), man)
            print(f"Frame {i}: centered at X, preserved Y={min_y}")
            
    out_path = 'images/sprite_sheet_fixed.png'
    new_sheet.save(out_path)
    print(f"Saved optimized sprite sheet to {out_path}")

if __name__ == "__main__":
    process_sprite()
