const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { supabaseAdmin, supabasePublic, PRODUCT_IMAGE_BUCKET } = require('../config/supabase');
const { CATEGORY_SLUGS } = require('../config/categories');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function uploadProductImage(file) {
  const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'jpg';
  const path = `${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteProductImage(imageUrl) {
  const path = storagePathFromPublicUrl(imageUrl);
  if (!path) return;
  await supabaseAdmin.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
}

// GET /api/products?category=xxx — public, available products, optionally filtered by category.
// GET /api/products?all=true — protected, returns every product (any availability) for the admin dashboard.
router.get('/', async (req, res) => {
  const { category, all } = req.query;

  if (category && !CATEGORY_SLUGS.includes(category)) {
    return res.status(400).json({ error: `Unknown category "${category}"` });
  }

  let client = supabasePublic;
  let includeUnavailable = false;

  if (all === 'true') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const { data: userData } = token ? await supabaseAdmin.auth.getUser(token) : { data: null };

    if (!userData?.user) {
      return res.status(401).json({ error: 'Authentication required to list all products' });
    }

    client = supabaseAdmin;
    includeUnavailable = true;
  }

  let query = client.from('products').select('*').order('created_at', { ascending: false });

  if (!includeUnavailable) {
    query = query.eq('available', true);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ products: data });
});

// GET /api/products/:id — public, single product detail.
router.get('/:id', async (req, res) => {
  const { data, error } = await supabasePublic
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product: data });
});

// POST /api/products — protected, creates a product with an optional image upload.
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { name, category, description, available } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }
  if (!CATEGORY_SLUGS.includes(category)) {
    return res.status(400).json({ error: `Unknown category "${category}"` });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadProductImage(req.file);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        category,
        description: description || null,
        image_url: imageUrl,
        available: available === undefined ? true : available === 'true' || available === true,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ product: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — protected, edit a product; replaces the image if a new one is uploaded.
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, category, description, available } = req.body;

  if (category && !CATEGORY_SLUGS.includes(category)) {
    return res.status(400).json({ error: `Unknown category "${category}"` });
  }

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (available !== undefined) updates.available = available === 'true' || available === true;

    if (req.file) {
      const newImageUrl = await uploadProductImage(req.file);
      if (existing.image_url) {
        await deleteProductImage(existing.image_url);
      }
      updates.image_url = newImageUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ product: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — protected, deletes a product and its stored image.
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('image_url')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { error: deleteError } = await supabaseAdmin.from('products').delete().eq('id', id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  if (existing.image_url) {
    await deleteProductImage(existing.image_url);
  }

  res.json({ success: true });
});

module.exports = router;
