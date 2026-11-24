// GTA 6 — Pages worker (advanced mode, lives INSIDE the gta6-nft Pages project).
// Serves /metadata/<id>.json dynamically for token ids 1..15555 (Sealed state),
// so no 15,555 individual JSON files need to be uploaded.
// Everything else falls through to the static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/metadata\/(\d+)\.json$/);
    if (m) {
      const id = parseInt(m[1], 10);
      if (id >= 1 && id <= 15555) {
        const body = JSON.stringify({
          name: "GTA 6 #" + id,
          description: "A sealed GTA 6 - Leonida Trading Card. Reveal it at gta6-nft.pages.dev to discover its design and tier. One of 15,555 collectible cards across 1,481 designs and 7 metal tiers: Silver, Chrome, Mercury, Platinum, Gold, Molten and Sovereign.",
          image: "https://gta6-nft.pages.dev/assets/card-vice-skyline.webp",
          attributes: [
            { trait_type: "State", value: "Sealed" },
            { trait_type: "Collection", value: "GTA 6 - Leonida Trading Cards" }
          ]
        });
        return new Response(body, {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=60"
          }
        });
      }
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
