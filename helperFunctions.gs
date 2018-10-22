// This is a dictionary in order to check key membership.
// The version of JavaScript that Google Apps Scripts uses does not have the
// sets datatype.
var CATEGORIES = {};




/////////////////////////////////
// Initialization & Validation //
/////////////////////////////////

function initializeCategories(ingredientsSS) {
  var categoriesSheet = ingredientsSS.getSheetByName(CATEGORIES_SHEET_NAME);
  var values = categoriesSheet.getDataRange().getValues();
  for (row = 0; row < values.length; ++row) {
    var category = values[row][0];
    CATEGORIES[category] = '';
  }
}

// Requires that the CATEGORIES dictionary is initialized prior to this function being run.
function initializeCategoryDict() {
  var ingredientCategoryDict = {};
  
  for (var key in CATEGORIES) {
    // Check if the property/key is defined in the object itself, not in parent.
    if (CATEGORIES.hasOwnProperty(key)) {
      var category = key;
      ingredientCategoryDict[category] = [];
    }
  }
  
  return ingredientCategoryDict;
}

function getRecipesAndBatches() {
  var ingredientsSS = SpreadsheetApp.openById(INGREDIENTS_SPREADSHEET_ID);
  var recipesInputSheet = ingredientsSS.getSheetByName(RECIPES_INPUT_SHEET_NAME);
  
  var recipesAndBatches = [];
  
  var recipeValues = recipesInputSheet.getDataRange().getValues();
  for (row = 1; row < recipeValues.length; ++row) {
    var recipeName = recipeValues[row][RECIPE_COL_AS_NUMBER];
    var batches = recipeValues[row][BATCHES_COL_AS_NUMBER];
    
    recipesAndBatches.push([recipeName, batches]);
  }
  
  return recipesAndBatches;
}

function initialize() {
  var ingredientsSS = SpreadsheetApp.openById(INGREDIENTS_SPREADSHEET_ID);
  initializeCategories(ingredientsSS);
  var ingredientCategoryDict = initializeCategoryDict();
  
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

function readRecipeNamesAndMultipliers(recipeName, numberOfBatches, ingredientCategoryDict) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var recipeSheet = getRecipeSheet(recipeName);
  var values = recipeSheet.getDataRange().getValues();
  for (row = 1; row < values.length; ++row) {
    var ingredientName = values[row][INGREDIENT_COL_AS_NUMBER];
    var category = values[row][CATEGORY_COL_AS_NUMBER];
    if (!(category in CATEGORIES)) {
      Logger.log("Invalid category found: " + category);
      continue;
    }
    
    // TODO: more validation on these fields. Or maybe create a separate validate function that main should call.
    var quantitySingleBatch = values[row][QUANTITY_COL_AS_NUMBER];
    var quantityActual = quantitySingleBatch * numberOfBatches;
    var units = values[row][UNITS_COL_AS_NUMBER];
    
    ingredientCategoryDict[category].push([ingredientName, quantityActual, units]);
  }
}




/////////////////////
// Post-Processing //
/////////////////////

function lowerCaseStringsEqual(a, b) {
  return a.trim().toLowerCase() == b.trim().toLowerCase();
}

function ingredientEntryCompare(ingredientEntryA, ingredientEntryB) {
  var ingredientNameA = ingredientEntryA[0];
  var ingredientNameB = ingredientEntryB[0];
  
  return ingredientNameA.localeCompare(ingredientNameB);
}

function alphabetizeCategories(ingredientCategoryDict) {
  for (var key in ingredientCategoryDict) {
    // Check if the property/key is defined in the object itself, not in parent.
    if (ingredientCategoryDict.hasOwnProperty(key)) {
      var category = key;
      var ingredientList = ingredientCategoryDict[category];
      
      var x = ingredientList.sort(ingredientEntryCompare);
    }
  }
}

/* 
 * Input: two ingredient lists of format: [<name>, <quantity>, <units>].
 * Output: a combined ingredient list if the lists represent the same item in the same units, null otherwise.
 */
function condenseDuplicateIngredientsHelper(ingredientEntryA, ingredientEntryB) {
  var ingredientNameA = ingredientEntryA[0];
  var ingredientNameB = ingredientEntryB[0];
  
  if (lowerCaseStringsEqual(ingredientNameA, ingredientNameB)) {
    var unitsA = ingredientEntryA[2];
    var unitsB = ingredientEntryB[2];
    if (unitsA == unitsB) {
      var quantityA = ingredientEntryA[1];
      var quantityB = ingredientEntryB[1];
      var quantityCombined = quantityA + quantityB;
      var combinedIngredientEntry = [ingredientNameA, quantityCombined, unitsA];
      return combinedIngredientEntry;
    }
  }
  
  return null;
}

