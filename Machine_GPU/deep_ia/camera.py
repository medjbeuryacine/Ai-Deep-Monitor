#!/usr/bin/env python3
import gi

gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GLib

Gst.init(None)

class DeepstreamRTSPServer(GstRtspServer.RTSPServer):
    def __init__(self):
        super(DeepstreamRTSPServer, self).__init__()
        self.set_service('8554')
        mounts = self.get_mount_points()

        # Teste avec image/jpeg, si ça échoue, utilise video/x-raw
        pipeline = (
            '( v4l2src device=/dev/video0 ! '
            'image/jpeg,width=1280,height=720,framerate=30/1 ! jpegdec ! '
            'nvvideoconvert ! video/x-raw(memory:NVMM) ! '
            'nvv4l2h264enc bitrate=8000000 insert-sps-pps=true iframeinterval=30 ! '
            'h264parse ! rtph264pay name=pay0 pt=96 )'
        )

        factory = GstRtspServer.RTSPMediaFactory()
        factory.set_launch(pipeline)
        factory.set_shared(True)
        mounts.add_factory("/gpu-stream", factory)

        self.attach(None)
        print("🔥 RTSP Server lancé sur rtsp://192.168.1.153:8554/gpu-stream")

if __name__ == '__main__':
    server = DeepstreamRTSPServer()
    loop = GLib.MainLoop()
    loop.run()
