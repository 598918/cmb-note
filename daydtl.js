$(document).ready(function() {
	generateCalendar();
	bindEvent();
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
					<ul></ul>';
		}
		html += '</td>';
		if(i%7 == 0){
			html += '</tr>';
		}
	}
	$('.table-calendar').find('tbody').append(html);
	
	colorizeTable();
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
	
	bindNoteEvent();
}

function bindNoteEvent(){
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

var $float = null;
function bindEvent(){
	$('#saveBtn').click(function(){
		var txt = $.trim($('#reason').val());
		if(txt){
			$('#reason').val('');
//			$('#editing ul').append($('<p></p>').append(txt).wrap('<li class="single-reason"></li>'));
			var $li = $('<li class="single-reason"><a href="#" class="remove-reason"><i class="fa fa-remove"></i></a></li>');
			if($('#editing ul li').length > 1){
				$('#editing ul .single-reason:visible').last().hide();
				if($('#editing ul .show-more').length <= 0){
					var $more = $('<li class="show-more"><a href="#"><i class="fa fa-arrow-down"></i> 显示更多</a></li>');
					$('#editing ul').append($more);
				}
			}
			$('#editing ul').prepend($li.append($('<p></p>').append(txt)));
			$('#noteModal').modal('hide');
			
			$('.single-reason').click(function(){
				var content =  $(this).html();
				var left = $(this).offset().left;
				var top = $(this).offset().top;
				var width = $(this).outerWidth();
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
			});
			
			$('.single-reason').mouseenter(function(){
				$(this).find('.remove-reason').show();
			}).mouseleave(function(){
				$(this).find('.remove-reason').hide();
			});
			
			$('.single-reason .remove-reason').click(function(){
				if(confirm("确定要删除这条记录吗？")){
					var target = $(this).parents('ul');
					$(this).parent('li').remove();
					$float = null;
					
					reorder(target);
				}
			});
		}
	});
	
	$('.table-calendar').mousedown(function(){
		$('.float-reason').remove();
		$float = null;
	});
	
	$('#noteModal').on('hidden.bs.modal', function (e) {
		  $('#editing').removeAttr('id');
	});
}

function reorder(ul){
	console.log(ul.html());
	$(ul).find('.single-reason:lt(2)').show();
}
