#!/usr/bin/env python3
import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GObject, GLib

Gst.init(None)

class DeepstreamRTSP:
    def __init__(self):
        self.server = GstRtspServer.RTSPServer()
        self.server.set_service('8554')
        mounts = self.server.get_mount_points()

        pipeline = ('( v4l2src device=/dev/video0 ! image/jpeg,width=1280,height=720,framerate=30/1 ! '
                    'jpegdec ! videoconvert ! nvvideoconvert ! video/x-raw(memory:NVMM) ! '
                    'm.sink_0 nvstreammux name=m width=1280 height=720 batch-size=1 batched-push-timeout=40000 ! '
                    'nvinfer config-file-path=/opt/nvidia/deepstream/deepstream-7.1/samples/configs/deepstream-app/config_infer_primary.txt ! '
                    'nvdsosd ! nvvideoconvert ! nvv4l2h264enc bitrate=4000000 ! h264parse ! rtph264pay name=pay0 pt=96 )')

        factory = GstRtspServer.RTSPMediaFactory()
        factory.set_launch(pipeline)
        factory.set_shared(True)
        mounts.add_factory("/ds-test", factory)

        self.server.attach(None)
        print("Serveur RTSP lancé : rtsp://192.168.1.153:8554/ds-test")

if __name__ == '__main__':
    s = DeepstreamRTSP()
    loop = GLib.MainLoop()
    loop.run()
