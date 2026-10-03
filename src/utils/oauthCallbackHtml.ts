function escapeScriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function createOAuthCallbackHtml(session: unknown, redirectPath: string) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex,nofollow" />
    <title>SEND OAuth</title>
  </head>
  <body>
    <script>
      try {
        window.localStorage.setItem("send.authSession", JSON.stringify(${escapeScriptJson(session)}));
      } catch (error) {}
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "send.authSession",
          session: ${escapeScriptJson(session)}
        }));
      }
      window.location.replace(${escapeScriptJson(redirectPath)});
    </script>
  </body>
</html>`;
}

export { createOAuthCallbackHtml };
