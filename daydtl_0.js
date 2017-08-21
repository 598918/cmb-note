var isTDExpanded = false;
var $float = null;

$(document).ready(function() {
	generateCalendar();
});

function generateCalendar() {
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var days = getDayOfMonth(year, month);// 当月天数
	var firstDay = getDayOfFirstDay(year, month);// 当月第一天是星期几
	var trNums = (days + firstDay)%7 == 0 ? parseInt((days + firstDay)/7,10) : parseInt((days + firstDay)/7,10) + 1;
	var tdNums = trNums * 7;
	var html = '';
	for ( var i = 1; i <= tdNums; i++) {
		if(i%7 == 1){
			html += '<tr align="center">';
		}
		var calDay = i - firstDay;
		html += '<td class="day Day' + calDay + '">';
		if(calDay > 0 && calDay <= days){
			html += '<p class="day-top">\
						<span class="day-num">'+ calDay +'</span><span>\
						<span class="day-value">'+ parseInt(Math.random() * 100) +'</span>%</span>\
					</p>\
					<ul>\
						<li class="show-more"><a href="#"><i class="fa fa-arrow-down"></i> 显示更多</a></li>\
						<li class="no-more"><a href="#"><i class="fa fa-arrow-up"></i> 收起</a></li>\
					</ul>';
		}
		html += '</td>';
		if(i%7 == 0){
			html += '</tr>';
		}
	}
	$('.table-calendar').find('tbody').append(html);
	
	colorizeTable();
	bindEvent();
}	

/* 生成日历的相关方法 */
/* 获取某年某月的天数 */
function getDayOfMonth(year, month) {
	//用当月最后一天在一个月中的日期值作为当月的天数
	var d = new Date(year, month, 0).getDate();
	return d;
}

/* 获取某年某月的第一天距离星期天的天数 */
function getDayOfFirstDay(year, month) {
	//用当月第一天在一周中的日期值作为当月离第一天的天数
	var d = new Date(year, month - 1, 1).getDay();
	return d;
}

function colorizeTable(){
	$('.table-calendar td .day-value').each(function(){
		if($(this).text() < 80){
			$(this).parent().css('color','red');
			$(this).parents('td').addClass('editable');
		}
	});
	
	bindAddNoteEvent();
}

function bindAddNoteEvent(){
	var $editBtn = null;
	if(!$editBtn){
		$('.table-calendar .editable').mouseenter(function(){
			$editBtn = $('<a class="btn-edit"><i class="fa fa-edit"></i></a>');
			$editBtn.appendTo($(this).children('.day-top'));
			$editBtn.click(function(){
				$(this).parents('td').attr('id', 'editing');
				$('#noteModal').modal('show');
			});
		}).mouseleave(function(){
			$editBtn.remove();
		});
	}
}

function bindEvent(){
	$('#saveBtn').click(function(){
		var txt = $.trim($('#reason').val());
		if(txt){
			$('#reason').val('');
			var $li = $('<a href="#" class="remove-reason"><i class="fa fa-remove"></i></a>')
						.click(function(){removeItem(this);}).wrap('<li class="single-reason"></li>').parent();
			$li.click(function(){ expandReason(this); }).mouseenter(function(){ showRemoveIcon(this); }).mouseleave(function(){ hideRemoveIcon(this); });
			$('#editing ul').prepend($li.append($('<p></p>').append(txt)));
			
			renderTD($('#editing ul'));
			$('#noteModal').modal('hide');
		}
	});
	
	function removeItem(a){
		if(confirm("确定要删除这条记录吗？")){
			var target = $(a).parents('ul');
			$(a).parent('li').remove();
			$float = null;
			
			renderTD(target);
		}
	}
	
	function expandReason(li){
		var content =  $(li).html();
		var left = $(li).offset().left;
		var top = $(li).offset().top;
		var width = $(li).outerWidth();
		if(!$float){
			$float = $('<div class="float-reason"></div>');
			if(left + 300 > $('.table-calendar').offset().left + $('.table-calendar').width()){
				$float.css({'left': left - 300 + width, 'top':top});
			}else{
				$float.css({'left': left, 'top':top});
			}
			$float.empty().append(content).appendTo($('body'));
			
			$float.click(function(){
				$(this).remove();
				$float = null;
			});
		}
	}
	
	function showRemoveIcon(li){
		$(li).find('.remove-reason').show();
	}
	
	function hideRemoveIcon(li){
		$(li).find('.remove-reason').hide();
	}
	
	$('.show-more').click(function(e){
		$(this).hide().siblings('li').show();
		
		isTDExpanded = true;
		e.preventDefault();
		return false;
	});
	
	$('.no-more').click(function(e){
		$(this).hide().siblings('li').hide();
		$(this).parents('ul').find('.single-reason:lt(2)').show();
		$(this).parents('ul').find('.show-more').show();
		
		isTDExpanded = false;
		e.preventDefault();
		return false;
	});
	
	$('.table-calendar').mousedown(function(){
		$('.float-reason').remove();
		$float = null;
	});
	
	$('#noteModal').on('hidden.bs.modal', function (e) {
		$('#editing').removeAttr('id');
	});
}

function renderTD(ul){
	if($(ul).find('.single-reason').length > 2){
		$(ul).find('.single-reason:lt(2)').show();
		if(isTDExpanded){
			$(ul).find('.single-reason').show();
			$(ul).find('.show-more').hide();
		}else{
			$(ul).find('.single-reason:gt(1)').hide();
			$(ul).find('.show-more').show();
		}
	}else{
		$(ul).find('.single-reason').show();
		$(ul).find('.show-more, .no-more').hide();
		isTDExpanded = false;
	}
}
