MWS.query = function(text, depth){
	var me = this; 

	//store parameters for query
	this._text = text; 
    this._depth = depth;
	this._cached = false; 

	var get = function(start, size, callback, callback_fail){
		if(arguments.length == 1){
			var callback = start; 
			var start = 0; 
			var size = 5; 
		}

		if(typeof callback !== "function"){
			var callback = function(){}; //Nothing
		}

		if(typeof callback_fail !== "function"){
			var callback_fail = function(){}; //Nothing
		}

		var data = {
			"text": me._text, 
            "depth" : me._depth,
			"from": start, 
			"size": size
		}; 
		try{
			$.ajax({
			    type: 'GET',
			    url: MWS.config.mws_query_url,
				data: data
			}).done(function(data) {
			    callback.call(me, data); 
			}).fail(function(){
				callback_fail.call(me); 
			}); 
		} catch(e){
			callback_fail.call(me); 
		}
		
	};

	this.getAll = function(callback, callback_fail) {
        var DEFAULT_SIZE = 10;
		var callback = (typeof callback == "function")?callback:function(){}; 
		var callback_fail = (typeof callback_fail == "function")?callback:function(){}; 

		get(0, 10, function(data){
			callback(data);
		}, callback_fail); 
	}
}
