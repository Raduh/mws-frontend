MWS.gui = {
	"init": function(){

		$(document.getElementById("start-search")).click(function(){
			$(document.getElementById("query-form")).submit();
		});

		$(document.getElementById("query-form")).submit(function(){
			MWS.gui.runSearch();
			return false;
		})

		// For backwards compatibility, URLs which do not have "query-math"
		// parameter can get the math query from "query" parameter
		var query_text = getParameterByName("query-text");

		if(query_text){
			$(document.getElementById("query-text")).val(query_text || "");
			MWS.gui.runSearch();
		}

		if(document.location.hash !== ""){
			MWS.init_page = parseInt(document.location.hash.substr(1)) - 1;

			//something weird
			if(MWS.init_page % 1 !== 0 || MWS.init_page <= 0){
				MWS.init_page = undefined;
			}
		}

        $("#examplebuttons").remove();
	},

	"runSearch": function(){
			MWS.gui.performSearch();
	},

	"getSearchText": function(){
		return $(document.getElementById("query-text")).val();
	},

	"performSearch": function(){
		var text = MWS.gui.getSearchText();

		window.history.pushState("", window.title, resolve(
			"?query-text="+encodeURIComponent(text)
		));

		// Log piwik search data
		if (typeof _paq !== 'undefined') {
			_paq.push(["trackSiteSearch", encodeURIComponent(text), "text", false]);
		}

		$("#results")
		.empty()
		.append(
			$(document.createElement("span"))
			.css("color", "gray")
			.text("Querying server, please wait ...")
		);

		var myQuery = new MWS.query(text); //create a new query

		myQuery.getAll(function(res){
			MWS.gui.renderSearchResults(res, 0);
		}, function(){
			MWS.gui.renderSearchFailure("Unable to search, please check your connection and try again. ");
		});
	},
    "renderSearchResults" : function(results) {
        var schemata = results["schemata"] || "<p>error</p>";
        var $res = $("#results").empty();
        $res.append(schemata);
        $("<br/>").insertAfter("mws\\:schema");
        // mws:qvar needs to be rendered properly
        var qvars = $("mws\\:qvar");
        console.log("qvars length: " + qvars.length);
        for (var i = 0; i < qvars.length; i++) {
            var qvar = qvars[i];
            var replacement = '<mi class="math-highlight-qvar">' + $(qvar).text() + '</mi>';
            $(qvar).replaceWith(replacement);
        }

        MWS.makeMath($res);
    },

	"renderSearchFailure": function(msg){
		//render search Failure
		$("#results").empty()
		.append(
			$("<h4>").text("Sorry, "),
			$("<div>").text(msg)
		);
	}
};
