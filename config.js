// ============================================================
// GTA 6 — Leonida Trading Cards · SITE CONFIG (single edit point)
// ------------------------------------------------------------
// Contract addresses below are the DEPLOYED BSC mainnet
// contracts (verified on-chain 2026-11-24). The site reads all
// state live from them. To point the site at different
// contracts, change ONLY the two addresses.
// ============================================================
window.GTA6_CONFIG = {
  chainId: 56,
  chainName: "BNB Smart Chain",
  rpcUrl: "https://rpc-bsc.48.club",
  rpcUrls: [
    "https://rpc-bsc.48.club",
    "https://bsc-dataseed.binance.org",
    "https://bsc-dataseed1.defibit.io",
    "https://bsc.publicnode.com",
  ],

  // Deployed contracts (BSC mainnet, 2026-11-24)
  nftAddress: "0xd42090e179c7deF79992c9eE9d78673228bAcE84",    // GTA6 NFT
  marketAddress: "0x3d14d6efeDF19A37e6EB537368acd0Feb0799F9f", // GTA6 Market

  // BSC USDT (BEP20) — used for USDT-priced marketplace listings.
  usdtAddress: "0x55d398326f99059fF775485246999027B3197955",

  assetBase: "assets/", // official card art (same files the NFT metadata points to)

  // Locked collection spec (mirrors the NFT contract constants).
  maxSupply: 15555,
  maxPerWallet: 33,
  actionFeeBNB: "0.00025", // market list / delist fee
  royaltyPct: 5,           // market sale royalty
};
