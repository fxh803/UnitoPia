from PIL import Image 
import base64
import cairosvg
from io import BytesIO
import cv2
import numpy as np 
import cv2
import numpy as np
import random
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


def find_region_containing_point(image, pos):
    """
    找到包含指定点pos的非透明区域
    
    Args:
        image: PIL图像对象
        pos: 包含x,y坐标的字典 {'x': x_coord, 'y': y_coord}
    
    Returns:
        包含该点的轮廓区域，如果没有找到则返回None
    """
    # 确保图片是RGBA模式
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # 转换为numpy数组
    img_array = np.array(image) 
    r, g, b = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2]
    is_white = (r >= 250) & (g >= 250) & (b >= 250)
    binary = np.where(is_white, 0, 255).astype(np.uint8)  # 确保是uint8类型
    # 找到轮廓
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
    
    # 检查哪个轮廓包含指定的点
    # 处理pos可能是列表或字典的情况
    if isinstance(pos, list) and len(pos) >= 2:
        point = (int(pos[0]), int(pos[1]))
    elif isinstance(pos, dict) and 'x' in pos and 'y' in pos:
        point = (int(pos['x']), int(pos['y']))
    else:
        return None
    
    for contour in contours:
        # 使用cv2.pointPolygonTest检查点是否在轮廓内
        result = cv2.pointPolygonTest(contour, point, False)
        if result >= 0:  # 点在轮廓内或边界上
            return contour
    
    return None

 


def grid_based_sampling(contour, num_points, canvas_width, canvas_height, shrink_distance=10):
    """
    基于网格的采样，通过收缩轮廓避免点在边缘初始化
    
    Args:
        contour: OpenCV轮廓
        num_points: 需要生成的点数
        shrink_distance: 轮廓收缩距离（像素）
    
    Returns:
        生成的点列表
    """
    if contour is None or num_points <= 0:
        return []
    
    # 1. 获取轮廓边界框和面积
    x, y, w, h = cv2.boundingRect(contour)
    contour_area = cv2.contourArea(contour)
    if contour_area <= 0:
        return []
    
    # 2. 收缩轮廓
    # 创建二值图像
    binary_img = np.zeros((canvas_height, canvas_width), dtype=np.uint8) 
    cv2.drawContours(binary_img, [contour], -1, 255, -1)
    
    # 使用形态学腐蚀操作收缩轮廓
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (shrink_distance*2+1, shrink_distance*2+1))
    shrunk_img = cv2.erode(binary_img, kernel, iterations=1)
    
    # 创建彩色图像，将两个轮廓用不同颜色显示
    # 创建3通道彩色图像
    comparison_img = np.zeros((canvas_height, canvas_width, 3), dtype=np.uint8)
    
    # 原轮廓用蓝色显示
    comparison_img[binary_img > 0] = [255, 0, 0]  # 蓝色 (BGR格式)
    
    # 收缩后轮廓用红色显示
    comparison_img[shrunk_img > 0] = [0, 0, 255]  # 红色 (BGR格式)
    
    # 重叠区域用绿色显示
    overlap = (binary_img > 0) & (shrunk_img > 0)
    comparison_img[overlap] = [0, 255, 0]  # 绿色 (BGR格式)
    
    # 保存对比图像
    cv2.imwrite('contour_comparison.png', comparison_img)
    print(f"已保存轮廓对比图像: contour_comparison.png")
    print(f"蓝色: 原轮廓, 红色: 收缩后轮廓, 绿色: 重叠区域") 
    
    # 找到收缩后的轮廓
    shrunk_contours, _ = cv2.findContours(shrunk_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 如果没有找到收缩后的轮廓，使用原轮廓
    if not shrunk_contours:
        target_contour = contour
    else:
        # 直接取第一个（也是唯一的）收缩轮廓
        target_contour = shrunk_contours[0] 
    
    # 3. 动态调整网格间距，确保生成的点数 >= num_points
    grid_size = int(np.sqrt(contour_area / num_points))
    points = []
    
    while True:
        points.clear()
        # 生成网格点
        for i in range(x, x + w, grid_size):
            for j in range(y, y + h, grid_size):
                if cv2.pointPolygonTest(target_contour, (i, j), False) >= 0:
                    points.append((i, j))
        
        # 检查是否生成足够的点
        if len(points) >= num_points:
            break
        else:
            # 缩小网格间距（例如每次减少10%）
            grid_size = max(1, int(grid_size * 0.9))  # 避免grid_size=0

    # 4. 随机下采样到目标点数（保证均匀性）
    if len(points) > num_points:
        # 计算轮廓质心
        M = cv2.moments(contour)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx, cy = x + w // 2, y + h // 2  # 退化为边界框中心
        # 按点到质心的距离排序 
        points.sort(key=lambda p: np.sqrt((p[0]-cx)**2 + (p[1]-cy)**2))
        
        # 保留最近的num_points个点 
        points = points[:num_points]
    
    return points