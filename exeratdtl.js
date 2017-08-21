define(['framework', 'singleselect', 'datecontrol','validation','css!LV35_BusMonitor/base.css'],
		function(framework, singleselect, dat, validation, daycld){
	//当前分行和当前排班组
	var grpNbr = null; 
	var brnNbr = null;
	var brnNbrCtl = null;
	var schMdlCtl = null;
	
	var isTDExpanded = null;
	var $float = null;
	
	$(document).ready(function() {
		//获取排班组代码
		var params = AppConst.params;
		grpNbr = (params && params.GRP_NBR)?params.GRP_NBR:null;
		
		//排班组代码
		if(!isGroup(grpNbr)){
			framework.showMessage("info","排班组代码有误");
			return false;
		}
		
		//显示排班组名称
		$("#DISPLAY_GRP_NAM").val(params.GRP_NAM?params.GRP_NAM:null);
		
		//初始化页面控件
		initPageCtl();
		
		//添加执行率数据
		getDayRats();
		
		//绑定方法
		bindEvent();
	});
	
	function initPageCtl(){
		//初始化支行列表
		brnNbrCtl = singleselect.create("#SEARCH_BRN_NBR",{
			operationID : 'Common.BranchGroupChild',
			inputValue : [{UPP_BRN:grpNbr}],
			codeColumnName : 'BRN_NBR',	
			valueColumnName : 'BRN_NAM',
		});
		
		//班表模型及样式
		schMdlCtl = singleselect.create("#SEARCH_SCH_MDL", {
			inputValue:"Q2SCHMDL",
		});
		$("div[id^=SEARCH_]").find("select").addClass("form-control");
	}

	function bindEvent(){
		$("#search").on("click", getDayRats);
		$("#saveErrBtn").on("click", doSaveErr);
		$('.table-calendar').mousedown(function(){
			$('.float-reason').remove();
			$float = null;
		});
	}
	
	//异常原因保存
	function doSaveErr(){
		if(!validation.isValid("causeFrm")){
			return false;
		}
		
		var dtaDte = $("#dtaDte").text().trim();
		var brnNbr = $("#brnNbr").val();
		var exeRat = $("#exeRat").val();
		
		if(!dtaDte){
			framework.showMessage("info", "日期有误！")
			return false;
		}
		
		if(!isBrnNbr(brnNbr)){
			framework.showMessage("info", "选择支行有误！")
			return false;
		}
		
		if(!exeRat){
			framework.showMessage("info", "执行率有误！")
			return false;
		}
		
		var mntExeErrCauseX1 = new Object;
		mntExeErrCauseX1['DTA_DTE'] = $("#dtaDte").text().trim();
		mntExeErrCauseX1['BRN_NBR'] = $("#brnNbr").val();
		mntExeErrCauseX1['EXE_RAT'] = $("#exeRat").val();
		mntExeErrCauseX1['CAUSE']   = $("#cause").val();
		mntExeErrCauseX1['OPR_TYP'] = "ADD";
		
		framework.preload();
		framework.operate("BusMonitor.MntExeErrCause", {"MntExeErrCauseX1":[mntExeErrCauseX1]}, afterDoSave, null);
	}
	
	function afterDoSave(){
		framework.endload();
		var id = parseInt(getDay($("#dtaDte").text().trim()));
		$(".Day" + id + " ul .single-reason").remove();
		showCauseItem(id, $("#cause").val(),$("#brnNbr").val());
		$('#noteModal').modal('hide');
	}

	//获取异常执行率
	function getDayRats(){
		var schMdl = $("#SEARCH_SCH_MDL").find("select").val();
		var dtaDte = getFullDate( $("#DTA_DTE").val());
		
		brnNbr = $("#SEARCH_BRN_NBR").find("select").val();

		var queryExeRatDayX1 = new Object;
		queryExeRatDayX1['BRN_NBR'] = brnNbr?brnNbr:grpNbr;
		queryExeRatDayX1['SCH_MDL'] = schMdl?schMdl:'TLRS';
		queryExeRatDayX1['DTA_DTE'] = dtaDte.Format("yyyy-MM-dd");
		
		framework.preload();
		framework.callWKE(addDayRats, "BusMonitor.QueryExeRatDay", '102005', {"QueryExeRatDayX1":[queryExeRatDayX1]}, {BRN_NBR:brnNbr, DTA_DTE:dtaDte}, null, true);
	}
	
	//页面上添加执行率
	function addDayRats(obj, others){
		//创建日历
		createCalendar(others['DTA_DTE']);
		
		if(obj && obj['QueryExeRatDayZ1']){
			var day = null;
			var rat = null;
			$(obj['QueryExeRatDayZ1']).each(function(k,v){
				day = parseInt(getDay(v['DTA_DTE']));
				rat = parseInt(v['EXE_RAT']);
				$(".Day" + day + " .day-top .day-value").html("<span>" + rat + "</span>%");
				$(".Day" + day).data("DTA_DTE",v["DTA_DTE"]);
				$(".Day" + day).data("EXE_RAT",v["EXE_RAT"]);
				if(rat < 80){
					initTd($(".Day" + day));
				}
			});
		}
		framework.endload();
		
		//查询异常原因
		getErrCause(others['BRN_NBR'], others['DTA_DTE']);
	}
	
	function getErrCause(brnNbr,dtaDte){
		var queryExeErrCauseX1 = new Object;
		queryExeErrCauseX1['DTA_MON'] = dtaDte.Format("yyyy-MM");
		queryExeErrCauseX1['BRN_NBR'] = brnNbr?brnNbr:grpNbr;
		
		framework.preload();
		framework.operate("BusMonitor.QueryExeErrCause", {"QueryExeErrCauseX1":[queryExeErrCauseX1]}, addErrCause , null);
	}
	
	function addErrCause(obj){
		if(obj){
			var cause = "";
			$(".day ul .single-reason").remove();
			$(obj['QueryExeErrCauseZ1']).each(function(k,v){
				if(v['CAUSE'] &&　parseInt(v['EXE_RAT']) < 80){
					cause = v['CAUSE'];
					if(!brnNbr){
						cause = "<span>[" + v['BRN_NAM'] + "]</span>" + v['CAUSE'];
					}
					showCauseItem(parseInt(getDay(v['DTA_DTE'])),cause,v['BRN_NBR']);
				}
			});
			bindAddErrCauseEvt();
		}
		framework.endload();
	}
	
	function getDay(dat){
		if("" != dat && dat.length == 10){
			return dat.substr(8);
		}
		return "";
	}
	
	function getMon(dat){
		if("" != dat && dat.length == 10){
			return dat.substr(0,7);
		}
		return "";
	}
	
	function getFullDate(dat){
		if(dat && typeof dat == "string" && dat.indexOf('-') >= 0){
			var date = dat.split("-");
			return new Date(date[0], date[1], 0);
		}
		return new Date();
	}
	
	function createCalendar() {
		var date = getFullDate( $("#DTA_DTE").val());
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var days = new Date(year, month, 0).getDate();//用当月最后一天在一个月中的日期值作为当月的天数
		var firstDay = new Date(year, month - 1, 1).getDay();//用当月第一天在一周中的日期值作为当月离第一天的天数
		var trNums = (days + firstDay)%7 == 0 ? parseInt((days + firstDay)/7) : parseInt((days + firstDay)/7) + 1;
		var tdNums = trNums * 7;
		
		$('.table-calendar').find('tbody').html("");
		var html = '';
		var calDay = 0;
		for ( var i = 1; i <= tdNums; i++) {
			if(i%7 == 1){
				html += '<tr align="center">';
			}
			calDay = i - firstDay;
			html += '<td class="day Day' + calDay + '">';
			if(calDay > 0 && calDay <= days){
				html += '<p class="day-top">';
				html += '	<span class="day-num">'+ calDay +'</span>';
				html += '	<span class="day-value"></span>';
				html += '	<a class="btn-edit hide"><i class="fa fa-edit"></i></a>'
				html += '</p>';
				html += '<ul>';
				html += '	<li class="show-more"><a href="#"><i class="fa fa-arrow-down"></i> 显示更多</a></li>';
				html += '	<li class="no-more"><a href="#"><i class="fa fa-arrow-up"></i> 收起</a></li>';
				html += '</ul>';
			}
			html += '</td>';
			if(i%7 == 0){
				html += '</tr>';
			}
		}
		$('.table-calendar').find('tbody').append(html);
	}
	
	function initTd(obj){
		obj.find(".day-top").find(".day-value").css("color", "red");
		if(brnNbr){
			obj.mouseenter(function(){
				obj.find(".day-top").find(".btn-edit").removeClass("hide");
			}).mouseleave(function(){
				obj.find(".day-top").find(".btn-edit").addClass("hide");
			});
		}
		obj.find(".day-top").find(".btn-edit").click(function(){
			$("#dtaDte").text(obj.data('DTA_DTE'));
			$("#brnNbr").val($("#SEARCH_BRN_NBR").find("select").val());
			$("#exeRat").val(obj.data('EXE_RAT'));
			$('#noteModal').modal('show');
		});
	}
	
	function showCauseItem(container,txt,corNbr){ 
		if(txt){
			$('#cause').val('');
			var id = "li" + corNbr + container;
			$(".Day"+container + " ul").prepend('<li class="single-reason" id="'+id+'"><a href="#" class="remove-reason"><i class="fa fa-remove"></i></a><p>' + txt + '</p></li>');
			$("#" + id).data("BRN_NBR", corNbr);
			if(brnNbr){
				$(".Day"+container + " ul li").mouseenter(function(){
					$(this).find('.remove-reason').show();
				}).mouseleave(function(){
					$(this).find('.remove-reason').hide();
				});
			}
			$('#'+id + ' a').on("click", function(e){ removeCause("#"+id); e.stopPropagation();});
			$('#'+id ).on("click", function(){expandReason("#"+id);});
			renderTD($(".Day"+container + " ul"));
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
	
	function removeCause(a){
		if(confirm("确定要删除这条记录吗？")){
			framework.preload();
			$("#delId").val(a);
			var mntExeErrCauseX1 = new Object;
			mntExeErrCauseX1['DTA_DTE'] = $(a).parents(".day").data("DTA_DTE");
			mntExeErrCauseX1['BRN_NBR'] = $(a).data('BRN_NBR');
			mntExeErrCauseX1['OPR_TYP'] = "DEL";
			framework.operate("BusMonitor.MntExeErrCause", {"MntExeErrCauseX1":[mntExeErrCauseX1]}, afterDoRemove, null);
		}
	}
	
	function afterDoRemove(){
		var a = $("#delId").val();
		var target = $(a).parents('ul');
		$(a).remove();
		renderTD(target);
		framework.endload();
	}
	
	function bindAddErrCauseEvt(){
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
	
	//支行校验
	function isBrnNbr(brnNbr){
		if(brnNbr && brnNbr.length == 6 && brnNbr.charAt(0) != "G" ){
			return true;
		}
		return false;
	}
	
	//排班组校验
	function isGroup(grpNbr){
		if(grpNbr && grpNbr.length == 6 && grpNbr.charAt(0) == "G" ){
			return true;
		}
		return false;
	}
});
