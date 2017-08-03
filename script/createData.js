/* eslint-env node, es6 */
var fs = require("fs");
var d3 = require("d3-dsv");

var output = {};

fs.readFile("data/incomedata.csv", "utf8", function(err, data) {
  var csv = d3.csvParse(data),
    row, group, groupName, oldGroupName, subgroup, subGroupName;

  for (var r = 0; r < csv.length; r++) {
    row = csv[r];

    switch(row.ENG_LABEL_VIEW) {
    case "Age Groups":
      groupName = "agegroup";
      break;
    case "Can, Prov / Terr, CMA /CA":
      groupName = "geo";
      break;
    default:
      groupName = row.ENG_LABEL_VIEW.toLowerCase();
    }

    if (groupName !== oldGroupName) {
      output[groupName] = group = {};
      oldGroupName = groupName;
    }

    if (groupName === "sex") {
      switch(row.Code){
      case "0":
        subGroupName = "total";
        break;
      case "1":
        subGroupName = "m";
        break;
      case "2":
        subGroupName = "f";
        break;
      }
    } else {
      subGroupName = row.Code;
    }

    subgroup = group[subGroupName] = [];

    for (var p = 1; p < 100; p++) {
      subgroup.push(parseInt(row[`totpnz${p}`], 10));
    }
  }

  fs.writeFile("data/census_income.json", JSON.stringify(output), "utf8");
});
