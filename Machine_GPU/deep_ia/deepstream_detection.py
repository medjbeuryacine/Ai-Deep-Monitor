import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst

Gst.init(None)

pipeline = """
uridecodebin uri=rtsp://192.168.1.153:8554/youtube ! 
nvvideoconvert ! m.sink_0 
nvstreammux name=m width=640 height=640 batch-size=1 batched-push-timeout=40000 ! 
nvinfer config-file-path=models/yolov8n_config.txt ! 
nvinfer config-file-path=models/yolov8n-faces_config.txt ! 
nvdsosd ! nvvideoconvert ! nvdsrtppay ! udpsink host=192.168.1.153 port=8556
"""

print("✅ Détection YOLOv8n (personnes) & YOLOv8n-Faces (visages) en cours...")

pipeline = Gst.parse_launch(pipeline)
pipeline.set_state(Gst.State.PLAYING)

loop = Gst.MainLoop()
loop.run()
