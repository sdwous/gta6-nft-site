/* GTA 6 — Leonida Trading Cards · site logic.
   All contract addresses come from config.js (window.GTA6_CONFIG) only.
   On-chain state is derived exclusively from authoritative eth_call probes
   (Multicall3 aggregate3, chunked) — this site never scans event logs. */
(function () {
  "use strict";
  const CFG = window.GTA6_CONFIG;
  const ZERO = "0x0000000000000000000000000000000000000000";
  const DEPLOYED = CFG.nftAddress !== ZERO && CFG.marketAddress !== ZERO;
  const NAMES = window.GTA6_DESIGN_NAMES || {};
  const DTier = window.GTA6_DESIGN_TIERS || {};

  const TIERS = [
    { name: "Silver",    level: 1, designs: 400, per: 17, total: 6800,  file: "img/338.webp",  showcase: "Amber Tavern" },
    { name: "Chrome",    level: 2, designs: 300, per: 14, total: 4200,  file: "img/658.webp",  showcase: "Jade Arcade" },
    { name: "Mercury",   level: 3, designs: 300, per: 9,  total: 2700,  file: "img/920.webp",  showcase: "Silver Tarpon" },
    { name: "Platinum",  level: 4, designs: 250, per: 5,  total: 1250,  file: "img/1004.webp", showcase: "Palmetto Grand Theater" },
    { name: "Gold",      level: 5, designs: 150, per: 3,  total: 450,   file: "img/1251.webp", showcase: "Sovereign Sands Resort" },
    { name: "Molten",    level: 6, designs: 74,  per: 2,  total: 148,   file: "img/1468.webp", showcase: "Dre'Quan Priest" },
    { name: "Sovereign", level: 7, designs: 7,   per: 1,  total: 7,     file: "img/1475.webp", showcase: "Jason Duval" },
  ];
  const GALLERY = [
    { name: "Lucia Caminos", tier: "Sovereign", file: "img/1476.webp", note: "1 print — 1-of-1" },
    { name: "Vice Beach Panorama", tier: "Sovereign", file: "img/1481.webp", note: "1 print — 1-of-1" },
    { name: "Sapphire Skybar", tier: "Molten", file: "img/1408.webp", note: "2 prints per design" },
    { name: "Breakwater Lighthouse", tier: "Molten", file: "img/1422.webp", note: "2 prints per design" },
    { name: "Cyclone GT Supercar", tier: "Gold", file: "img/1320.webp", note: "3 prints per design" },
    { name: "Boobie Ike", tier: "Gold", file: "img/1385.webp", note: "3 prints per design" },
    { name: "Lori Heder", tier: "Platinum", file: "img/1240.webp", note: "5 prints per design" },
    { name: "Everglades Gator", tier: "Platinum", file: "img/1165.webp", note: "5 prints per design" },
    { name: "Jetmax Powerboat", tier: "Platinum", file: "img/1150.webp", note: "5 prints per design" },
    { name: "Reef Reaper Jetski", tier: "Mercury", file: "img/876.webp", note: "9 prints per design" },
    { name: "Diamond Ring", tier: "Mercury", file: "img/948.webp", note: "9 prints per design" },
    { name: "Vintage Woody Wagon", tier: "Chrome", file: "img/544.webp", note: "14 prints per design" },
    { name: "Marsh Rabbit", tier: "Chrome", file: "img/592.webp", note: "14 prints per design" },
    { name: "Sandy Hostel", tier: "Silver", file: "img/57.webp", note: "17 prints per design" },
    { name: "Cinder Diner", tier: "Silver", file: "img/362.webp", note: "17 prints per design" },
  ];
  const FAQS = [
    ["What is GTA 6 — Leonida Trading Cards?",
     "An original NFT trading-card collection on BNB Chain: 15,555 cards across 1,481 unique designs covering all of Leonida — its characters, vehicles, locations, wildlife and items — in seven metal tiers, from matte Silver commons to one-of-one full-art Sovereign foils. Every card is full-art with its own stat line and a one-line story printed over the artwork. It is a fan-made collectible project, not affiliated with Rockstar Games or Take-Two Interactive."],
    ["Who can mint?",
     "Only wallets holding a Binance Agent ID. The NFT contract checks your Agent ID status on-chain when you mint — no Agent ID, no mint."],
    ["How does minting work?",
     "Every mint is a random pull (gacha): you cannot choose the design or tier. What you pull is decided by the print runs still remaining. Each wallet may mint up to 33 cards: the 1st is free, mints 2–9 cost 0.0002 BNB, 10–17 cost 0.00025 BNB, 18–25 cost 0.0003 BNB and 26–33 cost 0.00035 BNB — 0.0088 BNB for a full quota."],
    ["What are the seven tiers?",
     "Silver (400 designs × 17 prints), Chrome (300 × 14), Mercury (300 × 9), Platinum (250 × 5), Gold (150 × 3), Molten (74 × 2) and Sovereign (7 designs × 1 print). Scarcity lives at the design level: a Sovereign design exists exactly once, forever."],
    ["Is there a GTA 6 token?",
     "No. There is no companion token, no staking and no claim attached to these cards. They are pure collectibles — value comes from scarcity and the built-in marketplace."],
    ["How does the marketplace work?",
     "The market is a separate on-chain contract built into this site. Sellers set prices in BNB or USDT. Listing costs a flat 0.00025 BNB fee, delisting costs 0.00025 BNB, and a 5% royalty is taken on every sale. Cards are held in escrow by the market contract while listed."],
    ["What makes Sovereign special?",
     "There are only seven Sovereign designs and each is printed exactly once — seven 1-of-1 cards in the entire 15,555-card collection. When one is gone from the mint, it can only ever change hands on the market."],
  ];

  /* ABIs reconciled against the deployed contracts' artifacts
     (~/workspace/gta6-nft/contracts/artifacts) on 2026-11-24:
     mint takes a quantity, designs come from designOf (0-based
     catalog index; 1481 = still sealed), there is no tierMinted
     and no cardOf on the NFT, and the market fee getter is the
     constant ACTION_FEE(). */
  const NFT_ABI = [
    "function totalMinted() view returns (uint256)",
    "function mintedBy(address) view returns (uint256)",
    "function hasAgentId(address) view returns (bool)",
    "function mintOpen() view returns (bool)",
    "function quote(address,uint256) view returns (uint256)",
    "function mintableBy(address) view returns (uint256)",
    "function tierOf(uint256) view returns (uint8)",
    "function designOf(uint256) view returns (uint256)",
    "function isRevealed(uint256) view returns (bool)",
    "function designMinted(uint256) view returns (uint256)",
    "function tokensOfOwner(address) view returns (uint256[])",
    "function revealReady() view returns (bool)",
    "function nextRevealBatch() view returns (uint256)",
    "function batchCount() view returns (uint256)",
    "function batch(uint256) view returns (address minter, uint32 firstId, uint16 qty, uint40 targetBlock, bool revealed)",
    "function balanceOf(address) view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function tokenURI(uint256) view returns (string)",
    "function mint(uint256) payable",
    "function revealPending(uint256) returns (uint256,uint256)",
    "function approve(address,uint256)",
    "function getApproved(uint256) view returns (address)",
    "function setApprovalForAll(address,bool)",
    "function isApprovedForAll(address,address) view returns (bool)",
  ];
  const MARKET_ABI = [
    "function listings(uint256) view returns (address seller, uint256 price, uint8 currency)",
    "function totalSales() view returns (uint256)",
    "function ACTION_FEE() view returns (uint256)",
    "function list(uint256,uint256,uint8) payable",
    "function delist(uint256) payable",
    "function buy(uint256) payable",
  ];
  const ERC20_ABI = [
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
  ];
  const MULTICALL = "0xcA11bde05977b3631167028862bE2a173976CA11";
  const MC_ABI = ["function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])"];

  const $ = (id) => document.getElementById(id);
  const rpcList = CFG.rpcUrls && CFG.rpcUrls.length ? CFG.rpcUrls : [CFG.rpcUrl];
  const readProvider = new ethers.FallbackProvider(
    rpcList.map((u) => new ethers.JsonRpcProvider(u, CFG.chainId, { batchMaxCount: 10, staticNetwork: true })),
    CFG.chainId, { quorum: 1 }
  );
  const nftRead = DEPLOYED ? new ethers.Contract(CFG.nftAddress, NFT_ABI, readProvider) : null;
  const marketRead = DEPLOYED ? new ethers.Contract(CFG.marketAddress, MARKET_ABI, readProvider) : null;
  const mc = DEPLOYED ? new ethers.Contract(MULTICALL, MC_ABI, readProvider) : null;
  // Seeded from config; refreshed from the market's ACTION_FEE() constant
  // on every stats read so the site can never drift from the contract.
  let actionFeeWei = ethers.parseEther(CFG.actionFeeBNB);
  const UNREVEALED = 1481; // designOf() sentinel while a token is sealed
  const NOT_READY_SEL = ethers.id("NotReady()").slice(0, 10); // NFT custom error: reveal attempted too early
  // Design-index ranges per tier (catalog order, 0-based) — mirrors the NFT.
  const TIER_RANGES = [[0, 399], [400, 699], [700, 999], [1000, 1249], [1250, 1399], [1400, 1473], [1474, 1480]];

  let account = null, signer = null, nftWrite = null, marketWrite = null;
  let chainOk = false; // true only while the wallet sits on BNB Smart Chain
  let myMintCount = 0, myMintable = 0, mintIsOpen = false;
  let totalMintedCache = 0, totalSalesCache = 0;
  let listingsCache = []; // {id, seller, price(BigInt), currency(0 BNB | 1 USDT), tier, design}
  let myTokens = [], myListings = [];
  let tierFilter = "All", actFilter = "all";

  const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
  function fmtUnits(wei, dec) {
    const s = ethers.formatUnits(wei, dec);
    return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  }
  const fmtBNB = (wei) => fmtUnits(wei, 18);
  function priceText(l) {
    return l.currency === 1 ? fmtUnits(l.price, 18) + " USDT" : fmtBNB(l.price) + " BNB";
  }
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3400);
  }
  function setStatus(id, msg, isErr) {
    const el = $(id); if (!el) return;
    el.textContent = msg || ""; el.className = "status" + (isErr ? " err" : "");
  }
  function errText(e) {
    if (!e) return "Unknown error";
    return e.shortMessage || e.reason || (e.message || String(e)).slice(0, 220);
  }
  async function sendTx(id, label, fn) {
    try {
      setStatus(id, label + ": transaction sent, waiting for confirmation…");
      const tx = await fn(); await tx.wait();
      setStatus(id, label + ": confirmed ✓");
      return true;
    } catch (e) { setStatus(id, label + " failed: " + errText(e), true); return false; }
  }
  function guardChain() {
    if (chainOk) return true;
    toast("Wrong network — switch your wallet to BNB Smart Chain first.");
    return false;
  }
  function tierName(idx) { if (idx === 255) return "Sealed"; return TIERS[idx] ? TIERS[idx].name : "Unknown"; }
  function designName(designNo) { return NAMES[designNo] || ("Design #" + designNo); }
  function cardName(l) { return l && l.sealed ? "Sealed Card" : designName(l ? l.design : 0); }

  /* ── price ladder (locked spec) ─────────────────────────── */
  function priceForNext(count) { // count = cards this wallet already minted
    if (count >= CFG.maxPerWallet) return null;
    if (count === 0) return 0n;
    if (count <= 8) return ethers.parseEther("0.0002");
    if (count <= 16) return ethers.parseEther("0.00025");
    if (count <= 24) return ethers.parseEther("0.0003");
    return ethers.parseEther("0.00035");
  }
  function rungOf(count) {
    if (count >= CFG.maxPerWallet) return -1;
    if (count === 0) return 0; if (count <= 8) return 1; if (count <= 16) return 2;
    if (count <= 24) return 3; return 4;
  }

  /* ── navigation (tab views, mirroring the reference app) ── */
  const VIEWS = ["mint", "market", "activity", "my", "agent"];
  function show(view) {
    VIEWS.forEach((v) => { $("v-" + v).hidden = v !== view; });
    document.querySelectorAll("nav.tabs .tab").forEach((b) => {
      const on = b.dataset.nav === view;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "market") refreshMarket(false);
    if (view === "my") refreshMine();
    if (view === "activity") renderActivity();
    if (view === "agent") refreshAgent();
  }
  document.querySelectorAll("[data-nav]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); show(el.dataset.nav); }));

  /* ── static paint (renders instantly, before any chain read) ── */
  function paintStatic() {
    $("tierCards").innerHTML = TIERS.map((t) => `
      <div class="tier">
        <img src="${t.file}" alt="${t.name} tier showcase card — ${t.showcase}" loading="lazy">
        <div class="body"><span class="chip ${t.name}">${t.name} · Lv ${t.level}</span>
          <p style="margin-top:7px"><b>${t.showcase}</b><br>${t.designs} designs × ${t.per} prints<br>${t.total.toLocaleString("en-US")} cards</p>
        </div>
      </div>`).join("");
    $("tierRows").innerHTML = TIERS.map((t, i) => `
      <tr><td><span class="chip ${t.name}">${t.name}</span></td><td>${t.level}</td><td>${t.designs}</td>
      <td>${t.per}</td><td>${t.total.toLocaleString("en-US")}</td><td id="tm-${i}">—</td></tr>`).join("") +
      `<tr><td>Total</td><td></td><td>1,481</td><td></td><td>15,555</td><td id="tm-all">—</td></tr>`;
    $("galleryGrid").innerHTML = GALLERY.map((g) => `
      <div class="card"><img src="${g.file}" alt="${g.name} — ${g.tier}" loading="lazy">
        <div class="body"><b>${g.name}</b><p>${g.note}</p>
        <div class="row"><span class="chip ${g.tier}">${g.tier}</span></div></div></div>`).join("");
    $("faqList").innerHTML = FAQS.map((f) => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("");
    $("chips").innerHTML = ["All"].concat(TIERS.map((t) => t.name)).map((n) =>
      `<button data-tier="${n}" class="${n === "All" ? "on" : ""}">${n}</button>`).join("");
    $("chips").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      tierFilter = b.dataset.tier;
      $("chips").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      renderMarket();
    }));
    $("afil").innerHTML = [["all", "All"], ["listings", "Live listings"], ["sales", "Sales"]]
      .map(([v, l]) => `<button data-a="${v}" class="${v === "all" ? "on" : ""}">${l}</button>`).join("");
    $("afil").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      actFilter = b.dataset.a;
      $("afil").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      renderActivity();
    }));
    if (!DEPLOYED) {
      const note = `<div class="notice">Pre-launch: the NFT and Market contracts are not deployed yet.
        Minting and trading activate the moment the contract addresses are published here — every price,
        quota and tier on this page is already final.</div>`;
      $("prelaunchMint").innerHTML = note; $("prelaunchMarket").innerHTML = note; $("prelaunchMy").innerHTML = note;
      $("lgrid").innerHTML = `<div class="empty">The market opens at launch.</div>`;
      $("mgrid").innerHTML = `<div class="empty">Connect a wallet after launch to see your cards.</div>`;
      $("mlist").innerHTML = `<div class="empty">Nothing listed yet.</div>`;
    }
  }

  /* ── wallet ─────────────────────────────────────────────── */
  async function attachWallet(accounts) {
    if (!accounts || !accounts.length) return;
    const bp = new ethers.BrowserProvider(window.ethereum);
    const net = await bp.getNetwork();
    chainOk = Number(net.chainId) === CFG.chainId;
    if (!chainOk) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + CFG.chainId.toString(16) }] });
      } catch (_) { /* user declined the switch; reads still work, writes stay blocked */ }
      const net2 = await bp.getNetwork().catch(() => null);
      chainOk = !!net2 && Number(net2.chainId) === CFG.chainId;
      if (!chainOk)
        toast("Your wallet is not on BNB Smart Chain — switch networks to mint or trade.");
    }
    signer = await bp.getSigner();
    account = await signer.getAddress();
    localStorage.setItem("gta6-wallet", "1");
    $("waddr").textContent = short(account);
    $("connectBtn").textContent = "Connected";
    if (DEPLOYED) {
      nftWrite = new ethers.Contract(CFG.nftAddress, NFT_ABI, signer);
      marketWrite = new ethers.Contract(CFG.marketAddress, MARKET_ABI, signer);
    }
    refreshMintPanel(); refreshAgent();
    if (!$("v-my").hidden) refreshMine();
  }
  async function connect() {
    if (!window.ethereum) { toast("No wallet found — install a BNB Chain wallet (e.g. MetaMask or Binance Wallet)."); return; }
    try { attachWallet(await window.ethereum.request({ method: "eth_requestAccounts" })); }
    catch (e) { toast("Connection rejected."); }
  }
  async function silentReconnect() {
    if (!window.ethereum || localStorage.getItem("gta6-wallet") !== "1") return;
    try {
      const accs = await window.ethereum.request({ method: "eth_accounts" });
      if (accs && accs.length) attachWallet(accs);
    } catch (_) {}
  }
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on("accountsChanged", (a) => {
      if (a && a.length) attachWallet(a);
      else { localStorage.removeItem("gta6-wallet"); location.reload(); } // wallet disconnected/locked
    });
    window.ethereum.on("chainChanged", () => location.reload());
  }
  $("connectBtn").addEventListener("click", connect);

  /* ── chain probes: mint stats (small direct eth_call batch) ── */
  async function refreshStats() {
    if (!DEPLOYED) return;
    try {
      const tm = await nftRead.totalMinted();
      totalMintedCache = Number(tm);
      $("st-minted").textContent = totalMintedCache.toLocaleString("en-US");
      $("tm-all").textContent = totalMintedCache.toLocaleString("en-US");
      const sales = await marketRead.totalSales().catch(() => null);
      if (sales !== null) { totalSalesCache = Number(sales); $("st-sales").textContent = totalSalesCache.toLocaleString("en-US"); }
      const fee = await marketRead.ACTION_FEE().catch(() => null);
      if (fee !== null) actionFeeWei = fee;
      sweepTierMinted();
    } catch (_) { /* RPC hiccup: painted spec values stay, next refresh retries */ }
  }

  /* Per-tier minted counts: the NFT has no tierMinted() getter, so the
     totals are summed from designMinted() over all 1,481 designs via
     aggregate3 (100 designs per eth_call), mapped to tiers by the
     catalog index ranges. Runs in the background after the headline
     stats — the table shows "—" until the sweep lands. */
  let tierSweepBusy = false;
  async function sweepTierMinted() {
    if (!DEPLOYED || tierSweepBusy) return;
    tierSweepBusy = true;
    try {
      const iface = new ethers.Interface(NFT_ABI);
      const sums = TIERS.map(() => 0);
      const CH = 100;
      for (let s = 0; s < 1481; s += CH) {
        const calls = [];
        for (let d = s; d < Math.min(s + CH, 1481); d++)
          calls.push({ target: CFG.nftAddress, data: iface.encodeFunctionData("designMinted", [d]) });
        let out;
        try { out = await aggCalls(calls); } catch (_) { return; }
        out.forEach((r, i) => {
          if (!r) return;
          let v;
          try { v = Number(iface.decodeFunctionResult("designMinted", r)[0]); } catch (_) { return; }
          const d = s + i;
          const t = TIER_RANGES.findIndex(([a, b]) => d >= a && d <= b);
          if (t >= 0) sums[t] += v;
        });
        sums.forEach((v, i) => { $("tm-" + i).textContent = v.toLocaleString("en-US"); });
      }
    } finally { tierSweepBusy = false; }
  }

  function clampQty() {
    const el = $("m-qty"); if (!el) return 1;
    let v = parseInt(el.value || "1", 10);
    if (isNaN(v) || v < 1) v = 1;
    let left = Math.max(1, CFG.maxPerWallet - myMintCount);
    // mintableBy() already folds in the remaining collection supply, so a
    // nearly sold-out collection clamps the quantity too (mint would revert).
    if (account && myMintable > 0) left = Math.max(1, Math.min(left, myMintable));
    if (v > left) v = left;
    if (String(v) !== el.value) el.value = String(v);
    return v;
  }
  async function updateMintCost() {
    if (!DEPLOYED || !account) return;
    const qty = clampQty();
    try {
      const q = await nftRead.quote(account, qty);
      $("m-cost").textContent = q === 0n ? "FREE" : fmtBNB(q) + " BNB";
    } catch (_) { /* keep last shown cost */ }
  }

  async function refreshMintPanel() {
    if (!DEPLOYED) { $("mintBtn").textContent = "Minting opens at launch"; return; }
    if (!account) {
      $("m-count").textContent = "— / " + CFG.maxPerWallet;
      $("m-agent").textContent = "Not connected";
      $("m-next").textContent = "FREE (1st)";
      $("m-cost").textContent = "—";
      $("mintBtn").textContent = "Connect wallet to mint";
      $("mintBtn").disabled = false; // click connects the wallet (handler below)
      return;
    }
    try {
      const [count, agent, open, mintable] = await Promise.all([
        nftRead.mintedBy(account), nftRead.hasAgentId(account),
        nftRead.mintOpen(), nftRead.mintableBy(account),
      ]);
      const n = Number(count);
      myMintCount = n; myMintable = Number(mintable); mintIsOpen = !!open;
      $("m-count").textContent = n + " / " + CFG.maxPerWallet;
      $("m-agent").textContent = agent ? "Agent ID verified ✓" : "No Agent ID ✗";
      $("a-wallet").textContent = short(account);
      $("a-status").textContent = agent ? "Agent ID verified ✓" : "No Agent ID on this wallet ✗";
      $("a-count").textContent = n + " / " + CFG.maxPerWallet;
      const rung = rungOf(n);
      document.querySelectorAll("table.ladder tr[data-rung]").forEach((tr) =>
        tr.classList.toggle("cur", Number(tr.dataset.rung) === rung));
      const price = priceForNext(n);
      if (!mintIsOpen) {
        $("m-next").textContent = "—";
        $("m-cost").textContent = "—";
        $("mintBtn").textContent = "Mint is not open yet";
        $("mintBtn").disabled = true;
      } else if (price === null) {
        $("m-next").textContent = "Quota full";
        $("m-cost").textContent = "—";
        $("mintBtn").textContent = "Wallet quota reached (33)";
        $("mintBtn").disabled = true;
      } else {
        $("m-next").textContent = price === 0n ? "FREE" : fmtBNB(price) + " BNB";
        $("mintBtn").textContent = agent ? "Mint" : "Agent ID required to mint";
        $("mintBtn").disabled = !agent;
        updateMintCost();
      }
    } catch (e) { setStatus("mintStatus", "Could not read your mint status: " + errText(e), true); }
  }
  function refreshAgent() {
    if (!account) { $("a-wallet").textContent = "Not connected"; $("a-status").textContent = "—"; $("a-count").textContent = "—"; return; }
    if (DEPLOYED) refreshMintPanel();
    else { $("a-wallet").textContent = short(account); $("a-status").textContent = "Checked on-chain at launch"; }
  }
  $("m-qty").addEventListener("change", updateMintCost);
  $("m-qty").addEventListener("input", updateMintCost);
  $("mintBtn").addEventListener("click", async () => {
    if (!account) { connect(); return; }
    if (!DEPLOYED || !nftWrite) return;
    if (!mintIsOpen) { toast("Minting is not open yet."); return; }
    if (!guardChain()) return;
    const qty = clampQty();
    let price;
    try {
      price = await nftRead.quote(account, qty); // authoritative on-chain price
    } catch (_) {
      // Fallback: sum the local ladder (identical bands to the contract).
      price = 0n;
      for (let i = 0; i < qty; i++) {
        const p = priceForNext(myMintCount + i);
        if (p === null) { toast("This wallet has used its full 33-card quota."); return; }
        price += p;
      }
    }
    // Explicit gas limit (contract README): eth_estimateGas can misreport
    // because of the gate's try/catch; a max 33-mint costs ~4–4.5M gas.
    const gasLimit = 400000n + BigInt(qty) * 160000n;
    const ok = await sendTx("mintStatus", "Mint", () => nftWrite.mint(qty, { value: price, gasLimit }));
    if (ok) { refreshStats(); refreshMintPanel(); toast("Mint confirmed — your cards are in My Cards. Designs reveal within a few blocks."); }
  });

  /* ── listings probe: Multicall3 aggregate3 sweeps, chunked ──
     Paints instantly from the local snapshot, then reconciles
     against the chain in bounded chunks with a saved cursor.   */
  const SNAP_KEY = "gta6-listings-v2";
  function loadSnapshot() {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      // Snapshots are bound to the contract pair they were taken from, so a
      // snapshot left over from a previous deployment never paints as live.
      // (Bare arrays are the legacy pass-1 format, from these same contracts.)
      const rows = Array.isArray(snap) ? snap
        : (snap && snap.nft === CFG.nftAddress && snap.market === CFG.marketAddress ? snap.rows : null);
      if (!rows) return;
      listingsCache = rows.map((r) => ({ ...r, price: BigInt(r.price) }));
      $("st-listings").textContent = listingsCache.length.toLocaleString("en-US");
      renderMarket(); renderActivity();
    } catch (_) {}
  }
  function saveSnapshot() {
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify({
        nft: CFG.nftAddress, market: CFG.marketAddress,
        rows: listingsCache.map((r) => ({ ...r, price: r.price.toString() })),
      }));
    } catch (_) {}
  }
  async function aggCalls(calls) {
    // one aggregate3 eth_call per chunk — sub-batches stay small per RPC
    const res = await mc.aggregate3(calls.map((c) => ({ target: c.target, allowFailure: true, callData: c.data })));
    return res.map((r) => (r.success ? r.returnData : null));
  }
  let sweepBusy = false, listingsSwept = false;
  async function sweepListings() {
    if (!DEPLOYED || !totalMintedCache || sweepBusy) return;
    sweepBusy = true;
    try {
    const nftIface = new ethers.Interface(NFT_ABI);
    const mktIface = new ethers.Interface(MARKET_ABI);
    const found = new Map(listingsCache.map((l) => [l.id, l]));
    const CHUNK = 33; // 33 ids × 3 probes = 99 subcalls per aggregate3 eth_call
    for (let start = 1; start <= totalMintedCache; start += CHUNK) {
      const ids = [];
      for (let id = start; id < Math.min(start + CHUNK, totalMintedCache + 1); id++) ids.push(id);
      const calls = [];
      ids.forEach((id) => {
        calls.push({ target: CFG.marketAddress, data: mktIface.encodeFunctionData("listings", [id]) });
        calls.push({ target: CFG.nftAddress, data: nftIface.encodeFunctionData("tierOf", [id]) });
        calls.push({ target: CFG.nftAddress, data: nftIface.encodeFunctionData("designOf", [id]) });
      });
      let out;
      try { out = await aggCalls(calls); } catch (_) { break; } // keep snapshot on RPC failure
      ids.forEach((id, i) => {
        const lr = out[i * 3], tr = out[i * 3 + 1], cr = out[i * 3 + 2];
        if (!lr) return;
        try {
          const [seller, price, currency] = mktIface.decodeFunctionResult("listings", lr);
          if (seller === ZERO) { found.delete(id); return; }
          const tierRaw = tr ? Number(nftIface.decodeFunctionResult("tierOf", tr)[0]) : 255;
          const rawDesign = cr ? Number(nftIface.decodeFunctionResult("designOf", cr)[0]) : UNREVEALED;
          // Sealed tokens (design not yet revealed) report designOf = 1481
          // and tierOf = 255 — render them as sealed, never as a tier.
          const sealed = rawDesign >= UNREVEALED || tierRaw === 255;
          found.set(id, {
            id, seller, price, currency: Number(currency),
            tier: sealed ? 255 : tierRaw,
            design: sealed ? null : rawDesign + 1, // site uses 1-based catalog numbers
            sealed,
          });
        } catch (_) {}
      });
      listingsCache = [...found.values()].sort((a, b) => a.id - b.id);
      $("st-listings").textContent = listingsCache.length.toLocaleString("en-US");
      renderMarket(); renderActivity(); saveSnapshot();
    }
    } finally { sweepBusy = false; listingsSwept = true; }
  }
  let marketBusy = false;
  async function refreshMarket(force) {
    if (!DEPLOYED || marketBusy) return;
    marketBusy = true;
    try { await refreshStats(); await sweepListings(); }
    finally { marketBusy = false; }
  }
  $("refreshMarket").addEventListener("click", () => refreshMarket(true));
  $("sort").addEventListener("change", renderMarket);
  $("q").addEventListener("input", renderMarket);

  function tierArt(tierIdx) { return TIERS[tierIdx] ? TIERS[tierIdx].file : TIERS[0].file; }
  function artHTML(l) {
    if (l.sealed) return `<div class="sealed-art"><span>VI</span><small>SEALED</small></div>`;
    // Revealed cards show their own design artwork — the same /img/<design>
    // file the token metadata points to. Tier showcase art is the fallback
    // when no design is known or the design file fails to load.
    if (l.design) return `<img src="img/${l.design}.webp" alt="${cardName(l)}" loading="lazy" onerror="this.onerror=null;this.src='${tierArt(l.tier)}'">`;
    return `<img src="${tierArt(l.tier)}" alt="${cardName(l)}" loading="lazy">`;
  }
  function cardHTML(l, mode) {
    const name = cardName(l);
    const mine = account && l.seller && l.seller.toLowerCase() === account.toLowerCase();
    let btn = "";
    if (mode === "market") btn = mine
      ? `<button class="btn pink-ghost" data-delist="${l.id}">Delist</button>`
      : `<button class="btn" data-buy="${l.id}">Buy</button>`;
    if (mode === "mine") btn = `<button class="btn pink-ghost" data-delist="${l.id}">Delist</button>`;
    const sub = l.sealed
      ? `Token #${l.id} · Sealed — design not yet revealed`
      : `Token #${l.id} · ${tierName(l.tier)} · Design #${l.design}`;
    return `<div class="card">
      ${artHTML(l)}
      <div class="body"><b>${name}</b>
        <p>${sub}</p>
        <div class="row"><span class="price">${priceText(l)}</span>${btn}</div>
      </div></div>`;
  }
  function renderMarket() {
    if (!DEPLOYED) return;
    let rows = listingsCache.slice();
    if (tierFilter !== "All") rows = rows.filter((l) => tierName(l.tier) === tierFilter);
    const q = $("q").value.trim().toLowerCase();
    if (q) rows = rows.filter((l) => cardName(l).toLowerCase().includes(q)
      || tierName(l.tier).toLowerCase().includes(q) || String(l.id) === q.replace("#", ""));
    const s = $("sort").value;
    // Prices are never compared across currencies (1 USDT ≠ 1 BNB): price
    // sorts group by currency first (BNB, then USDT), then by price.
    if (s === "low") rows.sort((a, b) => a.currency - b.currency || (a.price < b.price ? -1 : a.price > b.price ? 1 : 0));
    if (s === "high") rows.sort((a, b) => a.currency - b.currency || (a.price > b.price ? -1 : a.price < b.price ? 1 : 0));
    if (s === "new") rows.sort((a, b) => b.id - a.id);
    $("lgrid").innerHTML = rows.length
      ? rows.map((l) => cardHTML(l, "market")).join("")
      : `<div class="empty">No listings match — check back soon.</div>`;
    bindCardButtons($("lgrid"));
  }

  /* ── my cards: tokensOfOwner (one call) + per-token probes ──
     Replaces the old full-supply ownerOf sweep: the real NFT is
     ERC-721 Enumerable, so the owner's token list is one eth_call
     and only those ids need tierOf/designOf probes.             */
  async function refreshMine() {
    if (!DEPLOYED) return;
    if (!account) {
      $("mgrid").innerHTML = `<div class="empty">Connect your wallet to see your cards.</div>`;
      $("mlist").innerHTML = `<div class="empty">Nothing listed yet.</div>`;
      return;
    }
    $("mbal").textContent = short(account);
    // "My Listings" is derived from the listings cache — make sure a sweep
    // has actually run this session before trusting it (e.g. when the user
    // lands on My Cards first, or the startup sweep hit an RPC outage).
    if (!listingsSwept) { await refreshStats(); await sweepListings(); }
    const nftIface = new ethers.Interface(NFT_ABI);
    try {
      const ids = (await nftRead.tokensOfOwner(account)).map(Number);
      $("mbal").textContent = short(account) + " · " + ids.length + " cards";
      const mine = [];
      const CH = 50; // 50 tokens × 2 probes = 100 subcalls per aggregate3
      for (let s = 0; s < ids.length; s += CH) {
        const part = ids.slice(s, s + CH);
        const calls = [];
        part.forEach((id) => {
          calls.push({ target: CFG.nftAddress, data: nftIface.encodeFunctionData("tierOf", [id]) });
          calls.push({ target: CFG.nftAddress, data: nftIface.encodeFunctionData("designOf", [id]) });
        });
        let out;
        try { out = await aggCalls(calls); } catch (_) { break; }
        part.forEach((id, i) => {
          const tr = out[i * 2], dr = out[i * 2 + 1];
          const tierRaw = tr ? Number(nftIface.decodeFunctionResult("tierOf", tr)[0]) : 255;
          const rawDesign = dr ? Number(nftIface.decodeFunctionResult("designOf", dr)[0]) : UNREVEALED;
          const sealed = rawDesign >= UNREVEALED || tierRaw === 255;
          mine.push({ id, tier: sealed ? 255 : tierRaw, design: sealed ? null : rawDesign + 1, sealed });
        });
      }
      myTokens = mine;
    } catch (e) { toast("Could not load your cards: " + errText(e)); }
    myListings = listingsCache.filter((l) => l.seller && l.seller.toLowerCase() === account.toLowerCase());
    renderMine();
  }
  function renderMine() {
    const sealedCount = myTokens.filter((t) => t.sealed).length;
    const revealBar = sealedCount
      ? `<div class="empty">${sealedCount} of your cards are still sealed. Designs reveal
         automatically as new mints land — or reveal them now.
         <div style="margin-top:10px"><button class="btn" id="revealBtn">Reveal sealed cards</button></div></div>`
      : "";
    $("mgrid").innerHTML = revealBar + (myTokens.length ? myTokens.map((t) => `
      <div class="card">${artHTML(t)}
        <div class="body"><b>${cardName(t)}</b>
          <p>${t.sealed ? `Token #${t.id} · Sealed` : `Token #${t.id} · ${tierName(t.tier)} · Design #${t.design}`}</p>
          <div class="row"><span class="chip ${tierName(t.tier)}">${tierName(t.tier)}</span>
          <button class="btn" data-list="${t.id}">List</button></div>
        </div></div>`).join("")
      : `<div class="empty">No cards in this wallet yet — mint your first (it's free).</div>`);
    $("mlist").innerHTML = myListings.length
      ? myListings.map((l) => cardHTML(l, "mine")).join("")
      : `<div class="empty">Nothing listed yet.</div>`;
    bindCardButtons($("mgrid")); bindCardButtons($("mlist"));
    const rb = $("revealBtn");
    if (rb) rb.addEventListener("click", doReveal);
  }
  async function doReveal() {
    if (!nftWrite) { connect(); return; }
    if (!guardChain()) return;
    // revealPending reverts NotReady while the oldest sealed batch's target
    // block has not passed — check first instead of burning a doomed tx.
    const ready = await nftRead.revealReady().catch(() => true);
    if (!ready) { toast("Not ready yet — designs unlock a few blocks after minting. Try again in a few seconds."); return; }
    // Gas scales with the sealed work: size the limit from the actual
    // pending batches (up to 3) — a flat guess can run out of gas when the
    // queue holds several full 33-card batches.
    let gasLimit = 2500000n;
    try {
      const [head, count] = await Promise.all([nftRead.nextRevealBatch(), nftRead.batchCount()]);
      let tokens = 0;
      for (let b = Number(head); b < Math.min(Number(head) + 3, Number(count)); b++)
        tokens += Number((await nftRead.batch(b)).qty);
      if (tokens > 0) gasLimit = BigInt(300000 + tokens * 120000);
    } catch (_) { /* keep the fallback limit */ }
    toast("Reveal transaction sent, waiting for confirmation…");
    try {
      const tx = await nftWrite.revealPending(3, { gasLimit });
      await tx.wait();
      toast("Reveal confirmed — refreshing your cards.");
      refreshMine();
    } catch (e) {
      const data = (e && (e.data || (e.info && e.info.error && e.info.error.data))) || "";
      if (typeof data === "string" && data.startsWith(NOT_READY_SEL))
        toast("Not ready yet — designs unlock a few blocks after minting. Try again in a few seconds.");
      else toast("Reveal failed: " + errText(e));
    }
  }

  /* ── activity (state-derived: live book + cumulative sales counter) ── */
  function renderActivity() {
    if (!DEPLOYED) { $("alog").innerHTML = `<div class="empty">Activity opens at launch.</div>`; return; }
    const rows = [];
    if (actFilter === "all" || actFilter === "sales")
      rows.push(`<div class="row"><b>Cumulative market sales</b><span>${totalSalesCache.toLocaleString("en-US")} sales · 5% royalty applied</span></div>`);
    if (actFilter === "all" || actFilter === "listings")
      listingsCache.slice().reverse().forEach((l) => rows.push(
        `<div class="row"><b>Listed — ${cardName(l)} #${l.id}</b><span>${priceText(l)} · seller ${short(l.seller)}</span></div>`));
    $("alog").innerHTML = rows.length ? rows.join("") : `<div class="empty">No activity yet.</div>`;
  }

  /* ── modal + market actions ── */
  function openModal(html) { $("mb").innerHTML = html; $("md").classList.add("open"); $("md").setAttribute("aria-hidden", "false"); }
  function closeModal() { $("md").classList.remove("open"); $("md").setAttribute("aria-hidden", "true"); }
  document.querySelectorAll("[data-x]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  function bindCardButtons(root) {
    root.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => openBuy(Number(b.dataset.buy))));
    root.querySelectorAll("[data-delist]").forEach((b) => b.addEventListener("click", () => doDelist(Number(b.dataset.delist))));
    root.querySelectorAll("[data-list]").forEach((b) => b.addEventListener("click", () => openList(Number(b.dataset.list))));
  }
  function openBuy(id) {
    const l = listingsCache.find((x) => x.id === id); if (!l) return;
    openModal(`${artHTML(l)}
      <h3 style="margin:14px 0 4px">${cardName(l)}</h3>
      <p class="hint">Token #${l.id} · ${tierName(l.tier)}${l.sealed ? "" : ` · Design #${l.design}`}<br>Seller ${short(l.seller)}</p>
      <div class="kv"><span>Price</span><b class="big">${priceText(l)}</b></div>
      <button class="btn" id="mb-buy" style="margin-top:14px;width:100%">Buy this card</button>
      <p class="status" id="mb-status"></p>`);
    $("mb-buy").addEventListener("click", async () => {
      if (!account) { connect(); return; }
      if (!guardChain()) return;
      if (l.currency === 1) {
        const usdt = new ethers.Contract(CFG.usdtAddress, ERC20_ABI, signer);
        const allow = await usdt.allowance(account, CFG.marketAddress);
        if (allow < l.price) {
          const okA = await sendTx("mb-status", "Approve USDT", () => usdt.approve(CFG.marketAddress, l.price));
          if (!okA) return;
        }
        const ok = await sendTx("mb-status", "Buy", () => marketWrite.buy(l.id));
        if (ok) { closeModal(); toast("Card purchased — find it in My Cards."); refreshMarket(true); }
      } else {
        const ok = await sendTx("mb-status", "Buy", () => marketWrite.buy(l.id, { value: l.price }));
        if (ok) { closeModal(); toast("Card purchased — find it in My Cards."); refreshMarket(true); }
      }
    });
  }
  function openList(id) {
    const t = myTokens.find((x) => x.id === id); if (!t) return;
    openModal(`${artHTML(t)}
      <h3 style="margin:14px 0 4px">List ${cardName(t)}</h3>
      <p class="hint">Token #${id} · ${tierName(t.tier)}. Listing fee: ${CFG.actionFeeBNB} BNB (paid once, now).
        Your card moves into market escrow until it sells or you delist.</p>
      <label>Price</label><input type="text" id="mb-price" placeholder="e.g. 0.01" inputmode="decimal">
      <label>Currency</label><select id="mb-cur"><option value="0">BNB</option><option value="1">USDT</option></select>
      <button class="btn" id="mb-list" style="width:100%">Approve & List</button>
      <p class="status" id="mb-status"></p>`);
    $("mb-list").addEventListener("click", async () => {
      if (!guardChain()) return;
      const raw = $("mb-price").value.trim().replace(",", "."); // accept "0,01" as well as "0.01"
      const cur = Number($("mb-cur").value);
      let price;
      try { price = ethers.parseUnits(raw, 18); if (price <= 0n) throw new Error("bad"); }
      catch (_) { setStatus("mb-status", "Enter a valid price.", true); return; }
      const approved = await nftRead.isApprovedForAll(account, CFG.marketAddress).catch(() => false);
      if (!approved) {
        const okA = await sendTx("mb-status", "Approve market", () => nftWrite.setApprovalForAll(CFG.marketAddress, true));
        if (!okA) return;
      }
      const ok = await sendTx("mb-status", "List", () => marketWrite.list(id, price, cur, { value: actionFeeWei }));
      if (ok) { closeModal(); toast("Card listed."); refreshMine(); refreshMarket(true); }
    });
  }
  async function doDelist(id) {
    if (!account) { connect(); return; }
    if (!guardChain()) return;
    if (!confirm("Delist token #" + id + "? The delist fee is " + CFG.actionFeeBNB + " BNB.")) return;
    // Feedback goes to the toast: the delist buttons live in the Market /
    // My Cards views, where the Mint view's status line is not visible.
    toast("Delist transaction sent, waiting for confirmation…");
    try {
      const tx = await marketWrite.delist(id, { value: actionFeeWei });
      await tx.wait();
      toast("Delisted — card returned to your wallet.");
      refreshMine(); refreshMarket(true);
    } catch (e) { toast("Delist failed: " + errText(e)); }
  }

  /* ── init: paint first, probe after ── */
  paintStatic();
  loadSnapshot();
  silentReconnect();
  if (DEPLOYED) { refreshMintPanel(); refreshStats().then(() => { refreshMarket(false); }); }
})();
