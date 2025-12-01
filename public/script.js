const socket = io();
const room = "default-room";

let localStream;
let peer;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const muteBtn = document.getElementById("muteBtn");
const camBtn = document.getElementById("camBtn");

let audioEnabled = true;
let videoEnabled = true;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;

    socket.emit("join", room);
})
.catch(err => console.error("Error:", err));

socket.on("joined", () => {
    startCall(true);
});

socket.on("signal", async data => {
    if (!peer) startCall(false);
    await peer.setRemoteDescription(new RTCSessionDescription(data));

    if (data.type === "offer") {
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal", { room, signal: answer });
    }
});

function startCall(isCaller) {
    peer = new RTCPeerConnection();

    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

    peer.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    if (isCaller) {
        peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);
            socket.emit("signal", { room, signal: offer });
        });
    }
}

muteBtn.onclick = () => {
    audioEnabled = !audioEnabled;
    localStream.getAudioTracks()[0].enabled = audioEnabled;
    muteBtn.textContent = audioEnabled ? "Mute" : "Unmute";
};

camBtn.onclick = () => {
    videoEnabled = !videoEnabled;
    localStream.getVideoTracks()[0].enabled = videoEnabled;
    camBtn.textContent = videoEnabled ? "Camera Off" : "Camera On";
};
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
