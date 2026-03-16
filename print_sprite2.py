from PIL import Image
img = Image.open('ezgif-54c016148ad4d8bf.png')
w, h = img.size
rows = 5
cols = 5
fh = h // rows
fw = w // cols

count = 0
for r in range(rows):
    line = ""
    for c in range(cols):
        box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
        sub = img.crop(box).convert('L')
        # Check standard deviation or min/max
        extrema = sub.getextrema()
        if extrema[0] > 250: # Minimum brightness is very high -> empty frame
            line += "[ ] "
        else:
            line += "[X] "
            count += 1
    print(line)
print(f"Total non-empty frames: {count}")
