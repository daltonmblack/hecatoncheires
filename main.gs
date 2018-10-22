// Available Recipes
// These are mapped to their exact sheet name in: https://docs.google.com/spreadsheets/d/1VZgyE8irKxj4JUVSgT6C286jD0hxqnRAFDhNeMXqcOs/
var BASIL_MEATLOAF = "Basil Meatloaf";

////////////////////////////////////////////////////////////////////
// Fill this in with desired recipes & quantities of each recipe. //
////////////////////////////////////////////////////////////////////

var recipesAndQuantities = {};
recipesAndQuantities[BASIL_MEATLOAF] = 1;


function main() {
  var ingredientCategoryDict = initializeIngredientCategoryDict();
  
  for (var key in recipesAndQuantities) {
    // check if the property/key is defined in the object itself, not in parent.
    if (recipesAndQuantities.hasOwnProperty(key)) {           
      var recipeName = key;
      var quantity = recipesAndQuantities[recipeName];
      
      readRecipeNamesAndMultipliers(recipeName, quantity, ingredientCategoryDict);
    }
  }
  
  buildShoppingList(ingredientCategoryDict);
}
