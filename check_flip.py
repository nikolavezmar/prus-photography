from PIL import Image

img = Image.open('ezgif-54c016148ad4d8bf.png').convert('L')
w, h = img.size
rows, cols = 5, 5
fw, fh = w//cols, h//rows

centers = []
for r in range(rows):
    for c in range(cols):
        box = (c*fw, r*fh, (c+1)*fw, (r+1)*fh)
        sub = img.crop(box)
        # Calculate horizontal center of mass of dark pixels
        pixels = sub.load()
        mass_x = 0
        total_mass = 0
        for y in range(fh):
            for x in range(fw):
                val = pixels[x, y]
                if val < 128:
                    mass_x += x
                    total_mass += 1
        if total_mass > 0:
            cx = mass_x / total_mass
            centers.append(cx)
        else:
            centers.append(-1)

print("Centers of mass (X):")
for i, cx in enumerate(centers):
    print(f"Frame {i}: {cx:.1f}")

