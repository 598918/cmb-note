var params = getParams();

$(function() {
	$('#mngDetailTitle').text(params['year']+'年'+params['month'] +'月');	
	
	clearBrnList();
	clearCalendar();
	generateCalendar(params);
	bindEvent();
	
	$(document.body).find('#empViewBtn').trigger('click');
});

function generateCalendar(params) {
	var year = params['year'];//排班年份
	var month = params['month'];//排班月份
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
			html += calDay;
		}
		html += '</td>';
		if(i%7 == 0){
			html += '</tr>';
		}
	}
	$('#week_template').find('tbody').append(html);
}	

function detail_callback(obj) {
	if (obj && obj.OutputResult  && obj.OutputResult.length >0) {	
		DetailList = obj.OutputResult;
		var start=0;
		var end =0;
		var last_dte = DetailList[0].DTA_DTE;
		for ( var i = 0; i < DetailList.length; i++) {
			var now_dte = DetailList[i].DTA_DTE; 
		    if(last_dte!=now_dte && i > 0) {		    	
		    	end =  i - 1 ;		   		    	
		    	// 添加开始 与结束索引号 到属性
		    	addDate(last_dte,start,end);		    	
				// 更新值下次循环
		    	last_dte = now_dte;
		    	start = i;
		    }
		    if(i == DetailList.length -1){
		    	end = i;
		    	// 添加开始 与结束索引号 到属性
		    	addDate(last_dte,start,end);		    	
		    }			
		}
	}
}

//添加属性到日历td上
function addDate(last_dte, start, end) {
	// 插入开始 与结束索引号
	var date = last_dte.split("-");
	var dayClass = '.Day' + date[2].replace(/^0+/, "");
	$('#week_template').find(dayClass).addClass('remind').attr('START', start).attr('END', end).on("click", showBrnDetail);
}

//显示机构班表明细 
function showBrnDetail() {
	var $this = $(this);
	var start = parseInt($this.attr('START'));
	var end =  parseInt($this.attr('END'));	
    var lastBrnnbr ="000000";
    var sch_mdl = params['sch_mdl'];    
    
    $("tbody td").removeClass('currentday');
    $this.addClass('currentday');
    
    clearBrnList();
	for ( var i = start; i <= end; i++) {
		var nowBrnnbr = DetailList[i].BRN_NBR;
		if( nowBrnnbr!= lastBrnnbr ){
			//添加支行
			var newrow = $("#detail_template").clone();
			$(newrow).attr('id', 'BRN' + nowBrnnbr);			
			$(newrow).find("h2").text(DetailList[i].BRN_NAM =='' ? DetailList[i].BRN_NBR:DetailList[i].BRN_NAM);		
			$(newrow).attr('BRN_NBR', nowBrnnbr);
			$(newrow).find("li").remove();
			$(newrow).show();
			$("#srcbill").append(newrow);			
			//更新上一机构编号
			lastBrnnbr =  nowBrnnbr;
		}
		
		//添加柜员人员	
		if (sch_mdl == 'TLRS') {//柜员	
			var newli  = $("#tlr_li_template").clone();
			$(newli).append(DetailList[i].SAP_NAM);		
			$(newli).attr("id",nowBrnnbr+DetailList[i].WIN_NAM);			
			var htmlcontent = '	<div class="modal-arrange">\
									<p><span>工号：</span><span>' + DetailList[i].SAP_NBR + '</span></p>\
									<p><span>窗口：</span><span>' + DetailList[i].WIN_NAM + '</span></p>\
									<p><span>类型：</span><span>' + DetailList[i].WIN_TYP_NAM +'</span></p>\
									<p><span>时间：</span><span>' + DetailList[i].OPN_TIM +'-'+ DetailList[i].CLS_TIM+ '</span></p>\
								</div>';	
			$(newli).data('data', htmlcontent);
			$(newli).on("click", showSapDetail);
			$(newli).show();
			$('#BRN' + nowBrnnbr).find('ul').append(newli);
		} else if (sch_mdl == 'CHFS') {//主管	
			var newli = $("#chf_li_template").clone();
			$(newli).append(DetailList[i].SAP_NAM +'/'+ DetailList[i].CHF_TYP_NAM);
			$(newli).removeAttr("id");	
			$(newli).show();
			$('#BRN' + nowBrnnbr).find('ul').append(newli);
		}	
	}	
}

function clearCalendar(){
	$('#week_template').find('tbody').empty();
}

function clearBrnList(){
	$('#srcbill').find('.bill-list[brn_nbr]').remove();
}

function showSapDetail(){
	var modal = $.modal({
      title: $(this).text(),
      text:  $(this).data('data'),
      buttons: [
        {
          text: '确定'
        }
      ]
    });
}

function bindEvent(){
	$(document).on('click', '#winViewBtn', function() {
		// TODO
	});
	
	$(document).on('click', '#empViewBtn', function() {
		var inputInfo = {'InputParameter' : [{'SCH_NBR' : params['sch_nbr']}]};	
		if(params['sch_mdl'] =='TLRS'){
			callWKE('detail_callback', 'WapArrMngTlrDetail', '102005', inputInfo, "", "");
		}else if(params['sch_mdl'] == 'CHFS'){
			callWKE('detail_callback', 'WapArrMngChfDetail', '102005', inputInfo, "", "");
		}
	});
	
	$(document).on('mylib:change', function(e, from, to){
		  console.log('change on %o with data %s, %s', e.target, from, to);
	});
	// trigger the custom event
//	$(document.body).trigger('mylib:change', ['one', 'two']);
}
