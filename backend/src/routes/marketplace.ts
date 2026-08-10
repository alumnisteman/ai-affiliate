import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/marketplace/listings — daftar semua listing aktif
router.get("/listings", async (req, res) => {
  try {
    const { type, status = "open" } = req.query;
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        status: String(status),
        ...(type ? { type: String(type) } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator:  { select: { id: true, name: true, handle: true, platform: true, followers: true } },
        product:  { select: { id: true, name: true, imageUrl: true, commissionRate: true } },
        _count:   { select: { bids: true } },
      },
    });
    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/marketplace/listing — buat listing baru (brand/creator)
router.post("/listing", async (req, res) => {
  try {
    const { creatorId, brandUserId, productId, type, title, description, budget, commission } = req.body;
    if (!title) return res.status(400).json({ success: false, error: "title diperlukan" });

    const listing = await prisma.marketplaceListing.create({
      data: { creatorId, brandUserId, productId, type, title, description, budget, commission },
    });
    res.status(201).json({ success: true, data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/marketplace/bid — ajukan penawaran
router.post("/bid", async (req, res) => {
  try {
    const { listingId, creatorId, bidderId, message, proposedRate } = req.body;
    if (!listingId) return res.status(400).json({ success: false, error: "listingId diperlukan" });

    const bid = await prisma.marketplaceBid.create({
      data: { listingId, creatorId, bidderId, message, proposedRate },
    });
    res.status(201).json({ success: true, data: bid });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/marketplace/bid/:id — terima/tolak bid
router.patch("/bid/:id", async (req, res) => {
  try {
    const { status } = req.body; // accepted | rejected
    const bid = await prisma.marketplaceBid.update({
      where: { id: Number(req.params.id) },
      data:  { status },
    });
    if (status === "accepted") {
      await prisma.marketplaceListing.update({
        where: { id: bid.listingId },
        data:  { status: "matched" },
      });
    }
    res.json({ success: true, data: bid });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
