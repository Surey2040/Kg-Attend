from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import cv2
import numpy as np
import base64
from ultralytics import YOLO

app = FastAPI(title="PresenceIQ AI Headcount Engine")

# Load the YOLOv8 nano model (downloads automatically if not present)
# Using nano for speed and lower resource consumption
try:
    model = YOLO('yolov8n.pt')
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="YOLO model not loaded")

    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Run inference
    # classes=[0] filters for 'person' class only
    results = model(img, classes=[0], conf=0.3)

    # Process results
    headcount = 0
    annotated_img = img.copy()

    if len(results) > 0:
        result = results[0]
        headcount = len(result.boxes)
        # Plot the boxes on the image
        annotated_img = result.plot()

    # Convert annotated image to base64
    _, buffer = cv2.imencode('.jpg', annotated_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return JSONResponse(content={
        "headcount": headcount,
        "annotated_image": f"data:image/jpeg;base64,{img_base64}"
    })

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
