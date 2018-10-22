var PRODUCE = "produce";
var DAIRY = "dairy";

var CATEGORIES = {};
CATEGORIES[PRODUCE] = '';
CATEGORIES[DAIRY] = '';

var INGREDIENT_COL = 0;
var CATEGORY_COL   = 1;
var QUANTITY_COL   = 2;
var UNITS_COL      = 3;




/////////////////////////////////
// Initialization & Validation //
/////////////////////////////////

function initializeIngredientCategoryDict() {
  var ingredientCategoryDict = {};
  ingredientCategoryDict[PRODUCE] = [];
  ingredientCategoryDict[DAIRY] = [];
  
  return ingredientCategoryDict;
}

// TODO
function validateRecipes() {
  
}




///////////////////
// Parse Recipes //
///////////////////

function getRecipeSheet(recipeName) {
  var ingredientsSS = SpreadsheetApp.openById(INGREDIENTS_SPREADSHEET_ID);
  var recipeSheet = ingredientsSS.getSheetByName(recipeName);
  
  return recipeSheet;
}

function readRecipeNamesAndMultipliers(recipeName, quantity, ingredientCategoryDict) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var recipeSheet = getRecipeSheet(recipeName);
  var values = recipeSheet.getDataRange().getValues();
  for (row = 1; row < values.length; ++row) {
    var ingredientName = values[row][INGREDIENT_COL];
    var category = values[row][CATEGORY_COL];
    if (!(category in CATEGORIES)) {
      Logger.log("Inva/lid category found: " + category);
      continue;
    }
    
    // TODO: more validation on these fields. Or maybe create a separate validate function that main should call.
    var quantity = values[row][QUANTITY_COL];
    var units = values[row][UNITS_COL];
    
    ingredientCategoryDict[category].push([ingredientName, quantity, units]);
  }
  
  var firstIngredientName = ingredientCategoryDict[PRODUCE][0];
  
  var sheet = ss.getSheets()[0];
  var cell = sheet.getRange('B1').setValue(firstIngredientName);
}




/////////////////////
// Post-Processing //
/////////////////////

function alphabetizeCategories(ingredientCategoryDict) {
  for (var key in ingredientCategoryDict) {
    // Check if the property/key is defined in the object itself, not in parent.
    if (ingredientCategoryDict.hasOwnProperty(key)) {
      var category = key;
      var ingredientList = ingredientCategoryDict[categoryName];
    }
}




/////////////////////////
// Build Shopping List //
/////////////////////////

function buildShoppingListName() {
  var today = new Date();
  var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  return date;
}

function addCategoryHeaders(categoryName, row, shoppingListSheet) {
  shoppingListSheet.getRange('A' + row).setValue(categoryName);
  shoppingListSheet.getRange(INGREDIENT_COL_OUTPUT + row).setValue(INGREDIENT_TITLE);
  shoppingListSheet.getRange(QUANTITY_COL_OUTPUT   + row).setValue(QUANTITY_TITLE);
  shoppingListSheet.getRange(UNITS_COL_OUTPUT      + row).setValue(UNITS_TITLE);
}

function addIngredientToRow(ingredientArray, row, shoppingListSheet) {
  var ingredientName = ingredientArray[0];
  var quantity = ingredientArray[1];
  var units = ingredientArray[2];
  
  shoppingListSheet.getRange(INGREDIENT_COL_OUTPUT + row).setValue(ingredientName);
  shoppingListSheet.getRange(QUANTITY_COL_OUTPUT   + row).setValue(quantity);
  shoppingListSheet.getRange(UNITS_COL_OUTPUT      + row).setValue(units);
}

function buildShoppingList(ingredientCategoryDict) {
  var shoppingListSS = SpreadsheetApp.openById(SHOPPING_LIST_SPREADSHEET_ID);
  
  var shoppingListSheetName = buildShoppingListName();
  
  // Look for existing shopping list generated today, and delete it if it exists.
  var oldShoppingListSheet = shoppingListSS.getSheetByName(shoppingListSheetName);
  if (oldShoppingListSheet) {
    shoppingListSS.deleteSheet(oldShoppingListSheet);
  }
  
  // Create new shopping list.
  var shoppingListSheet = shoppingListSS.insertSheet(shoppingListSheetName, 0);
  
  var nextCategoryRow = 1;
  for (var key in ingredientCategoryDict) {
    // Check if the property/key is defined in the object itself, not in parent.
    if (ingredientCategoryDict.hasOwnProperty(key)) {           
      var categoryName = key;
      var ingredientList = ingredientCategoryDict[categoryName];
      
      var numIngredients = ingredientList.length;
      if (numIngredients > 0) {
        addCategoryHeaders(categoryName, nextCategoryRow, shoppingListSheet);
        var firstIngredientRow = nextCategoryRow + 1;
        for (ingredientIdx = 0; ingredientIdx < numIngredients; ++ingredientIdx)
        {
          var ingredientArray = ingredientList[ingredientIdx];
          var ingredientRow = firstIngredientRow + ingredientIdx;
          addIngredientToRow(ingredientArray, ingredientRow, shoppingListSheet);
        }
        
        nextCategoryRow += numIngredients + 2; // 1 for the category header itself, and 1 for a space between categories
      }
    }
  }
}

// TODO: ingredients of the same name must be converted to the same units in order to be combined
// TODO: alphabetize each category
// TODO: think about throwing if invalid input found. Failing silently isn't good in this case.
// TODO: onEdit() syntax checking in the sheet
// TODO: make optional function that splits list into different stores (Costco, Safeway, etc)