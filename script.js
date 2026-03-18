const GIPHY_API_KEY = 'tfbPBDAbBTLzoR5nGDp4Fs1wHK3jYSRf';
const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

const fallbackMedia = {
  fhellype: {
    character: 'Sanji',
    searchTerm: 'sanji one piece',
    stills: [
      'https://media.giphy.com/media/13SYnseWRwRSc8/giphy_s.gif',
      'https://media.giphy.com/media/l4EoSBIpWo73b9bW0/giphy_s.gif'
    ],
    gifs: [
      'https://media.giphy.com/media/13SYnseWRwRSc8/giphy.gif',
      'https://media.giphy.com/media/l4EoSBIpWo73b9bW0/giphy.gif'
    ]
  },
  clara: {
    character: 'Nico Robin',
    searchTerm: 'nico robin one piece',
    stills: [
      'https://media.giphy.com/media/3oKIPsx2VAYAgEHC12/giphy_s.gif',
      'https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy_s.gif'
    ],
    gifs: [
      'https://media.giphy.com/media/3oKIPsx2VAYAgEHC12/giphy.gif',
      'https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy.gif'
    ]
  }
};

const state = {
  mode: 'image',
  currentName: '',
  currentItems: [],
  currentIndex: 0
};

const loadingScreen = document.getElementById('loadingScreen');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const nextBtn = document.getElementById('nextBtn');
const imageModeBtn = document.getElementById('imageModeBtn');
const gifModeBtn = document.getElementById('gifModeBtn');
const viewer = document.getElementById('viewer');
const statusText = document.getElementById('statusText');
const currentSource = document.getElementById('currentSource');
const openOriginalLink = document.getElementById('openOriginalLink');

function normalizeName(value) {
  return value.trim().toLowerCase();
}

function chooseRandomIndex(length) {
  return Math.floor(Math.random() * length);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? '#ffb3a6' : '';
}

function setOriginalLink(url) {
  if (!url || url === '#') {
    openOriginalLink.classList.add('disabled');
    openOriginalLink.href = '#';
    return;
  }
  openOriginalLink.classList.remove('disabled');
  openOriginalLink.href = url;
}

function showEmpty(title, message) {
  viewer.className = 'viewer empty-state';
  viewer.innerHTML = `
    <div class="empty-icon">🧭</div>
    <h2>${title}</h2>
    <p>${message}</p>
  `;
  setOriginalLink('');
}

function renderCurrentItem() {
  const item = state.currentItems[state.currentIndex];
  if (!item) {
    showEmpty('Sem resultado', 'Nenhum resultado foi encontrado para essa busca.');
    return;
  }

  viewer.className = 'viewer';
  viewer.innerHTML = `
    <div class="media-wrap">
      <img src="${item.url}" alt="${item.title}" loading="eager" referrerpolicy="no-referrer" />
      <div class="media-caption">
        <div class="caption-main">
          <h2>${item.character}</h2>
          <p>${item.title}</p>
        </div>
        <span class="result-tag">${state.mode === 'gif' ? 'GIF' : 'Imagem'} ${state.currentIndex + 1}/${state.currentItems.length}</span>
      </div>
    </div>
  `;

  const mediaEl = viewer.querySelector('img');
  mediaEl.addEventListener('error', () => {
    showEmpty('Falha ao carregar', 'Esse resultado não abriu. Clique em Próximo resultado para tentar outro.');
  }, { once: true });

  setOriginalLink(item.original || item.url);
}

function buildFallbackItems(nameKey, mode) {
  const data = fallbackMedia[nameKey];
  if (!data) return [];
  const sourceArray = mode === 'gif' ? data.gifs : data.stills;
  return sourceArray.map((url, index) => ({
    url,
    original: url,
    title: `${data.character} ${mode === 'gif' ? 'GIF' : 'Imagem'} ${index + 1}`,
    character: data.character
  }));
}

function activateMode(mode) {
  state.mode = mode;
  imageModeBtn.classList.toggle('active', mode === 'image');
  gifModeBtn.classList.toggle('active', mode === 'gif');
  currentSource.textContent = mode === 'gif' ? 'Fonte: API real do GIPHY' : 'Fonte: imagens estáticas';

  if (state.currentName) handleSearch();
}

