MWS.gui = {
	"init": function() {

		$(document.getElementById("start-search")).click(function() {
			$(document.getElementById("query-form")).submit();
		});

		$(document.getElementById("query-form")).submit(function() {
			MWS.gui.runSearch();
			return false;
		})

		// For backwards compatibility, URLs which do not have "query-math"
		// parameter can get the math query from "query" parameter
		var query_text = getParameterByName("query-text");
        var query_depth = getParameterByName("query-depth");
        var cutoff_mode = getParameterByName("cutoff-mode");

        if (cutoff_mode) {
            if (cutoff_mode == 'R') {
                $(document.getElementById("cutoff-mode")).
                    attr('checked', true);
            } else {
                $(document.getElementById("cutoff-mode")).
                    attr('checked', false);
            }
        }

		if (query_text || query_depth) {
			$(document.getElementById("query-text")).val(query_text || "");
            $(document.getElementById("query-depth")).val(query_depth || "");
			MWS.gui.runSearch();
		}

		if (document.location.hash !== "") {
			MWS.init_page = parseInt(document.location.hash.substr(1)) - 1;

			// something weird
			if (MWS.init_page % 1 !== 0 || MWS.init_page <= 0) {
				delete MWS.init_page;
			}
		}

        $("#examplebuttons").remove();
	},

	"runSearch": function() {
			MWS.gui.performSearch();
	},

	"getSearchText": function() {
		return $(document.getElementById("query-text")).val();
	},

	"getSearchDepth": function(){
		var depth = $(document.getElementById("query-depth")).val();
        if (depth > 100) depth = 100;
        return depth;
	},

    "getCutoffMode": function() {
        var isChecked = $(document.getElementById('cutoff-mode')).is(':checked');
        if (isChecked) return 'R';  // relative
        return 'A';  // absolute
    },

	"performSearch": function(){
		var text = MWS.gui.getSearchText();
        var depth = MWS.gui.getSearchDepth();
        var cutoffMode = MWS.gui.getCutoffMode();

		window.history.pushState("", window.title, resolve(
            "?query-text="+encodeURIComponent(text) +
            "&query-depth="+encodeURIComponent(depth) +
            "&cutoff-mode="+encodeURIComponent(cutoffMode)
		));

		// Log piwik search data
		if (typeof _paq !== 'undefined') {
			_paq.push(["trackSiteSearch", encodeURIComponent(text),
                    "text", false]);
		}

		$("#resultsDiv")
		.empty()
		.append(
			$(document.createElement("span"))
			.css("color", "gray")
			.text("Querying server, please wait ...")
		);

        //create a new query
		var myQuery = new MWS.query(text, depth, cutoffMode);

		myQuery.getAll(function(res){
			MWS.gui.renderSearchResults(res, 0);
		}, function(){
			MWS.gui.renderSearchFailure(
                "Unable to search, please check your connection and try again. "
            );
		});
	},

    "renderSearchResults" : function(results) {
        var $res = $("#resultsDiv").empty();
        if (!results["schemata"]) {
            $res.append("<p>No results.</p>");
            return;
        }

        MWS.gui.processProxyReply(results);

        var resultId = 1;    
        results.schemata.forEach(function(schema) {
            /* An error occured and this schema does not have a title */
            if (!schema['title']) return;
            $res.append(MWS.gui.renderResult(schema, resultId));
            $res.append("<br/>");
            resultId++;
        });
    },

    "renderResult" : function(schema, resId) {
        var titleElem = $("<span>");
        var coverage = $("<div>");
        coverage.addClass("coverage");
        coverage.addClass("pull-left");
        coverage.text(schema['coverage']);

        titleElem.append(coverage);
        titleElem.append(MWS.makeMath(schema['title']));

        var bodyHtml = $("<div>");
        schema['formulae'].forEach(function(exprWithUrl) {
            var fmla = exprWithUrl['expr'];
            var url = MWS.config.id_to_link(exprWithUrl['url']);
            
            var exprDiv = $("<a>").addClass('formula-link')
                                  .attr('href', url);
            exprDiv.append(fmla);

            bodyHtml.append(exprDiv);
            bodyHtml.append("<br/>");
        });
        var bodyDiv = $("<div>")
            .addClass("panel-body")
            .append(bodyHtml);
        
        return $("<div>").addClass("panel panel-default")
            .append(
                    $("<div>").addClass("panel-heading").append(
                        $("<h4>").addClass("panel-title")
                        .append(
                            $("<a>").attr({
                                "data-toggle": "collapse",
                                "data-parent": "#resultsDiv",
                                "href" : "#resultId" + resId
                            })
                            .append(MWS.makeMath(titleElem))
                        )
                    ),
                    $("<div>")
                    .addClass("panel-collapse collapse")
                    .attr("id", "resultId" + resId)
                    .append(MWS.makeMath(bodyDiv))
        );
    },

	"renderSearchFailure": function(msg){
		//render search Failure
		$("#resultsDiv").empty()
		.append(
			$("<h4>").text("Sorry, "),
			$("<div>").text(msg)
		);
	},

    "processProxyReply" : function(proxy_reply) {
        proxy_reply.schemata.forEach(function(schema) {
            /* Ignore cerrors */
            if (schema['title'].indexOf("cerror") > -1) {
                delete schema['title'];
                return;
            }

            schema['title'] = MWS.gui.schematizeFormula(schema['title'],
                schema['subst']);
        });
    },

    "schematizeFormula" : function(formula, substitutions) {
        // if there are few substitutions we will just use letters
        var useCounter = substitutions.length > 26;
        var qvar = useCounter ? 1 : "a";

        var nextQvar = function(currQvar) {
            if (!useCounter) {
                var pos = currQvar.length - 1;
                return currQvar.substring(0, pos) +
                    String.fromCharCode(currQvar.charCodeAt(pos) + 1);
            }
            return currQvar + 1;
        };

        var schema = $(formula);
        
        substitutions.map(function(subst) {
            var cutElemPM = schema.find("[id='" + subst + "']");
            var cutElemCM = schema.find("[xref='" + subst + "']");

            if (cutElemPM.children().length == 0 && MWS.config.keep_leaves_name) {
                cutElemPM.addClass("math-highlight-qvar");
                cutElemCM.replaceWith("<qvar>" + qvar_str + "</qvar>");
            } else {
                var qvar_str;
                if (useCounter) qvar_str = "?x" + qvar;
                else qvar_str = "?" + qvar;
                cutElemPM.replaceWith("<mi>" + qvar_str + "</mi>");
                cutElemCM.addClass("math-highlight-qvar");
                cutElemCM.replaceWith("<qvar>" + qvar_str + "</qvar>");
                qvar = nextQvar(qvar);
            }
        });
        return schema;
    }
};
