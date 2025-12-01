let ws;
let pc;
let localStream;
let roomName = "";

let audioEnabled = true;
let videoEnabled = true;

async function init() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch {
    document.getElementById("error").innerText = "Camera and microphone are required.";
    return;
  }
}

init();

document.getElementById("joinBtn").onclick = () => {
  const input = document.getElementById("roomInput").value.trim();
  if (!input) return alert("Enter a valid room name.");

  roomName = input;

  ws = new WebSocket("ws://" + window.location.host);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room: roomName }));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "room_full") return alert("Room is full.");

    if (data.type === "joined") setupRTC();

    if (data.type === "ready") makeOffer();

    if (data.type === "signal") {
      if (data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "signal", room: roomName, answer }));
      }

      if (data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.ice) pc.addIceCandidate(data.ice);
    }
  };
};

function setupRTC() {
  pc = new RTCPeerConnection();

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.ontrack = (e) => {
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(JSON.stringify({ type: "signal", room: roomName, ice: e.candidate }));
    }
  };

  document.getElementById("localVideo").srcObject = localStream;
  document.getElementById("chat-screen").classList.remove("hidden");
}

async function makeOffer() {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: "signal", room: roomName, offer }));
}

document.getElementById("mute-btn").onclick = () => {
  audioEnabled = !audioEnabled;
  localStream.getAudioTracks()[0].enabled = audioEnabled;
  document.getElementById("mute-btn").innerText = audioEnabled ? "Mute" : "Unmute";
};

document.getElementById("camera-btn").onclick = () => {
  videoEnabled = !videoEnabled;
  localStream.getVideoTracks()[0].enabled = videoEnabled;
  document.getElementById("camera-btn").innerText = videoEnabled ? "Camera Off" : "Camera On";
};
