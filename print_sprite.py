from PIL import Image
img = Image.open('ezgif-54c016148ad4d8bf.png')
w, h = img.size
print(f"w: {w} h: {h}")
# Let's count non-empty frames across columns/rows
rows = 5
cols = 5
fh = h // rows
fw = w // cols
print(f"fw: {fw} fh: {fh}")

count = 0
for r in range(rows):
    line = ""
    for c in range(cols):
        box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
        sub = img.crop(box)
        extrema = sub.convert('L').getextrema()
        if extrema == (255, 255): # completely white
            line += "[ ] "
        else:
            line += "[X] "
            count += 1
    print(line)
print(f"Total non-empty frames: {count}")
