define([ 'components/config', 'framework', 'dragModal','skin/js/jquery-ui.min.js','skin/js/jquery.ui.touch-punch.min.js','skin/js/jquery.htmlClean.js' ],
function(config, framework) {
	var componentsObj = config.genCompnonets(),aceMode, tree = [], less='';

	function randomNumber() {
		return randomFromInterval(1, 1e6);
	}
	
	function randomFromInterval(e, t) {
		return Math.floor(Math.random() * (t - e + 1) + e);
	}
	
	function getPreviewHtml() {
		var $preview = $(".demo").clone();
		$preview.find(".operation, .preview").remove();
		var $row = $preview.find(".lyrow, .box").first();  // 为什么是 first()
		while ($row.length > 0) {
			$row.parent().append($row.html());
			$row.remove();
			$row = $preview.find(".lyrow, .box").first();
		}
		$preview.find("*").removeClass("box-content column ui-sortable config-inner").removeAttr('style data-css tmpId extra-class');
		for ( var component in componentsObj) {
			if (componentsObj[component] && typeof componentsObj[component].afterInit == 'function') {
				componentsObj[component].afterInit();
			}
		}
		return $preview.html();
	}

	function getTarget(html) {
		var target = '<!DOCTYPE html>\n'
				+ '<html lang="zh-CN">\n'
				+ '<head>\n'
				+ '<meta charset="utf-8">\n'
				+ '<meta http-equiv="X-UA-Compatible" content="IE=edge">\n'
				+ '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
				+ '<link rel="stylesheet/less" href="page1.less" />\n'
				+ '<script src="less.min.js"></script>\n'
				+ '<title>预览页</title>\n' + '</head>\n' + '<body><div class="col-sm-12">\n'
				+ html + '\n' + '</div><script>\n'
				+ 'var iImportCss = false;\n' + '</script>\n'
				+ '<script src="../../framework.js"></script>\n'
				+ '</body>\n' + '</html>\n';
		return target;
	}

	function getCleanHtml(html) {
		return html;
		// return $.htmlClean(html, {
		// format : true,
		// allowedAttributes : [ [ "id" ], [ "class" ], [ "data-toggle"
		// ],
		// [ "data-target" ], [ "data-parent" ], [ "role" ],
		// [ "data-dismiss" ], [ "aria-labelledby" ], [ "aria-hidden" ],
		// [ "data-slide-to" ], [ "data-slide" ] ]
		// });
	}
	
	function importPage() {
		framework.operate("DevPortal.ImportPage", {
			"ImportPageX1" : [ {
				"ProjectCode" : "0.project.folder",
				"PageCode" : "page1"
			} ]
		}, afterImport);
	}
	
	function afterImport(obj) {
		$('#tag-name, #extra-class, #css-editer').val('');
		if (obj) {
			$('.demo').html(obj['ImportPageZ1'][0]['HTML']);
			
			$('.demo .lyrow, .demo .box').mouseenter(function(){
				$(this).children('.operation').children().css({'filter': 'alpha(opacity=100)', 'opacity': 1});
			}).mouseleave(function(){
				$(this).children('.operation').children().css({'filter': 'alpha(opacity=0)', 'opacity': 0});
			})
			
			buildTreeFromDemo();
			framework.endload();
			framework.showMessage('info', '导入成功');
		}
	}

	function getDemoNodesArray(node) {
		if (node && node.nodeType === 1) {
			var pid;
			if (node.parentNode) {
				pid = node.parentNode.getAttribute('tmpId');
			} else {
				pid = '';
			}
			var n = {
				'name' : node.tagName.toLowerCase() + (node.className ? '.'+ node.className.split(' ')[0] : ''),
				'tmpId' : node.getAttribute('tmpId'),
				'pid' : pid,
				'css' : node.getAttribute('data-css'),
				'extra-class' : node.getAttribute('extra-class')
			};
			tree.push(n);
		}
		var i = 0, childNodes = node.childNodes, item;
		for (; i < childNodes.length; i++) {
			item = childNodes[i];
			if (item.nodeType === 1) {
				getDemoNodesArray(item);
			}
		}
	}
	
	function deepCopy(obj){
		var object;
		if(Object.prototype.toString.call(obj)=="[object Array]"){
			object=[];
			for(var i=0;i<obj.length;i++){
				object.push(deepCopy(obj[i]))
			}   
			return object
	    }

	    if(Object.prototype.toString.call(obj)=="[object Object]"){   
	    	object={};
	    	for(var p in obj){
    			object[p]=obj[p]
	    	}   
    		return object
	    }
	}
	
	function arrayToJson(tree) {
		var r = [];
		var tmpMap = {};
		for (var i = 0, l = tree.length; i < l; i++) {
			tmpMap[tree[i]["tmpId"]] = tree[i];
		}
		for (i = 0, l = tree.length; i < l; i++) {
			var key = tmpMap[tree[i]["pid"]];
			if (key) {
				if (!key["children"]) {
					key["children"] = [];
					key["children"].push(tree[i]);
				} else {
					key["children"].push(tree[i]);
				}
			} else {
				r.push(tree[i]);
			}
		}
		return r;
	}
	
	function render(treeJson){
		if(!Array.isArray(treeJson)||treeJson.length<=0){return ""}   
		var ul=$("<ul>");
		treeJson.forEach(function(item,i){
			var icon = Array.isArray(item.children)&&item.children.length>0 ? "<i class='fa fa-plus-square-o'></i>" : "";
			var li= $("<li><span class='treeName' tmpId='"+ item.tmpId +"' data-css='"+ item.css +"' extra-class='"+ item['extra-class'] +"'>" + icon + item.name + "</span></li>");
			if(Array.isArray(item.children)&&item.children.length>0){
				li.append(render(item.children));
			}
			ul.append(li);
			if(icon){
				li.children('span').children('i').click(function(){
					$(this).toggleClass('fa-minus-square-o fa-plus-square-o').parent('span').next('ul').toggle();
				});
			}
			li.children('span').click(function(){
				$('#tag-name').val($(this).text()).attr('tmpId', $(this).attr('tmpId'));
				var extraClass = $(this).attr('extra-class') == 'null' ? '' : $(this).attr('extra-class')
				$('#extra-class').val(extraClass).attr('extra-class', extraClass);
				$('#css-editer').val($(this).attr('data-css') == 'null' ? '' : $(this).attr('data-css'));
			});
		})
		return ul;
	}
	
	function buildTreeFromDemo(){
		$(".demo").find("*").each(function() {
			$(this).attr('tmpId',randomNumber());
		});
		var $preview = $(".demo").first().clone();
		$preview.find(".operation, .preview").remove();
		var $row = $preview.find(".lyrow, .box").first();
		while ($row.length > 0) {
			$row.parent().append($row.html());
			$row.remove();
			$row = $preview.find(".lyrow, .box").first();
		}
		$preview.find("*").removeClass("box-content column ui-sortable").removeAttr('style');
		tree = [];
		getDemoNodesArray($preview[0]);
		var html = render(arrayToJson(deepCopy(tree)));
		$('#tree').html(html);
	}
	
	function exportPage() {
		if (confirm('已经保存了上一个页面了吗？')==true){ 
			var src = encodeURIComponent($(".demo").html());
			var previewHtml = getPreviewHtml();
			var html = getCleanHtml(previewHtml);
			var target = encodeURIComponent(getTarget(html));
			var less = getLess(cleanTree(arrayToJson(deepCopy(tree))));
	
			framework.preload();
			framework.operate("DevPortal.SavePage",
				{
					"SavePageX1" : [ {
						"ProjectCode" : "0.project.folder",
						"PageCode" : "page1"
					} ],
					"SavePageX2" : [ {
						"HTML" : src
					} ],
					"SavePageX3" : [ {
						"HTML" : target
					} ],
					"SavePageX4" : [ {
						"LESS" : less
					} ]
				},
				function() {
					framework.endload();
					framework.showMessage('info','保存成功');
				}
			);
		}
		
	}

	function getLess(treeJson){
		$.each(treeJson, function(n){
			if(treeJson[n]['css']){
				var extraClass = !treeJson[n]['extra-class'] ? '' : '.' + treeJson[n]['extra-class']; 
				less += treeJson[n]['name'] + extraClass + '{' + treeJson[n]['css'];
			} else {
				delete treeJson[n]['name'];
			}
			if(typeof treeJson[n]['children'] == 'object') {
				getLess(treeJson[n]['children']);
			}
			if(treeJson[n]['css']){
				less += '}';
			}
		})
		return less;
	}
	
	function cleanTree(tree) {
		$.each(tree, function(n){
			delete tree[n]['pid'];
			delete tree[n]['tmpId'];
			if(tree[n]['css'] == '') delete tree[n]['css'];
			if(typeof tree[n]['children'] == 'object'){
				cleanTree(tree[n]['children']);
			}
		});
		return tree;
	}
	
	function bindEvents() {
		$("body").css("min-height",$(window).height() - 90);
		$(".demo").css("min-height",$(window).height() - 160);

		$(".demo, .demo .column").sortable({
			connectWith : ".column",
			opacity : .35,
			handle : ".drag",
			cursor : "crosshair",
			cursorAt : {
				top : 0,
				left : 0
			}
		});
		
		$(".sidebar-nav .lyrow").draggable({
			connectToSortable : ".demo",
			helper : "clone",
			handle : ".drag, .preview",
			stop : function(e, t) {
				$(".demo .column").sortable({
					opacity : .35,
					connectWith : ".column",
					handle : ".drag",
					cursor : "crosshair",
					cursorAt : {
						top : 0,
						left : 0
					}
				})
			},
			cursor : "crosshair",
			cursorAt : {
				top : 0,
				left : 0
			}
		});
		
		$(".sidebar-nav .box").draggable({
			connectToSortable : ".demo, .column, .panel-heading, .panel-body, .panel-footer",
			helper : "clone",
			handle : ".drag, .preview",
			stop : function(e, t) {
				$(".demo .panel-heading, .demo .panel-body, .demo .panel-footer").sortable();
				var $e = $(".demo .box-draggable");
				var component = $e.attr("component");
				$e.attr("id",component+ randomNumber());
				$e.removeClass(" box-draggable");

				// 由插件自己初始化
				if (typeof componentsObj[component] == 'object'&& typeof componentsObj[component].afterInit == 'function') {
					componentsObj[component].afterInit($e);
				}
			},
			cursor : "crosshair",
			cursorAt : {top : 0,left : 0}
		});

		$(".nav-header").click(function() {
			$(".sidebar-nav .boxes, .sidebar-nav .rows").hide();
			$(this).next().slideDown()
		});

		$("#export").click(function() {
			exportPage();
			return false;
		});

		$('#import').click(function() {
			importPage();
			return false;
		});
		
		$('#export-tree').click(function() {
			buildTreeFromDemo();
		});
		
		$('#save-css').click(function(){
			var tid = $('#tag-name').attr('tmpId');
			var target = $('.demo').find('[tmpId="'+ tid +'"]');
			
			target.removeClass($('#extra-class').attr('extra-class')).addClass($('#extra-class').val()).attr({
				'style': $('#css-editer').val(), 
				'data-css': $('#css-editer').val(),
				'extra-class': $('#extra-class').val()
			})
			
			// 给同类元素添加样式
//			if(!$('#extra-class').val()) {
//				var target = $('.demo').find('[tmpId="'+ tid +'"]');
//				$('.demo').find('[tmpId="'+ tid +'"]').siblings().each(function(){
//					if($(this).prop('tagName') == target.prop('tagName') && $(this).prop('class') == target.prop('class')) {
//						$(this).attr('style', $('#css-editer').val())
//					}
//				})
//			}

			if(!$('#extra-class').val()) {
				var block = target.parents('[component]').parents().filter(function(){
					return $(this).attr('extra-class');
				});
				var meta = target.prop('tagName').toLowerCase() + (target.prop('class') ? '.'+ target.prop('class').split(' ')[0] : '');
				block.find(meta).attr('style', $('#css-editer').val());
			}
			
			$('#tree').find('[tmpId="'+ tid +'"]').removeClass($('#extra-class').attr('extra-class')).addClass($('#extra-class').val()).attr({
				'data-css': $('#css-editer').val(),
				'extra-class': $('#extra-class').val()
			})
			$.each(tree, function(i){
				if(tree[i]['tmpId'] == tid) {
					tree[i]['css'] = $('#css-editer').val();
					tree[i]['extra-class'] = $('#extra-class').val();
				}
			})
			less = '';
		});
		
		$("#run").click(function() {
			// var url = 'http://127.0.0.1/0.project.folder/pages/page1/page1.html';
			var url = 'http://127.0.0.1:8020/preview/pages/page1/page1.html';
			window.open(url);
			return false;
		});
		
		var editor = ace.edit("code");
		$(document).on("click",".configuration a[ace-mode]",function(e) {
			var id = $(this).parent().parent().parent().attr("id");
			$('#aceModal').attr('cursrcid', id);
			editor.setValue('');
			aceMode = $(this).attr('ace-mode');
			var html = $('#' + id).find('.box-content').html();
			var css = $('#' + id).find('.box-content').attr('data-css') ? $('#' + id).find('.box-content').attr('data-css'): '';
	
			switch (aceMode) {
			case 'html':
				editor.setValue(html);
				break;
			case 'css':
				editor.setValue(css);
				break;
			case 'js':
				editor.setValue(js);
				break;
			}
			editor.getSession().setMode("ace/mode/" + aceMode);
		});
	
		$("#aceModalSave").click(function() {
			var id = $('#aceModal').attr('cursrcid');
			switch (aceMode) {
			case 'html':
				$('#' + id).find('.box-content').html(editor.getValue());
				break;
			case 'css':
				$('#' + id).find('.box-content').attr({'style' : editor.getValue(),'data-css' : editor.getValue()}).addClass(id);
				break;
			case 'js':
				// todo
				break;
			}
			$('#aceModal').modal('hide');
		});
		
		$(window).resize(function() {
			$("body").css("min-height", $(window).height() - 90);
			$(".demo").css("min-height", $(window).height() - 160)
		});
	}

	$(document).ready(function() {
		bindEvents();
	})
});
