const url = 'https://pokeapi.co/api/v2/pokemon?limit=30&offset=463';

const pokemonContainer = document.getElementById('pokemonContainer');
const favsContainer = document.getElementById('favsContainer');

const mainSortButton = document.getElementById('mainSortButton');
const favsSortButton = document.getElementById('favsSortButton');
const ascText = 'A-Z';
const descText = 'Z-A';

const totalNumberSpan = document.getElementById('totalPokemonCount');
const totalLegendarySpan = document.getElementById('totalLegendaryCount');
let totalReturnedPokemon = 0;
let legendaryCount = 0;

// localStorage initialize and functions
let favoritePokemonJSON = localStorage.getItem('favoritePokemon');
let favoritePokemon = new Set();

if (favoritePokemonJSON) {
  favoritePokemon = new Set(JSON.parse(favoritePokemonJSON));
}

const addToLocalStorage = (id) => {
  favoritePokemon.add(id);
  updateLocalStorage();
};

const removeFromLocalStorage = (id) => {
  favoritePokemon.delete(id);
  updateLocalStorage();
};

const updateLocalStorage = () => {
  localStorage.setItem('favoritePokemon', JSON.stringify(Array.from(favoritePokemon)));
};

const pokemonInStorage = (id) => favoritePokemon.has(id);

// fetch elements from api
const fetchData = async (url) => {
  if (!url) return 'cannot find URL';
  console.log('fetching url...');
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.error(error);
  }
};

// get main pokemon data
const getPokemonData = async (rawData) => {
  try {
    const promises = rawData.results.map(async (item) => {
      const response = await fetch(item.url);
      return response.json();
    });
    const pokemonData = await Promise.all(promises);
    totalReturnedPokemon = Math.floor(pokemonData.length / 10) * 10 - 10;
    console.log('pokemon data: success');
    return pokemonData;
  } catch (error) {
    console.error(error);
  }
};

// get the species data from pokemon to calculate num of legendaries
const getSpeciesData = async (pokeData) => {
  try {
    const promises = pokeData.map(async (item) => {
      const response = await fetch(item.species.url);
      return response.json();
    });
    const legendaryData = await Promise.all(promises);
    calculateLegendaryCount(legendaryData);
    console.log('species data: success');
  } catch (error) {
    console.error(error);
  }
};

// generate the HTML for each pokemon card
const createPokemonElements = (data) => {
  data.forEach((pokemon) => {
    const pokemonCard = document.createElement('div');
    pokemonCard.classList.add('data-cards');
    pokemonCard.setAttribute('data-id', pokemon.id);

    const pokemonImage = document.createElement('img');
    pokemonImage.classList.add('card-img');
    pokemonImage.src = pokemon.sprites.front_default;
    pokemonImage.alt = pokemon.name;

    const pokemonIndex = document.createElement('span');
    pokemonIndex.classList.add('dex-num');
    pokemonIndex.textContent = pokemon.id;

    const pokemonName = document.createElement('span');
    pokemonName.classList.add('name');
    pokemonName.textContent = pokemon.name;

    const favoriteButton = document.createElement('i');
    favoriteButton.classList.add('fa-solid', 'fa-heart');

    const unfavoriteButton = document.createElement('i');
    unfavoriteButton.classList.add('fa-solid', 'fa-heart-crack');

    pokemonCard.appendChild(pokemonImage);
    pokemonCard.appendChild(pokemonIndex);
    pokemonCard.appendChild(pokemonName);
    pokemonCard.addEventListener('click', addRemoveFavorite);

    if (pokemonInStorage(pokemon.id.toString())) {
      pokemonCard.appendChild(unfavoriteButton);
      favsContainer.appendChild(pokemonCard);
    } else {
      pokemonCard.appendChild(favoriteButton);
      pokemonContainer.appendChild(pokemonCard);
    }
  });
  console.log('cards HTML: success');
};

// main fetch calls
fetchData(url)
  .then((data) => getPokemonData(data))
  .then((data) => {
    getSpeciesData(data);
    totalNumberSpan.innerText = totalReturnedPokemon;
    createPokemonElements(data);
  })
  .then(() => {
    [mainSortButton, favsSortButton].forEach((btn) => {
      btn.addEventListener('click', sortPokemon);
    });
  });

// function to add/remove card from favorites list
const addRemoveFavorite = (e) => {
  const card = e.currentTarget;
  const id = card.getAttribute('data-id');
  const heartIcon = card.querySelector('i.fa-heart');

  const params = heartIcon
    ? [favsContainer, 'fa-heart', 'fa-heart-crack']
    : [pokemonContainer, 'fa-heart-crack', 'fa-heart'];

  params[0].appendChild(card);
  heartIcon.classList.remove(params[1]);
  heartIcon.classList.add(params[2]);

  heartIcon ? addToLocalStorage(id) : removeFromLocalStorage(id);
};

const sortCallback = (sortOrder) => (a, b) => {
  const nameA = a.querySelector('.name').innerText;
  const nameB = b.querySelector('.name').innerText;
  return sortOrder === 'desc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
};

// sort button functionality
const sortPokemon = (e) => {
  const target = e.currentTarget;
  const container = target.id === 'mainSortButton' ? pokemonContainer : favsContainer;

  const containerCards = container.querySelectorAll('.data-cards');
  const cardsArray = Array.from(containerCards);

  let sortOrder = target.getAttribute('data-order');
  target.setAttribute('data-order', sortOrder === 'desc' ? 'asc' : 'desc');
  target.innerText = sortOrder === 'desc' ? ascText : descText;

  cardsArray.sort(sortCallback(sortOrder)).forEach((card) => {
    container.appendChild(card);
  });
};

// total number of legendaries from the fetched list of pokemon
const calculateLegendaryCount = (data) => {
  for (let i of data) {
    if (i.is_legendary === true) {
      legendaryCount += 1;
    }
  }
  totalLegendarySpan.innerText = legendaryCount;
};
