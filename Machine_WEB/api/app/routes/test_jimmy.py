import requests
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["Flux HTTP MJPEG depuis .153"])

# 🔗 URL HTTP MJPEG (et non RTSP)
HTTP_MJPEG_URL_153 = "http://192.168.1.153:8010/api/view"

def gen_frames_from_http_mjpeg():
    with requests.get(HTTP_MJPEG_URL_153, stream=True) as r:
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:
                yield chunk

@router.get("/api/view153")
async def view_from_http_153():
    """
    Affiche le flux HTTP MJPEG provenant de 192.168.1.153:8000/api/view
    """
    return StreamingResponse(gen_frames_from_http_mjpeg(), media_type="multipart/x-mixed-replace; boundary=frame")


#  /api/view