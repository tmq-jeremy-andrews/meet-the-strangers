const express = require("express");
const http = require("http");
const { isObject } = require("util");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const socketio = require("socket.io")(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let connectedPeers = [];
let connectedPeersStrangers = [];

socketio.on("connection", (socket) => {
  connectedPeers.push(socket.id);

  socket.on("pre-offer", (data) => {
    const connectedPeer = connectedPeers.find((peerSocketId) => {
      return peerSocketId === data.receiverCode;
    });

    if (connectedPeer) {
      const emitData = {
        callerSocketId: socket.id,
        callType: data.callType,
      };

      socketio.to(data.receiverCode).emit("pre-offer", emitData);
    } else {
      const data = {
        // FIXME Rather janky implementation of not using constants for
        // this. Might result in this getting forgotten about when the
        // values for the constants gets changed in the future.
        preOfferAnswer: "RECEIVER_NOT_FOUND",
      };
      socketio.to(socket.id).emit("pre-offer-answer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === data.callerSocketId
    );

    if (connectedPeer) {
      socketio.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });

  socket.on("webRTC-signalling", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      socketio.to(connectedUserSocketId).emit("webRTC-signalling", data);
    }
  });

  socket.on("disconnect", () => {
    const newConnectedPeers = connectedPeers.filter((peerSocketId) => {
      return peerSocketId !== socket.id;
    });

    connectedPeers = newConnectedPeers;
    removeFromStrangerPool(socket.id);
  });

  socket.on("user-hanged-up", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      socketio.to(connectedUserSocketId).emit("user-hanged-up");
    }
  });

  socket.on("stranger-connection-status", (data) => {
    const { status } = data;
    if (status) {
      connectedPeersStrangers.push(socket.id);
    } else {
      removeFromStrangerPool(socket.id);
    }
  });

  socket.on("get-stranger-socket-id", () => {
    let randomStrangerSocketId;

    // Removes caller's own socket Id from the selection
    const filteredStrangers = connectedPeersStrangers.filter(
      (peerSocketId) => peerSocketId !== socket.id
    );

    if (filteredStrangers.length > 0) {
      randomStrangerSocketId =
        filteredStrangers[Math.floor(Math.random() * filteredStrangers.length)];
    } else {
      randomStrangerSocketId = null;
    }

    const data = {
      strangerSocketId: randomStrangerSocketId,
    };

    socketio.to(socket.id).emit("stranger-socket-id", data);
  });
});

const removeFromStrangerPool = (socketID) => {
  const newConnectedPeersStrangers = connectedPeersStrangers.filter(
    (peerSocketId) => peerSocketId !== socketID
  );

  connectedPeersStrangers = newConnectedPeersStrangers;
};

server.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
