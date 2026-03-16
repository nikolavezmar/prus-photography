import os
import math
from PIL import Image, ImageChops, ImageOps

def get_body_bbox(img, threshold=128):
    """Returns the bounding box (left, top, right, bottom) of dark pixels."""
    # Convert to grayscale
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
        return None # Empty
    return (min_x, min_y, max_x, max_y)

def process_sprite():
    print("Loading sprite sheet...")
    sheet = Image.open('ezgif-54c016148ad4d8bf.png').convert('RGBA')
    w, h = sheet.size
    rows, cols = 5, 5
    fw, fh = w // cols, h // rows
    
    # Create a new blank, transparent (or white) sheet
    new_sheet = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    
    frames = []
    
    for r in range(rows):
        for c in range(cols):
            box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
            frame = sheet.crop(box)
            bbox = get_body_bbox(frame)
            if bbox is None:
                frames.append(None)
            else:
                # Extract just the man
                man = frame.crop(bbox)
                frames.append(man)
                
    # We want to make sure all frames are facing the same direction.
    # Let's assume the first valid frame is facing the correct direction.
    # Or actually, let's use the bounding box asymmetry to determine facing?
    # Better yet, since we have all frames, let's see if we can align them.
    # But wait, the user said "running the same direction the whole time"
    # Maybe we can calculate the orientation by looking at the center of mass of the bounding box?
    # A person running has a specific profile. 
    # Let's just assume we want them all facing the same way as Frame 0.
    
    base_man = None
    for f in frames:
        if f is not None:
            base_man = f.convert('L')
            break
            
    print("Normalizing frames...")
    normalized_frames = []
    for i, man in enumerate(frames):
        if man is None:
            normalized_frames.append(None)
            continue
            
        # To check if we need to flip, we can resize this man to the base_man size
        # and compare MSE (Mean Squared Error) between:
        # 1. base_man vs man
        # 2. base_man vs flipped(man)
        man_gray = man.convert('L').resize(base_man.size)
        man_gray_flipped = ImageOps.mirror(man_gray)
        
        diff_normal = ImageChops.difference(base_man, man_gray)
        diff_flipped = ImageChops.difference(base_man, man_gray_flipped)
        
        def calc_error(diff_img):
            # Sum of pixel values
            return sum(diff_img.getdata())
            
        err_normal = calc_error(diff_normal)
        err_flipped = calc_error(diff_flipped)
        
        if err_flipped < err_normal * 0.8: # strong bias required to flip
            print(f"Frame {i}: Flipped (normal_err={err_normal}, flip_err={err_flipped})")
            man = ImageOps.mirror(man)
        else:
            print(f"Frame {i}: Kept normal")
            
        normalized_frames.append(man)
        
    print("Pasting into new sheet...")
    # Now paste each normalized man into the center of its frame
    for i, man in enumerate(normalized_frames):
        if man is None: continue
        r = i // cols
        c = i % cols
        
        # We want the man's bottom to be locked to a specific Y coordinate so he doesn't bob up and down unnaturally
        # Center horizontally, but vertically align to the bottom?
        # A running animation is usually bottom-aligned to the ground, but let's vertically align the centers to be safe,
        # or bottom align? Usually the feet touch the ground at varying points, so we align the center of mass, 
        # or we just center the bounding box horizontally, and center vertically.
        mw, mh = man.size
        paste_x = c * fw + (fw - mw) // 2
        paste_y = r * fh + (fh - mh) // 2
        
        # Actually, bottom aligning is usually better for walking cycles
        # Let's align such that the bottom of the bounding box is a fixed distance from the bottom of the frame
        paste_y = r * fh + fh - mh - (fh // 8) # 12.5% padding from bottom
        
        # Paste using the image itself as a mask if it has transparency,
        # but ezgif png usually has a white background.
        # Let's make white transparent in the man image.
        man_data = man.getdata()
        new_data = []
        for item in man_data:
            # item is (R, G, B, A)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0)) # Transparent
            else:
                new_data.append(item)
        man.putdata(new_data)
        
        new_sheet.paste(man, (paste_x, paste_y), man)
        
    out_path = 'images/sprite_sheet_fixed.png'
    new_sheet.save(out_path)
    print(f"Saved optimized sprite sheet to {out_path}!")

if __name__ == "__main__":
    process_sprite()
