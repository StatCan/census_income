var sgcI18nRoot = "lib/statcan_sgc/i18n/sgc/",
  rootI18nRoot = "src/i18n/",
  sgcDataUrl = "lib/statcan_sgc/sgc.json",
  incomeDataUrl = "data/census_income.json",
  container = d3.select(".income .data"),
  chart = container.append("svg")
    .attr("id", "canada_income"),
  settings = {
    x: {
      getValue: function(d){
        return null;
      }
    },
    y: {
      getValue: function(d) {
        return null;
      }
    },
    z: {
      getId: function(d) {
        return null;
      },
      getClass: function(d) {
        return null;
      }
    }
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
  showData = function() {

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
      incomeData = income;
    });
});
