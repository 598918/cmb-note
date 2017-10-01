(function($) {
    $(function(){
    	$('.nav > li > a').mouseenter(function(){
    		$(this).siblings('ul').addClass('active');
    	}).mouseleave(function(){
    		$(this).siblings('ul').removeClass('active');
    	});
    	
    	$('.nav > li > a + ul').mouseenter(function(){
    		$(this).addClass('active');
    		$(this).siblings('a').addClass('active');
    	}).mouseleave(function(){
    		$(this).removeClass('active');
    		$(this).siblings('a').removeClass('active');
    	});
    	
    	$('.nav > li > a + ul > li > a').mouseenter(function(){
    		$(this).siblings('ul').addClass('active');
    	}).mouseleave(function(){
    		$(this).siblings('ul').removeClass('active');
    	});
    	
    	$('.nav > li > a + ul > li > a + ul').mouseenter(function(){
    		$(this).addClass('active');
    		$(this).siblings('a').addClass('active');
    	}).mouseleave(function(){
    		$(this).removeClass('active');
    		$(this).siblings('a').removeClass('active');
    	});
    	
    	$('.nav > li > ul > li > ul').each(function(){
//			var h = $(this).parent().height();   // ?? null ??	
			var i = $(this).parent().index();
			$(this).css('top', - 40 * i + 'px');
    	})
    });
})(jQuery);
