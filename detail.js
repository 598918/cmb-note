
define(['framework'], function(framework,table){

	$(function() {
		var searchprdCd = "";
		var searchUpdDte = "";
		var params = AppConst.params;
		if (params && params.PRD_CD) {
			searchprdCd = params.PRD_CD;
		}
		if (params && params.UPD_DTE) {
			searchUpdDte = params.UPD_DTE;
		}
		
		// 页面被 iframe 引用
		if (params && params.PAG_INC == 'true') {
			$('body').css({'margin':'0 -25px', 'overflow':'hidden'});
			$('.big-title').hide();
		}

		var inputInfo = {
			DetailX1 : [ {
				PRD_CD : searchprdCd,
				UPD_DTE : searchUpdDte,
				UPDATE_QUERY_COUNT : 'true'
			} ]
		};
		framework.preload();
		framework.callWKE(getDetail, 'Product.Detail', '102005', inputInfo, "", "",true);
		framework.preload();
		framework.callWKE(getHandBook, 'Product.HandBook', '102005', {HandBookX1:[{PRD_CD : searchprdCd}]}, "", "",true);
		
		$('#goBack').on('click', framework.back);
		
		$('#dtlTable thead a').click(function(e){
			e.preventDefault();
			$(this).children('i').toggleClass('fa-arrow-circle-down fa-arrow-circle-right');
			$(this).parents('thead').next('tbody').toggle('fast', function(){reSizePageHeight();});
			e.preventDefault();
			return false;
		});
		//导出
		$('#btn_import').click(function(){
			window.open(AppConst.root + "/download.ndo?{'PRCCOD':'Product.HandBookToWord','INFBDY':{'HandBookToWordX1':[{'PRD_CD' : '"+ searchprdCd + "'}]}}}]}}");
		});
	});

	function getDetail(obj) {
		framework.endload();
		var objz1 = obj['DetailZ1'];
		if (objz1 && objz1.length > 0) {
			$('#PRD_CD').text(objz1[0].PRD_CD);
			$('#PRD_LV1_NAM').text(objz1[0].PRD_LV1_NAM);
			$('#PRD_LV2_NAM').text(objz1[0].PRD_LV2_NAM);
			$('#PRD_LV3_NAM').text(objz1[0].PRD_LV3_NAM);
			$('#HEAD_SAP').text(objz1[0].HEAD_SAP);
			$('#CRT_DTE').text(objz1[0].CRT_DTE);
			$('#MAS_CD').text(objz1[0].MAS_CD);
			$('#FUND_ND').text(objz1[0].FUND_ND);		
			$('#PRD_NAM').text(objz1[0].PRD_NAM);
			$('#PRD_STS_NAM').text(objz1[0].PRD_STS_NAM);
			$('#BRN_NAM').text(objz1[0].BRN_NAM);
			$('#ROOM').text(objz1[0].ROOM);
			$('#SUB_SAP').text(objz1[0].SUB_SAP);
			$('#UPD_DTE').text(objz1[0].UPD_DTE);
			$('#CRG_CD').text(objz1[0].CRG_CD);		
			$('#IS_DEC').text(objz1[0].IS_DEC_NAM);
			$('#IS_HDWK').text(objz1[0].IS_HDWK_NAM);

			$('#MKT_FILE').text(objz1[0].MKT_FILE_NAM).attr("FILE_ID",objz1[0].MKT_FILE);
			$('#FAB_FILE').text(objz1[0].FAB_FILE_NAM).attr("FILE_ID",objz1[0].FAB_FILE);
			$('#OTR_FILE').text(objz1[0].OTR_FILE_NAM).attr("FILE_ID",objz1[0].OTR_FILE);	
			$('#EVL_FILE').text(objz1[0].EVL_FILE_NAM).attr("FILE_ID",objz1[0].EVL_FILE);	
			$('#RET_FILE').text(objz1[0].RET_FILE_NAM).attr("FILE_ID",objz1[0].RET_FILE);	

		}
		
		BindFilelink();
		BindFilelinkMuti();
	}
	
	function getHandBook(obj){
		framework.endload();
		var objz1 = obj['HandBookZ1'];
		if (objz1 && objz1.length > 0) {
			for(var i=0;i<objz1.length;i++){
				if(objz1[i].FILE){
					$("#" + objz1[i].TYPE.toLowerCase()).append("<img src='" + framework.getDownloadUrl(objz1[i].FILE.split(";")[0]) + "'>");
				}
				$("#" + objz1[i].TYPE.toLowerCase()).append(objz1[i].CONTENT);
			}
		}
		var objz2 = obj['HandBookZ2'];
		if (objz2 && objz2.length > 0) {
			for(var i=0;i<objz2.length;i++){
				var content = "<tr><td>" + objz2[i].REPORT_NAME +"</td><td>" + objz2[i].REPORT_ID +"</td><td>" + objz2[i].PORTAL +"</td></tr>";
				$("#rcgl tbody").append(content);
			}
		}
		var objz3 = obj['HandBookZ3'];
		if (objz3 && objz3.length > 0) {
			for(var i=0;i<objz3.length;i++){
				if(objz3[i].FILE_URL){
					$("#xgzd tbody").append("<tr><td>" + objz3[i].FILE_TYPE +"</td><td><a target='_blank' href='" + objz3[i].FILE_URL + "'>" + objz3[i].FILE_NAME +"</a></td><td>" + objz3[i].FILE_ID +"</td></tr>");
				}else{
					$("#xgzd tbody").append("<tr><td>" + objz3[i].FILE_TYPE +"</td><td>" + objz3[i].FILE_NAME +"</td><td>" + objz3[i].FILE_ID +"</td></tr>");
				}
			}
		}
		
		reSizePageHeight();
	}
	
	//单个文件添加下载链接
	function BindFilelink() {
		var obj = $(".FILE_NAM");
		var temp = "";
		obj.each(function(k, v) {
			var fileId = encodeURI(encodeURI($(this).attr('FILE_ID')));
			temp = "<a target='_blank' href='" + framework.getDownloadUrl(fileId) + "}]}}'>";
			temp += $(this).text();
			temp += "</a>";
			$(this).html(temp);
		});	
	}

	//多个文件添加下载链接
	function BindFilelinkMuti(){
	    var obj = $("#OTR_FILE");
		var temp = "";
		obj.each(function(k, v) {		
			var fileId = $(this).attr("FILE_ID");
			var fileNam = $(this).text();
			var fileIdArr = fileId.split(';');
			var fileNameArr = fileNam.split(';');
			if (fileIdArr.length == fileNameArr.length && fileIdArr.length > 0) {
				for ( var i = 0; i < fileIdArr.length; i++) {
					if (i > 0) {
						temp += "<span>;&nbsp<span>";
					}
					temp += "<a target='_blank' href='" + framework.getDownloadUrl(fileIdArr[i]) + "}]}}'>";
					temp += fileNameArr[i];
					temp += "</a>";				
				}
				$(this).html(temp);
			}
		}); 
	}
	
	function reSizePageHeight(height){
		var iframe = window.parent.document.getElementById("detailframe");
		if(iframe){
			var height = $("#dtlTable").height();
			$(iframe).height(height+35);
		}
	}
});
