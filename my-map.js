$(document).ready(function() {
	var chart = echarts.init(document.getElementById('china'));	
	
	var geoCoordMap = {
		    "前海分行":[113.886895,22.507172],
		    "广州分行":[113.324643,23.121707]
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
		        formatter: function (params) {
		            return params.name + ' : ' + params.value[2];
		        }
		    },
		    visualMap: {
		        min: 0,
		        max: 200,
		        calculable: true,
		        inRange: {
		            color: ['#50a3ba', '#eac736', '#d94e5d']
		        },
		        textStyle: {
		            color: '#fff'
		        }
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
		                {name: "前海分行", value: -59},
		                {name: "广州分行", value: 159}
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


