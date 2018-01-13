define(['framework','validation','upload','branch','multiselect','singleselect','users','LF62_Product/plugin/wfsubmit/wfsubmit'], 
function(framework,validation,upload,branch,multiselect,singleselect,users,wfsubmit){
	var PagUid 	   = '3006';
	var wfsessionId = 0;
	var wfsubmitCreated = false;
	var initPrdLv1 = null;
	var initPrdLv2 = null;
	var initPrdLv3 = null;
	var Files = {
			mktfile : {},
			fabfile : {},
			otrfile : {},
			evdfile : {}
		};

	var HbFiles = {
			YWLC : {},
			ALFX : {}
		};
	var HbFilesInitData = {
			YWLC : null,
			ALFX : null
		}
	var HB_types = ['CPJJ','JRXQ','YHHY','SYDX','YWLC','FXTS','ALFX'];
	var componentObjs={
			multiObj : {},
		}
	$(function(){
		var params = AppConst.params;
		if (params && params.PAG_UID) {
			PagUid = params.PAG_UID;		
		}
		if (params && params.WFSESSION_ID) {
			wfsessionId= parseInt(params.WFSESSION_ID);
		}
		
		if(wfsessionId==0){
			//初始化页面控件
			initController();
		}else{
			//提交或驳回后修改
			framework.preload();
			framework.callWKE(getDetail, 'Product.NewApq', '102005',{NewApqX1:[{SESSION_ID : wfsessionId}]}, "", "",true);
		}
				
		//事件绑定
		bindEvent();
		
		//显示提示
		$('[data-toggle="tooltip"]').tooltip();
	});

	//初始化页面控件
	function initController(){
		//产品线、产品类、产品组三级联动
		genSearchPrdLv1();
		
		//产品主管部门
		$('#BRN_NBR').branch({
			type : 'STD',
			permissionPage : PagUid,
			wkeChild : 'Product.StdBranchChild',
			wkeDetail : 'Product.StdBranchDetail',
			wkePermissionPage : 'Product.StdUserRoleBranch'
		});
		
		//产品经理（总行和分行）
		$("#HEAD_SAP").users({maxSize:5});
		$("#SUB_SAP" ).users({maxSize:50});
		
		// 产品文件上传				
		Files.mktfile = upload.create('#MKT_FILE',{		
			accept: null,			
			errorFn   : function(msg){framework.showMessage("info",msg);}
		});
		Files.fabfile = upload.create('#FAB_FILE',{		
			accept: null,			
			errorFn   : function(msg){framework.showMessage("info",msg);}
		});
		Files.otrfile = upload.create('#OTR_FILE',{		
			accept: null,			
			errorFn   : function(msg){framework.showMessage("info",msg);},
			isMulti : true //多个文件
		});
		Files.evdfile = upload.create('#EVD_FILE',{		
			accept: null,			
			errorFn: function(msg){framework.showMessage("info",msg);},
			isMulti : true //多个文件
		});
		// 手册章节附件上传		
		HbFiles.YWLC = upload.create('#HB_YWLC_FILE',{		
			accept: '.bmp,.gif,.jpg,.jpeg,.png',			
			errorFn   : function(msg){framework.showMessage("info",msg);}
		});
		HbFiles.ALFX = upload.create('#HB_ALFX_FILE',{		
			accept: '.bmp,.gif,.jpg,.jpeg,.png',			
			errorFn   : function(msg){framework.showMessage("info",msg);}
		});
					
		// 是否涉及手工业务	
		componentObjs.multiObj = multiselect.create('#HDWK_V', {
			autoExpand : true,
			multiSelect : true,
			operationID : 'Common.ParameterQuery',
			outputDataID : 'ParameterQueryZ1',
			codeColumn : 'PAM_SUB',
			valueColumn : 'PAM_SUB_NAM',
			inputValue : 'HANDWORK',
			inputKey : 'PAM_FAT',
			selectModel : 'all',
			placeholder : '--手工关键处理环节--',
			initFn : function() {
				componentObjs.multiObj.disableControl(true);
				}
			});	
	}

	function getDetail(obj) {
		framework.endload();
		var objz1 = obj['NewApqZ1'];
		if (objz1 && objz1.length > 0) {			
			$('#PRD_NAM').val(objz1[0].PRD_NAM);
			$('#MAS_CD').val(objz1[0].MAS_CD);
			$('#FUND_ND').val(objz1[0].FUND_ND);	
			$('#CRG_CD').val(objz1[0].CRG_CD);		
			$('#ROOM').val(objz1[0].ROOM);	
			$('#REV_TXT').val(objz1[0].REV_TXT);			
			
			//产品经理
			$('#HEAD_SAP').users({
				maxSize : 5,
				initData : objz1[0].HEAD_SAP
			});
			$('#SUB_SAP').users({
				maxSize : 50,
				initData : objz1[0].SUB_SAP
			});

			// 是否涉及保证金
			if(objz1[0].IS_DEC=='Y'){
				$("input[name=IS_DEC]:eq(1)").attr("checked",'checked');				
			}else{
				$("input[name=IS_DEC]:eq(0)").attr("checked",'checked');
			}
			// 是否涉及手工业务	
			componentObjs.multiObj = multiselect.create('#HDWK_V', {
				autoExpand : true,
				multiSelect : true,
				operationID : 'Common.ParameterQuery',
				outputDataID : 'ParameterQueryZ1',
				codeColumn : 'PAM_SUB',
				valueColumn : 'PAM_SUB_NAM',
				inputValue : 'HANDWORK',
				inputKey : 'PAM_FAT',
				selectModel : 'all',
				placeholder : '--手工关键处理环节--',
				initFn : function() {
					componentObjs.multiObj.setValue(objz1[0].IS_HDWK);
					enablePlaceholder();
					}
				});		
			if (objz1[0].IS_HDWK == '') {
				$("input[name=IS_HDWK]:eq(0)").attr("checked", 'checked');
				componentObjs.multiObj.disableControl(true);
			} else {
				$("input[name=IS_HDWK]:eq(1)").attr("checked", 'checked');				
			}
			
			// 产品文件上传	
			var mktfile = objz1[0].MKT_FILE;
			var mktinitData = {};
			if(mktfile != ''){
				mktinitData[mktfile] = objz1[0].MKT_FILE_NAM;
			}else{
				mktinitData = null;	
			}			
			var fabfile = objz1[0].FAB_FILE;
			var fabinitData = {};
			if(fabfile != ''){
				fabinitData[fabfile] = objz1[0].FAB_FILE_NAM;
			}else{
				fabinitData = null;
			}
			var otrfiles = objz1[0].OTR_FILE.split(";");
			var otrfileNams = objz1[0].OTR_FILE_NAM.split(";");
			var otrinitData = {};
			if (otrfiles != '' && otrfiles.length > 0) {
				for (var o = 0; o < otrfiles.length; o++) {
					otrinitData[otrfiles[o]] = otrfileNams[o];
				}
			}
			var evdfiles = objz1[0].EVD_FILE.split(";");
			var evdfileNams = objz1[0].EVD_FILE_NAM.split(";");
			var evdinitData = {};
			if (evdfiles != '' && evdfiles.length > 0) {
				for (var o = 0; o < evdfiles.length; o++) {
					evdinitData[evdfiles[o]] = evdfileNams[o];
				}
			}
			
			Files.mktfile = upload.create('#MKT_FILE',{		
				accept: null,			
				errorFn   : function(msg){framework.showMessage("info",msg);},
				initData : mktinitData				
			});
			Files.fabfile = upload.create('#FAB_FILE',{		
				accept: null,			
				errorFn   : function(msg){framework.showMessage("info",msg);},
				initData : fabinitData

			});
			Files.otrfile = upload.create('#OTR_FILE',{		
				accept: null,			
				errorFn   : function(msg){framework.showMessage("info",msg);},
				isMulti : true ,
				initData : otrinitData
			});
			Files.evdfile= upload.create('#EVD_FILE',{		
				accept: null,			
				errorFn   : function(msg){framework.showMessage("info",msg);},
				isMulti : true ,
				initData : evdinitData
			});
			
		  //产品线类组单选框			
		  genSearchPrdLv1(objz1[0].PRD_LV1,objz1[0].PRD_LV2,objz1[0].PRD_LV3);
//		  $('#PRD_LV1').attr('disabled','disabled');
//		  $('#PRD_LV2').attr('disabled','disabled');
//		  $('#PRD_LV3').attr('disabled','disabled');

		  //产品主管部门  		
		  $('#BRN_NBR').branch({
			  type : 'STD',
			  fixData : [{code:objz1[0].BRN_NBR,value:objz1[0].BRN_NAM}],
			  wkeChild : 'Product.StdBranchChild',
			  wkeDetail : 'Product.StdBranchDetail',
			  wkePermissionPage : 'Product.StdUserRoleBranch'			
		  });
		  $('#BRN_NBR').branch('setInputValue', [ objz1[0].BRN_NBR, objz1[0].BRN_NAM]);
//		  $('#BRN_NBR input').attr('disabled','disabled');
//		  $('#BRN_NBR button').attr('disabled','disabled');		  
		}	
	
		var objz2 = obj['NewApqZ2'];
		if (objz2 && objz2.length > 0) {
			for(var i=0;i<objz2.length;i++){
				var content=objz2[i].CONTENT;
				var type=objz2[i].TYPE;
				var files=objz2[i].FILE.split(";");
				var fileNams=objz2[i].FILE_NAM.split(";");

				if(content){
					content = content.replace(/<\/p><p>/g, '\n');
					content = content.replace(/<p>/g, '').replace(/<\/p>/g, '');
				}
				$('#HB_' + type).val(content);
				
				if (files != '' && files.length > 0 && typeof (HbFiles[type]) == 'object') {
					var tmp = {};
					for (var f = 0; f < files.length; f++) {
						tmp[files[f]] = fileNams[f];
					}	
					HbFilesInitData[type]= tmp;						
				} 		
			}
		}	
		$.each(HbFiles,function(key){
			HbFiles[key] = upload.create('#HB_'+ key +'_FILE',{		
				accept: '.bmp,.gif,.jpg,.jpeg,.png',			
				errorFn   : function(msg){framework.showMessage("info",msg);},
				initData : HbFilesInitData[key]
			});
		});
			
		var objz3 = obj['NewApqZ3'];
		if (objz3 && objz3.length > 0) {
			$("#HB_RCGL_TB tbody").empty();		
			for(var i=0;i<objz3.length;i++){
				var content = "<tr><td>" + objz3[i].REPORT_NAME +"</td><td>" + objz3[i].REPORT_ID +"</td><td>" + objz3[i].PORTAL +"</td></tr>";
				$("#HB_RCGL_TB tbody").append(content);			
			}
		}
		var objz4 = obj['NewApqZ4'];
		if (objz4 && objz4.length > 0) {
			$("#HB_XGZD_TB tbody").empty();
			for(var i=0;i<objz4.length;i++){
				var content = "<tr><td type='select'>"+ objz4[i].FILE_TYPE +"</td><td>"+objz4[i].FILE_NAME+"</td><td>"+objz4[i].FILE_ID+"</td><td class='link-container'><div>"+objz4[i].FILE_URL+"</div></td></tr>";
				$("#HB_XGZD_TB tbody").append(content);
			}
		}
	
	}	
	
	//事件绑定
	function bindEvent(){
		$("#btn_save").on("click", savePrnInf);
		$("#approvalbtn").on("click", function(){savePrnInf("submit");});//提交审批	
		
		$('#goBack').on('click', framework.back);
		
		// 折叠表格
		$('#dtlTable thead a').click(function(e){
			$(this).children('i').toggleClass('fa-arrow-circle-down fa-arrow-circle-right');
			$(this).parents('thead').next('tbody').toggle();
			e.preventDefault();
			return false;
		});
		//radio事件
		$("input[type=radio][name=IS_HDWK]").on("click", function(){	
			var v = $("input[type=radio][name=IS_HDWK]:checked").val();
			if("Y"==v){
				componentObjs.multiObj.enableControl(false);
			}else{
				componentObjs.multiObj.disableControl(true);
			}
		});
		
		bindEventEditable();
	}

	function disableMulti($obj){
		//$obj.find('button').attr('disabled','disabled');
		$obj.css('overflow','hidden').find('input').css('background','#eee');
	}
	function enableMulti($obj){
		//$obj.find('button').removeAttr('disabled');
		$obj.css('overflow','inherit').find('input').css('background','#fff');		
	}
	// 绑定可编辑表格的事件
	function bindEventEditable(){
		// 选中行
		$('.mTable').click(function(e){
			if(e.target.nodeName == 'TD'){
				$(e.target).parent('tr').toggleClass('row-selected').siblings().removeClass('row-selected');
			}
		});
		
		// 新增行
		$('#newRowThreeTd').click(function(){
			var html = '<tr><td></td><td></td><td></td></tr>';
			$(this).parent().prev('table').find('tbody').append(html);
		});		
		$('#newRowFourTd').click(function(){
			var html = '<tr><td type="select"></td><td></td><td></td><td class="link-container"><div></div></td></tr>';
			$(this).parent().prev('table').find('tbody').append(html);
		});
		
		// 删除行
		$('.deleteRow').click(function(){
			$(this).parent().prev('table').find('.row-selected').remove();
		});
		
		// 更改行内容
		$('.mTable tbody').dblclick(function(e){
			var vb = $(e.target).text();
			$(e.target).empty();
			if($(e.target).attr('type')=='select'){
				$('<select style="width:100%;"><option>行内</option><option>行外</option></select>').val(vb).prependTo($(e.target)).focus().blur(function(){
					var vf = $(this).val();
					$(e.target).html(vf);
					$(this).remove();
				});
			} else{
				$('<input type="text" style="width:100%;" />').val(vb).prependTo($(e.target)).focus().blur(function(){
					var vf = $(this).val();
					$(e.target).html($.trim(vf));
					$(this).remove();
				});
			}
		});
	}

	//保存产品信息
	function savePrnInf(arg){
		
		//表单验证 
		var result = validation.validate("prdForm");
		if(eval(result)){
			if(!result.ISPassCheck){
				$("#"+result.control).showTip({
					flagInfo  : result.message,
					isAnimate : true
				});
				return false;
			}
		}
		
		//机构验证
		var brnNbr = $('#BRN_NBR').branch('getValue');
		if(!/^([0-9]{9})$/.test(brnNbr)){
			framework.showMessage("info", "机构只能为标准机构机构号!");
			return false;
		}
		
		//如果‘是否涉及手工业务’选择为‘是’，则手工关键处理环节为必填项
		var isDec = $("input[type=radio][name=IS_DEC]:checked" ).val();
		var hdwk  = "";
		if("Y" == $("input[type=radio][name=IS_HDWK]:checked").val()){
			var hdwk_kv = componentObjs.multiObj.getSelectedNode();
			var hdwkArr = [];
			$.each(hdwk_kv, function(k,v){
				hdwkArr.push(k);
			});
			if(hdwkArr.length > 0){
				hdwk = hdwkArr.join(",");
			}
			if(hdwk==''){
				$('#HDWK_V').find('input:eq(0)').showTip({
					flagInfo : "选中'是'时,该项必填",
					isAnimate : true
				});
				return false;
			}
		}
		
		//总行经理校验 
		if(0 == $("#HEAD_SAP").users("getMaxSize")){
			framework.showMessage("info", "总行产品经理不能为空!");
			return false;
		};
		
		// 基础参数
		var paramsX1 = new Object;
		paramsX1['MAS_CD']   = $("#MAS_CD").val();
		paramsX1['CRG_CD']   = $("#CRG_CD").val().replace(/\s/g,"").replace(/，/g,",");
		paramsX1['FUND_ND']  = $("#FUND_ND").val().replace(/\s/g,"").replace(/，/g,",");
		paramsX1['PRD_NAM']  = $("#PRD_NAM").val();
		paramsX1['BRN_NBR']  = brnNbr;
		paramsX1['PRD_LV1']  = $("#PRD_LV1").val();
		paramsX1['PRD_LV2']  = $("#PRD_LV2").val();
		paramsX1['PRD_LV3']  = $("#PRD_LV3").val();
		paramsX1['UPP_PRD']  = $("#PRD_LV3").val();
		paramsX1['ROOM']     = $("#ROOM").val();
		paramsX1['HEAD_SAP'] = $("#HEAD_SAP").users("getKVStr");
		paramsX1['SUB_SAP']  = $("#SUB_SAP" ).users("getKVStr");
		paramsX1['IS_DEC']   = isDec ? isDec : "";
		paramsX1['IS_HDWK']  = hdwk  ? hdwk  : "";
		paramsX1['REV_TXT']  = $("#REV_TXT").val();
		paramsX1['MKT_FILE'] = Files.mktfile.getKeys() ;
		paramsX1['FAB_FILE'] = Files.fabfile.getKeys() ;
		paramsX1['OTR_FILE'] = Files.otrfile.getKeys() ;
		paramsX1['EVD_FILE'] = Files.evdfile.getKeys() ;
		paramsX1['SESSION_ID'] = wfsessionId ;


		// 产品手册段落 //TODO 验证必填与字符数
		var paramsX2 = new Array();
		for (var i = 0; i < HB_types.length; i++) {
			var hbElt = {};
			hbElt['TYPE'] = HB_types[i];
			if (typeof (HbFiles[HB_types[i]]) == 'object') {
				hbElt['FILE'] =  HbFiles[HB_types[i]].getKeys();
			} else {
				hbElt['FILE'] = '';
			}
			hbElt['CONTENT'] = $('#HB_' + HB_types[i]).val();
			if($('#HB_' + HB_types[i]).is(":hidden")){
				var validkey=$('#HB_' + HB_types[i]).attr("validate");
				if(validkey.indexOf('required')>=0){
					if($.trim(hbElt['CONTENT'])==''){
						framework.showMessage("info","产品手册必填项不能为空,请点击产品手册标签展开编辑区后填写。");
						return false;
					}
				}
			}	
			if(hbElt['CONTENT']){
				hbElt['CONTENT'] = '<p>' + hbElt['CONTENT'] + '</p>';
				hbElt['CONTENT'] = hbElt['CONTENT'].replace(/\n/g, '</p><p>');
			}
//			hbElt['CONTENT'] = HB_types_obj[i].getValue();
			
			paramsX2.push(hbElt);
		}

		// 产品手册日常管理
		var paramsX3 = new Array();
		var rcglCnt = $('#HB_RCGL_TB tbody').find("tr").length;
		for (var a = 0; a < rcglCnt; a++) {
			var rcglElt = {};
			var tr = $('#HB_RCGL_TB tbody tr:eq(' + a + ')');
			rcglElt['REPORT_NAME'] = $.trim(tr.find('td:eq(0)').text());
			rcglElt['REPORT_ID'] = $.trim(tr.find('td:eq(1)').text());
			rcglElt['PORTAL'] = $.trim(tr.find('td:eq(2)').text());
			rcglElt['LIST_ORDER'] = a;

			if (rcglElt['REPORT_NAME'] == '' && rcglElt['REPORT_ID'] == '' && rcglElt['PORTAL'] == '') {
				continue;
			}
			var rcglMaxlength={
					REPORT_NAME:100,
					REPORT_ID:20,
					PORTAL:100
			};
			if (framework.getCNStringLength(rcglElt['REPORT_NAME']) > rcglMaxlength.REPORT_NAME) {
				framework.showMessage('error','第'+(b+1)+'行相关报表长度超过'+rcglMaxlength.REPORT_NAME);
				return;				
			}
			if (framework.getCNStringLength(rcglElt['REPORT_ID']) > rcglMaxlength.REPORT_ID) {
				framework.showMessage('error','第'+(b+1)+'行报表编号长度超过'+rcglMaxlength.REPORT_ID);
				return;				
			}
			if (framework.getCNStringLength(rcglElt['PORTAL']) > rcglMaxlength.PORTAL) {
				framework.showMessage('error','第'+(b+1)+'行系统平台长度超过'+rcglMaxlength.PORTAL);
				return;				
			}
			paramsX3.push(rcglElt);
		}
		
		// 产品手册相关制度
		var paramsX4 = new Array();
		var xgzdCnt = $('#HB_XGZD_TB tbody').find("tr").length;
		for (var b = 0; b < xgzdCnt; b++) {
			var xgzdElt = {};
			var tr = $('#HB_XGZD_TB tbody tr:eq(' + b + ')');
			xgzdElt['FILE_TYPE'] = $.trim(tr.find('td:eq(0)').text());
			xgzdElt['FILE_NAME'] = $.trim(tr.find('td:eq(1)').text());
			xgzdElt['FILE_ID'] = $.trim(tr.find('td:eq(2)').text());
			xgzdElt['FILE_URL'] = $.trim(tr.find('td:eq(3)').text());
			xgzdElt['LIST_ORDER'] = b;

			if (xgzdElt['FILE_NAME'] == '' && xgzdElt['FILE_ID'] == '' && xgzdElt['FILE_URL'] == '') {
				continue;
			}
			var xgzdMaxlength={
					FILE_NAME:200,
					FILE_ID:100,
					FILE_URL:1000
			};
			if (framework.getCNStringLength(xgzdElt['FILE_NAME'])> xgzdMaxlength.FILE_NAME) {
				framework.showMessage('error','第'+(b+1)+'行制度名称长度超过'+xgzdMaxlength.FILE_NAME);
				return;				
			}
			if (framework.getCNStringLength(xgzdElt['FILE_ID']) > xgzdMaxlength.FILE_NAME) {
				framework.showMessage('error','第'+(b+1)+'行发文文号长度超过'+xgzdMaxlength.FILE_ID);
				return;				
			}
			if (framework.getCNStringLength(xgzdElt['FILE_URL']) > xgzdMaxlength.FILE_NAME) {
				framework.showMessage('error','第'+(b+1)+'行链接网址长度超过'+xgzdMaxlength.FILE_URL);
				return;				
			}
		
			paramsX4.push(xgzdElt);
		}	
		
		if(paramsX4.length==0){
			framework.showMessage('error','相关制度不能为空！');
			return;
		}

		//查询
		framework.preload();
		var NewX = {
			'NewX1' : [paramsX1],
			'NewX2' : paramsX2, 
			'NewX3' : paramsX3,
			'NewX4' : paramsX4
		};
		framework.callWKE(afterProductNew, "Product.New", '102005', NewX, arg, "", true);
	}

	//保存后跳转到详情页面
	function afterProductNew(obj,arg){
		framework.endload();
		if(obj && obj['NewZ1'] && obj['NewZ1'].length>0){
			wfsessionId = obj['NewZ1'][0].SESSION_ID;
			if(arg == 'submit'){
				if(!wfsubmitCreated){
					//创建提交审批插件
					var currentTaskId = obj['NewZ1'][0].TASK_ID;
					var brnNbr = obj['NewZ1'][0].BRN_NBR;
					var brnFindType = "UP";
					
					wfsubmit.init('#submitDialog', {
						prcCod : 'Product.NewApa',
						sessionId : wfsessionId,
						currentTaskId : currentTaskId,
						brnNbr : brnNbr,
						brnFindType : brnFindType
					});
					wfsubmitCreated = true;
				}
				
				if(wfsubmitCreated){
					wfsubmit.openSubmitDialog(function(){
						framework.showMessage('info','流程提交成功！', function(){framework.back();});
					});
				}
			}else{
				framework.showMessage('info','保存成功！');
			}
		}else{
			framework.showMessage('error','保存失败！');
		}	
	}
	
	// 产品线
	function genSearchPrdLv1(lv1_val,lv2_val,lv3_val) {
		creatPrdSelect('PRD_LV1', '', genSearchPrdLv2, function() {
			if (lv1_val) {
				$('#PRD_LV1').val(lv1_val);
				genSearchPrdLv2(lv1_val,lv2_val,lv3_val);
			} 		
		});
	}

	// 产品类
	function genSearchPrdLv2(lv1_val,lv2_val,lv3_val) {
		if (!lv1_val || lv1_val == '') {
			creatPrdSelect('PRD_LV2', lv1_val, null,null, true);		
		} else {
			creatPrdSelect('PRD_LV2', lv1_val, genSearchPrdLv3, function() {
				if (lv2_val) {
					$('#PRD_LV2').val(lv2_val);
					genSearchPrdLv3(lv2_val,lv3_val);
				}
			});		
		}
		creatPrdSelect('PRD_LV3', lv1_val, null,null, true);
	}

	// 产品组 
	function genSearchPrdLv3(lv2_val,lv3_val) {
		if (!lv2_val || lv2_val == '') {
			creatPrdSelect('PRD_LV3', lv2_val, null, null, true);
		} else {
			creatPrdSelect('PRD_LV3', lv2_val, null, function() {
				if (lv3_val) {
					$('#PRD_LV3').val(lv3_val);
				}	
			});
		}
	}

	//创建产品目录单选框
	function creatPrdSelect(id,inputVal, changeFn,initFn, isNull) {
		$('#' + id).singleselect({
			operationID     : isNull ? null : 'Product.Child',
			inputValue 		: [{
				UPP_PRD : inputVal, 		// 输入参数
				IF_FTR : false,
				IF_VALID : false 
			}],
			codeColumnName  : 'PRD_CD',   	// 输出option编码字段
			valueColumnName : 'PRD_NAM',  	// 输出option文本字段
			changeFn        : changeFn ,  	// 选中回调	
			initFn			: initFn		// 初始化回调			
		});
	}
	
	
	function enablePlaceholder(){
		if(AppConst.explorerType == 'IE' && AppConst.explorerVersion < 10){
			$("input[placeholder]").placeholder();
		}
	}
});
