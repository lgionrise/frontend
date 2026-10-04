"use client";

import { useEffect, useRef, useState } from "react";
import {
  LoaderCircle,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalTrack,
} from "agora-rtc-sdk-ng";

import { apiRequest, type ApiRecord } from "@/lib/api";
import type { PortalRole } from "@/lib/navigation";

type AgoraCredentials = {
  app_id: string;
  channel_name: string;
  token: string;
  uid: string | number;
  role: string;
};

type Props = {
  role: PortalRole;
  classId: string;
  credentials: ApiRecord;
  onClose: () => void;
  onError: (message: string) => void;
};

function asCredentials(value: ApiRecord): AgoraCredentials | null {
  if (
    typeof value.app_id !== "string" ||
    typeof value.channel_name !== "string" ||
    typeof value.token !== "string" ||
    (typeof value.uid !== "string" && typeof value.uid !== "number") ||
    typeof value.role !== "string"
  ) {
    return null;
  }

  return {
    app_id: value.app_id,
    channel_name: value.channel_name,
    token: value.token,
    uid: value.uid,
    role: value.role,
  };
}

export function AgoraClassroom({
  role,
  classId,
  credentials,
  onClose,
  onError,
}: Props) {
  const localVideo = useRef<HTMLDivElement>(null);
  const remoteVideo = useRef<HTMLDivElement>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<ILocalTrack[]>([]);
  const remoteUsersRef = useRef<Set<string | number>>(new Set());

  const [status, setStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");

  const [statusMessage, setStatusMessage] = useState(
    "Connecting to live class…",
  );

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const token = asCredentials(credentials);

  const appId = token?.app_id;
  const channelName = token?.channel_name;
  const accessToken = token?.token;
  const uid = token?.uid;
  const rtcRole = token?.role;

  useEffect(() => {
    let mounted = true;
    let client: IAgoraRTCClient | null = null;
    let localTracks: ILocalTrack[] = [];

    async function connect() {
      if (
        !appId ||
        !channelName ||
        !accessToken ||
        uid === undefined ||
        !rtcRole
      ) {
        throw new Error(
          "The backend did not return valid Agora RTC credentials.",
        );
      }

      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

      if (!mounted) return;

      AgoraRTC.setLogLevel(1);

      client = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      clientRef.current = client;

      client.on("connection-state-change", (curState, prevState, reason) => {
        if (!mounted) return;

        if (curState === "CONNECTED") {
          setStatus("connected");
          setStatusMessage("Connected to live class.");
          return;
        }

        if (curState === "RECONNECTING") {
          setStatus("connecting");
          setStatusMessage("Reconnecting to live class…");
          return;
        }

        if (curState === "DISCONNECTED") {
          setStatus("error");
          setStatusMessage(
            `Connection lost${reason ? `: ${reason}` : "."}`,
          );
        }
      });

      client.on(
        "user-published",
        async (
          user: IAgoraRTCRemoteUser,
          mediaType: "audio" | "video",
        ) => {
          if (!client || !mounted) return;

          try {
            await client.subscribe(user, mediaType);

            if (!mounted) return;

            remoteUsersRef.current.add(user.uid);

            if (mediaType === "video") {
              if (!remoteVideo.current) return;

              user.videoTrack?.play(remoteVideo.current);
            }

            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
          } catch (reason) {
            const message =
              reason instanceof Error
                ? reason.message
                : "Could not receive the teacher's live media.";

            if (mounted) {
              onError(message);
            }
          }
        },
      );

      client.on(
        "user-unpublished",
        (user: IAgoraRTCRemoteUser, mediaType) => {
          if (mediaType === "video") {
            user.videoTrack?.stop();

            if (remoteVideo.current) {
              remoteVideo.current.innerHTML = "";
            }
          }
        },
      );

      client.on("user-left", (user) => {
        remoteUsersRef.current.delete(user.uid);

        if (remoteVideo.current) {
          remoteVideo.current.innerHTML = "";
        }
      });

      await client.join(
        appId,
        channelName,
        accessToken,
        uid,
      );

      if (!mounted) return;

      if (rtcRole === "publisher") {
        try {
          localTracks =
            await AgoraRTC.createMicrophoneAndCameraTracks();

          if (!mounted) {
            localTracks.forEach((track) => {
              track.stop();
              track.close();
            });
            return;
          }

          localTracksRef.current = localTracks;

          const camera = localTracks.find(
            (track) => track.trackMediaType === "video",
          );

          if (camera && localVideo.current) {
            camera.play(localVideo.current);
          }

          await client.publish(localTracks);
        } catch (reason) {
          throw new Error(
            reason instanceof Error
              ? `Camera/microphone could not start: ${reason.message}`
              : "Camera/microphone permission is required.",
          );
        }
      }

      if (mounted) {
        setStatus("connected");
        setStatusMessage(
          rtcRole === "publisher"
            ? "You are live."
            : "Connected. Waiting for teacher video…",
        );
      }
    }

    void connect().catch((reason) => {
      if (!mounted) return;

      const message =
        reason instanceof Error
          ? reason.message
          : "The live classroom could not be started.";

      setStatus("error");
      setStatusMessage(message);
      onError(message);
    });

    return () => {
      mounted = false;

      for (const track of localTracks) {
        try {
          track.stop();
          track.close();
        } catch {
          // Ignore cleanup errors.
        }
      }

      localTracksRef.current = [];

      const connectedClient = client;

      clientRef.current = null;

      if (connectedClient) {
        void connectedClient.leave().catch(() => {
          // Ignore cleanup disconnect errors.
        });
      }
    };
  }, [
    accessToken,
    appId,
    channelName,
    onError,
    rtcRole,
    uid,
  ]);

  async function leaveClass() {
    if (role === "student") {
      try {
        await apiRequest(
          `/live-classes/${classId}/leave/`,
          {
            method: "POST",
            body: "{}",
          },
        );
      } catch (reason) {
        onError(
          reason instanceof Error
            ? reason.message
            : "Could not save attendance when leaving.",
        );
        return;
      }
    }

    onClose();
  }

  async function toggleMicrophone() {
    const microphone = localTracksRef.current.find(
      (track) => track.trackMediaType === "audio",
    );

    if (!microphone) return;

    try {
      const nextEnabled = muted;

      await microphone.setEnabled(nextEnabled);

      setMuted(!nextEnabled);
    } catch (reason) {
      onError(
        reason instanceof Error
          ? reason.message
          : "Could not change microphone state.",
      );
    }
  }

  async function toggleCamera() {
    const camera = localTracksRef.current.find(
      (track) => track.trackMediaType === "video",
    );

    if (!camera) return;

    try {
      const nextEnabled = cameraOff;

      await camera.setEnabled(nextEnabled);

      setCameraOff(!nextEnabled);
    } catch (reason) {
      onError(
        reason instanceof Error
          ? reason.message
          : "Could not change camera state.",
      );
    }
  }

  const isPublisher = rtcRole === "publisher";

  return (
    <section
      className="agora-classroom"
      aria-label="Live classroom"
    >
      <div className="agora-classroom-heading">
        <div>
          <span
            className={`class-live-indicator ${status}`}
          />

          {statusMessage}
        </div>

        {status === "connecting" && (
          <LoaderCircle
            size={16}
            className="spin"
          />
        )}
      </div>

      <div className="agora-video-grid">
        {isPublisher && (
          <div className="agora-video-tile">
            <div
              ref={localVideo}
              className="agora-video-player"
            />

            <span>
              You · camera and microphone
            </span>
          </div>
        )}

        <div className="agora-video-tile">
          <div
            ref={remoteVideo}
            className="agora-video-player"
          />

          <span>
            {isPublisher
              ? "Students"
              : "Teacher"}
          </span>
        </div>
      </div>

      <div className="agora-controls">
        {isPublisher && (
          <>
            <button
              className="button button-light"
              type="button"
              onClick={() => void toggleMicrophone()}
              disabled={status !== "connected"}
            >
              {muted ? (
                <MicOff size={15} />
              ) : (
                <Mic size={15} />
              )}

              {muted ? "Unmute" : "Mute"}
            </button>

            <button
              className="button button-light"
              type="button"
              onClick={() => void toggleCamera()}
              disabled={status !== "connected"}
            >
              {cameraOff ? (
                <VideoOff size={15} />
              ) : (
                <Video size={15} />
              )}

              {cameraOff
                ? "Camera on"
                : "Camera off"}
            </button>
          </>
        )}

        <button
          className="button button-danger"
          type="button"
          onClick={() => void leaveClass()}
        >
          <PhoneOff size={15} />
          Leave class
        </button>
      </div>
    </section>
  );
}
