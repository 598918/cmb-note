define(['framework','table'], function(framework,table){

	var QueryDefine = {
		WkeDefine : {
			WkeCod : "Product.RevList",
			InputName : "RevListX1",
			ResultName : "RevListZ1",
			RecordCountResultName : "RevListZ2"
		},
		InputDefine : {
			PRD_CD : 'INF_PRD_CD',		
			DWN_STR : '',
			DWN_CNT : ''
		}
	};
	
	var $table;
	$(function() {
		var params = AppConst.params;
		if (params && params.PRD_CD) {
			var prdCd = params.PRD_CD;
			$('#INF_PRD_CD').val(prdCd);
			$('#SPAN_PRD_CD').html(prdCd);
		}
		if (params && params.PRD_NAM) {
			$('#INF_PRD_NAM').html(params.PRD_NAM);
		}
	
		$table = $('#listTable').table({
			queryDefine : QueryDefine,
			pageSize : 14,
		});
	
		$table.table('fillTable', 1);
		
		$('#goBack').on('click', framework.back);
	});

});
