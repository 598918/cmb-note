$(document).ready(function() {
	var chart = echarts.init(document.getElementById('china'));	
	
	var geoCoordMap = {
		    "安阳分行":[114.412702,36.099297],
		    "鞍山分行":[114.412702,36.099297],
		    "安庆分行":[117.048753,30.517797],
		    "滨州分行":[117.973437,37.383871],
		    "宝鸡分行":[107.176933,34.366182],
		    "北京分行":[116.369179,39.912136],
		    "包头分行":[109.874554,40.661678],
		    "南阳分行":[112.572765,33.035806],
		    "常州分行":[119.961402,31.799862],
		    "长春分行":[125.329704,43.870287],
		    "重庆分行":[106.516098,29.623317],
		    "长沙分行":[112.989798,28.201119],
		    "成都分行":[104.073181,30.651964],   // ??
		    "大连分行":[121.654206,38.928381],
		    "丹东分行":[124.401805,40.127128],
		    "东莞分行":[113.761494,23.012819],
		    "东营分行":[118.669719,37.439471],
		    "大庆分行":[124.894249,46.605339],
		    "鄂尔多斯分行":[109.973365,39.818845],
		    "福州分行":[119.304061,26.098259],
		    "福州自贸区分行":[119.436119,26.016596],
		    "佛山分行":[113.155805,23.058563],
		    "抚顺分行":[123.949676,41.884887],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[],
		    "分行":[]
		};

		var convertData = function (data) {
		    var res = [];
		    for (var i = 0; i < data.length; i++) {
		        var geoCoord = geoCoordMap[data[i].name];
		        if (geoCoord) {
		            res.push({
		                name: data[i].name,
		                value: geoCoord.concat(data[i].value)
		            });
		        }
		    }
		    return res;
		};
		
		var generateBar = function(today, lastYear){
			if(today <= lastYear){
				var percent = (today / lastYear) * 150;
				var html = '<div style="height:16px;border-radius:8px;background:green;width:150px;position;relative;margin-top:3px;">\
								<div style="height:16px;border-radius:8px;background:#00c700;width:'+ percent +'px;position:absolute;text-align:right;padding-right:5px;">\
									<div style="line-height:16px;">' + today + '/' + lastYear + '</div>\
								</div>\
							</div>';
				return html;
			} else{
				var percent = (lastYear / today) * 150;
				var html = '<div style="width:150px;">\
								<div style="height:16px;border-radius:8px;background:#ff0000;width:150px;position;relative;margin-top:3px;">\
									<div style="height:16px;border-radius:8px;background:#8a0909;width:'+ percent +'px;position:absolute;">\
									</div>\
									<div style="position:absolute;right:8px;width:100%;text-align:right;line-height:16px;">' + today + '/' + lastYear + '</div>\
								</div>\
							</div>';
				return html;
			}
		};

		option = {
		    title: {
		        text: '全国分行业务量实时监控',
		        x:'center',
		        y:'5%',
		        textStyle: {
		            color: '#000000'
		        }
		    },
		    tooltip: {
		        trigger: 'item',
		        formatter: function (obj) {
		            var value = obj.value;
		            return '招商银行-' + obj.name + '：'
		                + generateBar(value[3], value[4]); 
		                + value[3] + '/' + value[4] + '<br>';  
		        }
		    },
		    visualMap: {
		        type: 'piecewise',
		        dimension: 2,
		        pieces: [
		            {min: 0},
		            {max: 0}
		        ],
		        color: ['#ff0000', '#03a71e']
		    },
		    geo: {
		        map: 'china',
		        label: {
		            emphasis: {
		                show: false
		            }
		        },
		        itemStyle: {
		            normal: {
		                areaColor: '#CFF4FC',
		                borderColor: '#467FA8'
		            },
		            emphasis: {
		                areaColor: '#88C6F2'
		            }
		        }
		    },
		    series: [
		        {
		            type: 'scatter',
		            coordinateSystem: 'geo',
		            data: convertData([
		                {name: "前海分行", value: [-10,110,120]},
		                {name: "广州分行", value: [60,280,222]}
		            ]),
		            symbolSize: 12,
		            label: {
		                normal: {
		                    show: false
		                },
		                emphasis: {
		                    show: false
		                }
		            },
		            itemStyle: {
		                emphasis: {
		                    borderColor: '#fff',
		                    borderWidth: 1
		                }
		            }
		        }
		    ]
		};
	
	chart.setOption(option);
});