function searchStatic(nameKey) {
  const data = fallbackMedia[nameKey];
  if (!data) {
    setStatus('Digite apenas Fhellype ou Clara.', true);
    showEmpty('Nome não encontrado', 'Tente somente Fhellype ou Clara.');
    return;
  }

  state.currentName = nameKey;
  state.currentItems = buildFallbackItems(nameKey, 'image');
  state.currentIndex = chooseRandomIndex(state.currentItems.length);
  setStatus(`Mostrando uma imagem de ${data.character}.`);
  renderCurrentItem();
}

async function searchGiphy(nameKey) {
  const data = fallbackMedia[nameKey];
  if (!data) {
    setStatus('Digite apenas Fhellype ou Clara.', true);
    showEmpty('Nome não encontrado', 'Tente somente Fhellype ou Clara.');
    return;
  }

  state.currentName = nameKey;
  setStatus(`Buscando GIFs de ${data.character} na API do GIPHY...`);
  viewer.className = 'viewer empty-state';
  viewer.innerHTML = `
    <div class="empty-icon">⏳</div>
    <h2>Buscando no mar dos GIFs</h2>
    <p>Aguarde um instante enquanto a API responde.</p>
  `;
  setOriginalLink('');

  try {
    if (!GIPHY_API_KEY || GIPHY_API_KEY === 'COLE_SUA_CHAVE_AQUI') {
      throw new Error('API key ausente');
    }

    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      q: data.searchTerm,
      limit: '20',
      rating: 'pg',
      lang: 'pt'
    });

    const response = await fetch(`${GIPHY_ENDPOINT}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const items = (payload.data || []).map((gif) => {
      const animated = gif.images?.downsized_large?.url || gif.images?.original?.url || gif.images?.downsized?.url;
      const still = gif.images?.original_still?.url || gif.images?.downsized_still?.url || animated;
      if (!animated) return null;
      return {
        url: state.mode === 'gif' ? animated : still,
        original: gif.url,
        title: gif.title || data.character,
        character: data.character
      };
    }).filter(Boolean);

    if (!items.length) throw new Error('Sem resultados da API');

    state.currentItems = items;
    state.currentIndex = chooseRandomIndex(items.length);
    setStatus(`Mostrando um ${state.mode === 'gif' ? 'GIF' : 'resultado'} de ${data.character} vindo do GIPHY.`);
    renderCurrentItem();
  } catch (error) {
    console.error(error);
    state.currentItems = buildFallbackItems(nameKey, 'gif');
    state.currentIndex = chooseRandomIndex(state.currentItems.length);
    setStatus(`A API falhou agora, então usei GIFs de backup de ${data.character}.`, true);
    renderCurrentItem();
  }
}

function handleSearch() {
  const nameKey = normalizeName(searchInput.value);
  if (!nameKey) {
    setStatus('Digite Fhellype ou Clara.');
    showEmpty('Pesquisa vazia', 'Digite Fhellype ou Clara para começar.');
    return;
  }

  if (state.mode === 'gif') {
    searchGiphy(nameKey);
  } else {
    searchStatic(nameKey);
  }
}

function showNextItem() {
  if (!state.currentItems.length) {
    setStatus('Faça uma busca antes de pedir o próximo resultado.', true);
    return;
  }
  if (state.currentItems.length === 1) {
    renderCurrentItem();
    return;
  }

  let nextIndex = state.currentIndex;
  while (nextIndex === state.currentIndex) {
    nextIndex = chooseRandomIndex(state.currentItems.length);
  }
  state.currentIndex = nextIndex;
  renderCurrentItem();
}

searchBtn.addEventListener('click', handleSearch);
randomBtn.addEventListener('click', () => {
  const names = ['fhellype', 'clara'];
  const selected = names[chooseRandomIndex(names.length)];
  searchInput.value = selected === 'fhellype' ? 'Fhellype' : 'Clara';
  handleSearch();
});
nextBtn.addEventListener('click', showNextItem);
imageModeBtn.addEventListener('click', () => activateMode('image'));
gifModeBtn.addEventListener('click', () => activateMode('gif'));
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleSearch();
});

window.addEventListener('load', () => {
  setTimeout(() => loadingScreen.classList.add('hidden'), 1900);
});

activateMode('image');
