const form = document.getElementById("support-form");
const messageInput = document.getElementById("message");
const submitButton = document.getElementById("submit-button");
const statusText = document.getElementById("status");

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = type || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) {
    setStatus("메시지를 입력해 주세요.", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("전송 중입니다...", "");

  try {
    const response = await fetch("/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = payload?.message || "전송에 실패했습니다.";
      setStatus(errorMessage, "error");
      return;
    }

    messageInput.value = "";
    setStatus("문의가 접수되었습니다. 감사합니다.", "success");
  } catch (error) {
    setStatus("네트워크 오류가 발생했습니다.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
