(function($) {
	var pluginName = "nav";
	var defaults = {};

	var Nav = function(element, options) {
		this.element = $(element);
		this.elementID = $(element).attr('id');
		this.init(options);
		return {};
	};

	Nav.prototype.init = function(options) {
		this.options = $.extend({}, defaults, options);
		var treeJson = arrayToJson(this.options.menu);
		var treeHtml = render(treeJson[0]["children"]);
		this.element.append(treeHtml);
		this.bindEvent();
	};

	Nav.prototype.initHeaderTD = function() {};

	function arrayToJson(treeArray) {
		var r = [];
		var tmpMap = {};

		for(var i = 0, l = treeArray.length; i < l; i++) {
			// 以每条数据的id作为obj的key值，数据作为value值存入到一个临时对象里面
			tmpMap[treeArray[i]["PAG_UID"]] = treeArray[i];
		}

		for(i = 0, l = treeArray.length; i < l; i++) {
			var key = tmpMap[treeArray[i]["UPP_PAG"]];

			//循环每一条数据的pid，假如这个临时对象有这个key值，就代表这个key对应的数据有children，需要Push进去
			if(key) {
				if(!key["children"]) {
					key["children"] = [];
					key["children"].push(treeArray[i]);
				} else {
					key["children"].push(treeArray[i]);
				}
			} else {
				//如果没有这个Key值，那就代表没有父级,直接放在最外层
				r.push(treeArray[i]);
			}
		}
		return r;
	}

	function render(treeJson) {
		if(!Array.isArray(treeJson) || treeJson.length <= 0) {
			return ""
		}
		var ul = $("<ul>");
		treeJson.forEach(function(item, i) {
			var icon = item.PAG_IMG ? "<i class='" + item.PAG_IMG + "'></i>" : "";
			var li = $("<li><a href=" + item.PAG_URL + ">" + icon + item.PAG_NAM + "<i class='fa fa-arrow-right'></i></a></li>");
			if(Array.isArray(item.children) && item.children.length > 0) {
				li.append(render(item.children));
			}
			ul.append(li);
		})
		return ul;
	}

	Nav.prototype.bindEvent = function() {
		$('#' + this.elementID + ' ul > li > a').mouseenter(function() {
			$(this).siblings('ul').addClass('active');
		}).mouseleave(function() {
			$(this).siblings('ul').removeClass('active');
		});

		$('#' + this.elementID + ' ul > li > a + ul').mouseenter(function() {
			$(this).addClass('active');
			$(this).siblings('a').addClass('active');
		}).mouseleave(function() {
			$(this).removeClass('active');
			$(this).siblings('a').removeClass('active');
		});

		$('#' + this.elementID + ' ul > li > a + ul > li > a').mouseenter(function() {
			$(this).siblings('ul').addClass('active').find('a').each(function(i) {
				$(this).css({
					'transition': 'left .2s ease ' + i * 0.05 + 's',
					'opacity': 1,
					'left': 0
				});
			});
		}).mouseleave(function() {
			$(this).siblings('ul').removeClass('active');
			var _this = $(this);
			setTimeout(function() {
				if(!_this.hasClass('active')) {
					_this.siblings('ul').find('a').css({
						'left': '-100%',
						'opacity': 0
					});
				}
			}, 100);
		});

		$('#' + this.elementID + ' ul > li > ul > li > ul').mouseenter(function() {
			$(this).addClass('active');
			$(this).siblings('a').addClass('active');
		}).mouseleave(function() {
			$(this).removeClass('active');
			$(this).siblings('a').removeClass('active');
		});

		$('#' + this.elementID + ' ul > li > ul > li > ul').each(function() {
			var i = $(this).parent().index();
			$(this).css('top', -40 * i + 'px');
		}).mouseleave(function() {
			$(this).find('a').css({
				'left': '-100%',
				'opacity': 0
			});
		});

		$('#' + this.elementID + ' a').hover(function() {
			if($(this).attr('href') && null != $(this).attr('href') && $(this).siblings('ul').length <= 0) {
				console.log('111');
				$(this).find('.fa-arrow-right').toggleClass('show');
			}
		})
	};

	$.fn[pluginName] = function(options, args) {
		var result = null;

		this.each(function() {
			var _this = $.data(this, pluginName);
			if(typeof options === 'string') {
				if(!_this) {
					logError('Not initialized, can not call method : ' + options);
				} else if(!$.isFunction(_this[options]) || options.charAt(0) === '_') {
					logError('No such method : ' + options);
				} else {
					if(!(args instanceof Array)) {
						args = [args];
					}
					result = _this[options].apply(_this, args);
				}
			} else {
				$.data(this, pluginName, new Nav(this, $.extend(true, {}, options)));
			}

		});
		return result == null ? this : result;
	};
})(jQuery);
