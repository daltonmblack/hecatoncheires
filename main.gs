function main() {
  var ingredientCategoryDict = initialize();
  
  var recipesAndBatches = getRecipesAndBatches();
  for (idx = 0; idx < recipesAndBatches.length; ++idx) {
    var recipeAndBatchesEntry = recipesAndBatches[idx];
    var recipeName = recipeAndBatchesEntry[0];
    var numberOfBatches = recipeAndBatchesEntry[1];
    
    readRecipeNamesAndMultipliers(recipeName, numberOfBatches, ingredientCategoryDict);
  }
  
  alphabetizeCategories(ingredientCategoryDict);
  condenseDuplicateIngredients(ingredientCategoryDict);
  buildShoppingList(ingredientCategoryDict);
}
