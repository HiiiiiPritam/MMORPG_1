import os
import glob
from PIL import Image

def process_image(img_path):
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print(f"Skipping {img_path}: {e}")
        return

    data = img.getdata()
    new_data = []
    # Replace white with transparent
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    img.save(img_path, "PNG")

    # If it's a student sprite, let's create walk frames!
    if "student" in img_path and "walk" not in img_path:
        w, h = img.size
        
        # Walk 1: Shift left half up 2px (left leg step)
        img_w1 = img.copy()
        w1_data = img_w1.load()
        for x in range(w // 2):
            for y in range(h):
                if y < h - 4:
                    w1_data[x, y] = w1_data[x, y + 4]
                else:
                    w1_data[x, y] = (0, 0, 0, 0)
        img_w1.save(img_path.replace(".png", "_walk1.png"), "PNG")

        # Walk 2: Shift right half up 2px (right leg step)
        img_w2 = img.copy()
        w2_data = img_w2.load()
        for x in range(w // 2, w):
            for y in range(h):
                if y < h - 4:
                    w2_data[x, y] = w2_data[x, y + 4]
                else:
                    w2_data[x, y] = (0, 0, 0, 0)
        img_w2.save(img_path.replace(".png", "_walk2.png"), "PNG")
        print(f"Generated walk frames for {img_path}")

print("Processing files in public/sprites...")
for f in glob.glob('public/sprites/*.png'):
    process_image(f)
print("Done!")
