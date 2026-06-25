import "./App.css";
import React, { useState, useRef, useEffect } from "react";

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "0:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

function App() {
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDragging = useRef(false);
  const controlsTimeoutRef = useRef(null);

  const playlist = ["video.mp4", "video2.mp4", "video3.mp4"];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(100);
  const [videoSrc, setVideoSrc] = useState(playlist[0]);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isAutoPlayNext, setIsAutoPlayNext] = useState(true);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // --- MOUSE IDLE LOGIC ---
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // --- HANDLERS ---
  const togglePlay = () => {
    if (isSimulatingLoad || !videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const current = video.currentTime;
      const dur = video.duration;
      setCurrentTime(formatTime(current));
      if (dur > 0) setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(formatTime(video.duration));
    }
  };

  const handleScrub = (e) => {
    if (isSimulatingLoad) return;
    const progressContainer = progressRef.current;
    const video = videoRef.current;

    if (progressContainer && video) {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));

      video.currentTime = percentage * video.duration;
      setProgress(percentage * 100);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    handleScrub(e);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume / 100;
  };

  const skip = (amount) => {
    if (isSimulatingLoad || !videoRef.current) return;
    videoRef.current.currentTime += amount;
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" &&
        document.activeElement.type === "text"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullScreen();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.min(100, Number(prev) + 10);
            if (videoRef.current) videoRef.current.volume = newVol / 100;
            return newVol;
          });
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.max(0, Number(prev) - 10);
            if (videoRef.current) videoRef.current.volume = newVol / 100;
            return newVol;
          });
          break;
        default:
          break;
      }
      resetControlsTimeout();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulatingLoad]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging.current) handleScrub(e);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPlaying && videoRef.current && !isSimulatingLoad) {
      videoRef.current
        .play()
        .catch((err) => console.log("Autoplay blocked:", err));
    }
  }, [videoSrc, isPlaying, isSimulatingLoad]);

  const handlePrevVideo = () => {
    if (isSimulatingLoad) return;
    setIsSimulatingLoad(true);
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();

    setTimeout(() => {
      const prevIndex =
        currentVideoIndex === 0 ? playlist.length - 1 : currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      setVideoSrc(playlist[prevIndex]);
      setProgress(0);
      setCurrentTime("0:00");
      setIsSimulatingLoad(false);
      setIsPlaying(true);
    }, 1000);
  };

  const handleNextVideo = () => {
    if (isSimulatingLoad) return;
    setIsSimulatingLoad(true);
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();

    setTimeout(() => {
      const nextIndex = (currentVideoIndex + 1) % playlist.length;
      setCurrentVideoIndex(nextIndex);
      setVideoSrc(playlist[nextIndex]);
      setProgress(0);
      setCurrentTime("0:00");
      setIsSimulatingLoad(false);
      setIsPlaying(true);
    }, 1000);
  };

  const toggleAutoPlay = () => setIsAutoPlayNext(!isAutoPlayNext);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      if (!isFull) {
        playerRef.current?.classList.remove("is-fullscreen");
        if (
          window.screen &&
          window.screen.orientation &&
          window.screen.orientation.unlock
        ) {
          window.screen.orientation.unlock();
        }
      }
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = async () => {
    if (playerRef.current) {
      if (!document.fullscreenElement) {
        try {
          await playerRef.current.requestFullscreen();
          playerRef.current.classList.add("is-fullscreen");
          if (
            window.screen &&
            window.screen.orientation &&
            window.screen.orientation.lock
          ) {
            await window.screen.orientation.lock("landscape");
          }
        } catch (err) {
          console.log("Fullscreen/Orientation error:", err);
        }
      } else {
        document.exitFullscreen();
        playerRef.current.classList.remove("is-fullscreen");
        if (
          window.screen &&
          window.screen.orientation &&
          window.screen.orientation.unlock
        ) {
          window.screen.orientation.unlock();
        }
      }
    }
  };

  const togglePIP = () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement !== videoRef.current) {
        videoRef.current.requestPictureInPicture();
      } else {
        document.exitPictureInPicture();
      }
    }
  };

  const handleUploadClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.log(err));
      if (
        window.screen &&
        window.screen.orientation &&
        window.screen.orientation.unlock
      ) {
        window.screen.orientation.unlock();
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setVideoSrc(fileURL);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.load();
      }
    }
    e.target.value = null;
  };

  const uiVisibilityStyle = {
    opacity: showControls ? 1 : 0,
    pointerEvents: showControls ? "auto" : "none",
    transition: "opacity 0.4s ease",
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  return (
    <>
      <div
        className="container"
        ref={playerRef}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={handleMouseLeave}
      >
        <div className="video-player">
          <video
            ref={videoRef}
            src={videoSrc}
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onEnded={() => {
              if (isAutoPlayNext) handleNextVideo();
              else setIsPlaying(false);
            }}
            style={{ cursor: showControls ? "default" : "none" }}
          />
          <div className="gesture-left" onDoubleClick={() => skip(-10)}></div>
          <div className="gesture-right" onDoubleClick={() => skip(10)}></div>

          <div className="center-action-area" style={uiVisibilityStyle}>
            <div className="side-btn" onClick={handlePrevVideo}>
              <i className="material-symbols-rounded">skip_previous</i>
            </div>

            <div className="play-btn-wrapper">
              <div className="centrepp" onClick={togglePlay}>
                <span>
                  <i
                    className={`material-symbols-rounded ${isBuffering || isSimulatingLoad ? "spin" : ""}`}
                  >
                    {isBuffering || isSimulatingLoad
                      ? "progress_activity"
                      : isPlaying
                        ? "pause"
                        : "play_arrow"}
                  </i>
                </span>
              </div>
            </div>

            <div className="side-btn" onClick={handleNextVideo}>
              <i className="material-symbols-rounded">skip_next</i>
            </div>
          </div>
        </div>

        <div className="controls-wrapper" style={uiVisibilityStyle}>
          <div
            className="progress-container"
            ref={progressRef}
            onMouseDown={handleMouseDown}
          >
            <div className="progress-track">
              <div
                className="progress-filled"
                style={{ width: `${progress}%` }}
              >
                <div className="progress-thumb"></div>
              </div>
            </div>
          </div>

          <div className="controls">
            <div className="bottom-left-wrapper">
              <div className="controls-left">
                <span className="icon" onClick={() => skip(-10)}>
                  <i className="material-symbols-rounded">replay_10</i>
                </span>
                <span className="icon" onClick={togglePlay}>
                  <i className="material-symbols-rounded">
                    {isPlaying ? "pause" : "play_arrow"}
                  </i>
                </span>
                <span className="icon" onClick={() => skip(10)}>
                  <i className="material-symbols-rounded">forward_10</i>
                </span>
              </div>

              <div className="volume-container">
                <i className="material-symbols-rounded">
                  {Number(volume) === 0
                    ? "volume_off"
                    : Number(volume) < 50
                      ? "volume_down"
                      : "volume_up"}
                </i>
                <input
                  className="volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  id="volume"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>
              <div className="time">
                {currentTime} / {duration}
              </div>
            </div>

            <div className="controls-right">
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <span className="icon" onClick={handleUploadClick}>
                <i className="material-symbols-rounded">video_file</i>
              </span>
              <span
                className="icon"
                onClick={toggleAutoPlay}
                style={{ color: isAutoPlayNext ? "#befff6" : "inherit" }}
              >
                <i className="material-symbols-rounded">autoplay</i>
              </span>
              <span className="icon" onClick={togglePIP}>
                <i className="material-symbols-rounded">pip</i>
              </span>
              <span className="icon" onClick={toggleFullScreen}>
                <i className="material-symbols-rounded">fullscreen</i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
