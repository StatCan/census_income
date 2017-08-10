var sgcI18nRoot = "lib/statcan_sgc/i18n/sgc/",
  rootI18nRoot = "src/i18n/",
  sgcDataUrl = "lib/statcan_sgc/sgc.json",
  incomeDataUrl = "data/census_income.json",
  container = d3.select(".income .data"),
  chart = container.append("svg")
    .attr("id", "canada_income"),
  defaultView = "time",
  settings = {
    margin: {
      right: 30
    },
    x: {
      getValue: function(d){
        switch (settings.group){
        case "time":
          return new Date(d.id + "-10");
        default:
          return d.id;
        }
      },
      getText: function() {
        return geti18n.call(this, this.x.getValue.apply(this, arguments));
      },
      getTickText: function(value) {
        return geti18n.call(this, value);
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
  geti18n = function(value) {
    var sep = "_x_";
    switch(this.group){
    case "time":
      return value;
    case "sex":
      return i18next.t(this.group + sep + value, {ns: "census_income"});
    case "age":
      if (value === "0") {
        return; //i18next.t(this.group + sep + "total", {ns: "census_income"});
      }
      return parseInt(value, 10) % 5 === 0 ? i18next.t(this.group + sep + "year", {ns: "census_income", year: value}) : null;
    case "agegroup":
      if (value === "0") {
        return; //i18next.t("age" + sep + "total", {ns: "census_income"});
      }
      return i18next.t(this.group + sep + value.replace(".", "-"), {ns: "census_income"});
    }
  },
  getOrdinalPoint = function() {
    return this.z.getDataPoints(this.data[0]);
  },
  getOrdinalDomain = function() {
    return getOrdinalPoint.call(this).map(this.x.getValue);
  },
  getOrdinalRange = function() {
    var sett = this,
      point = getOrdinalPoint.call(sett),
      factor = sett.innerWidth / (point.length - 1);
    return point.map(function(d, i) {
      return i * factor;
    });
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
  showData = function(view) {
    settings.group = view || defaultView;
    switch(settings.group) {
    case "time":
      break;
    default:
      settings.x.type = "ordinal";
      settings.x.getDomain = getOrdinalDomain;
      settings.x.getRange = getOrdinalRange;
      break;
    }
    settings.data = incomeData[settings.group];
    chartObj = lineChart(chart, settings);
  },
  showIncome = function(income) {
    var incomeLine = chart.select("g").selectAll(".income-line")
        .data([income]),
      y = chartObj.y(income);

    incomeLine
      .enter()
      .append("line")
        .attr("class", "income-line")
        .attr("x1", 0)
        .attr("x2", chartObj.settings.innerWidth)
        .attr("y1", y)
        .attr("y2", y);

    incomeLine
      .transition()
      .duration(1500)
      .ease(d3.easeElasticOut)
        .attr("y1", y)
        .attr("y2", y);
  },
  uiHandler = function(event) {
    var value;
    switch (event.target.id) {
    case "income":
      value = parseInt(event.target.value, 10);
      if (value) {
        showIncome(value);
      }
      break;
    case "view":
      showData(event.target.value);
    }
  },
  sgcData, incomeData, chartObj, uiTimeout;


i18n.load([sgcI18nRoot, rootI18nRoot], function() {
  d3.queue()
    .defer(d3.json, sgcDataUrl)
    .defer(d3.json, incomeDataUrl)
    .await(function(error, sgcs, income) {
      sgcData = sgcs;
      incomeData = processData(income);

      showData();

      $(".income").on("input change", function(event) {
        clearTimeout(uiTimeout);
        uiTimeout = setTimeout(function() {
          uiHandler(event);
        }, 100);
      });
    });
});
