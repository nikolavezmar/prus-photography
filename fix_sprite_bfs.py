import os
from PIL import Image

def get_largest_component_bbox(img, threshold=128):
    gray = img.convert('L')
    pixels = gray.load()
    w, h = gray.size
    
    visited = set()
    largest_comp = []
    
    # Simple BFS for connected components
    for y in range(h):
        for x in range(w):
            if pixels[x, y] < threshold and (x, y) not in visited:
                # Start new component
                comp = []
                queue = [(x, y)]
                visited.add((x, y))
                
                head = 0
                while head < len(queue):
                    cx, cy = queue[head]
                    head += 1
                    comp.append((cx, cy))
                    
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            if pixels[nx, ny] < threshold and (nx, ny) not in visited:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
                                
                if len(comp) > len(largest_comp):
                    largest_comp = comp
                    
    if not largest_comp:
        return None
        
    min_x = min(p[0] for p in largest_comp)
    max_x = max(p[0] for p in largest_comp)
    min_y = min(p[1] for p in largest_comp)
    max_y = max(p[1] for p in largest_comp)
    
    return (min_x, min_y, max_x, max_y, largest_comp)

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
        
        result = get_largest_component_bbox(frame)
        if result is not None:
            min_x, min_y, max_x, max_y, comp_pixels = result
            
            # create a new blank frame
            man = Image.new('RGBA', (fw, fh), (255, 255, 255, 0))
            man_pixels = man.load()
            orig_pixels = frame.convert('RGBA').load()
            
            # only copy pixels belonging to the largest component (the man)
            comp_set = set(comp_pixels)
            for cy in range(min_y, max_y + 1):
                for cx in range(min_x, max_x + 1):
                    if (cx, cy) in comp_set:
                        man_pixels[cx, cy] = orig_pixels[cx, cy]
                        
            # crop to bounding box
            man = man.crop((min_x, min_y, max_x + 1, max_y + 1))
            
            width = max_x - min_x + 1
            
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
