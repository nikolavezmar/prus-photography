from PIL import Image

def process():
    print("Opening original ezgif-54c016148ad4d8bf.png")
    img = Image.open('ezgif-54c016148ad4d8bf.png').convert("RGBA")
    
    cols, rows = 5, 5
    width, height = img.size
    fw, fh = width // cols, height // rows
    
    new_img = Image.new("RGBA", (width, height))
    
    for i in range(21):
        r, c = i // cols, i % cols
        box = (c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)
        frame = img.crop(box)
        
        datas = frame.getdata()
        new_frame_data = []
        min_x, max_x = fw, 0
        min_y, max_y = fh, 0
        
        for y in range(fh):
            for x in range(fw):
                idx = y * fw + x
                pixel = datas[idx]
                if pixel[0] < 150 and pixel[1] < 150 and pixel[2] < 150:
                    new_frame_data.append((17, 17, 17, 255))
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                else:
                    new_frame_data.append((255, 255, 255, 0))
                    
        transparent_frame = Image.new("RGBA", (fw, fh))
        transparent_frame.putdata(new_frame_data)
        
        if min_x > max_x:
            new_img.paste(transparent_frame, box)
            continue
            
        silh = transparent_frame.crop((min_x, min_y, max_x + 1, max_y + 1))
        
        # Center horizontally
        target_x = (fw - (max_x - min_x + 1)) // 2
        # Keep original horizontal bounce
        target_y = min_y
        
        # Mirror selectively to ensure consistent left-facing direction
        if i < 15 or i == 20:
            silh = silh.transpose(Image.FLIP_LEFT_RIGHT)
            
        final_frame = Image.new("RGBA", (fw, fh), (255, 255, 255, 0))
        final_frame.paste(silh, (target_x, target_y))
        
        new_img.paste(final_frame, box)
        print(f"Frame {i}: centered at x={target_x}. Flipped: {i < 15 or i == 20}")
        
    new_img.save('images/sprite_sheet_mirrored.png')
    print("Saved perfectly centered and oriented sprite sheet")

process()
