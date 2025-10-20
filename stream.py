import cv2
import subprocess
import threading
import time
import socket
import queue
import os

# --- Configuration ---
CAMERA_INDEX = "/dev/video0"
FRAME_WIDTH = 940
FRAME_HEIGHT = 480
FRAME_RATE = 60
VIDEO_CODEC = "libx264"
FFMPEG_PATH = "ffmpeg"
SHOW_CAMERA_FEED = False  # Set to False for headless Raspberry Pi

RTP_ADDRESS = "in1.pitunnel.net:27020"
RTP_PORT = 8050
MEDIA_NAME = "QC60_shadowfly"

# --- Detect Headless Environment ---
if not os.environ.get("DISPLAY"):
    SHOW_CAMERA_FEED = False

# --- Get Local IP ---
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

# --- FFmpeg Writer ---
def ffmpeg_writer(ffmpeg_process, frame_queue, stop_event):
    while not stop_event.is_set():
        try:
            if ffmpeg_process.poll() is not None:
                print("❌ FFmpeg process exited.")
                break

            frame = frame_queue.get(timeout=1.0)
            if frame is None or frame.size == 0:
                continue
            ffmpeg_process.stdin.write(frame.tobytes())
        except queue.Empty:
            continue
        except BrokenPipeError:
            print("❌ FFmpeg pipe broken.")
            break
        except Exception as e:
            print(f"⚠️ FFmpeg write error: {e}")
            time.sleep(0.1)

# --- FFmpeg Log Reader ---
def log_ffmpeg_errors(proc):
    for line in iter(proc.stderr.readline, b''):
        print("FFmpeg:", line.decode(errors="ignore"), end='')

# --- Streaming ---
def stream_camera():
    local_ip = get_local_ip()
    print(f"\n📡 WebRTC Stream Ready!")
    print(f"▶️ Open in browser: http://{local_ip}:8889/{MEDIA_NAME}\n")

    frame_queue = queue.Queue(maxsize=10)
    stop_event = threading.Event()

    while True:
        cap = cv2.VideoCapture(CAMERA_INDEX)
        if not cap.isOpened():
            print(f"❌ Failed to open camera. Retrying in 2s...")
            time.sleep(2)
            continue

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, FRAME_RATE)

        actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        print(f"📷 Camera opened at {actual_width}x{actual_height}, {FRAME_RATE} FPS")

        ffmpeg_cmd = [
            FFMPEG_PATH,
            "-f", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{actual_width}x{actual_height}",
            "-r", str(FRAME_RATE),
            "-i", "pipe:0",
            "-an",
            "-vf", "format=yuv420p",
            "-c:v", VIDEO_CODEC,
            "-preset", "veryfast",
            "-tune", "zerolatency",
            "-g", "15",
            "-keyint_min", "15",
            "-mpegts_flags", "resend_headers",
            "-bsf:v", "h264_mp4toannexb",
            "-f", "mpegts",
            f"udp://{RTP_ADDRESS}:{RTP_PORT}?pkt_size=1316"
        ]

        ffmpeg_process = subprocess.Popen(
            ffmpeg_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            bufsize=0
        )

        writer_thread = threading.Thread(target=ffmpeg_writer, args=(ffmpeg_process, frame_queue, stop_event))
        writer_thread.start()

        log_thread = threading.Thread(target=log_ffmpeg_errors, args=(ffmpeg_process,))
        log_thread.start()

        print("🎥 Streaming... Press Ctrl+C to stop.")
        time.sleep(2)

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Frame read failed. Restarting camera...")
                    cap.release()
                    break

                if SHOW_CAMERA_FEED:
                    cv2.imshow("Preview", frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        raise KeyboardInterrupt

                if not frame_queue.full():
                    frame_queue.put_nowait(frame)
        except KeyboardInterrupt:
            print("🛑 Stopping stream...")
            break
        except Exception as e:
            print(f"❌ Runtime error: {e}")
        finally:
            cap.release()
            stop_event.set()
            if writer_thread:
                writer_thread.join()
            if log_thread:
                log_thread.join()
            if ffmpeg_process:
                try:
                    ffmpeg_process.stdin.close()
                    ffmpeg_process.wait(timeout=5)
                except Exception:
                    ffmpeg_process.kill()
            print("♻️ Restarting stream loop...")

    cv2.destroyAllWindows()
    print("✅ Stream closed.")

# --- Entry Point ---
if __name__ == "__main__":
    stream_camera()
