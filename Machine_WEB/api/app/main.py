from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# yacine
from app.routes.system import router as router_systeme
from app.routes.cameras_endpoints import router as router_camera
from app.routes.detecionIA_endpoints import router as router_detectionia
from app.routes.personne_endpoints import router as router_personne
# from app.routes.get_video import router as router_get_video
from app.routes.get_video_test import router as router_test
from app.routes.Gpu_camera import router as router_gpu_camera
from app.routes.UploadVideo import router as router_UploadVideo
from app.routes.get_camera_ip import router as router_get_camera_ip
from app.routes.CameraIP_et_CameraConfig import router as router_camera_ip_config
from app.routes.get_image_personnes import router as router_get_image_personnes


## nicolas 
from app.routes.get_image import router as router_get_image
from app.routes.get_image_info import router as router_get_info
from app.routes.detect_yolo import router as router_detect_yolo

## marwane
from app.routes.compteur import router as router_coumpteur
from app.routes.video_entrer import router as router_video_entrer
from app.routes.video_sortie import router as router_video_sortie
# from app.routes.tracage_zone_detec import router as router_tracage_zone

from app.routes.test_jimmy import router as test_jimmy

from app.routes.test_m3u8 import router as test_m3u8


app = FastAPI(
    docs_url="/api/docs",   # URL pour Swagger UI
    redoc_url="/api/redocs"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mets ici l'URL de ton frontend au lieu de "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/hls", StaticFiles(directory="/var/www/hls"), name="hls")
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# app.mount("/static", StaticFiles(directory="/static"), name="static")

## Route yacine
app.include_router(router_systeme)
app.include_router(router_camera)
app.include_router(router_personne)
app.include_router(router_detectionia)
# app.include_router(router_get_video)
app.include_router(router_gpu_camera)
app.include_router(router_UploadVideo)
app.include_router(router_get_camera_ip)
app.include_router(router_camera_ip_config)
app.include_router(router_get_image_personnes)



## route nicolas
app.include_router(router_get_image)
app.include_router(router_get_info)
app.include_router(router_detect_yolo)

# route marwane
app.include_router(router_coumpteur)
app.include_router(router_video_entrer)
app.include_router(router_video_sortie)
# app.include_router(router_tracage_zone)


# test yacine
app.include_router(router_test)


app.include_router(test_jimmy)



# test yacine m3u8

app.include_router(test_m3u8)

# Monter le répertoire HLS pour servir les fichiers du stream
# mount_static_files(app)

@app.get("/")
def read_root():
    return {"message": "API is running!"}