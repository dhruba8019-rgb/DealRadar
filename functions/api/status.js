export async function onRequestGet() {
  return new Response(JSON.stringify({
    ok: true,
    service: "DealRadar API",
    mode: "setup",
    message: "Backend prepared. Live product prices are not connected yet."
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
