document.addEventListener('DOMContentLoaded', function() {
    initializeArchiveFilters();
    initializeCardHovers();
});

function initializeCardHovers() {
    document.querySelectorAll('.recipe-card').forEach(card => {
        const randomRotation = (Math.random() - 0.5) * 2;
        card.style.transform = `rotate(${randomRotation}deg)`;

        card.addEventListener('mouseenter', function() {
            const hoverRotation = (Math.random() - 0.5) * 2;
            this.style.transform = `translateY(-4px) rotate(${hoverRotation}deg)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = `rotate(${randomRotation}deg)`;
        });
    });
}

function initializeArchiveFilters() {
    const difficultyFilter = document.getElementById('difficulty-filter');
    const timeFilter = document.getElementById('time-filter');
    const sortSelect = document.getElementById('sort-select');
    const recipeGrid = document.querySelector('.recipe-grid');
    const searchInput = document.getElementById('recipe-search');
    const resultsCount = document.getElementById('results-count');

    const toolFilterToggle = document.getElementById('tool-filter-toggle');
    const toolFilterDropdown = document.getElementById('tool-filter-dropdown');
    const toolCheckboxes = document.querySelectorAll('.tool-checkbox');
    const allToolsCheckbox = document.getElementById('all-tools-checkbox');
    const selectedToolsPills = document.getElementById('selected-tools-pills');
    const toolFilterLabel = document.getElementById('tool-filter-label');

    if (!difficultyFilter || !timeFilter || !sortSelect) return;

    let selectedTools = [];

    if (toolFilterToggle) {
        toolFilterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = toolFilterDropdown.style.display !== 'none';
            toolFilterDropdown.style.display = isOpen ? 'none' : 'block';
            toolFilterToggle.classList.toggle('open', !isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!toolFilterToggle.contains(e.target) && !toolFilterDropdown.contains(e.target)) {
                toolFilterDropdown.style.display = 'none';
                toolFilterToggle.classList.remove('open');
            }
        });
    }

    if (allToolsCheckbox) {
        allToolsCheckbox.addEventListener('change', () => {
            const isChecked = allToolsCheckbox.checked;
            toolCheckboxes.forEach(cb => { cb.checked = isChecked; });
            selectedTools = isChecked ? Array.from(toolCheckboxes).map(cb => cb.value) : [];
            updateToolPills();
            updateToolFilterLabel();
            applyFiltersAndSort();
        });
    }

    toolCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            selectedTools = Array.from(toolCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
            if (allToolsCheckbox) {
                allToolsCheckbox.checked = Array.from(toolCheckboxes).every(cb => cb.checked);
            }
            updateToolPills();
            updateToolFilterLabel();
            applyFiltersAndSort();
        });
    });

    function updateToolPills() {
        selectedToolsPills.innerHTML = '';
        selectedTools.forEach(tool => {
            const pill = document.createElement('span');
            pill.className = 'tool-pill';
            pill.innerHTML = `${tool} <span class="tool-pill-remove" data-tool="${tool}">×</span>`;
            selectedToolsPills.appendChild(pill);
        });

        document.querySelectorAll('.tool-pill-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.getAttribute('data-tool');
                const checkbox = Array.from(toolCheckboxes).find(cb => cb.value === tool);
                if (checkbox) checkbox.checked = false;
                selectedTools = selectedTools.filter(t => t !== tool);
                updateToolPills();
                updateToolFilterLabel();
                applyFiltersAndSort();
            });
        });
    }

    function updateToolFilterLabel() {
        if (selectedTools.length === 0) {
            toolFilterLabel.textContent = 'All Tools';
        } else if (selectedTools.length === 1) {
            toolFilterLabel.textContent = selectedTools[0];
        } else {
            toolFilterLabel.textContent = `${selectedTools.length} Tools`;
        }
    }

    function applyFiltersAndSort() {
        const difficulty = difficultyFilter.value;
        const time = timeFilter.value;
        const sortBy = sortSelect.value;
        const searchTerm = ((searchInput && searchInput.value) || '').trim().toLowerCase();
        const emptyState = document.getElementById('empty-state');
        const cards = Array.from(recipeGrid.querySelectorAll('.recipe-card'));

        cards.forEach(card => {
            let show = true;

            if (difficulty !== 'all') {
                if (card.getAttribute('data-difficulty') !== difficulty) show = false;
            }

            if (time !== 'all') {
                const cardTime = parseInt(card.getAttribute('data-time'));
                if (time === 'quick' && cardTime > 10) show = false;
                if (time === 'medium' && (cardTime < 15 || cardTime > 20)) show = false;
                if (time === 'long' && cardTime < 30) show = false;
            }

            if (selectedTools.length > 0) {
                const cardTools = (card.getAttribute('data-tools') || '').split(',');
                if (!selectedTools.some(tool => cardTools.includes(tool))) show = false;
            }

            if (searchTerm) {
                const titleEl = card.querySelector('.recipe-title');
                const subEl = card.querySelector('.recipe-subtitle');
                const teaserEl = card.querySelector('.recipe-teaser');
                const haystack = [
                    titleEl ? titleEl.textContent : '',
                    subEl ? subEl.textContent : '',
                    teaserEl ? teaserEl.textContent : '',
                    card.getAttribute('data-tools') || ''
                ].join(' ').toLowerCase();
                if (!haystack.includes(searchTerm)) show = false;
            }

            card.style.display = show ? 'block' : 'none';
        });

        const visibleCards = cards.filter(card => card.style.display !== 'none');

        if (emptyState) {
            emptyState.style.display = visibleCards.length === 0 ? 'block' : 'none';
            recipeGrid.style.display = visibleCards.length === 0 ? 'none' : 'grid';
        }

        if (resultsCount) {
            const total = cards.length;
            const shown = visibleCards.length;
            resultsCount.textContent = shown === total
                ? 'Showing all ' + total + ' recipes'
                : 'Showing ' + shown + ' of ' + total + ' recipes';
        }

        visibleCards.sort((a, b) => {
            if (sortBy === 'popular') return parseFloat(b.getAttribute('data-popularity')) - parseFloat(a.getAttribute('data-popularity'));
            if (sortBy === 'newest') return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
            if (sortBy === 'oldest') return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
            return 0;
        });

        visibleCards.forEach(card => recipeGrid.appendChild(card));
    }

    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            difficultyFilter.value = 'all';
            timeFilter.value = 'all';
            sortSelect.value = 'popular';
            if (searchInput) searchInput.value = '';
            toolCheckboxes.forEach(cb => cb.checked = false);
            if (allToolsCheckbox) allToolsCheckbox.checked = false;
            selectedTools = [];
            updateToolPills();
            updateToolFilterLabel();
            applyFiltersAndSort();
        });
    }

    difficultyFilter.addEventListener('change', applyFiltersAndSort);
    timeFilter.addEventListener('change', applyFiltersAndSort);
    sortSelect.addEventListener('change', applyFiltersAndSort);
    if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort);

    setTimeout(applyFiltersAndSort, 100);
}

console.log('%c🍳 Idea Kitchen', 'font-size: 20px; font-weight: bold; color: #C98B50;');
console.log('%cAI recipes for busy professionals. ideakitchen.substack.com', 'font-size: 12px; color: #5C3D3A;');
