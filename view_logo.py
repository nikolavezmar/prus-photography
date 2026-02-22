import sys
from PIL import Image

def print_image(path, width=80):
    try:
        img = Image.open(path)
        img = img.convert('RGBA')
        aspect_ratio = img.height / img.width
        new_height = int(aspect_ratio * width * 0.5) # text characters are roughly 2x taller than wide
        img = img.resize((width, new_height))
        
        for y in range(new_height):
            line = ""
            for x in range(width):
                r,g,b,a = img.getpixel((x,y))
                if a > 128 and (r<128 or g<128 or b<128):
                    line += "##"
                else:
                    line += ".."
            print(line)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    print_image('/Users/nickprus/.gemini/antigravity/scratch/prus-photography/images/logo.png', width=120)
