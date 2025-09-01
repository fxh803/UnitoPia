from PIL import Image 
import base64 
import cairosvg
from io import BytesIO
import cv2
import numpy as np

def base64_to_image(base64_data): 
    # 检查是否为 SVG
    if base64_data.startswith('data:image/svg+xml'): 
        png_data = cairosvg.svg2png(bytestring=image_data)
        return Image.open(BytesIO(png_data))
    else: 
        image_data = base64.b64decode(base64_data.split(',', 1)[1])
        return Image.open(BytesIO(image_data))
 

def transparency(image,color):
    # 将图像转换为灰度图像
    gray_image = image.convert('L')

    # 获取图像数据
    data = gray_image.getdata()
    threshold = 200  # 设置阈值

    # 创建一个新的图像对象，将白色部分变为透明色
    new_data = []
    for pixel in data:
        if pixel >= threshold:
            new_data.append((255, 255, 255, 0))  # 将白色部分变为透明色
        else:
            new_data.append((int(color[0]), int(color[1]), int(color[2]), int(color[3]*255)))  # 其他部分保持黑色

    # 创建新的图像对象
    new_image = Image.new('RGBA', gray_image.size)
    new_image.putdata(new_data)

    return new_image


def crop_to_content(image):
    """
    使用OpenCV contour bounding box裁剪图片到非透明区域
    """
    # 确保图片是RGBA模式
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # 转换为numpy数组
    img_array = np.array(image)
    
    # 提取alpha通道
    alpha = img_array[:, :, 3]
    
    # 创建二值图像（非透明像素为255，透明像素为0）
    binary = np.where(alpha > 0, 255, 0).astype(np.uint8)
    
    # 找到轮廓
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image
    
    # 找到所有轮廓的边界框
    min_x, min_y = image.width, image.height
    max_x, max_y = 0, 0
    
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x + w)
        max_y = max(max_y, y + h)
    
    # 如果没有找到有效区域，返回原图
    if min_x >= max_x or min_y >= max_y:
        return image
    
    # 裁剪图片
    cropped_image = image.crop((min_x, min_y, max_x, max_y))
    return cropped_image