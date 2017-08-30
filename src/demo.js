var sgcI18nRoot = "lib/statcan_sgc/i18n/sgc/",
  rootI18nRoot = "src/i18n/",
  sgcDataUrl = "lib/statcan_sgc/sgc.json",
  incomeDataUrl = "data/census_income.json",
  container = d3.select(".income .data"),
  chart = container.append("svg")
    .attr("id", "canada_income"),
  defaultView = "time",
  geoGroup = "geo",
  rootI18nNs = "census_income",
  dateFormatter = i18n.getDateFormatter({
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }),
  numberFormatter = i18n.getNumberFormatter({
    style: "currency",
    currency: "CAD",
    currencyDisplay: "symbol"
  }),
  settings = {
    margin: {
      left: 70,
      right: 30,
      bottom: 130
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
      }
    },
    y: {
      getValue: function(d) {
        return d.value;
      },
      getText: function() {
        return numberFormatter.format(this.y.getValue.apply(this, arguments)).replace("CA", "");
      }
    },
    z: {
      getId: function(d) {
        return d.percentile;
      },
      getKeys: function(d) {
        return Object.keys(d);
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
    datatable: {}
  },
  geti18n = function(value, ticks) {
    var sep = "_x_",
      text;
    switch(this.group){
    case "time":
      return dateFormatter.format(value);
    case "sex":
      return i18next.t(this.group + sep + value, {ns: rootI18nNs});
    case "age":
      text = value === "0" ?
        i18next.t(this.group + sep + "total", {ns: rootI18nNs}) :
        i18next.t(this.group + sep + "year", {ns: rootI18nNs, year: value});

      if (ticks !== true)
        return text;

      return parseInt(text, 10) % 5 === 0 ? text : null;
    case "agegroup":
      text = value === "0" ?
        i18next.t("age" + sep + "total", {ns: rootI18nNs}) :
        i18next.t(this.group + sep + value.replace(".", "-"), {ns: rootI18nNs});

      if (ticks !== true)
        return text;

      return value !== "0" ? text : null;
    case "geo":
    case "geo_atl":
    case "geo_qc":
    case "geo_on":
    case "geo_pra":
    case "geo_bc":
    case "geo_terr":
      return ticks ? i18next.t("sgc_" + value, {ns: "sgc"}) : getSGCText(value);
    }
  },
  ordinalX = {
    getPoint: function() {
      return this.z.getDataPoints(this.data[0]);
    },
    getDomain: function() {
      return ordinalX.getPoint.call(this).map(this.x.getValue);
    },
    getRange: function() {
      var sett = this,
        point = ordinalX.getPoint.call(sett),
        factor = sett.innerWidth / (point.length - 1);
      return point.map(function(d, i) {
        return i * factor;
      });
    },
    getTickText: function(value) {
      return geti18n.call(this, value, true);
    }
  },
  getSGCText = function(sgcId) {
    var sgcNs = "sgc",
      sgcPrefix = "sgc_",
      text = i18next.t(sgcPrefix + sgcId, {ns: sgcNs}),
      sgcDef;

    if (sgcId.length > 2) {
      sgcDef = sgcData.sgcs.filter(function(s) {
        return s.sgcId === sgcId;
      });

      if (sgcDef && sgcDef.length > 0) {
        text += ", " + i18next.t(sgcDef[0].type, {ns: "sgc_type"});
      }

      text += ", " + i18next.t(sgcPrefix + sgc.sgc.getProvince(sgcId), {ns: sgcNs});
    }
    return text;
  },
  processData = function(data) {
    var groups = Object.keys(data),
      output = {},
      createData = function(keys, groupName, destName) {
        var dname = destName ? destName : groupName,
          group = output[dname] = [],
          p, percentile;
        for (p = 4; p < data[groupName][keys[0]].length; p++) {
          percentile = p + 1;
          if (percentile % 5 === 0 || percentile > 95) {
            group.push({
              percentile: percentile,
              values: keys
                .filter(function(x) {
                  return !groupName === "age" || x !== "0";
                })
                .map(function(x) {
                  return {
                    id: x,
                    value: data[groupName][x][p]
                  };
                })
            });
          }
        }
      },
      getSimpleFilter = function(provinceSgcId) {
        return function(sgcId) {
          return sgc.sgc.getProvince(sgcId) === provinceSgcId;
        };
      },
      getCompositeFilter = function(provinceSgcIds) {
        return function(sgcId) {
          return provinceSgcIds.indexOf(sgc.sgc.getProvince(sgcId)) !== -1;
        };
      },
      g, groupName, xKeys, geoFilters, f;

    for (g = 0; g < groups.length; g++) {
      groupName = groups[g];
      xKeys = Object.keys(data[groupName]);
      if (groupName === geoGroup) {
        xKeys.sort(sgc.sortCCW);

        geoFilters = [
          {
            name: "geo",
            filter: function(sgcId) {
              return sgcId === "01" || sgc.sgc.getProvince(sgcId) === sgcId;
            }
          },
          {
            name: "geo_atl",
            filter: getCompositeFilter(["10", "11", "12", "13"])
          },
          {
            name: "geo_qc",
            filter: getSimpleFilter("24")
          },
          {
            name: "geo_on",
            filter: getSimpleFilter("35")
          },
          {
            name: "geo_pra",
            filter: getCompositeFilter(["46", "47", "48"])
          },
          {
            name: "geo_bc",
            filter: getSimpleFilter("59")
          },
          {
            name: "geo_terr",
            filter: getCompositeFilter(["60", "61", "62"])
          }
        ];

        for (f = 0; f < geoFilters.length; f++) {
          createData(xKeys.filter(geoFilters[f].filter), geoGroup, geoFilters[f].name);
        }
      } else if (groupName === "sex") {
        createData(["f", "total", "m"], groupName);
      } else {
        createData(xKeys, groupName);
      }
    }

    return output;
  },
  showData = function(view) {
    var groups = "age agegroup geo sex time",
      animate = function(sett) {
        lineChart(chart, $.extend(true, {}, sett, {
          data: sett.data.map(function(d) {
            return $.extend({}, d, {
              values: settings.z.getDataPoints.call(sett, d).map(function(d) {
                return {
                  id: d.id,
                  value: 0
                };
              })
            });
          })
        }));
      },
      showFn = function() {
        settings.group = view || defaultView;
        settings.data = incomeData[newSettings.group];
        switch(settings.group) {
        case "time":
          break;
        default:
          newSettings = $.extend(true, {}, settings, {
            x: {
              type: "ordinal",
              getDomain: ordinalX.getDomain,
              getRange: ordinalX.getRange,
              getTickText: ordinalX.getTickText
            }
          });
          break;
        }

        newSettings.datatable.title = i18next.t("datatableTitle", {
          ns: rootI18nNs,
          title: i18next.t(settings.group + "_title", {ns: rootI18nNs})
        });
        chart.classed(groups, false);
        chart.classed(newSettings.group.substr(0, geoGroup.length) === geoGroup ? geoGroup : newSettings.group, true);

        animate(newSettings);
        setTimeout(function() {
          chartObj = lineChart(chart, newSettings);
          if (chart.classed("svg-shimmed") && settings.group.substr(0, 3) === "geo") {
            chart.selectAll(".x text")
              .attr("transform", "rotate(-45)");
          }
          if (myIncome) {
            showIncome();
          }
        }, 10);
      },
      newSettings = settings;

    if (chartObj) {
      animate(chartObj.settings);
      setTimeout(function() {
        chartObj.clear();
        showFn();
      }, 1000);
    } else {
      showFn();
    }
  },
  showIncome = function() {
    var incomeLine = chart.select("g").selectAll(".income-line")
        .data([myIncome]),
      y = chartObj.y(myIncome);

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
        .attr("y1", y)
        .attr("y2", y);

    highlightIncome();
  },
  highlightIncome = function() {
    var highlightClass = "highlight",
      tableBody = container.select(".table tbody"),
      getSelector = function(row, column) {
        return "tr:nth-child(" + (row + 1) + ") td:nth-child(" + (column + 2) + ")";
      },
      highIncome, p, q, vals, val, h, selector,
      oldHighlight = tableBody.selectAll("." + highlightClass);

    if (!oldHighlight.empty()) {
      oldHighlight.classed(highlightClass, false);
      oldHighlight.selectAll(".wb-inv").remove();
    }


    if (myIncome) {
      highIncome = [];
      for (p = 0; p < settings.data.length; p++) {
        vals = settings.z.getDataPoints(settings.data[p]);
        for (q = 0; q < vals.length; q++) {
          val = vals[q];
          if (!highIncome[q]) {
            if (settings.y.getValue(val) === myIncome) {
              highIncome[q] = p;
            } else if (settings.y.getValue(val) > myIncome){
              highIncome[q] = p - 1;
            }
          }
        }
      }
      for (h = 0; h < highIncome.length; h++) {
        selector = getSelector(highIncome[h], h);
        tableBody.selectAll(selector)
          .classed(highlightClass, true)
          .append("span")
            .attr("class", "wb-inv")
            .text(i18next.t("percentile_highlight"));
      }
    }
  },
  uiHandler = function(event) {
    var value;
    switch (event.target.id) {
    case "income":
      value = parseInt(event.target.value, 10);
      if (value) {
        myIncome = value;
        showIncome();
      }
      break;
    case "view":
      showData(event.target.value);
    }
  },
  sgcData, incomeData, myIncome, chartObj, uiTimeout;


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
        }, 500);
      });
    });
});
