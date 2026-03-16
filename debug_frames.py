import sys
from PIL import Image

def get_facing():
    img = Image.open('ezgif-54c016148ad4d8bf.png')
    w, h = img.size
    fw, fh = w//5, h//5
    
    # We will output a small thumb of the first few frames
    def print_frame(x, y):
        box = (x*fw, y*fh, (x+1)*fw, (y+1)*fh)
        sub = img.crop(box).resize((40, 40))
        sub = sub.convert('L')
        pixels = sub.load()
        lines = []
        for row in range(40):
            line = ""
            for col in range(40):
                if pixels[col, row] < 128:
                    line += "#"
                else:
                    line += "."
            lines.append(line)
        return lines

    for i in range(5):
        lines = print_frame(i, 0)
        print(f"Frame {i}:")
        for l in lines:
            print(l)

if __name__ == "__main__":
    get_facing()
