(() => {
  const $ = selector => document.querySelector(selector);
  const formatUsd = value => '$' + Math.round(value).toLocaleString('en-US');
  const formatPercent = value => value == null
    ? '—'
    : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

  let data = [];
  let sortKey = 'implied_value_usd';
  let direction = -1;

  fetch('data.bin')
    .then(response => response.json())
    .then(snapshot => {
      data = snapshot.board;
      $('#count').textContent = data.length;

      const categories = [...new Set(data.map(row => row.category).filter(Boolean))].sort();
      const chains = [...new Set(data.flatMap(row => row.chains))].sort();
      for (const [id, items] of [['category', categories], ['chain', chains]]) {
        items.forEach(item => {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          $('#' + id).append(option);
        });
      }

      $('#category').onchange = () => {
        if (location.hash.startsWith('#filter=')) location.hash = '';
        render();
      };
      $('#chain').onchange = render;
      $('#search').oninput = render;
      $('#watch').onchange = render;
      document.querySelectorAll('th[data-key]').forEach(header => {
        header.onclick = () => {
          const key = header.dataset.key;
          if (sortKey === key) {
            direction *= -1;
          } else {
            sortKey = key;
            direction = key === 'name' || key === 'category' ? 1 : -1;
          }
          render();
        };
      });
      onhashchange = route;
      route();
    });

  function filteredRows() {
    const query = $('#search').value.toLowerCase();
    const category = $('#category').value;
    const chain = $('#chain').value;
    const watchlistOnly = $('#watch').checked;
    return data
      .filter(row => (!query || `${row.name} ${row.slug} ${row.chains.join(' ')}`.toLowerCase().includes(query))
        && (!category || row.category === category)
        && (!chain || row.chains.includes(chain))
        && (!watchlistOnly || row.on_watchlist))
      .slice()
      .sort((left, right) => {
        const a = left[sortKey];
        const b = right[sortKey];
        if (typeof a === 'string') return a.localeCompare(b) * direction;
        return ((a ?? -Infinity) - (b ?? -Infinity)) * direction;
      });
  }

  function render() {
    const rows = filteredRows();
    $('#shown').textContent = `${rows.length} / ${data.length} shown`;
    $('#rows').innerHTML = rows.map(row => `
      <tr data-slug="${row.slug}">
        <td>${row.rank.toString().padStart(3, '0')}</td>
        <td class="name">${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.category || 'Uncategorised')}</td>
        <td>${escapeHtml(row.chains.slice(0, 3).join(', '))}${row.chains.length > 3 ? ' +' + (row.chains.length - 3) : ''}</td>
        <td>${formatUsd(row.tvl_usd)}</td>
        <td class="${(row.change_7d || 0) >= 0 ? 'up' : 'down'}">${formatPercent(row.change_7d)}</td>
        <td>${row.age_days.toLocaleString()}d</td>
        <td class="value">${formatUsd(row.implied_value_usd)}</td>
        <td>${row.confidence}</td>
      </tr>`).join('');

    $('#rows').querySelectorAll('tr').forEach(tableRow => {
      tableRow.onclick = () => {
        location.hash = 'detail=' + encodeURIComponent(tableRow.dataset.slug);
      };
    });
    $('#board').hidden = false;
    $('#detail').hidden = true;
    window.__shotReady = true;
  }

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash.startsWith('detail=')) {
      const row = data.find(item => item.slug === hash.slice(7));
      if (row) showDetail(row);
      return;
    }

    $('#detail').hidden = true;
    $('#board').hidden = false;
    if (hash.startsWith('filter=')) {
      const category = hash.slice(7);
      $('#category').value = [...$('#category').options].some(option => option.value === category)
        ? category
        : '';
    } else {
      $('#category').value = '';
    }
    render();
  }

  function showDetail(row) {
    const factors = row.factors;
    $('#detail').innerHTML = `
      <div class="detailhead">
        <div>
          <p class="eyebrow">PROTOCOL FILE / RANK ${row.rank} ${row.on_watchlist ? '· WATCHLIST' : ''}</p>
          <h2>${escapeHtml(row.name)}</h2>
        </div>
        <button onclick="location.hash=''">← Back to radar</button>
      </div>
      <div class="metrics">
        <span><strong>${formatUsd(row.tvl_usd)}</strong>TVL · ${escapeHtml(row.chains.join(', ') || 'chain unreported')}</span>
        <span><strong>${formatPercent(row.change_7d)}</strong>7-day TVL change</span>
        <span><strong>${row.age_days.toLocaleString()} days</strong>since first tracking</span>
        <span><strong>${formatUsd(row.implied_value_usd)}</strong>implied value</span>
      </div>
      <div class="detailgrid">
        <article class="card">
          <h3>Model breakdown</h3>
          <p>Implied value = 8% TVL × 7d-growth × token-less tenure × chain breadth × category-only launch plausibility. CEX and bridge scores are ×0.003; liquid staking and restaked BTC are ×0.02; liquid restaking is ×0.55. They rank down because they are not farmable pre-token launches.</p>
          <div class="factor"><span>TVL base</span><b>${formatUsd(factors.base_tvl_usd)}</b></div>
          <div class="factor"><span>7d growth · ${formatPercent(row.change_7d)}</span><b>×${factors.growth_multiplier}</b></div>
          <div class="factor"><span>Token-less tenure · ${factors.tenure_days} days</span><b>×${factors.tenure_multiplier}</b></div>
          <div class="factor"><span>Chain breadth · ${factors.chain_count} chains</span><b>×${factors.chain_multiplier}</b></div>
          <div class="factor"><span>${escapeHtml(row.category || 'Uncategorised')} category adjustment</span><b>×${factors.category_multiplier}</b></div>
          <p>${row.confidence}. These are snapshot-based estimates, not launch odds or a token price.</p>
        </article>
        <article class="card">
          <h3>Practical activity plan</h3>
          <ol>${row.farm_steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
          <p>Costs are approximate activity budgets; actual fees vary by chain and position size. Do not spend for an assumed reward.</p>
        </article>
        <article class="card">
          <h3>Snapshot context</h3>
          <p>${escapeHtml(row.name)} is listed under ${escapeHtml(row.category || 'no category')} and tracks ${row.chains.length} chain${row.chains.length === 1 ? '' : 's'}. TVL is a point-in-time protocol metric, not market capitalization or user deposits you can safely access.</p>
          <p>First tracked: ${row.listed_at || 'not supplied'} · 7d change: ${formatPercent(row.change_7d)} · token metadata: none recorded in this snapshot.</p>
        </article>
        <article class="card">
          <h3>Research guidance</h3>
          <p>Confirm the official app and chain, inspect contract permissions, liquidity and withdrawal terms, and keep any test position small. DefiLlama’s snapshot records no token for this protocol; it makes no claim that one will launch.</p>
        </article>
      </div>`;
    $('#board').hidden = true;
    $('#detail').hidden = false;
    window.__shotReady = true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }
})();
