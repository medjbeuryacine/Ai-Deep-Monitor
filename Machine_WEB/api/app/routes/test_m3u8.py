

################################## test m3u8 ##################################
# import requests

# url = "http://192.168.1.154/api/hls/test_16/stream.m3u8"
# response = requests.get(url)

# if response.status_code == 200:
#     print("Fichier .m3u8 accessible ✅")
#     print(response.text)  # Aperçu du contenu
# else:
#     print("Erreur accès HLS ❌ :", response.status_code)



from fastapi.responses import PlainTextResponse
import cv2
from fastapi import APIRouter

router = APIRouter(tags=["TEST M3U8"])

@router.get("/api/test-hls", response_class=PlainTextResponse)
async def test_hls_stream(username: str):
    """Teste si le stream HLS est lisible avec OpenCV depuis la machine web"""
    hls_url = f"http://192.168.1.154/api/hls/{username}/playlist.m3u8"
    cap = cv2.VideoCapture(hls_url)

    if not cap.isOpened():
        return "❌ Impossible d'ouvrir le flux HLS à l'adresse : " + hls_url

    frame_count = 0
    for _ in range(20):  # Tente de lire 20 frames max
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1

    cap.release()

    if frame_count > 0:
        return f"✅ Flux HLS lisible depuis OpenCV ({frame_count} frames lues) : {hls_url}"
    else:
        return f"⚠️ Stream ouvert mais aucune frame lisible sur : {hls_url}"