function condenseDuplicateIngredients(ingredientCategoryDict) {
  for (var key in ingredientCategoryDict) {
    // Check if the property/key is defined in the object itself, not in parent.
    if (ingredientCategoryDict.hasOwnProperty(key)) {
      var category = key;
      var ingredientList = ingredientCategoryDict[category];
      
      var ingredientsCountCur = ingredientList.length;
      var idx = 0;
      while (idx < ingredientsCountCur - 1) {
        var ingredientEntryA = ingredientList[idx];
        var ingredientEntryB = ingredientList[idx + 1];
        var combiedIngredientEntry = condenseDuplicateIngredientsHelper(ingredientEntryA, ingredientEntryB);
        if (combiedIngredientEntry !== null) {
          // We have found a combined entry. Overwrite the first entry of the duplicate pair with the combined entry.
          ingredientList[idx] = combiedIngredientEntry;
          // Remove the second entry of the duplicate pair and shift the rest of the array to fill.
          ingredientList.splice(idx + 1, 1);
          --ingredientsCountCur;
        } else {
          idx++;
        }
      }
    }
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
  shoppingListSheet.getRange('A' + row).setValue(categoryName).setFontWeight(FONT_WEIGHT_BOLD);
  shoppingListSheet.getRange(INGREDIENT_COL_OUTPUT + row).setValue(INGREDIENT_TITLE).setFontWeight(FONT_WEIGHT_BOLD);
  shoppingListSheet.getRange(QUANTITY_COL_OUTPUT   + row).setValue(QUANTITY_TITLE).setFontWeight(FONT_WEIGHT_BOLD);
  shoppingListSheet.getRange(UNITS_COL_OUTPUT      + row).setValue(UNITS_TITLE).setFontWeight(FONT_WEIGHT_BOLD);
}

function addStatusColorRuleToRange(sheet, row, text, color) {
  var leadingCellForRange = STATUS_COL_OUTPUT + row;
  var rowCells = sheet.getRange(STATUS_COL_OUTPUT + row + ":" + UNITS_COL_OUTPUT + row);
  var rowBgColorRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + leadingCellForRange + '="' + text + '"')
    .setBackground(color)
    .setRanges([rowCells])
    .build();
  return rowBgColorRule; 
}

function addStatusColorRulesToRange(sheet, row, statusColorPairs) {
  var rules = sheet.getConditionalFormatRules();
  
  for (idx = 0; idx < statusColorPairs.length; ++idx) {
    var statusColorPair = statusColorPairs[idx];
    var status = statusColorPair[0];
    var color = statusColorPair[1];
    var rule = addStatusColorRuleToRange(sheet, row, status, color);
    rules.push(rule);
  }
  
  sheet.setConditionalFormatRules(rules);
}

function addIngredientToRow(ingredientArray, row, shoppingListSheet) {
  var ingredientName = ingredientArray[0];
  var quantity = ingredientArray[1];
  var units = ingredientArray[2];
  
  shoppingListSheet.getRange(INGREDIENT_COL_OUTPUT + row).setValue(ingredientName);
  shoppingListSheet.getRange(QUANTITY_COL_OUTPUT   + row).setValue(quantity);
  shoppingListSheet.getRange(UNITS_COL_OUTPUT      + row).setValue(units);
  
  // Add dropdown allowing user to mark the status of their item.
  var statusCell = shoppingListSheet.getRange(STATUS_COL_OUTPUT + row);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList([ITEM_NEEDED, ITEM_IN_PANTRY, ITEM_IN_CART]).build();
  statusCell.setDataValidation(rule);
  
  var statusColorPairs = [];
  statusColorPairs.push(["", COLOR_WHITE]);
  statusColorPairs.push([ITEM_NEEDED, COLOR_ORANGE]);
  statusColorPairs.push([ITEM_IN_PANTRY, COLOR_GREEN]);
  statusColorPairs.push([ITEM_IN_CART, COLOR_GREEN]);
  addStatusColorRulesToRange(shoppingListSheet, row, statusColorPairs);
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
// TODO: think about throwing if invalid input found. Failing silently isn't good in this case.
// TODO: onEdit() syntax checking in the sheet
// TODO: make optional function that splits list into different stores (Costco, Safeway, etc)
// TODO: Add a trailing column with a checkbox that lets you say you have the item in your cart, and then that highlights the row green when checked
// TODO: add output to the bottom of the shopping list linking each of the recipes nicely.
