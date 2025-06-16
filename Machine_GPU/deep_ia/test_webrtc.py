import asyncio
import json
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.signaling import BYE
import websockets
import cv2
import numpy as np
from av import VideoFrame

async def run_client():
    uri = "ws://localhost:8050/ws/webrtc"  # adapte si nécessaire

    # Configuration de la caméra (même format que côté serveur)
    camera_config = {
        "rtsp_url": "rtsp://192.168.1.155/live1s1.sdp",
        "username": "root",
        "password": "demo1234"
    }

    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps(camera_config))  # envoyer config caméra

        # Recevoir l'offre SDP
        offer = json.loads(await websocket.recv())

        # Créer la connexion client
        pc = RTCPeerConnection()

        @pc.on("track")
        def on_track(track):
            print("Track received:", track.kind)
            if track.kind == "video":
                asyncio.ensure_future(display_video(track))

        # Appliquer la description distante
        await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))

        # Créer une réponse (answer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        # Envoyer la réponse au serveur
        await websocket.send(json.dumps({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        }))

        # Maintenir la connexion
        while True:
            await asyncio.sleep(1)


async def display_video(track: VideoStreamTrack):
    while True:
        frame: VideoFrame = await track.recv()
        img = frame.to_ndarray(format="bgr24")
        cv2.imshow("WebRTC Stream", img)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    cv2.destroyAllWindows()

if __name__ == "__main__":
    asyncio.run(run_client())
