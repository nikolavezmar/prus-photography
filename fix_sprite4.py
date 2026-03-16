import os
from PIL import Image

def get_body_bbox(img, threshold=50, margin=15):
    # threshold 50 ensures we only grab the VERY dark silhouette
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
        bbox = get_body_bbox(frame, threshold=50)
        
        if bbox is not None:
            min_x, min_y, max_x, max_y = bbox
            width = max_x - min_x
            man = frame.crop(bbox)
            
            # Make everything that is not the silhouette transparent
            man_data = man.getdata()
            new_data = []
            for item in man_data:
                # If it's not very dark, make it transparent
                if item[0] > 50 or item[1] > 50 or item[2] > 50:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            man.putdata(new_data)
            
            # Center horizontally
            paste_x = c * fw + (fw - width) // 2
            
            # Preserve original vertical offset!
            paste_y = r * fh + min_y
            
            new_sheet.paste(man, (paste_x, paste_y), man)
            print(f"Frame {i}: centered. original x={min_x}, width={width}")
            
    out_path = 'images/sprite_sheet_fixed.png'
    new_sheet.save(out_path)
    print(f"Saved optimized sprite sheet to {out_path}")

if __name__ == "__main__":
    process_sprite()
