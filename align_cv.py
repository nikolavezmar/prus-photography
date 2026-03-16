import cv2
import numpy as np
from PIL import Image
import sys

# 1. Load the first frame of the sprite sheet
sprite_path = 'images/sprite_sheet_mirrored.png'
sprite_img = Image.open(sprite_path)
width, height = sprite_img.size
frame_w = width // 5
frame_h = height // 5
# Crop first frame (0,0)
frame_img = sprite_img.crop((0, 0, frame_w, frame_h))
# Resize to CSS size (200x340) because that's what's in CSS
frame_img = frame_img.resize((200, 340), Image.Resampling.LANCZOS)
frame_rgba = np.array(frame_img)
# Extract alpha exactly
sprite_alpha = frame_rgba[:, :, 3]

# 2. Extract SVG image from screen or render it
# Since we have an SVG path, we can render it using rsvg or just draw it.
# Wait, let's just use the `test_align.html` in playwright to take screenshots of both
