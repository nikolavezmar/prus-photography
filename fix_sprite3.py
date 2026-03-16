import os
from PIL import Image

def get_body_bbox(img, threshold=200, margin=15):
    # margin=15 ignores the 15 pixels around the border which might contain grid lines
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
        bbox = get_body_bbox(frame)
        
        if bbox is not None:
            min_x, min_y, max_x, max_y = bbox
            man = frame.crop(bbox)
            
            # Make white transparent
            man_data = man.getdata()
            new_data = []
            for item in man_data:
                # Be aggressive with white removal to remove artifacts
                if item[0] > 200 and item[1] > 200 and item[2] > 200:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            man.putdata(new_data)
            
            # Center horizontally
            mw = max_x - min_x
            paste_x = c * fw + (fw - mw) // 2
            
            # We want to lock the man vertically to his original Y coordinate
            # BUT the user noted that his head/briefcase were clipped.
            # If he was clipped, we can't 'fix' the clipping outside of generating drawing,
            # but we CAN ensure he stays at his relative authored Y coordinate.
            # Since the camera pans right, his Y shouldn't change relative to the frame height.
            paste_y = r * fh + min_y
            
            new_sheet.paste(man, (paste_x, paste_y), man)
            print(f"Frame {i}: centered at X, preserved Y={min_y}")
            
    out_path = 'images/sprite_sheet_fixed.png'
    new_sheet.save(out_path)
    print(f"Saved optimized sprite sheet to {out_path}")

if __name__ == "__main__":
    process_sprite()
