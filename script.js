const GIPHY_API_KEY = 'COLE_SUA_CHAVE_AQUI';
const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

const localImages = {
  fhellype: {
    character: 'Sanji',
    searchTerm: 'Sanji One Piece',
    items: [
      {
        url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 1',
        source: 'Galeria local do site'
      },
      {
        url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 2',
        source: 'Galeria local do site'
      },
      {
        url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 3',
        source: 'Galeria local do site'
      }
    ]
  },
  clara: {
    character: 'Nico Robin',
    searchTerm: 'Nico Robin One Piece',
    items: [
      {
        url: 'https://images.unsplash.com/photo-1516972810927-80185027ca84?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 1',
        source: 'Galeria local do site'
      },
      {
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 2',
        source: 'Galeria local do site'
      },
      {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        title: 'Retrato estilizado 3',
        source: 'Galeria local do site'
      }
    ]
  }
};

const aliases = {
  fhellype: {
    character: 'Sanji',
    searchTerm: 'sanji one piece'
  },
  clara: {
    character: 'Nico Robin',
    searchTerm: 'nico robin one piece'
  }
};

const state = {
  mode: 'image',
  currentName: '',
  currentItems: [],
  currentIndex: 0
};

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

function activateMode(mode) {
  state.mode = mode;
  imageModeBtn.classList.toggle('active', mode === 'image');
  gifModeBtn.classList.toggle('active', mode === 'gif');
  currentSource.textContent = mode === 'gif' ? 'Fonte: API real do GIPHY' : 'Fonte: galeria local';

  if (state.currentName) {
    handleSearch();
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? '#ffb3a6' : '';
}

function setOriginalLink(url) {
  if (!url) {
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
      <img src="${item.url}" alt="${item.title}" loading="eager" />
      <div class="media-caption">
        <div class="caption-main">
          <h2>${item.character}</h2>
          <p>${item.title}</p>
        </div>
        <span class="result-tag">${state.mode === 'gif' ? 'GIF' : 'Imagem'} ${state.currentIndex + 1}/${state.currentItems.length}</span>
      </div>
    </div>
  `;

  setOriginalLink(item.original || item.url);
}

function chooseRandomIndex(length) {
  return Math.floor(Math.random() * length);
}

function searchLocalImages(nameKey) {
  const data = localImages[nameKey];

  if (!data) {
    setStatus('Digite apenas Fhellype ou Clara.', true);
    showEmpty('Nome não encontrado', 'Tente somente Fhellype ou Clara.');
    return;
  }

  state.currentName = nameKey;
  state.currentItems = data.items.map((item) => ({
    ...item,
    character: data.character,
    original: item.url
  }));
  state.currentIndex = chooseRandomIndex(state.currentItems.length);

  setStatus(`Mostrando uma imagem local aleatória de ${data.character}.`);
  renderCurrentItem();
}

async function searchGiphy(nameKey) {
  const mapping = aliases[nameKey];

  if (!mapping) {
    setStatus('Digite apenas Fhellype ou Clara.', true);
    showEmpty('Nome não encontrado', 'Tente somente Fhellype ou Clara.');
    return;
  }

  if (!GIPHY_API_KEY || GIPHY_API_KEY === 'COLE_SUA_CHAVE_AQUI') {
    setStatus('Adicione sua API key do GIPHY no arquivo script.js para ativar o modo GIF.', true);
    showEmpty('API key necessária', 'Abra o arquivo script.js e substitua COLE_SUA_CHAVE_AQUI pela sua chave do GIPHY.');
    return;
  }

  state.currentName = nameKey;
  setStatus(`Buscando GIFs de ${mapping.character} na API do GIPHY...`);
  viewer.className = 'viewer empty-state';
  viewer.innerHTML = `
    <div class="empty-icon">⏳</div>
    <h2>Buscando no mar dos GIFs</h2>
    <p>Aguarde um instante enquanto a API responde.</p>
  `;
  setOriginalLink('');

  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      q: mapping.searchTerm,
      limit: '18',
      rating: 'g',
      lang: 'pt'
    });

    const response = await fetch(`${GIPHY_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = (payload.data || [])
      .map((gif) => {
        const rendition = gif.images?.original || gif.images?.downsized_large || gif.images?.downsized;
        if (!rendition?.url) return null;

        return {
          url: rendition.url,
          original: gif.url,
          title: gif.title || mapping.character,
          character: mapping.character
        };
      })
      .filter(Boolean);

    if (!items.length) {
      setStatus(`Nenhum GIF encontrado para ${mapping.character}.`, true);
      showEmpty('Sem GIF encontrado', 'A API do GIPHY não retornou resultados nessa tentativa.');
      return;
    }

    state.currentItems = items;
    state.currentIndex = chooseRandomIndex(items.length);
    setStatus(`Mostrando um GIF aleatório de ${mapping.character} vindo da API real do GIPHY.`);
    renderCurrentItem();
  } catch (error) {
    console.error(error);
    setStatus('Não foi possível buscar no GIPHY agora. Verifique a chave e tente de novo.', true);
    showEmpty('Erro na API', 'Confira sua API key, a internet e tente novamente.');
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
    return;
  }

  searchLocalImages(nameKey);
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

activateMode('image');
