import * as store from "./store.js";
import * as constants from "./constants.js";
import * as wss from "./wss.js";
import * as webRTCHandler from "./webRTCHandler.js";

// Initializtion of socketIO connection
const socket = io("/");
wss.registerSocketEvents(socket);

// Shows local video preview
webRTCHandler.getLocalPreview();

// Registers event for personal code copy button
const personalCodeCopyButton = document.getElementById(
  "personal_code_copy_button"
);
personalCodeCopyButton.addEventListener("click", () => {
  const personalCode = store.getState().socketId;
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
  //alert("Your perosnal code has been copied to the clipboard!");
});

// Registers event listeners for connection buttons
const personalCodeChatButton = document.getElementById(
  "personal_code_chat_button"
);

const personalCodeVideoButton = document.getElementById(
  "personal_code_video_button"
);

const personalCodeInput = document.getElementById("personal_code_input");

personalCodeChatButton.addEventListener("click", () => {
  webRTCHandler.sendPreOffer(
    constants.callType.CHAT_PERSONAL_CODE,
    personalCodeInput.value
  );
});

personalCodeVideoButton.addEventListener("click", () => {
  webRTCHandler.sendPreOffer(
    constants.callType.VIDEO_PERSONAL_CODE,
    personalCodeInput.value
  );
});
