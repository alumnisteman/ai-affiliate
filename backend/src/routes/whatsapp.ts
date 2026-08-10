import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/whatsapp/templates
 * List all WhatsApp templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const templates = await prisma.whatsAppTemplate.findMany({
      where: category ? { category: category as string } : {},
      orderBy: { createdAt: 'desc' },
    });

    res.json({ templates, total: templates.length });
  } catch (error: any) {
    console.error('[WhatsApp] Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil template' });
  }
});

/**
 * POST /api/whatsapp/templates
 * Create a new WhatsApp template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const { name, content, category } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'nama dan konten wajib diisi' });
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        content,
        category: category || 'promo',
      },
    });

    res.status(201).json(template);
  } catch (error: any) {
    console.error('[WhatsApp] Create error:', error.message);
    res.status(500).json({ error: 'Gagal membuat template' });
  }
});

/**
 * PUT /api/whatsapp/templates/:id
 * Update a WhatsApp template
 */
router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { name, content, category } = req.body;

    const template = await prisma.whatsAppTemplate.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name ? { name } : {}),
        ...(content ? { content } : {}),
        ...(category ? { category } : {}),
      },
    });

    res.json(template);
  } catch (error: any) {
    console.error('[WhatsApp] Update error:', error.message);
    res.status(500).json({ error: 'Gagal memperbarui template' });
  }
});

/**
 * DELETE /api/whatsapp/templates/:id
 * Delete a WhatsApp template
 */
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    await prisma.whatsAppTemplate.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Template dihapus' });
  } catch (error: any) {
    console.error('[WhatsApp] Delete error:', error.message);
    res.status(500).json({ error: 'Gagal menghapus template' });
  }
});

/**
 * POST /api/whatsapp/send
 * Simulate sending a WhatsApp message (placeholder for actual integration)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { templateId, phone, variables } = req.body;

    if (!templateId || !phone) {
      return res.status(400).json({ error: 'templateId dan nomor telepon wajib diisi' });
    }

    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template tidak ditemukan' });
    }

    // Replace variables in template content
    let message = template.content;
    if (variables && typeof variables === 'object') {
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(`{{${key}}}`, String(value));
      }
    }

    // Record event
    await prisma.event.create({
      data: {
        eventType: 'whatsapp_sent',
        entityId: template.id,
        entityType: 'whatsapp_template',
        payload: JSON.stringify({ phone: phone.substring(0, 6) + '***', template: template.name }),
      },
    });

    // TODO: Integrate with actual WhatsApp Business API
    res.json({
      status: 'queued',
      message: 'Pesan masuk antrean pengiriman',
      preview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    });
  } catch (error: any) {
    console.error('[WhatsApp] Send error:', error.message);
    res.status(500).json({ error: 'Gagal mengirim pesan' });
  }
});

export default router;
