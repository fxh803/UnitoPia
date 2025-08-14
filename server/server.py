from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import math
import base64
app = Flask(__name__, template_folder='',static_folder="")
CORS(app)  # 启用跨域支持

@app.route('/api/process-data', methods=['POST'])
def process_data():  
    
    # 获取请求数据
    request_data = request.get_json() 
    data = request_data['data']
    id = request_data['id']
    print(data)
    json_data = {
        "collage": []
    }
    for i, collage_data in enumerate(data):#这是要输入的数据
        #文件夹准备
        os.makedirs(f"./workdir/{str(id)}_{i}", exist_ok=True) 
        os.makedirs(f"./workdir/{str(id)}_{i}/markers", exist_ok=True)
        # 确保 collage 列表长度足够
        while len(json_data["collage"]) <= i:
            json_data["collage"].append({
                "marker_config": [],
                "container_config": {},
                "emitter": {},
                "forces": {}
            })
        
        # 处理标记点数据
        for j, marker_data in enumerate(collage_data["markers"]):
            print(collage_data["forces"])
            # 确保 marker_config 列表长度足够
            while len(json_data["collage"][i]["marker_config"]) <= j:
                json_data["collage"][i]["marker_config"].append({
                    "marker": [],
                    "visual_encoding": [],
                    "data": []
                })
            
            # 保存 marker 的 base64 到指定文件夹,并填写json 
            marker_id = marker_data["markerId"]
            marker_type = 'svg' if marker_data['thumbnail'].startswith('data:image/svg+xml;base64,') else 'png'
            marker_base64 = marker_data['thumbnail'].split(',')[1]
            marker_path = f"./workdir/{str(id)}_{i}/markers/"+str(marker_id)+"."+marker_type
            with open(marker_path, "wb") as f_marker:
                f_marker.write(base64.b64decode(marker_base64))
            json_data["collage"][i]["marker_config"][j]["marker"] = [marker_path]
            
            visualEncoding = None
            data = None
            for binding in collage_data.get("dataBinding", []):
                if binding.get("markerId") == marker_id:
                    visualEncoding = binding.get("visualEncoding")
                    data = binding.get("data")
                    break
            
            # 确保 visual_encoding 列表长度足够
            while len(json_data["collage"][i]["marker_config"][j]["visual_encoding"]) <= 0:
                json_data["collage"][i]["marker_config"][j]["visual_encoding"].append({})
            
            json_data["collage"][i]["marker_config"][j]["visual_encoding"][0]["channel"] = visualEncoding
            json_data["collage"][i]["marker_config"][j]["data"] = data

        
        # 将 base64 编码的 container 保存为图片文件
        container_base64 = collage_data["container"].split(',')[1]
        container_path = f"./workdir/{str(id)}_{i}/container.png"
        with open(container_path, "wb") as f_container:
            f_container.write(base64.b64decode(container_base64))
        json_data["collage"][i]["container_config"]["container"] = container_path

        # 将 emitter 字典列表转换为 [[x, y], ...] 的结构
        json_data["collage"][i]["emitter"]["control_points"] = [
            [point["x"], point["y"]] for point in collage_data["emitter"]
        ]
        force_type = collage_data["forces"][0]["type"]
        if force_type == "pointForce":
            json_data["collage"][i]["forces"]["force_points"] = [
                [force["coordinates"]["x"], force["coordinates"]["y"]] for force in collage_data["forces"]
            ] 
            json_data["collage"][i]["forces"]["force_type"] = "points"
        elif force_type == "fieldForce":
            rotation = collage_data["forces"][0]["rotation"]
            # 根据 rotation 计算单位向量，初始方向为正右（1,0），rotation为弧度制
            x1, y1 = 0, 0
            x2 = math.cos(rotation)
            y2 = math.sin(rotation)
            json_data["collage"][i]["forces"]["force_points"] = [x1, y1, x2, y2]
            json_data["collage"][i]["forces"]["force_type"] = "indicate_direction"
    print(json_data)
    with open(f'./workdir/{str(id)}_{i}/collage.json', 'w') as f:
        json.dump(json_data, f, indent=4)
    # 返回处理结果
    return jsonify({
        "success": True,
        "message": "数据接收成功"
    }), 200

 
if __name__ == '__main__': 
    
    app.run(host='0.0.0.0', port=5000, debug=True)
