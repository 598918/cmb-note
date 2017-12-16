/*
* mDialog V 1.0 页面交互
* Author: 张晓虹
* Date: 2014/3/14
* 注：调用该dialog，后续如果有取数的动作，最好setTimeout 0一下，否则在ios里面向左切换的动画偶尔没有。
*/
var mDialog = (function () {
    var defaultOption = {
        pageType: '',//如果有传入该值，则该值可做弹出的窗口唯一标识，不能弹出2个或多个该值相同的窗口
        title: '',//头部标题，如果不传值，则默认的头部高度会为0，真实头部可自行实现。
        iframe: false,//该属性需与iframeSrc配合使用，可实现通过传入url切换的方式。
        iframeSrc: 'about:blank;',
        loadByObj: false,//该属性需与contentObj配合使用，可实现通过zepto对象切换的方式。
        closeDelObj: false,//loadByObj=true时，该属性才生效，表示返回或关闭窗口时是否要移除contentObj对象，默认不移除
        contentObj: null,//zepto对象，如：$(...)
        content: '',//内容，如果iframe=false且loadByObj=false，则该属性生效，可传入html字符串
        width: 300,//对showType为fulldialog或backwnd以外的类型有效
        height: 160,//仅showType=closedialog时设置
        btnType: 'none',//按钮类型，仅showType=closedialog时设置有效，该属性一般不需要设置，已封装进alert、confirm、confirmyn、confirmync方法
        //dragable: false,
        //duration: 5000,
        showType: "backwnd",//交互方式：backwnd, closewnd, closedialog, fulldialog, rightwnd, leftwnd, scalewnd
        backText: "返回",//返回按钮显示的文字
        top: 90,//closewnd的方式设置才有效
        arrowX: 0,//箭头的x轴位置，scalewnd的方式设置才有效
        arrowY: 0,//箭头的y轴位置，scalewnd的方式设置才有效
        isHasCloseBtn: true,//是否有关闭按钮，closewnd的方式设置才有效
        isScalePre: false,//后面的窗口是否缩小变换，closewnd的方式设置才有效
        isClickShadowClose: false,//点击遮盖区域是否关闭窗口，closewnd的方式设置才有效
        isHasBackground: false,//窗口最外层元素是否设置背景色白色
        shadowType: "",//遮盖层颜色：dark,littlelight,light,none
        submit: function (v, d) { return true; }, /*点击窗口按钮后的回调函数,v代表按钮的返回值,"确定为ok,取消为cancel,是为yes,否为no,参数d代表窗口的jQuery对象。*/
        closed: function () { }, /* 窗体关闭后执行的函数 */
        isShowNoAnimate: false,/* 显示窗口不执行动画 */
        isCloseNoAnimate: false,/* 关闭窗口不执行动画 */
        exchangeData: null,//窗口传递数据用，在弹出窗口中可用GetDataByPageType获得
        className: "",//窗口最外层元素的class
        useNativeScroll: false,//是否使用原生滚动
        isTouchMoveClose: false,//是否支持滑动关闭，目前仅对rightwnd的方式设置有效
        showIframeLoading: false//iframe加载时是否显示“加载中..”
    };
    var cfg = null;
    var wndsHistory = new Array();
    var isFirst = true;
    var isCurTouchMoveClose = false;
    var curCanMoveCfg = null;
    var getId = function () {
        var id = (Math.random().toString()).replace(".", "");
        if (checkIdIsUse(id)) return getId();
        return id;
    };
    var checkIdIsUse = function (id) {
        for (var i = 0; i < wndsHistory.length; i++) {
            if (wndsHistory[i].id == id) return true;
        }
        return false;
    };
    //判断是否打开了相同页面
    var checkPageIsOpen = function (pageType) {
        for (var i = 0; i < wndsHistory.length; i++) {
            if (wndsHistory[i].cfg.pageType == pageType) return true;
        }
        return false;
    };
    var resetAllPosition = function () {
        var wndWidth = $(top.window).width();
        var wndHeight = $(top.window).height();
        for (var i = 0; i < wndsHistory.length; i++) {
            var wnditem = wndsHistory[i];
            var id = wnditem.id;
            var showType = wnditem.cfg.showType;
            //var w = wnditem.width;
            //var h = wnditem.height;
            //var t = wnditem.top;
            resetPosition(id, showType, wndWidth, wndHeight, wnditem.cfg);
        }
    }
    //重置md_shadow和md_dialog的位置
    var resetPosition = function (id, showType, wndWidth, wndHeight, cfg) {
        //重新计算过滤层的高宽
        //$("#md_shadow" + id).css({
        //    "width": wndWidth,
        //    "height": wndHeight
        //});

        //重新计算层的位置
        var md_dialog = $("#md_dialog" + id);
        if (md_dialog.length == 0) {
            return;
        }
        if (showType == "closedialog") {
            var w = md_dialog.width();
            var h = md_dialog.height();
            md_dialog.css({
                left: Math.max(0, (wndWidth - w) / 2) + 'px',
                top: Math.max(0, (wndHeight - h) / 2) + 'px'
            });
        }
        else if (showType == "fulldialog") {
            md_dialog.css({
                //width: wndWidth + 'px',
                height: wndHeight + 'px'
            });
            $(".md_body", md_dialog).css({
                height: wndHeight + "px"
            });
        }
        else if (showType == "backwnd") {
            md_dialog.css({
                height: wndHeight + 'px'
            });
            $(".md_body", md_dialog).css({
                height: (wndHeight - $(".md_header", md_dialog).outerHeight()) + "px"
            });
        }
        else if (showType == "closewnd") {
            //md_dialog.css({
            //    //width: wndWidth + 'px',
            //    height: (wndHeight - md_dialog.position().top) + 'px'
            //});
            //$(".md_body", md_dialog).css({
            //    height: (wndHeight - cfg.top - $(".md_header", md_dialog).outerHeight()) + "px"
            //});
        }
        else if (showType == "rightwnd" || showType == "leftwnd") {
            md_dialog.css({
                height: wndHeight + 'px'
                //left: (wndWidth - cfg.width - 1) + 'px'
            });
            $(".md_body", md_dialog).css({
                height: wndHeight + "px"
            });
        }
        else if (showType == "scalewnd") {

        }
        //$(".md_iframe", md_dialog).css({
        //    height: ($(".md_body", md_dialog).height() - 3) + "px"
        //});
    }
    var init = function (option) {
        cfg = $.extend({}, defaultOption, option);
        //相同页面类型只能打开一个
        if (cfg.pageType && cfg.pageType.length > 0) {
            if (checkPageIsOpen(cfg.pageType)) return;
        }
        //如果没有回调函数，设置一个默认的
        if (typeof cfg.submit != "function") {
            cfg.submit = function () { return true; }
        }
        if (typeof cfg.closed != "function") {
            cfg.closed = function () { return true; }
        }
        var curScrollTop = $(window).scrollTop();

        //获取客户端window宽高
        var win_height = $(window).height(), win_width = $(window).width();
        var id = getId();
        if (cfg.pageType.length == 0) {
            cfg.pageType = id;
        }
        //创建定位容器
        //var fixedlayer = $("#md_dialog_fixedlayer");
        //if (fixedlayer.length == 0) {
        //    fixedlayer = $('<div id="md_dialog_fixedlayer"></div>').appendTo(document.body)
        //    if (!MobileCommon.isSupportFix()) {
        //        var changeLayerPos = function () {
        //            fixedlayer.css({
        //                "left": $(document).scrollLeft(),
        //                "top": $(document).scrollTop()
        //            });
        //        }
        //        //添加窗口监听事件：重新计算 定位容器的x,y
        //        $(window).bind("scroll.mdialog_fixedlayer", function () {
        //            changeLayerPos();
        //        });
        //        changeLayerPos();
        //    }
        //}

        var fixedlayer = $(document.body);
        //创建遮罩层
        if (cfg.showType != "backwnd" && $("#md_shadow" + id).length == 0) {
            fixedlayer.append("<div id='md_shadow" + id + "' class='md_shadow md_shadow" + cfg.showType + "'></div>");
            $("#md_shadow" + id).css({
                //"width": $(window).width(),
                "height": $(window).height(),//不能用100%，否则dialog有文本框的情况会出现无法折腾下层页面的情况
                "z-index": 10000 + wndsHistory.length * 2
            });
            //if (cfg.isNoShadow) {
            $("#md_shadow" + id).addClass(cfg.shadowType);
            //}
        }

        if ($("#md_dialog" + id).length > 0) {
            $("#md_dialog" + id).remove();
        }

        var md_dialog = $("<div id='md_dialog" + id + "' class='md_dialog " + cfg.showType + "'></div>").appendTo(fixedlayer);
        if (cfg.isHasBackground) {
            md_dialog.addClass("hasBackground");
        }
        if (cfg.className && cfg.className.length > 0) {
            md_dialog.addClass(cfg.className);
        }
        var md_header = $("<div class='md_header'></div>");
        //页面居中显示
        if (cfg.showType == "closedialog") {
            if (cfg.width > win_width) {
                cfg.width = win_width;
            }
            if (cfg.height > win_height) {
                cfg.height = win_height;
            }
            md_dialog.css({
                width: cfg.width + 'px',
                height: cfg.height + 'px',
                left: Math.max(0, (win_width - cfg.width) / 2) + 'px',
                top: Math.max(0, (win_height - cfg.height) / 2) + 'px',
                "opacity": 0
            });
            if (cfg.title.length > 0) {
                md_header.append("<span class='title'>" + cfg.title + "</span>");
            }
            else {
                md_dialog.addClass("notitle");
                //md_header.css({ height: 0, "line-height": 0, "font-size": 0, "border": "none" });
            }
            md_header.append("<button type='button' class='close' type='button' title='关闭'>×</button>");
        }
        else if (cfg.showType == "fulldialog") {
            cfg.height = win_height;
            md_dialog.css({
                height: cfg.height + 'px',
                left: '0px',
                top: '0px'
            });
            if (cfg.title.length > 0) {
                md_header.append("<span class='title'>" + cfg.title + "</span>");
                md_header.append("<button type='button' class='close' type='button' title='关闭'>×</button>");
            }
            else {
                //md_header.css({ height: 0, "line-height": 0, "font-size": 0, "border": "none" });
                md_header.append("<button type='button' class='close notitle' type='button' title='关闭'>×</button>");
                md_dialog.addClass("notitle");
            }
        }
        else if (cfg.showType == "backwnd") {
            cfg.height = win_height;
            md_dialog.css({
                //height:'100%',
                height: cfg.height + 'px',
                left: '0px',
                top: '0px'
                //bottom: '0px'
            });
            if (cfg.title.length > 0 || cfg.isHasCloseBtn) {
                md_header.append("<span class='title'>" + cfg.title + "</span>");
            }
            else {
                md_dialog.addClass("notitle");
            }
            if (cfg.backText.length > 0) {
                md_header.append("<button type='button' class='close' type='button' title='返回'>" + cfg.backText + "</button>");
            }
            md_dialog.hide();
        }
        else if (cfg.showType == "closewnd") {
            cfg.height = win_height - cfg.top;
            md_dialog.css({
                //width: win_width + 'px',
                height: cfg.height + 'px',
                left: '0px',
                //top: cfg.top + 'px'
                bottom:0
            });
            if (cfg.width != '100%') {
                md_dialog.css({
                    width: cfg.width + 'px'
                });
            }
            if (cfg.title.length > 0) {
                md_header.append("<span class='title'>" + cfg.title + "</span>");
            }
            else {
                md_dialog.addClass("notitle");
                //md_header.css({ height: 0, "line-height": 0, "font-size": 0, "border": "none" });
            }
            if (cfg.isHasCloseBtn) {
                if (cfg.title.length > 0) {
                    md_header.append("<button type='button' class='close intitle' type='button' title='关闭'>关闭</button>");
                }
                else {
                    md_header.append("<button type='button' class='close outtitle' type='button' title='关闭'>×</button>");
                }
            }
        }
        else if (cfg.showType == "rightwnd" || cfg.showType == "leftwnd") {
            if (cfg.width > win_width) {
                cfg.width = win_width;
            }
            cfg.width -= 1;//1是左边border
            cfg.height = win_height;
            md_dialog.css({
                width: cfg.width + 'px',
                height: cfg.height + 'px',
                //left: (win_width - cfg.width - 1) + 'px',//，不减去会出现横向滚动条
                top: '0px'
            });
            if (cfg.showType == "rightwnd") {
                md_dialog.css({
                    right: '0px'
                });
            }
            else {
                md_dialog.css({
                    left: '0px'
                });
            }
            md_header.append("<span class='title'>" + cfg.title + "</span>");
            if (cfg.backText.length > 0) {
                md_header.append("<button type='button' class='close' type='button' title='返回'>" + cfg.backText + "</button>");
            }
            md_header.css({ width: cfg.width + 'px' });
            //md_dialog.hide();
        }
        else if (cfg.showType == "scalewnd") {
            if (cfg.width > win_width - 6) {
                cfg.width = win_width - 6;//留边距
            }
            if (cfg.height > win_height - 15) {
                cfg.height = win_height - 15;
            }
            var arrowwidth = 18;
            var wintop = cfg.arrowY + arrowwidth / 2;
            if (cfg.arrowX + arrowwidth / 2 > win_width) {
                cfg.arrowX = win_width - arrowwidth / 2;
            }
            if (cfg.arrowX < arrowwidth / 2) {
                cfg.arrowX = arrowwidth / 2;
            }
            var vd = cfg.arrowY / win_height <= 0.5 ? 0 : 1;
            var hd = cfg.arrowX / win_width <= 0.5 ? 0 : 1;
            var winleft, awleft;
            var arrowToedgeWidth = 50;

            if (hd == 0) {
                if (cfg.arrowX < arrowToedgeWidth) arrowToedgeWidth = cfg.arrowX - 3;
                winleft = cfg.arrowX - arrowToedgeWidth;
                if (winleft + cfg.width > win_width - 3) {
                    winleft = win_width - cfg.width - 3;
                }
            }
            else {
                if (win_width - cfg.arrowX < arrowToedgeWidth + 2) arrowToedgeWidth = win_width - cfg.arrowX - 3;
                winleft = cfg.arrowX - (cfg.width - arrowToedgeWidth);
                if (winleft < 3) {
                    winleft = 3;
                }
            }
            awleft = cfg.arrowX - winleft - arrowwidth / 2;
            if (awleft < 0) awleft = 0;
            if (awleft + arrowwidth > cfg.width) awleft = cfg.width - arrowwidth;
            var hv = "auto";
            if (cfg.height != "auto") {
                hv = cfg.height + 'px';
            }
            var tOrigin = (awleft + arrowwidth / 2) / cfg.width * 100 + "% " + ((vd == 0) ? '0' : '100%');
            var dgcss = {
                width: cfg.width + 'px',
                height: hv,
                left: winleft,
                //top: (vd == 0 ? wintop : cfg.arrowY - arrowwidth / 2 - cfg.height),
                "transform-origin": tOrigin,
                "-webkit-transform-origin": tOrigin
            };
            if (cfg.height != "auto") {
                dgcss.top = (vd == 0 ? wintop : cfg.arrowY - arrowwidth / 2 - cfg.height);
            }
            else {
                if (vd == 0) {
                    dgcss.top = wintop;
                }
                else {
                    dgcss.bottom = win_height - wintop + arrowwidth;
                }
            }
            md_dialog.css(dgcss);
            if (cfg.title.length > 0) {
                md_header.append("<span class='title'>" + cfg.title + "</span>");
            }
            else {
                md_dialog.addClass("notitle");
                //md_header.css({ height: 0, "line-height": 0, "font-size": 0, "border": "none" });
            }
            if (cfg.isHasCloseBtn) {
                md_header.append("<button type='button' class='close' type='button' title='关闭'>×</button>");
            }
            var md_arrow = $("<div class='md_arrow'></div>");
            var dc = (vd == 0 ? "top" : "bottom");
            md_arrow.addClass(dc);
            md_arrow.css({ left: awleft }).appendTo(md_dialog);
        }
        md_dialog.css({
            "z-index": 10001 + wndsHistory.length * 2
        });
        //Header
        md_header.appendTo(md_dialog);
        //$(".close", md_header).bind("mousedown", function (event) {
        //    //event.stopPropagation();
        //    return false;
        //});
        $(".close", md_header).unbind().bind("tap", function (event) {
            //event.stopPropagation();
            mDialog.close();
            return false;
        }).bind("mousedown touchstart", function (e) {
            //tap事件是加到document上的，加上这个避免底下有文本框时事件穿透。
            e.preventDefault();
        });
        md_header.css({
            "z-index": 10001 + wndsHistory.length * 2
        });
        // 改变焦点，目的是让触发mDialog前的文档框失去焦点，避免误操作。另外，在此处改变焦点也避免了与所加载页面对焦点控制的冲突。
        //md_header.focus();
        var md_headerHeight = md_header.outerHeight();
        var md_body;
        if (cfg.showType == "closedialog" || cfg.showType == "fulldialog") {
            md_body = $("<div class='md_body'></div>").appendTo(md_dialog).css({
                height: (cfg.height - md_headerHeight) + "px"
            });
        }
        else if (cfg.showType == "backwnd" || cfg.showType == "rightwnd" || cfg.showType == "leftwnd") {
            md_body = $("<div class='md_body'></div>").appendTo(md_dialog).css({
                paddingTop: md_headerHeight + "px",
                height: (cfg.height - md_headerHeight) + "px"
                //top: md_header.outerHeight() + "px",
                //bottom: "0px",
                //left: "0px",
                //position: "absolute"
            });
        }
        else if (cfg.showType == "closewnd") {
            md_body = $("<div class='md_body'></div>").appendTo(md_dialog).css({
                height: (cfg.height - md_headerHeight) + "px"
            });
        }
        else if (cfg.showType == "scalewnd") {
            if (cfg.height == "auto") {
                md_body = $("<div class='md_body'></div>").appendTo(md_dialog);
            }
            else {
                md_body = $("<div class='md_body'></div>").appendTo(md_dialog).css({
                    height: (cfg.height - md_headerHeight) + "px"
                });
            }
        }
        if (cfg.useNativeScroll) {
            md_body.addClass("nativeScroll");
        }
        if (cfg.iframe) {
            //iframe 载入中...
            var loadeventstr = "";
            if (cfg.showIframeLoading) {
                //md_body.append("<div class='md_ifame_mask' id='md_ifame_mask" + id + "'><div class='loding_position'><div class='loading'></div><div></div>");
                LoadBar.loading("加载中..", true, md_body[0], 2);
                loadeventstr = " onload='try{LoadBar.unloading();}catch(e){ }'";
            }
            //md_body.append("<div class='md_ifame_mask' id='md_ifame_mask" + id + "'><div class='loding_position'><div class='loading'></div><div></div>");
            //iframe src页面载入
            //离线应用不能加随机数
            //if (cfg.iframeSrc.indexOf("?") == -1) {
            //    cfg.iframeSrc += "?_t=" + Math.random();
            //} else {
            //    cfg.iframeSrc += "&_t=" + Math.random();
            //}
            //var md_iframe = $("<iframe id='md_iframe" + id + "' name='md_iframe'" + id + " class='md_iframe' seamless='seamless' frameborder='0' style='overflow-y:auto;width:100%;height:100%;' src=\"" + cfg.iframeSrc + "\""
            //				+ "allowTransparency='true' onload='try{document.getElementById(\"md_ifame_mask" + id + "\").style.display=\"none\";}catch(e){ }' onerror='alert(\"loading error\")'></iframe>");
            var md_iframe = $("<iframe id='md_iframe" + id + "' name='md_iframe" + id + "' class='md_iframe' seamless='seamless' frameborder='0' src='" + cfg.iframeSrc + "'"
                           + "allowTransparency='true'" + loadeventstr + "></iframe>");
            md_body.append(md_iframe);
            //md_iframe.css({
            //    height: ($(".md_body", md_dialog).height() - 3) + "px"
            //});
        }
        else if (cfg.loadByObj) {
            cfg.contentObjPt = cfg.contentObj.parent();
            //var md_content = $("<div class='md_content'></div>").appendTo(md_body);
            //md_content.append(cfg.contentObj);
            cfg.contentObj.appendTo(md_body);
            cfg.contentObj.show();

        }
        else {
            var md_content = $("<div class='md_content'></div>").appendTo(md_body);
            md_content.append(cfg.content);
        }
        if (cfg.showType == "closedialog") {
            if (cfg.btnType != "none") {
                //bottom
                var md_bottom = $("<div class='md_bottom'></div>").appendTo(md_dialog);
                md_bottom.css({
                    "z-index": 10001 + wndsHistory.length * 2
                });
                if (cfg.btnType.indexOf("cancel") >= 0) {
                    $("<button type='button' class='button'>取消</button>").appendTo(md_bottom)
                    .bind("tap", function () {
                        //调用回调函数
                        if (cfg.submit.call(null, "cancel", md_dialog)) {
                            //返回值为true时，关闭窗体
                            mDialog.close();
                        }
                        return false;
                    }).bind("mousedown touchstart", function (e) { e.preventDefault(); });
                }
                if (cfg.btnType.indexOf("ok") >= 0) {
                    $("<button type='button' class='button'>确定</button>").appendTo(md_bottom)
                    .bind("tap", function () {
                        //调用回调函数
                        if (cfg.submit.call(null, "ok", md_dialog)) {
                            //返回值为true时，关闭窗体
                            mDialog.closeWnd("c");
                        }
                        return false;
                    }).bind("mousedown touchstart", function (e) { e.preventDefault(); });
                }
                if (cfg.btnType.indexOf("no") >= 0) {
                    $("<button type='button' class='button'>否</button>").appendTo(md_bottom)
                    .bind("tap", function () {
                        //调用回调函数
                        if (cfg.submit.call(null, "no", md_dialog)) {
                            //返回值为true时，关闭窗体
                            mDialog.closeWnd("c");
                        }
                        return false;
                    }).bind("mousedown touchstart", function (e) { e.preventDefault(); });
                }
                if (cfg.btnType.indexOf("yes") >= 0) {
                    $("<button type='button' class='button'>是</button>").appendTo(md_bottom)
                    .bind("tap", function () {
                        //调用回调函数
                        if (cfg.submit.call(null, "yes", md_dialog)) {
                            //返回值为true时，关闭窗体
                            mDialog.closeWnd("c");
                        }
                        return false;
                    }).bind("mousedown touchstart", function (e) { e.preventDefault(); });
                }
                if (cfg.iframe || (option && option.height > defaultOption.height)) {
                    //--------iframe,或者是传入高度的大于默认的，不自动调整宽高---
                    //修正md_body的高度
                    md_body.height(md_dialog.height() - md_header.outerHeight() - md_bottom.outerHeight());
                } else {
                    //-----------  没有传入导入的，如alert，confirm，confirmync等将自动调整宽高-----
                    //内容太多，直接调整为400 * 150
                    var h_content = md_body.find(".md_content").outerHeight(true);
                    var h_body = md_dialog.height() - md_header.outerHeight() - md_bottom.outerHeight();
                    //if (h_content > h_body) {
                    //    //最高180px,取最合适的高度
                    //    var h_min = Math.min(h_content, 180);
                    //    var w_max = 400;
                    //    md_body.height(h_min);
                    //    var h = md_header.outerHeight() + h_min + md_bottom.outerHeight();
                    //    md_dialog.css({
                    //        height: h,
                    //        width: 400,
                    //        top: Math.max(0, (win_height - h) / 2),
                    //        left: Math.max(0, (win_width - w_max) / 2)
                    //    });
                    //} else {
                    md_body.height(h_body);
                    //}
                }
            }
            //拖动
            //if (cfg.dragable) {
            //    dragUtil.initDrag(document.getElementById("md_dialog" + id), md_header[0]);
            //}
        }
        wndsHistory.push({ id: id, cfg: cfg, wndScrollTop: curScrollTop });
        if (cfg.showType == "closedialog") {
            setTimeout(function () {
                md_dialog.css({ "opacity": 1 });
            }, 100);
        }
        else if (cfg.showType == "backwnd") {
            //setTimeout(function () {
            md_dialog.bind("animationend webkitAnimationEnd", function (event) {
                //移除样式才不会出现横向滚动条，fixed定位的才能出现
                md_dialog.removeClass("in");//不能移除slide，否则快速点返回时会偶发出现动画停止，导致白屏。
                //以下两行解决ios8文本框聚焦后页面偏移的问题
                $(window.document.body).width(0);
                $(window.document.body).width('100%');//$(window).width()
                md_dialog.unbind("animationend webkitAnimationEnd");
            });
            var preDialog = mDialog.GetPreDialog();
            if (preDialog == null) {
                preDialog = $("#" + mDialog.oldPageId);
            }
            else {
                preDialog = $(preDialog);
            }
            //android4.1-4.3，如果有动画效果页面重绘时会有闪一下的bug
            if (BrowserType.isBadAndroid || cfg.isShowNoAnimate) {
                md_dialog.show()
            }
            else {
                md_dialog.show().removeClass("slide out reverse").addClass("slide in");
                preDialog.removeClass("slide in reverse").addClass("slide out50");
            }
            //setTimeout(function () { preDialog.hide() }, 500);    
            //移除样式才不会出现横向滚动条，fixed定位的才能出现
            //setTimeout(function () {
            //    //md_dialog.removeClass("slide in");
            //    md_dialog.removeClass("in");//不能移除slide，否则快速点返回时会偶发出现动画停止，导致白屏。
            //    //以下两行解决ios8文本框聚焦后页面偏移的问题
            //    $(window.document.body).width(0);
            //    $(window.document.body).width($(window).width());
            //}, 1000);
            //}, 100);
        }
        else if (cfg.showType == "closewnd") {
            md_dialog.bind("animationend webkitAnimationEnd", function (event) {
                //移除样式才不会出现横向滚动条，fixed定位的才能出现
                md_dialog.removeClass("in");//不能移除slide，否则快速点返回时会偶发出现动画停止，导致白屏。
                //以下两行解决ios8文本框聚焦后页面偏移的问题
                $(window.document.body).width(0);
                $(window.document.body).width('100%');//$(window).width()
                md_dialog.unbind("animationend webkitAnimationEnd");
                if (cfg.isClickShadowClose) {
                    $("#md_shadow" + id).unbind().bind("tap", function (event) { mDialog.close(); return false; });
                    $("#md_shadow" + id).bind("mousedown touchstart", function (e) { e.preventDefault(); });
                }
            });
            //setTimeout(function () {
            if (cfg.isScalePre) {
                var preDialog = mDialog.GetPreDialog();
                if (preDialog != null) {
                    $(preDialog).addClass("scale").removeClass("scalereverse");
                }
                else {
                    $("#" + mDialog.oldPageId).addClass("scale").removeClass("scalereverse");
                }
                md_dialog.removeClass("slideup out").addClass("slideup in").addClass("showDialog");
            }
            else {
                if (cfg.isShowNoAnimate) {
                    md_dialog.addClass("showDialog");
                }
                else {
                    md_dialog.removeClass("slideup out fast").addClass("slideup in fast").addClass("showDialog");
                }
            }
            //setTimeout(function () {
            //    //以下两行解决文本框聚焦后页面上下偏移的问题
            //    md_dialog.removeClass("in");
            //    $(window.document.body).width(0);
            //    $(window.document.body).width($(window).width());
            //}, 250);
            //}, 100);
        }
        else if (cfg.showType == "rightwnd") {
            md_dialog.bind("animationend webkitAnimationEnd", function (event) {
                //移除样式才不会出现横向滚动条，fixed定位的才能出现
                md_dialog.removeClass("in");//不能移除slide，否则快速点返回时会偶发出现动画停止，导致白屏。
                //以下两行解决ios8文本框聚焦后页面偏移的问题
                $(window.document.body).width(0);
                $(window.document.body).width('100%');//$(window).width()
                md_dialog.unbind("animationend webkitAnimationEnd");
                $("#md_shadow" + id).unbind().bind("tap", function () { mDialog.close(); return false; });
                $("#md_shadow" + id).bind("mousedown touchstart", function (e) { e.preventDefault(); });
            });
            //setTimeout(function () {
            md_dialog.removeClass("slide out fast").addClass("slide in fast").addClass("showDialog");
            //}, 100);
        }
        else if (cfg.showType == "leftwnd") {
            md_dialog.bind("animationend webkitAnimationEnd", function (event) {
                //移除样式才不会出现横向滚动条，fixed定位的才能出现
                md_dialog.removeClass("in");//不能移除slide，否则快速点返回时会偶发出现动画停止，导致白屏。
                //以下两行解决ios8文本框聚焦后页面偏移的问题
                $(window.document.body).width(0);
                $(window.document.body).width('100%');//$(window).width()
                md_dialog.unbind("animationend webkitAnimationEnd");
                $("#md_shadow" + id).unbind().bind("tap", function () { mDialog.close(); return false; });
                $("#md_shadow" + id).bind("mousedown touchstart", function (e) { e.preventDefault(); });
            });
            //setTimeout(function () {
            md_dialog.removeClass("slide out reverse fast").addClass("slide in reverse fast").addClass("showDialog");
            //}, 100);
        }
        else if (cfg.showType == "scalewnd") {
            //setTimeout(function () {
            md_dialog.addClass("scaleOrigin");
            setTimeout(function () {
                $("#md_shadow" + id).unbind().bind("tap", function () { mDialog.close(); return false; });
                $("#md_shadow" + id).bind("mousedown touchstart", function (e) { e.preventDefault(); });
            }, 300);
            //}, 100);
        }
        $("#md_shadow" + id).bind("touchstart.mdialog touchmove.mdialog", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });
        if (isFirst) {
            //if (mDialog.wndFixEle.length > 0)
            //    $(mDialog.wndFixEle).hide();
            $(window).bind("resize.mdialog_fixedlayer orientationchange.mdialog_fixedlayer", function () {
            //$(document.body).bind("orientationchange.mdialog_fixedlayer", function () {
                //$(window).focus();
                resetAllPosition();
            });
            isFirst = false;
            //$(document.body).bind("touchmove.mdialogwnd", function (event) {
            //    event.preventDefault();
            //});
            var touch = {};
            var initiated = false;
            var isMove = false;
            var startEventName, moveEventName, endEventName;
            if ('ontouchstart' in window) {
                startEventName = "touchstart.mdialog";
                moveEventName = "touchmove.mdialog";
                endEventName = "touchend.mdialog touchcancel.mdialog";
            }
            else {
                startEventName = "mousedown.mdialog";
                moveEventName = "mousemove.mdialog";
                endEventName = "mouseup.mdialog mousestop.mdialog";
            }
            $(document).bind(startEventName, function (e) {
                if (!isCurTouchMoveClose) return;
                if (e.touches)
                    e = e.touches[0];
                touch.x1 = e.clientX;
                touch.y1 = e.clientY;
                initiated = true;
            });
            $(document).bind(moveEventName, function (e) {
                if (!isCurTouchMoveClose || !initiated) return;
                if (e.touches)
                    e = e.touches[0];
                touch.x2 = e.clientX;
                touch.y2 = e.clientY;
                var absDistY = Math.abs(touch.y2 - touch.y1);
                var absDistX = Math.abs(touch.x2 - touch.x1);
                if (touch.x2 - touch.x1 > 10 && absDistX > absDistY) {
                    isMove = true;
                }
                if (isMove && touch.x2 - touch.x1 >= 0) {
                    mDialog.BackTo(curCanMoveCfg.showType, curCanMoveCfg.pageType, absDistX);
                }
            });
            $(document).bind(endEventName, function (e) {
                if (!isCurTouchMoveClose) return;
                //MailFolder.Quit();
                if (isMove) {
                    if (touch.x2 - touch.x1 > 50) {
                        mDialog.closeAllByPageType(curCanMoveCfg.pageType);
                    }
                    else {
                        mDialog.BackTo(curCanMoveCfg.showType, curCanMoveCfg.pageType, 0, 250);
                    }
                    initiated = false;
                    isMove = false;
                }
            });
        }
        isCurTouchMoveClose = cfg.isTouchMoveClose;
        curCanMoveCfg = cfg;
        //if (cfg.showType == "backwnd") {
        if (!BrowserType.isIOS) {
            history.replaceState({ type: "mDialog", index: wndsHistory.length, pt: cfg.pageType }, cfg.title, location.href);
            history.pushState(null, cfg.title, location.href);
        }
        //}
    }
    return {
        oldPageId: "divGridBlock",
        //wndFixEle: ".bottomMenu",
        //alert信息,content 为参数内容
        alert: function (content, submitCallback, closedCallback, width, height) {
            init({
                title: '提示', content: content, iframe: false, btnType: 'ok', showType: 'closedialog',
                submit: submitCallback, closed: closedCallback, width: width, height: height
            });
        },
        //confirm信息,submitCallback为点击窗口按钮的回调函数
        confirm: function (content, submitCallback, closedCallback) {
            init({
                title: '提示', content: content, iframe: false, btnType: 'okcancel', showType: 'closedialog',
                submit: submitCallback, closed: closedCallback
            });
        },
        confirmyn: function (content, submitCallback, closedCallback) {
            init({
                title: '提示', content: content, iframe: false, btnType: 'yesno', showType: 'closedialog',
                submit: submitCallback, closed: closedCallback
            });
        },
        confirmync: function (content, submitCallback, closedCallback) {
            init({
                title: '提示', content: content, iframe: false, btnType: 'yesnocancel', showType: 'closedialog',
                submit: submitCallback, closed: closedCallback
            });
        },
        //iframe弹窗
        openDialog: function (title, url, width, height, submitCallback, closedCallback, submitBtn, cancelBtn) {
            var btnType = 'none';
            if (submitCallback) {
                btnType = 'okcancel';
            }
            if (submitBtn == false) {
                btnType = btnType.replace("ok", '');
            }
            if (cancelBtn == false) {
                btnType = btnType.replace("cancel", '');
            }
            init({
                title: title, iframe: true, iframeSrc: url, width: width, height: height,
                btnType: btnType, showType: 'closedialog', submit: submitCallback, closed: closedCallback
            });
        },
        openfullDialogById: function (title, contentObj, submitCallback, closedCallback, submitBtn, cancelBtn) {
            var btnType = 'none';
            if (submitCallback) {
                btnType = 'okcancel';
            }
            if (submitBtn == false) {
                btnType = btnType.replace("ok", '');
            }
            if (cancelBtn == false) {
                btnType = btnType.replace("cancel", '');
            }
            init({
                title: title, loadByObj: true, contentObj: contentObj,
                btnType: btnType, showType: 'fulldialog', submit: submitCallback, closed: closedCallback
            });
        },
        openBackWndByObj: function (pageType, title, contentObj, backText, submitCallback, closedCallback, submitBtn, cancelBtn) {
            init({
                pageType: pageType, title: title, backText: backText, loadByObj: true, contentObj: contentObj, showType: 'backwnd', submit: submitCallback, closed: closedCallback
            });
        },
        openBackWnd: function (title, url, backText, submitCallback, closedCallback) {
            init({
                title: title, backText: backText, iframe: true, iframeSrc: url, showType: 'backwnd', submit: submitCallback, closed: closedCallback
            });
        },
        openRightWndByObj: function (pageType, title, contentObj, backText, width, submitCallback, closedCallback, isTouchMoveClose) {
            if (!width) width = 768;
            init({
                pageType: pageType, title: title, backText: backText, loadByObj: true, contentObj: contentObj, showType: 'rightwnd', width: width, submit: submitCallback, closed: closedCallback, isTouchMoveClose: isTouchMoveClose
            });
        },
        openLeftWndByObj: function (pageType, title, contentObj, backText, width, submitCallback, closedCallback) {
            if (!width) width = 768;
            init({
                pageType: pageType, title: title, backText: backText, loadByObj: true, contentObj: contentObj, showType: 'leftwnd', width: width, submit: submitCallback, closed: closedCallback
            });
        },
        openRightWnd: function (title, url, backText, width, submitCallback, closedCallback) {
            if (!width) width = 768;
            init({
                title: title, backText: backText, iframe: true, iframeSrc: url, showType: 'rightwnd', width: width, submit: submitCallback, closed: closedCallback
            });
        },
        openBackWndContent: function (title, content, backText, closedCallback) {
            init({
                title: title, content: content, backText: backText, iframe: false, showType: 'backwnd', closed: closedCallback
            });
        },
        openRightWndContent: function (title, content, backText, width, closedCallback) {
            if (!width) width = 768;
            init({
                title: title, content: content, backText: backText, iframe: false, showType: 'rightwnd', width: width, closed: closedCallback
            });
        },
        openScaleWndByObj: function (title, contentObj, width, height, arrowX, arrowY, submitCallback, closedCallback) {
            init({
                title: title, loadByObj: true, contentObj: contentObj, showType: 'scalewnd', width: width, height: height, arrowX: arrowX, arrowY: arrowY, submit: submitCallback, closed: closedCallback
            });
        },
        openScaleWndContent: function (title, content, width, height, arrowX, arrowY, closedCallback) {
            init({
                title: title, content: content, iframe: false, showType: 'scalewnd', width: width, height: height, arrowX: arrowX, arrowY: arrowY, closed: closedCallback
            });
        },
        openCloseWnd: function (title, url, isScalePre, closedCallback) {
            init({
                title: title, iframe: true, iframeSrc: url, showType: 'closewnd', isScalePre: isScalePre, closed: closedCallback
            });
        },
        openCloseWndContent: function (title, content, isScalePre, closedCallback) {
            init({
                title: title, content: content, iframe: false, showType: 'closewnd', isScalePre: isScalePre, closed: closedCallback
            });
        },
        showDialog: function (options) {
            init(options);
        },
        closeAll: function () {
            $(".md_dialog").hide();
            $(".md_iframe").attr("src", "");
            $(".md_iframe").remove();
            $(".md_shadow").remove();
            $(".md_dialog").remove();
            wndsHistory = new Array();
            $(window).unbind("resize.mdialog_fixedlayer orientationchange.mdialog_fixedlayer");
            //$(window).unbind("orientationchange.mdialog_fixedlayer");
            isFirst = true;
            var preDialog = $("#" + mDialog.oldPageId);
            preDialog.removeClass("slide out scalereverse scale");
        },
        closeWndById: function (id, wnd) {
            if (wnd && wnd.cfg.loadByObj && !wnd.cfg.closeDelObj) {
                wnd.cfg.contentObjPt.append(wnd.cfg.contentObj);
                wnd.cfg.contentObj.hide();
            }
            $("#md_dialog" + id).hide();
            $("#md_iframe" + id).attr("src", "");
            $("#md_iframe" + id).remove();
            $("#md_shadow" + id).remove();
            $("#md_dialog" + id).remove();
        },
        //ctype=="s"，表示submit；ctype=="c"，表示close
        closeWnd: function (ctype, isNoAnimate) {
            var wnd = this.GetCurObj();
            if (wnd == null) return;
            //var wnd = wndsHistory.pop();
            var id = wnd.id;
            var md_dialog = $("#md_dialog" + id);
            var preDialog = mDialog.GetPreDialog();
            if (preDialog == null) {
                preDialog = $("#" + mDialog.oldPageId);
            }
            else {
                preDialog = $(preDialog);
            }
            //var preScrollTop = mDialog.GetPreDialogTop();
            //if (wnd.cfg.loadByObj) {
            //    wnd.cfg.contentObjPt.append(wnd.cfg.contentObj);
            //    wnd.cfg.contentObj.hide();
            //}
            //先隐藏md_dialog：修复ie下iframe打开xml文档会顶层显示，remove后遮罩住其他区域的bug
            var showType = wnd.cfg.showType;
            if (showType == "closedialog" || showType == "fulldialog") {
                mDialog.closeWndById(id, wnd);
                //preDialog.removeClass("hide");
                //setTimeout(function () { $(window).scrollTop(preScrollTop); }, 100);
            }
            else if (showType == "backwnd") {
                if (isNoAnimate) {
                    preDialog.removeClass("slide out50 scalereverse");
                    mDialog.closeWndById(id, wnd);
                }
                else {
                    $("#md_shadow" + id).remove();
                    preDialog.bind("animationend webkitAnimationEnd", function (event) {
                        mDialog.closeWndById(id, wnd);
                        preDialog.removeClass("in reverse");
                        preDialog.unbind("animationend webkitAnimationEnd");
                    });
                    md_dialog.removeClass("slide in scalereverse").addClass("slide out reverse");
                    preDialog.removeClass("slide out50 scalereverse").addClass("slide in reverse");//.show();
                    //setTimeout(function () { preDialog.removeClass("in reverse"); }, 1000);                   
                    //setTimeout(function () { mDialog.closeWndById(id, wnd);/*preDialog.removeClass("hide"); $(window).scrollTop(preScrollTop);*/ }, 350);
                }
            }
            else if (showType == "closewnd") {
                if (isNoAnimate) {
                    if (wnd.cfg.isScalePre) {
                        preDialog.removeClass("scale");
                    }
                    mDialog.closeWndById(id, wnd);
                }
                else {
                    $("#md_shadow" + id).remove();

                    if (wnd.cfg.isScalePre) {
                        md_dialog.removeClass("slideup in").addClass("slideup out");
                        preDialog.removeClass("scale").addClass("scalereverse");
                    }
                    else {
                        if (wnd.cfg.top == 0 && ctype == "s") {
                            md_dialog.removeClass("slideup in fast").addClass("slideup out fast");
                        }
                        else {
                            md_dialog.removeClass("slideup in fast").addClass("slideup out reverse fast");
                        }
                    }
                    setTimeout(function () { mDialog.closeWndById(id, wnd); /*preDialog.removeClass("hide"); $(window).scrollTop(preScrollTop);*/ }, 250);
                }
            }
            else if (showType == "rightwnd") {
                if (isNoAnimate) {
                    mDialog.closeWndById(id, wnd);
                }
                else {
                    $("#md_shadow" + id).remove();
                    md_dialog.bind("animationend webkitAnimationEnd", function (event) {
                        mDialog.closeWndById(id, wnd);
                        md_dialog.unbind("animationend webkitAnimationEnd");
                    });
                    var matrix = window.getComputedStyle(md_dialog[0], null);
                    var tfstr = matrix[utils.style.transform];
                    if (tfstr && tfstr != "none") {
                        md_dialog.animate({ "-webkit-transform": "translateX(100%)" }, 250);
                    }
                    else {
                        md_dialog.removeClass("slide in scalereverse fast").addClass("slide out reverse fast");
                    }
                    //setTimeout(function () { mDialog.closeWndById(id, wnd); }, 250);
                }
            }
            else if (showType == "leftwnd") {
                if (isNoAnimate) {
                    mDialog.closeWndById(id, wnd);
                }
                else {
                    $("#md_shadow" + id).remove();
                    md_dialog.removeClass("slide in reverse scalereverse fast").addClass("slide out fast");
                    setTimeout(function () { mDialog.closeWndById(id, wnd); }, 250);
                }
            }
            else if (showType == "scalewnd") {
                if (isNoAnimate) {
                    mDialog.closeWndById(id, wnd);
                }
                else {
                    $("#md_shadow" + id).remove();
                    md_dialog.removeClass("scaleOrigin");
                    setTimeout(function () { mDialog.closeWndById(id, wnd); }, 300);
                }
            }

            wndsHistory.pop();
            if (wndsHistory.length == 0) {
                $(window).unbind("resize.mdialog_fixedlayer orientationchange.mdialog_fixedlayer");
                //$(document.body).unbind("orientationchange.mdialog_fixedlayer");
                $(document).unbind("touchstart.mdialog touchmove.mdialog touchend.mdialog touchcancel.mdialog mousedown.mdialog mousemove.mdialog mouseup.mdialog mousestop.mdialog");
                //$(document.body).unbind("touchmove.mdialogwnd");
                //if (mDialog.wndFixEle.length > 0)
                //    $(mDialog.wndFixEle).show();
                //setTimeout(function () {
                //    //$("#md_dialog_fixedlayer").remove();
                //    //window.scrollTo(80, 0);
                //    //window.scrollTo(0, 0);
                //    $(window).resize();
                //}, 500);
                isFirst = true;
                isCurTouchMoveClose = false;
                curCanMoveCfg = null;
            }
            else {
                function getCurCanMovePageCfg() {
                    for (var i = wndsHistory.length - 1; i >= 0 ; i--) {
                        if (wndsHistory[i].cfg.showType == "scalewnd")
                            continue;
                        else {
                            return wndsHistory[i].cfg;
                        }
                    }
                    return null;
                }
                var curcfg = getCurCanMovePageCfg();
                if (curcfg) {
                    isCurTouchMoveClose = curcfg.isTouchMoveClose;
                    curCanMoveCfg = curcfg.pageType;
                }
                else {
                    isCurTouchMoveClose = false;
                    curCanMoveCfg = null;
                }
            }
            //ios6有个bug，返回上一个页面后，页面部分按钮点不了，加下面两行解决。
            //新版无需支持ios6，故注释掉
            //$('<div id="divResetWnd"></div>').appendTo(document.body);
            //setTimeout(function () { $("#divResetWnd").remove(); }, 600);
        },
        //同时关闭多层窗口，count：窗口数
        closeMutiWnd: function (count) {  
            for (var i = 0; i < count - 1; i++) {
                mDialog.closeWnd("c", true);
            }
            mDialog.closeWnd("c");
            if (!BrowserType.isIOS) {
                history.go(-count);
            }
        },
        //关闭窗体
        close: function (isNoAnimate) {
            //ie下打开多层窗口回调函数，会抛出异常“不能执行已经释放代码”
            try {
                if (wndsHistory.length > 0) {
                    var curcfg = wndsHistory[wndsHistory.length - 1].cfg;
                    //if (!isHistoryBack) {
                    //curcfg.closeParm = { type: "c", isNoAnimate: isNoAnimate };
                    //    history.go(-1);
                    //    return;
                    //}
                    curcfg.closed();
                    if (curcfg.isCloseNoAnimate) {
                        isNoAnimate = true;
                    }
                }
            } catch (e) { }
            mDialog.closeWnd("c", isNoAnimate);
            if (!BrowserType.isIOS) {
                history.go(-1);
            }
        },
        //调用提交的回调方法并关闭
        submit: function (isNoAnimate, rtn) {
            //ie下打开多层窗口回调函数，会抛出异常“不能执行已经释放代码”
            try {
                if (wndsHistory.length > 0) {
                    var curcfg = wndsHistory[wndsHistory.length - 1].cfg;
                    //if (!isHistoryBack) {
                    //curcfg.closeParm = { type: "c", isNoAnimate: isNoAnimate, rtn: rtn };
                    //history.go(-1);
                    //return;
                    //}
                    curcfg.submit(rtn);
                }
            } catch (e) { }
            mDialog.closeWnd("s", isNoAnimate);
            if (!BrowserType.isIOS) {
                history.go(-1);
            }
        },
        historyBack: function () {
            var curcfg = wndsHistory[wndsHistory.length - 1].cfg;
            var p = curcfg.closeParm;
            if (p) {
                var isNoAnimate = p.isNoAnimate;
                if (p.type == "c") {
                    curcfg.closed();
                    if (curcfg.isCloseNoAnimate) {
                        isNoAnimate = true;
                    }
                    mDialog.closeWnd("c", isNoAnimate);
                }
                else if (p.type == "s") {
                    var rtn = p.rtn;
                    curcfg.submit(rtn);
                    mDialog.closeWnd("s", isNoAnimate);
                }
            }
            else {
                curcfg.closed();
                var isNoAnimate = false;
                if (curcfg.isCloseNoAnimate) {
                    isNoAnimate = true;
                }
                mDialog.closeWnd("c", isNoAnimate);
            }
        },
        GetPreIframeWnd: function () {
            if (wndsHistory.length >= 2) {
                var id = wndsHistory[wndsHistory.length - 2].id;
                var iframe = $("#md_iframe" + id);
                if (iframe.length > 0) {
                    return iframe[0].contentWindow;
                }
            }
            return null;
        },
        GetCurIframeWnd: function () {
            if (wndsHistory.length >= 1) {
                var id = wndsHistory[wndsHistory.length - 1].id;
                var iframe = $("#md_iframe" + id);
                if (iframe.length > 0) {
                    return iframe[0].contentWindow;
                }
            }
            return null;
        },
        GetPreDialog: function () {
            if (wndsHistory.length >= 2) {
                var id = wndsHistory[wndsHistory.length - 2].id;
                var dialog = $("#md_dialog" + id);
                if (dialog.length > 0) {
                    return dialog[0];
                }
            }
            return null;
        },
        //GetPreDialogTop: function () {
        //    if (wndsHistory.length >= 1) {
        //        return wndsHistory[wndsHistory.length - 1].wndScrollTop;
        //    }
        //    return 0;
        //},
        GetCurDialog: function () {
            if (wndsHistory.length >= 1) {
                var id = wndsHistory[wndsHistory.length - 1].id;
                var dialog = $("#md_dialog" + id);
                if (dialog.length > 0) {
                    return dialog[0];
                }
            }
            return null;
        },
        GetCurObj: function () {
            if (wndsHistory.length >= 1) {
                return wndsHistory[wndsHistory.length - 1];
            }
            return null;
        },
        GetCurIframe: function () {
            if (wndsHistory.length >= 1) {
                var obj = wndsHistory[wndsHistory.length - 1];
                if (obj.cfg.iframe) {
                    var iframe = $("#md_iframe" + obj.id);
                    if (iframe.length > 0) {
                        return iframe;
                    }
                }
            }
            return null;
        },
        GetCurHeader: function () {
            if (wndsHistory.length >= 1) {
                var id = wndsHistory[wndsHistory.length - 1].id;
                var header = $("#md_dialog" + id + " .md_header");
                if (header.length > 0) {
                    return header;
                }
            }
            return null;
        },
        GetDataByPageType: function (pageType) {
            for (var i = wndsHistory.length - 1; i >= 0 ; i--) {
                if (wndsHistory[i].cfg.pageType == pageType)
                    return wndsHistory[i].cfg.exchangeData;
            }
            return null;
        },
        GetCurrentExchangData: function () {
            if (wndsHistory.length > 0) {
                return wndsHistory[wndsHistory.length - 1].cfg.exchangeData;
            }
            return null;
        },
        closeAllByPageType: function (pageType) {
            while (wndsHistory.length > 0) {
                var mWnd = wndsHistory[wndsHistory.length - 1]
                if (mWnd.cfg.pageType == pageType) {
                    mDialog.close(false);
                    return;
                }
                else {
                    mDialog.close(true);
                }
            }
        },
        getCount: function () {
            return wndsHistory.length;
        },
        BackTo: function (showType, pageType, x, time) {
            var dialog;
            var wndWidth = $(top.window).width();
            var preX = (-wndWidth / 2 + x / 2) / wndWidth * 100 + "%";
            for (var i = wndsHistory.length - 1; i >= 0 ; i--) {
                if (wndsHistory[i].cfg.pageType == pageType) {
                    var id = wndsHistory[i].id;
                    var dialog = $("#md_dialog" + id);
                    if (showType == "rightwnd") {
                        if (x == 0) {
                            if (time && time > 0) {
                                dialog.animate({ "-webkit-transform": "translateX(0)" }, 250);
                            }
                            else {
                                dialog.css("-webkit-transform", "translateX(0)");
                            }
                        } else {
                            dialog.css("-webkit-transform", "translateX(" + x + "px)");
                        }
                    }
                    //else if (showType = "backwnd") {
                    //    if (i == 0) {
                    //        preDialog = $("#" + mDialog.oldPageId);
                    //    }
                    //    else {
                    //        preDialog = $("#md_dialog" + wndsHistory[i - 1].id);
                    //    }
                    //    if (x == 0) {
                    //        dialog.css("-webkit-transform", "translateX(0)");
                    //        preDialog.css("-webkit-transform", "translateX(-50%)");
                    //    } else {
                    //        dialog.css("-webkit-transform", "translateX(" + x + "px)");
                    //        preDialog.css("-webkit-transform", "translateX(" + preX + ")");
                    //    }
                    //}
                    break;
                }
            }
        }
    }
})();
if (!BrowserType.isIOS) {
    window.addEventListener("popstate", function (event) {
        var currentState = event.state;
        if (currentState && currentState.type && currentState.type == "mDialog") {
            //if (currentState.pt) {
            $("input,textarea").blur();
            $("#btnDefaultClick").focus();
            var mobj = mDialog.GetCurObj();
            if (currentState.index == mDialog.getCount() && mobj && currentState.pt == mobj.cfg.pageType) {
                mDialog.historyBack();
            }
            else {
                if (window != top.window && top.mDialog.getCount() == 0) {
                    history.go(-1);
                }
            }
            //mDialog.closeAllByPageType(currentState.pt,true);
            //}
            //else if (currentState.url) {
            //    if (currentState.url.indexOf("/m/Item") > 0) {
            //        mDialog.openBackWnd("商品详情", currentState.url, "列表");
            //    }
            //}
        }
    });
}
