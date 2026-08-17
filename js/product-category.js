document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var category = params.get('category');

  var loadingState = document.getElementById('loading-state');
  var emptyState = document.getElementById('empty-state');
  var errorState = document.getElementById('error-state');
  var grid = document.getElementById('product-grid');
  var heading = document.getElementById('category-heading');
  var pageTitle = document.getElementById('page-title');

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function showState(state) {
    [loadingState, emptyState, errorState, grid].forEach(function (el) {
      el.classList.add('hidden');
    });
    state.classList.remove('hidden');
  }

  var label = category && window.SYNERGY_CATEGORIES[category];

  if (!label) {
    heading.textContent = 'Category Not Found';
    pageTitle.textContent = 'Category Not Found | Synergy Deals Limited';
    errorState.querySelector('h2').textContent = "We couldn't find that category";
    errorState.querySelector('p').textContent = 'Please choose a category from our Services page.';
    showState(errorState);
    return;
  }

  heading.textContent = label;
  pageTitle.textContent = label + ' | Synergy Deals Limited';

  function renderCard(p) {
    var media = p.image_url
      ? '<img src="' + escapeHtml(p.image_url) + '" alt="' + escapeHtml(p.name) + '" class="w-full h-full object-cover" loading="lazy" />'
      : '<div class="placeholder-art w-full h-full bg-gradient-to-br from-teal to-primary text-white">' +
        '<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' +
        '</div>';

    var description = p.description
      ? '<p class="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">' + escapeHtml(p.description) + '</p>'
      : '';

    return (
      '<div class="card-hover bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm fade-in-up is-visible">' +
      '<div class="aspect-[4/3] bg-slate-50 overflow-hidden">' + media + '</div>' +
      '<div class="p-5">' +
      '<h3 class="font-heading font-bold text-primary">' + escapeHtml(p.name) + '</h3>' +
      description +
      '</div>' +
      '</div>'
    );
  }

  fetch(window.SYNERGY_API_BASE + '/products?category=' + encodeURIComponent(category))
    .then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then(function (data) {
      var products = data.products || [];
      if (products.length === 0) {
        showState(emptyState);
        return;
      }
      grid.innerHTML = products.map(renderCard).join('');
      showState(grid);
    })
    .catch(function () {
      showState(errorState);
    });
});
