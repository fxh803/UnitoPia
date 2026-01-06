import requests
import base64
import numpy as np
from PIL import Image, ImageDraw
import io

# 配置
URL_ALL = 'http://175.178.152.10:2616/segmentAll'
URL_POINT = 'http://175.178.152.10:2616/segmentPoint'
IMAGE_PATH = './test.png'

def get_base64():
    with open(IMAGE_PATH, 'rb') as f:
        return base64.b64encode(f.read()).decode()

def visualize(img_arr, mask_arr, coords=None, colors=None):
    """通用可视化：img_arr原图, mask_arr掩码, coords点击坐标, colors颜色列表"""
    img = Image.fromarray(img_arr).convert('RGBA')
    if mask_arr is not None:
        mask_layer = Image.new('RGBA', img.size, colors[0] if colors else (255,0,0,100))
        mask_img = Image.fromarray((mask_arr * 255).astype(np.uint8)).convert('L')
        mask_layer.putalpha(mask_img)
        img = Image.alpha_composite(img, mask_layer)
    img = img.convert('RGB')
    draw = ImageDraw.Draw(img)
    if coords:
        x, y = coords
        draw.ellipse([x-8, y-8, x+8, y+8], fill=(0,255,0), outline=(0,0,0))
        draw.text((x+10, y-10), f'({x},{y})', fill=(255,255,255))
    if mask_arr is not None and colors:
        ys, xs = np.where(mask_arr)
        if len(ys) > 0:
            draw.text((xs.mean()-5, ys.mean()-5), '1', fill=(255,255,255))
    return img

def test_all():
    """全图分割"""
    print("🎯 测试全图分割...")
    b64 = get_base64()
    r = requests.post(URL_ALL, json={'image': b64})
    if r.status_code == 200:
        masks = r.json()['masks'][:5]
        img_arr = np.array(Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB"))
        colors = [(255,0,0,100), (0,255,0,100), (0,0,255,100), (255,255,0,100), (255,0,255,100)]
        
        # 合成图
        combined = Image.fromarray(img_arr)
        for i, mb in enumerate(masks):
            mask = np.array(Image.open(io.BytesIO(base64.b64decode(mb))).convert("L")) > 0
            combined = visualize(np.array(combined), mask, colors=[colors[i % len(colors)]])
        combined.save('output_all_combined.jpg')
        print(f"💾 合成图: output_all_combined.jpg")
        
        # 单mask
        for i, mb in enumerate(masks):
            mask = np.array(Image.open(io.BytesIO(base64.b64decode(mb))).convert("L")) > 0
            vis = visualize(img_arr, mask, colors=[colors[i % len(colors)]])
            vis.save(f'output_all_{i+1}.jpg')
            print(f"💾 单图: output_all_{i+1}.jpg")
    else:
        print(f"❌ 失败: {r.text}")

def test_point():
    """点分割（单次）"""
    print("\n🎯 点分割（单次测试）")
    b64 = get_base64()
    img = Image.open(IMAGE_PATH)
    w, h = img.size
    
    coord = input(f"坐标 x,y (0~{w-1}, 0~{h-1}): ").strip()
    if coord.lower() in ['q','quit']: return
    
    try:
        x, y = map(int, coord.split(','))
        r = requests.post(URL_POINT, json={'image': b64, 'x': x, 'y': y})
        if r.status_code == 200:
            mask = np.array(Image.open(io.BytesIO(base64.b64decode(r.json()['mask']))).convert("L")) > 0
            img_arr = np.array(img.convert("RGB"))
            vis = visualize(img_arr, mask, coords=(x,y), colors=[(255,0,0,100)])
            fname = f'output_point.jpg'
            vis.save(fname)
            print(f"💾 保存: {fname}")
        else:
            print(f"❌ 失败: {r.text}")
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    try:
        Image.open(IMAGE_PATH)
    except:
        print(f"❌ 请将测试图片命名为 {IMAGE_PATH}")
        exit(1)
    
    test_all()
    test_point()
    print("\n🏁 完成!")