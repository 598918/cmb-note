(function($) {
	var pluginName = "nav";
	var defaults = {
	};
	
	var Nav = function (element, options) {
		this.element = $(element);
		this.init(options);
		return {
		};
	};
	
	var template = {
		ul : '<ul></ul>',
		li: '<li></li>',
		divider: '<li role="separator" class="divider"></li>',
		icon : '<i class="fa"></i>',
		a: '<a></a>'
	};

	Nav.prototype.init = function (options) {
		this.options = $.extend({}, defaults, options);
		for(var i=0; i< this.options.menu.length; i++) {
			var menuRow = this.options.menu[i];
			console.log(this.options.menu[i]);
			if (menuRow.UPP_PAG != '0000') {
				continue;
			}
			
			var $firLink = $(template.a).attr({
								'pagUid': menuRow.PAG_UID, 
								'href': menuRow.PAG_URL, 
								'lnk_typ': menuRow.LNK_TYP
							})
							.text(menuRow.PAG_NAM)
							.prepend($(template.icon)
							.addClass(menuRow.PAG_IMG));
			var $firUl = this.element.addClass('lv0').append($(template.li).append($firLink));	
		}
	};

	Nav.prototype.initHeaderTD = function () {
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
				$.data(this, pluginName, new Nav(this, $.extend(true, {}, options)));
			}
			
		});
		return result == null ? this : result;
	};
	
//  $(function(){
//  	$('.nav > li > a').mouseenter(function(){
//  		$(this).siblings('ul').addClass('active');
//  	}).mouseleave(function(){
//  		$(this).siblings('ul').removeClass('active');
//  	});
//  	
//  	$('.nav > li > a + ul').mouseenter(function(){
//  		$(this).addClass('active');
//  		$(this).siblings('a').addClass('active');
//  	}).mouseleave(function(){
//  		$(this).removeClass('active');
//  		$(this).siblings('a').removeClass('active');
//  	});
//  	
//  	$('.nav > li > a + ul > li > a').mouseenter(function(){
//  		$(this).siblings('ul').addClass('active').find('a').each(function(i){
//  			$(this).css({'transition': 'left .2s ease ' + i * 0.05 + 's', 'opacity': 1, 'left': 0});
//  		});
//  	}).mouseleave(function(){
//  		$(this).siblings('ul').removeClass('active');
//  		var _this = $(this);
//  		setTimeout(function(){
//  			if(!_this.hasClass('active')) {
//	    			_this.siblings('ul').find('a').css({'left': '-100%', 'opacity': 0});
//	    		}
//  		}, 100);
//  	});
//  	
//  	$('.nav > li > a + ul > li > a + ul').mouseenter(function(){
//  		$(this).addClass('active');
//  		$(this).siblings('a').addClass('active');
//  	}).mouseleave(function(){
//  		$(this).removeClass('active');
//  		$(this).siblings('a').removeClass('active');
//  	});
//  	
//  	$('.nav > li > ul > li > ul').each(function(){
////			var h = $(this).parent().height();   // ?? null ??	
//			var i = $(this).parent().index();
//			$(this).css('top', - 40 * i + 'px');
//  	}).mouseleave(function(){
//  		$(this).find('a').css({'left': '-100%', 'opacity': 0});
//  	});
//  });
})(jQuery);

