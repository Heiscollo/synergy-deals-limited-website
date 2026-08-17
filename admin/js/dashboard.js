document.addEventListener('DOMContentLoaded', function () {
  if (!sdRequireAuth()) return;

  var products = [];
  var editingId = null;

  var form = document.getElementById('product-form');
  var formHeading = document.getElementById('form-heading');
  var cancelEditBtn = document.getElementById('cancel-edit-btn');
  var submitBtn = document.getElementById('submit-btn');
  var submitBtnText = document.getElementById('submit-btn-text');
  var formFeedback = document.getElementById('form-feedback');

  var nameInput = document.getElementById('name');
  var categorySelect = document.getElementById('category');
  var descriptionInput = document.getElementById('description');
  var imageInput = document.getElementById('image');
  var availableInput = document.getElementById('available');
  var productIdInput = document.getElementById('product-id');

  var loadingEl = document.getElementById('products-loading');
  var emptyEl = document.getElementById('products-empty');
  var tableEl = document.getElementById('products-table');
  var tbody = document.getElementById('products-tbody');
  var countEl = document.getElementById('product-count');

  var confirmModal = document.getElementById('confirm-modal');
  var confirmModalText = document.getElementById('confirm-modal-text');
  var confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  var confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  var pendingDeleteId = null;

  // ---------- Setup ----------
  Object.keys(window.SYNERGY_CATEGORIES).forEach(function (slug) {
    var opt = document.createElement('option');
    opt.value = slug;
    opt.textContent = window.SYNERGY_CATEGORIES[slug];
    categorySelect.appendChild(opt);
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    sdClearSession();
    window.location.href = 'login.html';
  });

  // ---------- Toasts ----------
  function toast(message, type) {
    var container = document.getElementById('toast-container');
    var el = document.createElement('div');
    el.className = 'toast ' + (type === 'error' ? 'error' : 'success');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4000);
  }

  // ---------- Load & render products ----------
  function loadProducts() {
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    tableEl.classList.add('hidden');

    sdAuthFetch('/products?all=true')
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        loadingEl.classList.add('hidden');
        if (!result.ok) throw new Error(result.data.error || 'Failed to load products');

        products = result.data.products || [];
        countEl.textContent = products.length + (products.length === 1 ? ' product' : ' products');

        if (products.length === 0) {
          emptyEl.classList.remove('hidden');
          return;
        }

        tbody.innerHTML = products.map(renderRow).join('');
        tableEl.classList.remove('hidden');
      })
      .catch(function (err) {
        loadingEl.classList.add('hidden');
        toast(err.message || 'Could not load products', 'error');
      });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function renderRow(p) {
    var img = p.image_url
      ? '<img src="' + escapeHtml(p.image_url) + '" alt="" class="thumb" />'
      : '<div class="thumb"></div>';
    var categoryLabel = window.SYNERGY_CATEGORIES[p.category] || p.category;
    var statusClass = p.available ? 'available' : 'unavailable';
    var statusText = p.available ? 'Available' : 'Hidden';

    return (
      '<tr data-id="' + p.id + '">' +
      '<td class="py-3 pr-4">' + img + '</td>' +
      '<td class="py-3 pr-4 font-semibold text-slate-700">' + escapeHtml(p.name) + '</td>' +
      '<td class="py-3 pr-4 text-slate-500">' + escapeHtml(categoryLabel) + '</td>' +
      '<td class="py-3 pr-4"><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td class="py-3 pr-4 text-right whitespace-nowrap">' +
      '<button type="button" class="row-action-btn edit" data-action="edit" data-id="' + p.id + '">Edit</button> ' +
      '<button type="button" class="row-action-btn delete" data-action="delete" data-id="' + p.id + '">Delete</button>' +
      '</td>' +
      '</tr>'
    );
  }

  tbody.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var product = products.find(function (p) {
      return p.id === id;
    });
    if (!product) return;

    if (btn.getAttribute('data-action') === 'edit') {
      startEdit(product);
    } else {
      openDeleteConfirm(product);
    }
  });

  // ---------- Add / edit form ----------
  function startEdit(product) {
    editingId = product.id;
    productIdInput.value = product.id;
    nameInput.value = product.name || '';
    categorySelect.value = product.category || '';
    descriptionInput.value = product.description || '';
    availableInput.checked = !!product.available;
    imageInput.value = '';

    formHeading.textContent = 'Edit Product';
    submitBtnText.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    formFeedback.textContent = '';

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    editingId = null;
    form.reset();
    productIdInput.value = '';
    formHeading.textContent = 'Add New Product';
    submitBtnText.textContent = 'Add Product';
    cancelEditBtn.classList.add('hidden');
    formFeedback.textContent = '';
  }

  cancelEditBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!editingId && !imageInput.files[0]) {
      formFeedback.textContent = 'Please select an image for the new product.';
      formFeedback.className = 'text-sm font-medium text-red-600';
      return;
    }

    var formData = new FormData();
    formData.set('name', nameInput.value.trim());
    formData.set('category', categorySelect.value);
    formData.set('description', descriptionInput.value.trim());
    formData.set('available', availableInput.checked ? 'true' : 'false');
    if (imageInput.files[0]) {
      formData.set('image', imageInput.files[0]);
    }

    var isEdit = !!editingId;
    var url = isEdit ? '/products/' + editingId : '/products';
    var method = isEdit ? 'PUT' : 'POST';

    submitBtn.disabled = true;
    submitBtnText.textContent = isEdit ? 'Saving…' : 'Adding…';
    formFeedback.textContent = '';

    sdAuthFetch(url, { method: method, body: formData })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || 'Something went wrong');
        toast(isEdit ? 'Product updated' : 'Product added', 'success');
        resetForm();
        loadProducts();
      })
      .catch(function (err) {
        formFeedback.textContent = err.message || 'Something went wrong';
        formFeedback.className = 'text-sm font-medium text-red-600';
        toast(err.message || 'Something went wrong', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtnText.textContent = isEdit ? 'Save Changes' : 'Add Product';
      });
  });

  // ---------- Delete confirm modal ----------
  function openDeleteConfirm(product) {
    pendingDeleteId = product.id;
    confirmModalText.textContent = 'This will permanently remove "' + product.name + '" and its image.';
    confirmModal.classList.remove('hidden');
  }

  function closeDeleteConfirm() {
    pendingDeleteId = null;
    confirmModal.classList.add('hidden');
  }

  confirmCancelBtn.addEventListener('click', closeDeleteConfirm);
  confirmModal.addEventListener('click', function (e) {
    if (e.target === confirmModal) closeDeleteConfirm();
  });

  confirmDeleteBtn.addEventListener('click', function () {
    if (!pendingDeleteId) return;
    var id = pendingDeleteId;

    confirmDeleteBtn.disabled = true;
    sdAuthFetch('/products/' + id, { method: 'DELETE' })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || 'Delete failed');
        toast('Product deleted', 'success');
        if (editingId === id) resetForm();
        loadProducts();
      })
      .catch(function (err) {
        toast(err.message || 'Delete failed', 'error');
      })
      .finally(function () {
        confirmDeleteBtn.disabled = false;
        closeDeleteConfirm();
      });
  });

  loadProducts();
});
