// Global app controller
import Search from "../models/Search";
import Recipe from "../models/Recipe";
import List from "../models/List";
import Likes from "../models/Likes";
import * as searchView from "../views/searchView";
import * as recipeView from "../views/recipeView";
import * as listView from "../views/listView";
import * as likesView from "../views/likesView";
import { elements, renderLoader, clearLoader } from "../views/base";

// Global state of the app
// Search object
// Current recipe object
// Shopping list object
// Liked Recipes
const state = {};

/**
 * SEARCH CONTROLLER
 **/
const controlSearch = async () => {
  // get the query from the view
  const query = searchView.getInput(); // TODO

  if (query) {
    // new search object and add to state
    state.search = new Search(query);

    // prepare the ui for the results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // search for recipes
      await state.search.getResults();

      // render results to UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something went wrong with the search");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});
elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 **/
const controlRecipe = async () => {
  // get id from the url
  const id = window.location.hash.replace("#", "");

  if (id) {
    // prepare ui for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // highlight selected search item
    if (state.search) searchView.highlightSelected(id);
    // create new recipe object
    state.recipe = new Recipe(id);

    try {
      // get recipe data and parse ingredients
      await state.recipe.getRecipe();

      state.recipe.parseIngredients();

      // calculate the servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      // render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      alert("Error processing the recipe");
    }
  }
};

["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/**
 * LIST CONTROLLER
 **/

const controlList = () => {
  // create a new list if there is none yet
  if (!state.list) state.list = new List();

  // add each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// handle delete and update list item
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // handle the delete event
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // delete from the state
    state.list.deleteItem(id);
    // delete from ui
    listView.deleteItem(id);
    // handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/**
 * LIKE CONTROLLER
 **/
// TESTING

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  // user has NOT yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // add the like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // toggle the like button
    likesView.toggleLikeBtn(true);
    // add like to the UI list
    likesView.renderLike(newLike);
    // user has liked the current recipe
  } else {
    // remove like from the state
    state.likes.deleteLike(currentID);
    // toggle the like button
    likesView.toggleLikeBtn(false);
    // remove like from UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// restore liked recipes on page load
window.addEventListener("load", () => {
  state.likes = new Likes();
  // restore likes
  state.likes.readStorage();
  // toggle like menu
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  // render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  // * indicates any child element of this class
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    // increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    // add ingredients to the shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    // like controller
    controlLike();
  }
});
