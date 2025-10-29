import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { CreateSignedUploadSchema } from '../schemas/submission';
import { supabase } from '../lib/supabase';

// Admin allowlist from environment variable
const getAdminEmails = (): Set<string> => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const emails = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  // Fallback for development if not set
  if (emails.length === 0 && process.env.NODE_ENV === 'development') {
    return new Set(['hello@proven.com']);
  }
  return new Set(emails);
};
const ADMIN_EMAILS = getAdminEmails();

const router = Router();

// GET /api/storage/proof?path=<storage_path>
// Returns the image bytes for a private proof submission.
router.get('/proof', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ success: false, message: 'Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.' });
      return;
    }

    const path = req.query.path as string | undefined;
    if (!path) {
      res.status(400).json({ success: false, message: 'Missing path query param' });
      return;
    }

    // Basic access check: ensure the path contains the authenticated user's id (last 8 chars)
    // Our uploader saves as: <dateFolder>/<userIdShort>-<challengeIdShort>-<timestamp>.<ext>
    const userIdShort = req.user?.id.slice(-8);
    const userIdPattern = `/${userIdShort}-`;
    const isAdmin = req.user?.email ? ADMIN_EMAILS.has(req.user.email) : false;
    if (!isAdmin && !path.includes(userIdPattern)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { data, error } = await supabase.storage
      .from('proof-submission')
      .download(path);

    if (error || !data) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // data is a Blob in Node 18+. Set content type if known
    const contentType = (data as any).type || 'application/octet-stream';
    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch (err) {
    // eslint-disable-next-line no-console
    res.status(500).json({ success: false, message: 'Failed to fetch image' });
  }
});

// POST /api/storage/proof/signed-upload
// Returns a one-time signed upload URL and canonical storage path
router.post('/proof/signed-upload', authenticate, validateRequest(CreateSignedUploadSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ success: false, message: 'Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.' });
      return;
    }

    const { challengeId, contentType } = req.body as { challengeId: string; contentType: string };
    const userId = req.user!.id;

    // Validate mime type roughly (client should also validate before calling)
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(contentType)) {
      res.status(400).json({ success: false, message: 'Unsupported content type' });
      return;
    }

    const ext = contentType.toLowerCase().includes('png') ? 'png' : contentType.toLowerCase().includes('webp') ? 'webp' : 'jpg';
    const ts = Date.now();
    const today = new Date();
    const dateFolder = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getFullYear()).slice(-2)}`; // DD-MM-YY

    // Use shorter identifiers to avoid extremely long filenames
    const userIdShort = userId.slice(-8); // Last 8 chars of userId
    const challengeIdShort = challengeId.slice(-8); // Last 8 chars of challengeId
    const path = `${dateFolder}/${userIdShort}-${challengeIdShort}-${ts}.${ext}`;

    // Supabase Storage v2 provides createSignedUploadUrl on the Storage API
    // For compatibility, we fallback to upload tokens via signed POST if available
    // Some client versions accept just the path; if your SDK variant uses options, adjust accordingly
    const { data, error } = await supabase.storage
      .from('proof-submission')
      .createSignedUploadUrl(path); // default TTL
    if (error || !data) {
      res.status(500).json({ success: false, message: 'Failed to create signed upload URL' });
      return;
    }

    res.json({ success: true, data: { path, signedUrl: data.signedUrl, token: (data as any).token } });
  } catch (err) {
    // eslint-disable-next-line no-console
    res.status(500).json({ success: false, message: 'Failed to create signed upload URL' });
  }
});

// POST /api/storage/proof/signed-preview
// Returns a signed URL for previewing an uploaded proof image
router.post('/proof/signed-preview', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ success: false, message: 'Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.' });
      return;
    }

    const { path } = req.body as { path: string };
    if (!path) {
      res.status(400).json({ success: false, message: 'Missing path in request body' });
      return;
    }

    // Basic access check: ensure the path contains the authenticated user's id (last 8 chars)
    const userIdShort = req.user!.id.slice(-8);
    const userIdPattern = `${userIdShort}-`;
    const isAdmin = req.user?.email ? ADMIN_EMAILS.has(req.user.email) : false;
    if (!isAdmin && !path.includes(userIdPattern)) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only preview your own images' });
      return;
    }

    // Generate signed URL (1 hour expiry)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('proof-submission')
      .createSignedUrl(path, 3600); // 1 hour = 3600 seconds

    if (signedError || !signedData) {
      console.error('Signed URL generation error:', signedError);
      res.status(404).json({ success: false, message: 'Failed to generate preview URL. File may not exist.' });
      return;
    }

    res.json({ success: true, data: { signedUrl: signedData.signedUrl } });
  } catch (err) {
    console.error('Signed preview error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate preview URL' });
  }
});

export default router;

