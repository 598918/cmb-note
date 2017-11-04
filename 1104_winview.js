define(['framework','branch','css!LV35_BusMonitor/base.css','LV35_BusMonitor/custom'],
		function(framework,branch,base,custom){
	$(document).ready(function() {
		$('#goBack').on('click', framework.back);
		$('[data-toggle="tooltip"]').tooltip();	
		
		$('#BRN_NBR').branch({
			wkeChild : 'Common.BranchGroupChild',
			permissionPage:custom.winview,
			initFn : function(){
				if(AppConst.params.BRN_NBR){
					$('#BRN_NBR').branch('setInputValue',[AppConst.params.BRN_NBR,AppConst.params.BRN_NAM]);
				}
				showCntResult();
				$("#searchButton").on("click",showCntResult);
			},
			changeFn : function(){showCntResult();}}
		);
	
	});
	
	function showCntResult() { 
		if(validateForm()){
			$('#winviewdiv .panel').remove();
			$('#winviewdiv br').remove();
			
			var inputInfo = {
					QueryHisBusX1 : [ {
						BRN_NBR : $("#BRN_NBR").branch('getValue'),
						SUM_LVL : 'BRN',
						YEAR : (new Date().getFullYear()) -1 ,
						ORD_COL : ''
					} ]
			};
			framework.preload();
			framework.callWKE(afterQueryHis, 'BusMonitor.QueryHisBus', '102005', inputInfo, "", "",true);
		}
	
	}
	
	function afterQueryHis(rtn){
		var hisObj = {};
		if(rtn && rtn.QueryHisBusZ1){
			var brnArry =rtn.QueryHisBusZ1;
			for(var i=0; i<brnArry.length; i++){
				hisObj[brnArry[i].BRN_NBR] = brnArry[i].AVG_CNT;
			}
		}
		var inputInfo = {QueryRealBusWinX1 : [ {BRN_NBR :  $("#BRN_NBR").branch('getValue')} ]};
		framework.callWKE(afterQuery, 'BusMonitor.QueryRealBusWin', '102005', inputInfo, hisObj, "",true);
	}
	
	function afterQuery(rtn,hisObj){
		framework.endload();
		if(rtn && rtn.QueryRealBusWinZ1 && rtn.QueryRealBusWinZ1.length >0 ){
			var brnObj = {},winArry =rtn.QueryRealBusWinZ1;
			var winCnt = 0,reg1Sum = 0,reg2Sum = 0,reg3Sum = 0,reg1Cnt = 0,reg2Cnt = 0,reg3Cnt = 0;
			for(var i=0; i<winArry.length; i++){
				if(!winArry[i].SVR_REG){
					continue;
				}
				var brnNbr = winArry[i].BRN_NBR;
				if(!brnObj[brnNbr]){
					brnObj[brnNbr] =winArry[i];
					$.extend(brnObj[brnNbr],{hisAvg : "-", winCnt : 0, reg1Str : "",reg2Str : "", reg3Str : "", 
						reg1Avg : 0, reg2Avg : 0, reg3Avg : 0,reg1Stu : "", reg2Stu : "", reg3Stu : ""});
					//清空上一个机构的计算数据
					winCnt = 0,reg1Sum = 0,reg2Sum = 0,reg3Sum = 0,reg1Cnt = 0,reg2Cnt = 0,reg3Cnt = 0;
				}
				if(winArry[i].SVR_REG == 1){
					brnObj[brnNbr].reg1Str += generateCounters(winArry[i]);
					reg1Sum += Number(winArry[i].SUM_CNT || 0);
					++reg1Cnt;
					brnObj[brnNbr].reg1Avg = reg1Sum/reg1Cnt;
				}
				if(winArry[i].SVR_REG == 2){
					brnObj[brnNbr].reg2Str += generateCounters(winArry[i]);
					reg2Sum +=  Number(winArry[i].SUM_CNT ||0) ;
					++reg2Cnt;
					brnObj[brnNbr].reg2Avg = reg2Sum/reg2Cnt;
				}
				if(winArry[i].SVR_REG == 3){
					brnObj[brnNbr].reg3Str += generateCounters(winArry[i]);
					reg3Sum +=  Number(winArry[i].SUM_CNT ||0) ;
					++reg3Cnt;
					brnObj[brnNbr].reg3Avg = reg3Sum/reg3Cnt;
				}
				++winCnt;
				if(hisObj[brnNbr]){
					brnObj[brnNbr].hisAvg = hisObj[brnNbr]/winCnt;
				}
				brnObj[brnNbr].winCnt = winCnt;
				brnObj[brnNbr].reg1Stu = getStatusCode(brnObj[brnNbr].reg1Avg, brnObj[brnNbr].hisAvg);
				brnObj[brnNbr].reg2Stu = getStatusCode(brnObj[brnNbr].reg2Avg, brnObj[brnNbr].hisAvg);
				brnObj[brnNbr].reg3Stu = getStatusCode(brnObj[brnNbr].reg3Avg, brnObj[brnNbr].hisAvg);
			}
			
			$.each(brnObj, function(k, v){
				$('#winviewdiv').append(fillTable(v));
			});
		}else{
			framework.showMessage("info", "暂无数据")
		}
	}
	
	function getStatusCode(avgVal, hisAvg){
		var rtn = "F";
		if(hisAvg != "-"){
			var val = avgVal/hisAvg;
			if(val <= 0.6){
				rtn =  "F";
			}else if(1 >= val && val > 0.6){
				rtn =  "N";
			}else if(val>1){
				rtn =  "B";
			}
		}
		
		return  rtn;
	}
	
	function fillTable(data){
		
		var div = '<div class="panel panel-default">\
		 <div class="panel-heading">\
			 <a data-toggle="collapse" href="#' + data.BRN_NBR + '" id="plandetailTitle"><i class="fa fa-arrow-circle-down"></i>' + data.BRN_NAM + '</a>\
			 <ul>\
				 <li>普通：<i class="icon-status-' + data.reg1Stu + '"></i></li>\
				 <li>贵宾：<i class="icon-status-' + data.reg2Stu + '"></i></li>\
				 <li>对公：<i class="icon-status-' + data.reg3Stu + '"></i></li>\
				 <li>去年平均笔数：' + (data.hisAvg == '-' ? data.hisAvg : Math.round(data.hisAvg)) + '</li>\
				 <li>窗口总数：' + data.winCnt + '</li>\
			 </ul>\
		 </div>\
		 <div id="' + data.BRN_NBR + '" class="panel-collapse collapse in">\
			 <div class="panel-body">\
				 <table class="table-dtl">\
					 <colgroup>\
						 <col width="10%">\</col>\
						 <col width="15%"></col>\
						 <col width="60%"></col>\
						 <col width="15%"></col>\
					 </colgroup>\
					 <thead>\
						 <tr>\
							 <th>窗口类型</th>\
							 <th>交易量平均值</th>\
							 <th>窗口已办理笔数</th>\
							 <th>排队预警</th>\
						 </tr>\
					 </thead>\
					 <tbody>\
						<tr class="status-' + data.reg1Stu + '">\
						<td>普通</td>\
						<td><i class="icon-' + data.reg1Stu + '">'+ Math.round(data.reg1Avg) +'</i></td>\
						<td>'+ data.reg1Str +'</td>\
						<td class="waiting"><div><i class="icon-human"></i>× <span>'+ '</span></div></td>\
						</tr>\
						<tr class="status-' + data.reg2Stu + '">\
						<td>贵宾</td>\
						<td><i class="icon-' + data.reg2Stu + '">'+ Math.round(data.reg2Avg) +'</i></td>\
						<td>'+ data.reg2Str +'</td>\
						<td class="waiting"><div><i class="icon-human"></i>× <span>'+ '</span></div></td>\
						</tr>\
						<tr class="status-' + data.reg3Stu + '">\
						<td>对公</td>\
						<td><i class="icon-' + data.reg3Stu + '">'+  Math.round(data.reg3Avg) +'</i></td>\
						<td>'+ data.reg3Str +'</td>\
						<td class="waiting"><div><i class="icon-human"></i>× <span>'+'</span></div></td>\
						</tr>\
					</tbody>\
				 </table>\
			 </div>\
		 </div>\
	 </div>\
	 <br>';
		
		return div;
	}

	function generateCounters(win){
		var counters = '<div class="counter"><p class="counter-title">'+ (win.WIN_NAM || ('窗口 ' + win.WIN_NBR))  +'</p><p>'+parseInt(win.SUM_CNT||0)+'</p></div>';
		return counters;
	}

	function validateForm(){
		var flag = true;
		var brnNbr = $("#BRN_NBR").branch('getValue')
		if(brnNbr.length == 6){
			flag = true;
		} else{
			framework.showMessage("info", "请选择排班组或网点！")
			flag = false;
		}
		return flag;
	}

});
