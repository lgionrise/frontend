"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalTrack } from "agora-rtc-sdk-ng";
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
    typeof value.app_id === "string" &&
    typeof value.channel_name === "string" &&
    typeof value.token === "string" &&
    (typeof value.uid === "string" || typeof value.uid === "number") &&
    typeof value.role === "string"
  ) {
    return {
      app_id: value.app_id,
      channel_name: value.channel_name,
      token: value.token,
      uid: value.uid,
      role: value.role,
    };
  }
  return null;
}

export function AgoraClassroom({ role, classId, credentials, onClose, onError }: Props) {
  const localVideo = useRef<HTMLDivElement>(null);
  const remoteVideo = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<ILocalTrack[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
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
      if (!appId || !channelName || !accessToken || uid === undefined || !rtcRole) {
        throw new Error("The backend did not return valid Agora connection credentials.");
      }

      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
      if (!mounted) return;
      client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
        if (!client) return;
        try {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && remoteVideo.current) user.videoTrack?.play(remoteVideo.current);
          if (mediaType === "audio") user.audioTrack?.play();
        } catch (reason) {
          onError(reason instanceof Error ? reason.message : "Could not subscribe to the teacher's live media.");
        }
      });
      client.on("user-unpublished", user => user.videoTrack?.stop());

      await client.join(appId, channelName, accessToken, uid);
      if (!mounted) return;

      if (rtcRole === "publisher") {
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = localTracks;
        await client.publish(localTracks);
        if (mounted && localVideo.current) {
          const camera = localTracks.find(track => track.trackMediaType === "video");
          camera?.play(localVideo.current);
        }
      }
      if (mounted) setStatus("connected");
    }

    void connect().catch(reason => {
      if (!mounted) return;
      const message = reason instanceof Error ? reason.message : "The live classroom could not be started.";
      setStatus("error");
      onError(message);
    });

    return () => {
      mounted = false;
      for (const track of localTracks) {
        track.stop();
        track.close();
      }
      localTracksRef.current = [];
      const connectedClient = client;
      clientRef.current = null;
      if (connectedClient) void connectedClient.leave().catch(reason => {
        onError(reason instanceof Error ? reason.message : "Could not disconnect from the live classroom.");
      });
    };
  }, [accessToken, appId, channelName, onError, rtcRole, uid]);

  async function leaveClass() {
    if (role === "student") {
      try {
        await apiRequest(`/live-classes/${classId}/leave/`, { method: "POST", body: "{}" });
      } catch (reason) {
        onError(reason instanceof Error ? reason.message : "Could not save your class attendance when leaving.");
        return;
      }
    }
    onClose();
  }

  async function toggleMicrophone() {
    const microphone = localTracksRef.current.find(track => track.trackMediaType === "audio");
    if (!microphone) return;
    try {
      await microphone.setEnabled(muted);
      setMuted(!muted);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not change your microphone state.");
    }
  }

  async function toggleCamera() {
    const camera = localTracksRef.current.find(track => track.trackMediaType === "video");
    if (!camera) return;
    try {
      await camera.setEnabled(cameraOff);
      setCameraOff(!cameraOff);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not change your camera state.");
    }
  }

  return <section className="agora-classroom" aria-label="Live classroom">
    <div className="agora-classroom-heading">
      <div><span className={`class-live-indicator ${status}`} />{status === "connecting" ? "Connecting to class…" : status === "connected" ? "Connected to live class" : "Connection needs attention"}</div>
      {status === "connecting" && <LoaderCircle size={16} className="spin" />}
    </div>
    <div className="agora-video-grid">
      {token?.role === "publisher" && <div className="agora-video-tile"><div ref={localVideo} className="agora-video-player" /><span>You · camera and microphone</span></div>}
      <div className="agora-video-tile"><div ref={remoteVideo} className="agora-video-player" /><span>{token?.role === "publisher" ? "Students" : "Teacher"}</span></div>
    </div>
    <div className="agora-controls">
      {token?.role === "publisher" && <><button className="button button-light" type="button" onClick={() => void toggleMicrophone()} disabled={status !== "connected"}>{muted ? <MicOff size={15} /> : <Mic size={15} />}{muted ? "Unmute" : "Mute"}</button><button className="button button-light" type="button" onClick={() => void toggleCamera()} disabled={status !== "connected"}>{cameraOff ? <VideoOff size={15} /> : <Video size={15} />}{cameraOff ? "Camera on" : "Camera off"}</button></>}
      <button className="button button-danger" type="button" onClick={() => void leaveClass()}><PhoneOff size={15} />Leave class</button>
    </div>
  </section>;
}
