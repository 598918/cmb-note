$(function(){
	$('#tree > ul > li > a').click(function(e){
		e.preventDefault();
		$(this).children('i').toggleClass('fa-minus-square-o fa-plus-square-o');
		$(this).siblings('ul').slideToggle('fast');
		return false;
	});
	
	$('#tree > ul > li > ul > li a').click(function(e){
		console.log('get in');
		e.preventDefault();
		var href=$(this).attr('href');
		changeIndexIframe(href);
		return false;
	});
});

function changeIndexIframe(src){
	$(window.top.document.body).find('.frameworkBody').attr('src', src);
}

function openFrame(src){
	var iFrame = $('<iframe class="_framePageClass" src="' + src + '" scrolling="yes" frameborder="0"></iframe>');
	$('html, body').scrollTop(0);
	$('body').css({'position' : 'relative', 'overflow' : 'hidden'}).prepend(iFrame);
}
