var sgcI18nRoot = "lib/statcan_sgc/i18n/sgc/",
  rootI18nRoot = "src/i18n/",
  sgcDataUrl = "lib/statcan_sgc/sgc.json",
  incomeDataUrl = "data/census_income.json",
  container = d3.select(".income .data"),
  chart = container.append("svg")
    .attr("id", "canada_income"),
  settings = {
    margin: {
      right: 30
    },
    x: {
      getValue: function(d){
        return new Date(d.id + "-10");
      }
    },
    y: {
      getValue: function(d) {
        return d.value;
      }
    },
    z: {
      getId: function(d) {
        return d.percentile;
      },
      getDataPoints: function(d) {
        return d.values;
      },
      getText: function(d) {
        return d.percentile + "th";
      },
      getClass: function(d) {
        return "p" + d.percentile;
      }
    },
    showLabels: function() {
      if ([99, 95, 75, 50, 25, 10].indexOf(this.z.getId.apply(this, arguments)) !== -1)
        return true;
      return false;
    },
    width: 1000,
    datatable: false
  },
  getSGCText = function(sgcId) {
    var text = i18next.t("sgc_" + sgcId, {ns: "sgc"}),
      sgcDef;

    if (sgcId.length > 2) {
      sgcDef = sgcData.sgcs.filter(function(s) {
        return s.sgcId === sgcId;
      });

      if (sgcDef && sgcDef.length > 0) {
        text += ", " + i18next.t(sgcDef[0].type, {ns: "sgc_type"});
      }

      text += ", " + i18next.t("sgc_" + sgc.sgc.getProvince(sgcId), {ns: "sgc"});
    }
    return text;
  },
  processData = function(data) {
    var groups = Object.keys(data),
      output = {},
      g, groupName, group, p, percentile, xKeys;

    for (g = 0; g < groups.length; g++) {
      groupName = groups[g];

      group = output[groupName] = [];

      xKeys = Object.keys(data[groupName]);
      for (p = 4; p < data[groupName][xKeys[0]].length; p++) {
        percentile = p + 1;
        if (percentile % 5 === 0 || percentile === 99) {
          group.push({
            percentile: percentile,
            values: xKeys.map(function(x) {
              return {
                id: x,
                value: data[groupName][x][p]
              };
            })
          });
        }
      }
    }

    return output;
  },
  showData = function() {
    var group = "time";

    settings.data = incomeData[group];
    lineChart(chart, settings);
  },
  uiHandler = function(event) {

  },
  sgcData, incomeData;


i18n.load([sgcI18nRoot, rootI18nRoot], function() {
  d3.queue()
    .defer(d3.json, sgcDataUrl)
    .defer(d3.json, incomeDataUrl)
    .await(function(error, sgcs, income) {
      sgcData = sgcs;
      incomeData = processData(income);

      showData();
    });
});
