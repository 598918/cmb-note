
;(function($, window, document, undefined) {
	var pluginName = "branch";
	var defaults = {
			type : '',	//机构树类别，默认（空）为核心机构树，GRP排班组
			changeFn : null,	//选中回调
			initFn : null,	//初始化后回调
			permissionPage : null,	//根据权限页面自动生成机构
			fixData : null		//根节点静态数据,[{code:'100',value:'招商银行'},{code:'110',value:'北京分行'}]
		};
	
	var Plugin = function (element, options) {
		this.$element = $(element);
		this.elementId = element.id;
		this.init(options);
		return {
			options: this.options,
			explainNode: $.proxy(this.explainNode, this),
			setInputValue: $.proxy(this.setInputValue, this),
			getValue: $.proxy(this.getValue, this)
		};
	};

	Plugin.prototype.init = function (options) {
		this.nodeList = {};
		this.selectedNode = {};
		this.lastSelectedValue = '';
		this.lastSelectedCode = '';
		this.inputIsValid = false;
		this.options = $.extend({}, defaults, options);
		this.inputAreaID = this.elementId + '_inputarea';
		this.inputID = this.elementId + '_input';
		this.inputHiddenID = this.elementId + '_inputhidden';
		this.dropDownDivID = this.elementId + '_dropdowndiv';

		this.$element.append('\
				<div class="input-group branchInputArea" id="' + this.inputAreaID + '">\
					<input type="text" id="' + this.inputID + '" class="form-control" placeholder="输入机构号回车,或下拉">\
					<div class="input-group-btn">\
						<button type="button" class="btn btn-default"><span class="caret"></span></button>\
					</div>\
				</div>');
		
		this.$element.append('<input type="hidden" id="' + this.inputHiddenID + '">');
		this.$element.append('<div id="' + this.dropDownDivID + '" class="branchDropDownDiv"></div>');
		
		var _this = this;
		$("#" + this.inputAreaID + " button").click(function(){
			if($("#" + _this.dropDownDivID).is(":hidden")){
				$("#" + _this.dropDownDivID).css("width", $("#" + _this.inputAreaID).outerWidth());
				$("#" + _this.dropDownDivID).show();
				$("#" + _this.dropDownDivID).focus();
				if(_this.dropDownDivTop && _this.dropDownDivTop>0)
					$("#" + _this.dropDownDivID).scrollTop(_this.dropDownDivTop);
			}else{
				_this.dropDownDivTop = $("#" + _this.dropDownDivID).scrollTop();
				$("#" + _this.dropDownDivID).hide();
			}
		});
		
		$("#" + this.inputID).click(function(){
			$("#" + _this.inputID).select();
			_this.inputIsValid = false;
		});
		
		$("#" + this.inputID).keydown(function(event){
			if(event.which == 13){
				var inputVal = $("#" + _this.inputID).val();
				if(inputVal == _this.lastSelectedValue){
					return;
				}
				if(inputVal.length>2 && inputVal!=_this.lastSelectedCode){
					var callback = CMBAjax.createCallback({
						success : function(message, obj) {
							if(obj && obj['Q2BUSQBRZ1'] && obj['Q2BUSQBRZ1'].length>0){
								var row = obj['Q2BUSQBRZ1'][0];
								_this.setInputValue(row.COR_NBR, row.COR_NAM);
								$("#" + _this.inputID).trigger("blur");
								if(typeof(_this.options.changeFn) == "function")
									_this.options.changeFn(row.COR_NBR, row.COR_NAM);
							}else{
								alert("机构编码" + inputVal + "不存在");
								$("#" + _this.inputID).select();
							}
						},
						fail : function(message, errMessage) {
							alert('发生错误：'+ errMessage);
						},
						scope : this
					});
					CMBAjax.remoteInvoke({prccod : 'Q2BUSQBR',  webcod : '102005', infbdy : {Q2BUSQBRX1 :[{BRN_NBR: inputVal}]} }, callback, null);
				}
			}
		});
		
		$("#" + this.inputID).blur(function(){
			if(!_this.inputIsValid){
				$("#" + _this.inputID).val(_this.lastSelectedValue);
				$("#" + _this.inputHiddenID).val(_this.lastSelectedCode);
			}
		});
		
		$("#" + this.dropDownDivID).blur(function(){
			_this.dropDownDivTop = $(this).scrollTop();
			$(this).hide();
		});
		
		if(this.options.permissionPage){
			this.getPermissionBranch(this.options.permissionPage);
		}else if(this.options.fixData){
			this.explainNode('', this.options.fixData);
		}
	};
	
	Plugin.prototype.getValue = function() {
		return $("#" + this.inputHiddenID).val();
	};

	Plugin.prototype.setInputValue = function(brnNbr, brnNam) {
		$("#" + this.inputID).val(brnNam);
		$("#" + this.inputHiddenID).val(brnNbr);
		this.lastSelectedValue = brnNam;
		this.lastSelectedCode = brnNbr;
		this.inputIsValid = true;
	};

	//根据页面id，获取权限机构
	Plugin.prototype.getPermissionBranch = function(pageID) {
		var _this = this;
		var callback = CMBAjax.createCallback({
			success : function(message, obj) {
				var list = obj['Q2BUSQUIZ1'];
				if(list && list.length > 0){
					var resultObj = [];
					var _fid = '',_fname = '';
					for(var i=0; i<list.length; i++){
						resultObj.push({code: list[i].COR_NBR, value: list[i].COR_NAM});
						if(i == 0){
							_fid = list[i].COR_NBR;
							_fname = list[i].COR_NAM;
						}
					}
					_this.explainNode('', resultObj);
					_this.setInputValue(_fid, _fname);
					_this.statusCheck(_fid);
					if(typeof(_this.options.initFn) == "function")
						_this.options.initFn();
				}
			},
			fail : function(message, errMessage) {
				alert('发生错误：'+ errMessage);
			},scope : this
		});
		
		CMBAjax.remoteInvoke({prccod : 'Q2BUSQUI',webcod : '102005',infbdy : {Q2BUSQUIX1:[{PAG_COD: pageID}]}},callback);
	};
	
	//展开节点
	Plugin.prototype.explainNode = function(nodeID, nodes) {
		var parentUL = this.elementId + '_ul_' + nodeID;
		var parentLI = this.elementId + '_li_' + nodeID;
		
		if($("#" + parentUL).length > 0){
			if($("#" + parentUL).is(":hidden")){
				this.statusOpen($("#" + parentLI), $("#" + parentUL));
			}else{
				this.statusClose($("#" + parentLI), $("#" + parentUL));
			}
		}else{
			var _this = this;
			if(nodes && nodes.length>0){
				if(nodeID)
					$("#" + parentLI).append('<ul id="' + parentUL + '" class="branchUL"></ul>');
				else
					$("#" + this.dropDownDivID).append('<ul id="' + parentUL + '" class="branchUL"></ul>');

				this.statusOpen($("#" + parentLI), $("#" + parentUL));
				
				for(var j=0; j<nodes.length; j++){
					var item = nodes[j];
					var liID = this.elementId + '_li_' + item.code;
					var textID = this.elementId + '_text_' + item.code;
					$("#" + parentUL).append('<li id="' + liID + '">' + 
							'<span id="' + textID + '" code=' + item.code + ' value=' + item.value + '><a>' + item.code + ' ' + item.value + '</a></span></li>');

					$("#" + textID).prepend('<i class="' + this.template.closeClass + '"> </i>');
					$("#" + textID + " i").click(function(){_this.getRemoteData($(this).parent().attr("code"));});
					$("#" + textID + " a").click(function(){
						var _c = $(this).parent().attr("code");
						var _v = $(this).parent().attr("value");

						var _oc = $("#" + _this.inputHiddenID).val();
						if(_oc && _c!=_oc){
							_this.statusUncheck(_oc);
						}

						_this.setInputValue(_c, _v);
						$("#" + _this.dropDownDivID).trigger('blur');
						_this.statusCheck(_c);
						if(typeof(_this.options.changeFn) == "function")
							_this.options.changeFn(_c, _v);
					});
				}
			}else{
				var textID = this.elementId + '_text_' + nodeID;
				$("#" + textID).find("i:first").removeClass().html("&nbsp;&nbsp;&nbsp;");
				$("#" + textID).unbind("click");
			}
		}
	};

	Plugin.prototype.getRemoteData = function(nodeID){
		var _this = this;
		var callback = CMBAjax.createCallback({
			success : function(message, obj) {
				var list = obj['Q2BUSQCLZ1'];
				var resultObj = [];
				if(list){
					for(var i=0; i<list.length; i++){
						resultObj.push({code: list[i].COR_NBR, value: list[i].COR_NAM});
					}
				}
				_this.explainNode(nodeID, resultObj);
			},
			fail : function(message, errMessage) {
				alert('发生错误：'+ errMessage);
			},
			scope : this
		});
		
		CMBAjax.remoteInvoke({
				prccod : 'Q2BUSQCL',  
				webcod : '102005', 
				infbdy : {Q2BUSQCLX1:[{PUB_BRN: nodeID, BRN_TYP: this.options.type}]}
			},callback, null);
	};
	
	Plugin.prototype.template = {
		closeClass: "glyphicon glyphicon-triangle-right",
		openClass: "glyphicon glyphicon-triangle-bottom",
		checkClass: "branch-check"
	};
	
	Plugin.prototype.statusOpen = function($parentLI, $parentUL) {
		if($parentUL)
			$parentUL.show();
		var $tmp = $parentLI.find("i:first");
		$tmp.removeClass(this.template.closeClass);
		$tmp.addClass(this.template.openClass);
	};
	
	Plugin.prototype.statusClose = function($parentLI, $parentUL) {
		if($parentUL)
			$parentUL.hide();
		var $tmp = $parentLI.find("i:first");
		$tmp.removeClass(this.template.openClass);
		$tmp.addClass(this.template.closeClass);
	};
	
	Plugin.prototype.statusCheck = function(nodeID) {
		var $tmp = $("#" + this.elementId + '_text_' + nodeID + ' a');
		$tmp.addClass(this.template.checkClass);
	};
	
	Plugin.prototype.statusUncheck = function(nodeID) {
		var $tmp = $("#" + this.elementId + '_text_' + nodeID + ' a');
		$tmp.removeClass(this.template.checkClass);
	};
	
	var logError = function (message) {
		if (window.console) {
			window.console.error(message);
		}
	};

	$.fn[pluginName] = function(options, args) {
		var result = null;
		
		this.each(function() {
			var _this = $.data(this, pluginName);
			if (typeof options === 'string') {
				if (!_this) {
					logError('Not initialized, can not call method : ' + options);
				} else if (!$.isFunction(_this[options]) || options.charAt(0) === '_') {
					logError('No such method : ' + options);
				} else {
					if (!(args instanceof Array)) {
						args = [ args ];
					}
					result = _this[options].apply(_this, args);
				}
			}else {
				$.data(this, pluginName, new Plugin(this, $.extend(true, {}, options)));
			}
			
		});
		return result == null ? this : result;
	};
})(jQuery, window, document);
