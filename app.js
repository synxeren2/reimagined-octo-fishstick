// API Anahtarları
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWVhY2E0MjliNjA1MjNlNjJlYjM0NmUyY2IzNTI1MSIsIm5iZiI6MTc2MTE0NDA4OS4yMTEsInN1YiI6IjY4ZjhlZDE5ZGNkMjQ2ODlmMGRiYzU3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bKYrzl2t-LQsJa3uq-EtBuqPJEzW7vlV9E0e77IkHxw';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ICEFY_BASE_URL = 'https://embed.icefy.top';

// DOM Elementleri
const seriesContainer = document.getElementById('seriesContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentFilter = 'popular';
let currentSeriesId = null;
let currentSeriesName = null;

// İlk Yükleme
document.addEventListener('DOMContentLoaded', () => {
    loadSeries('popular');
    attachEventListeners();
});

// Event Listeners
function attachEventListeners() {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchSeries(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchSeries(query);
            }
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadSeries(currentFilter);
            searchInput.value = '';
        });
    });

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// TMDB API İsteği
async function fetchFromTMDB(endpoint, params = {}) {
    try {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_API_KEY}`
            }
        };

        const queryString = new URLSearchParams({
            language: 'tr-TR',
            ...params
        }).toString();

        const response = await fetch(
            `${TMDB_BASE_URL}${endpoint}?${queryString}`,
            options
        );

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('TMDB API Hatası:', error);
        showError('Veri yükleme başarısız oldu');
        return null;
    }
}

// Dizi Yükleme
async function loadSeries(filter) {
    showLoading(true);
    seriesContainer.innerHTML = '';

    const endpoint = `/tv/${filter}`;
    const data = await fetchFromTMDB(endpoint, { page: 1 });

    if (data && data.results) {
        displaySeries(data.results);
    }

    showLoading(false);
}

// Dizi Arama
async function searchSeries(query) {
    showLoading(true);
    seriesContainer.innerHTML = '';

    const data = await fetchFromTMDB('/search/tv', { query });

    if (data && data.results) {
        if (data.results.length === 0) {
            seriesContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: #999;">Sonuç bulunamadı</p>';
        } else {
            displaySeries(data.results);
        }
    }

    showLoading(false);
}

// Dizi Gösterme
function displaySeries(series) {
    series.forEach(show => {
        const card = createSeriesCard(show);
        seriesContainer.appendChild(card);
    });
}

// Dizi Kartı Oluştur
function createSeriesCard(show) {
    const card = document.createElement('div');
    card.className = 'series-card';

    const posterUrl = show.poster_path
        ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
        : null;

    const releaseYear = show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : 'Bilinmeyen';

    const rating = show.vote_average
        ? show.vote_average.toFixed(1)
        : 'N/A';

    card.innerHTML = `
        <div class="poster-container">
            ${posterUrl 
                ? `<img src="${posterUrl}" alt="${show.name}" loading="lazy">` 
                : `<div class="no-poster">Poster Yok</div>`
            }
        </div>
        <div class="series-info">
            <h3 class="series-title">${show.name}</h3>
            <div class="series-rating">
                ⭐ ${rating}
            </div>
            <div class="series-year">${releaseYear}</div>
            <p class="series-overview">${show.overview || 'Açıklama bulunmamaktadır'}</p>
            <button class="watch-btn" data-id="${show.id}">İzle</button>
        </div>
    `;

    const watchBtn = card.querySelector('.watch-btn');
    watchBtn.addEventListener('click', () => {
        currentSeriesId = show.id;
        currentSeriesName = show.name;
        showSeriesDetails(show.id);
    });

    return card;
}

// Dizi Detayları Göster
async function showSeriesDetails(seriesId) {
    showLoading(true);

    const data = await fetchFromTMDB(`/tv/${seriesId}`);

    if (data) {
        displayModal(data);
    }

    showLoading(false);
}

// Modal Göster
function displayModal(show) {
    const posterUrl = show.poster_path
        ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
        : null;

    const genres = show.genres && show.genres.length > 0
        ? show.genres.map(g => g.name).join(', ')
        : 'Bilinmeyen';

    const status = show.status || 'Bilinmeyen';
    const totalSeasons = show.number_of_seasons || 0;

    let content = `
        <div class="modal-header">
            ${posterUrl ? `<img src="${posterUrl}" alt="${show.name}" class="modal-poster">` : ''}
            <div class="modal-header-info">
                <h2 class="modal-title">${show.name}</h2>
                <div class="modal-rating">⭐ ${show.vote_average?.toFixed(1) || 'N/A'}/10</div>
                <div class="modal-info">
                    <p><strong>Durumu:</strong> ${status}</p>
                    <p><strong>İlk Yayın:</strong> ${show.first_air_date || 'Bilinmeyen'}</p>
                    <p><strong>Son Yayın:</strong> ${show.last_air_date || 'Devam ediyor'}</p>
                    <p><strong>Toplam Sezon:</strong> ${totalSeasons}</p>
                    <p><strong>Toplam Bölüm:</strong> ${show.number_of_episodes || '0'}</p>
                    <div class="modal-genres">
                        <strong>Türler:</strong> ${genres}
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-info">
            <h3>Açıklama</h3>
            <p>${show.overview || 'Açıklama bulunmamaktadır'}</p>
        </div>
    `;

    // Sezon ve Bölüm Seçici
    if (totalSeasons > 0) {
        content += `
            <div class="episodes-container">
                <h3>Sezonlar</h3>
                <div class="season-selector" id="seasonSelector">
        `;

        for (let season = 1; season <= totalSeasons; season++) {
            content += `<button class="season-btn" data-season="${season}">Sezon ${season}</button>`;
        }

        content += `
                </div>
                <div id="playerContainer"></div>
                <div id="episodesList"></div>
            </div>
        `;
    }

    modalBody.innerHTML = content;

    // Sezon butonlarına event listener ekle
    if (totalSeasons > 0) {
        const seasonBtns = document.querySelectorAll('.season-btn');
        seasonBtns[0].classList.add('active');
        
        seasonBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                seasonBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const season = parseInt(btn.dataset.season);
                loadSeasonDetails(currentSeriesId, season);
            });
        });

        // İlk sezon verilerini yükle
        loadSeasonDetails(currentSeriesId, 1);
    }

    modal.classList.add('show');
}

// Sezon Detaylarını Yükle
async function loadSeasonDetails(seriesId, seasonNumber) {
    const playerContainer = document.getElementById('playerContainer');
    const episodesList = document.getElementById('episodesList');
    
    playerContainer.innerHTML = '<p style="text-align: center; color: #00d4ff;">Yükleniyor...</p>';
    episodesList.innerHTML = '';

    const data = await fetchFromTMDB(`/tv/${seriesId}/season/${seasonNumber}`);

    if (data && data.episodes) {
        // İlk bölümü oynat
        const firstEpisode = data.episodes[0];
        const playerHtml = `
            <div class="player-container">
                <iframe 
                    src="${ICEFY_BASE_URL}/tv?id=${seriesId}&season=${seasonNumber}&episode=${firstEpisode.episode_number}"
                    frameborder="0"
                    allowfullscreen
                    allow="autoplay"
                ></iframe>
            </div>
        `;
        playerContainer.innerHTML = playerHtml;

        // Bölümleri listele
        displayEpisodes(data.episodes, seriesId, seasonNumber);
    } else {
        playerContainer.innerHTML = '<p class="error-message">Bölüm yüklenemedi</p>';
    }
}

// Bölümleri Göster
function displayEpisodes(episodes, seriesId, seasonNumber) {
    const episodesList = document.getElementById('episodesList');
    const playerContainer = document.getElementById('playerContainer');
    
    let html = '<div class="episodes-list">';

    episodes.forEach(episode => {
        const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString('tr-TR') : 'Yayınlanmadı';
        
        html += `
            <div class="episode-item" data-episode="${episode.episode_number}">
                <h4>Bölüm ${episode.episode_number} - ${episode.name}</h4>
                <p><strong>Yayın Tarihi:</strong> ${airDate}</p>
                <p class="episode-overview">${episode.overview || 'Açıklama bulunmamaktadır'}</p>
            </div>
        `;
    });

    html += '</div>';
    episodesList.innerHTML = html;

    // Bölüm seçimi için event listener
    const episodeItems = document.querySelectorAll('.episode-item');
    episodeItems.forEach(item => {
        item.addEventListener('click', () => {
            const episodeNumber = parseInt(item.dataset.episode);
            playerContainer.innerHTML = `
                <div class="player-container">
                    <iframe 
                        src="${ICEFY_BASE_URL}/tv?id=${seriesId}&season=${seasonNumber}&episode=${episodeNumber}"
                        frameborder="0"
                        allowfullscreen
                        allow="autoplay"
                    ></iframe>
                </div>
            `;
            
            // Aktif bölümü vurgula
            episodeItems.forEach(e => e.style.borderLeftColor = '#00d4ff');
            item.style.borderLeftColor = '#00ff00';
        });
    });
}

// Modal Kapat
function closeModal() {
    modal.classList.remove('show');
    modalBody.innerHTML = '';
    currentSeriesId = null;
    currentSeriesName = null;
}

// Yükleme Göstergesi
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.add('show');
    } else {
        loadingIndicator.classList.remove('show');
    }
}

// Hata Göster
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}