/* eslint-env node, es6 */
var fs = require("fs");
var d3 = require("d3-dsv");

var output = {};

fs.readFile("data/incomedata.csv", "utf8", function(err, data) {
  var csv = d3.csvParse(data),
    row, group, groupName, subgroup;

  for (var r = 0; r < csv.length; r++) {
    row = csv[r];

    if (row.ENG_LABEL_VIEW !== groupName) {
      output[row.ENG_LABEL_VIEW] = group = {};
      groupName = row.ENG_LABEL_VIEW;
    }

    subgroup = group[row.Code] = [];

    for (var p = 1; p < 100; p++) {
      subgroup.push(row[`totpnz${p}`]);
    }
  }

  fs.writeFile("data/census_income.json", JSON.stringify(output), "utf8");
});
