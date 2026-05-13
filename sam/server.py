import io
import base64
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
import torch
from sam2.build_sam import build_sam2
from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
from sam2.sam2_image_predictor import SAM2ImagePredictor
import os
from scipy.ndimage import center_of_mass
app = Flask(__name__)
sam2_model = None
mask_generator = None
image_predictor = None

def init_model():
    global sam2_model, mask_generator, image_predictor
    model_cfg = "configs/sam2.1/sam2.1_hiera_b+.yaml"
    sam2_checkpoint = "./checkpoints/sam2.1_hiera_base_plus.pt"
    
    sam2_model = build_sam2(model_cfg, sam2_checkpoint, device="cuda", apply_postprocessing=False) 
    mask_generator = SAM2AutomaticMaskGenerator(
        sam2_model,
        box_nms_thresh=0.3,  
    )
    image_predictor = SAM2ImagePredictor(sam2_model)

def mask_to_base64(mask):
    """将mask转换为base64字符串"""
    buffer = io.BytesIO()
    Image.fromarray((mask * 255).astype(np.uint8)).save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def base64_to_image(base64_str):
    """将base64字符串转换为numpy数组"""
    try:
        # 去除可能的 data URL 前缀
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        return np.array(image)
    except Exception as e:
        raise ValueError(f"Base64解码失败: {str(e)}")

@app.route('/segmentAll', methods=['POST'])
def segment_all():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "缺少image字段或JSON格式错误"}), 400
        
        image_np = base64_to_image(data['image'])
        bbox = data.get('bbox', None) # {left, top, width, height}
        with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
            masks = mask_generator.generate(image_np)
        
        if not masks:
            return jsonify({"error": "无检测结果"}), 404
        
        # 如果提供了bbox，先筛选中心点在bbox内的mask
        if bbox is not None:
            # bbox格式: {left, top, width, height}
            bbox_left = bbox.get('left', 0)
            bbox_top = bbox.get('top', 0)
            bbox_width = bbox.get('width', 0)
            bbox_height = bbox.get('height', 0)
            bbox_right = bbox_left + bbox_width
            bbox_bottom = bbox_top + bbox_height
            
            # 筛选中心点在bbox内的mask
            filtered_indices = []
            for i, mask in enumerate(masks):
                # 使用center_of_mass快速计算mask的中心点（质心）
                mask_seg = mask['segmentation']
                center = center_of_mass(mask_seg)
                if not np.isnan(center[0]):  # 检查是否有效
                    mask_center_y, mask_center_x = center
                    
                    # 检查中心点是否在bbox内
                    if (bbox_left <= mask_center_x <= bbox_right and 
                        bbox_top <= mask_center_y <= bbox_bottom):
                        filtered_indices.append(i)
            
            # 如果筛选后没有mask，使用所有mask
            if not filtered_indices:
                filtered_indices = list(range(len(masks)))
        else:
            filtered_indices = list(range(len(masks)))
        
        # 在筛选后的mask中按面积排序，直接取前5个mask
        mask_areas = [(i, int(np.sum(masks[i]['segmentation']))) for i in filtered_indices]
        mask_areas.sort(key=lambda x: x[1], reverse=True)  # 按面积降序排序
        final_indices = [idx for idx, _ in mask_areas[:5]]
        
        # 只返回去重叠后的mask的base64数据
        top5_masks = []
        for idx in final_indices:
            top5_masks.append(mask_to_base64(masks[idx]['segmentation']))
        
        return jsonify({"masks": top5_masks})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/segmentPoint', methods=['POST'])
def segment_point():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "缺少image字段或JSON格式错误"}), 400
        
        # 获取坐标
        x = int(data.get('x', 0))
        y = int(data.get('y', 0))
        
        image_np = base64_to_image(data['image'])
        h, w = image_np.shape[:2]
        
        if not (0 <= x < w and 0 <= y < h):
            return jsonify({"error": f"坐标超出范围({w}x{h})"}), 400
        
        # 预测mask
        with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
            image_predictor.set_image(image_np)
            masks, scores, _ = image_predictor.predict(
                point_coords=np.array([[x, y]]),
                point_labels=np.array([1])
            )
        
        best_mask = masks[np.argmax(scores)]
        return jsonify({"mask": mask_to_base64(best_mask)})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_model()
    app.run(host='0.0.0.0', port=2616,debug=True)