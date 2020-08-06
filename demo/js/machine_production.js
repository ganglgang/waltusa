

function machine_product_calculation(sd,st,ed,et,file_product,option){
    let time_start = new Date(Date.parse(sd+' '+st));
    let time_end = new Date(Date.parse(ed+' '+et));

    if(time_start >= time_end){
        alert('Start Time or End Time is incorrect! Please re-select')
    }


    d3.csv(file_product, function(data) {
        let machine_id = []
        for (let i = 0; i < data.length; i++) {
            let temp_start = data[i]['DateRec'];
            temp_start = temp_start.replace("-", "/");
            temp_start = new Date(Date.parse(temp_start));
            data[i]['DateRec'] = temp_start;
            machine_id.push(data[i]['MachCode'])
        }
        let select_data = data.filter(item => item['DateRec'] > time_start && item['DateRec'] <= time_end)
        let id_time_efficiency = []
        let id_work_efficiency = []
        let id = [];
        machine_id = Array.from(new Set(machine_id))
        machine_id.sort((a, b) => parseInt(a) - parseInt(b));

        let machine_product_info={}
        machine_id.forEach(function (d) {
            let machine_id = d;
            let id_select_data = select_data.filter(item=>item['MachCode']==d)


            let onTime = 0;
            let offTime = 0;
            let actual_product = 0;
            let max_cycle = 0;
            let work_efficiency;
            let time_efficiency;
            id_select_data.forEach(function (d) {

                onTime+=parseFloat(d['TimeOn'])
                offTime+=parseFloat(d['TimeOff'])
                actual_product+=parseInt(d['Pieces'])
                if(parseInt(d['Cycle'])>max_cycle){
                    max_cycle = parseInt(d['Cycle'])
                }
            })

            let total_time = parseFloat(onTime)+parseFloat(offTime)

            if(total_time && max_cycle && actual_product){
                let idea_products = parseInt(total_time/max_cycle)
                work_efficiency = parseFloat((actual_product/idea_products)*100).toFixed(2)
                id_work_efficiency.push(work_efficiency)
            }
            //time efficiency
            let total_time_percent = (onTime/(onTime+offTime)).toFixed(2);
            if(!(total_time_percent.toString()=='0.00')){

                id.push(d);
                time_efficiency = parseFloat(total_time_percent)*100;
                id_time_efficiency.push(time_efficiency);

            }
            machine_product_info[machine_id] = {'id':machine_id,'openTime':onTime,'offTime':offTime,'maxCycle':max_cycle,'pieces':actual_product,'timeE':time_efficiency,'workE':work_efficiency}
        })

        if(option=='workE'){
            efficiency_id(id,id_work_efficiency,option,machine_product_info,select_data);


        }else{
            efficiency_id(id,id_time_efficiency,option,machine_product_info,select_data);

        }


    })

}




function machine_product(period_info){

    let res_counts = Object.keys(period_info).sort(function(a,b){
        return period_info[a]['time']-period_info[b]['time'];
    });
    let x_array = [];
    let y1_array = [];
    let y2_array = [];
    let y3_array = [];

    for(let item in res_counts){
        let obj = period_info[res_counts[item]];
        let month = parseInt(obj['time'].getMonth())+1
        x_array.push(month+"-"+obj['time'].getDate()+" "+obj['time'].getHours()+":00:00");
        y1_array.push(obj['pieces'])
        y2_array.push(parseInt(parseFloat(obj['timeE'])*100))
        y3_array.push(parseInt(parseFloat(obj['workE'])*100))
    }

    if (document.getElementById('machine_product') != null) {
        echarts.dispose(document.getElementById('machine_product'))
    }
    let myChart = echarts.init(document.getElementById('machine_product'));
    let option = {

        tooltip: {
            transitionDuration:0,

            trigger: 'axis'
        },
        legend: {
            data: ['生产数量', '开机效率','生产效率']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: x_array,
            axisLabel: {
                rotate: 45, //标签旋转角度，对于长文本标签设置旋转可避免文本重叠
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '生产数量',
                type: 'line',
                data:y1_array
            },
            {
                name: '开机效率',
                type: 'line',
                data: y2_array
            },
            {
                name: '生产效率',
                type: 'line',
                data: y3_array
            }
        ]
    };

    myChart.clear();
    myChart.setOption(option);

}


function efficiency_id(x_array,y_array,option_button,machine_product_info,select_data){
    if (document.getElementById('kaiji_timeE') != null) {
        echarts.dispose(document.getElementById('kaiji_timeE'))
    }
    let myChart = echarts.init(document.getElementById('kaiji_timeE'));


    let color_bar;
    let tooltip_name;
    if(option_button=='workE'){
        tooltip_name = '生产效率(%)：';
        color_bar = '#F1948A';

    }else{
        tooltip_name = '开机效率(%)：';
        color_bar = '#E67E22'
    }

    let option = {
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },

        toolbox: {
            show:true,
            transitionDuration:0,
            feature: {
                dataView: {show: true, readOnly: false},
                restore: {show: true},
                saveAsImage: {show: true}
            }
        },
        calculable: true,
        xAxis: [
            {
                type: 'category',
                data: x_array,
                axisLabel: {
                    show: true, //默认为true，设为false后下面都没有意义了
                    interval: 0 //此处关键， 设置文本标签全部显示
                }
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: tooltip_name,
                type: 'bar',
                data:y_array,

                markPoint: {
                    data: [
                        {type: 'max', name: '最大值'},
                        {type: 'min', name: '最小值'}
                    ]
                },
                markLine: {
                    data: [
                        {type: 'average', name: '平均值'}
                    ]
                },

                color: color_bar,
            },
        ]
    };


    myChart.clear();
    myChart.setOption(option);
    myChart.on('click', function (params) {
        let data = machine_product_info[params.name]
        document.getElementById("text_id").innerHTML = '机器ID：'+data.id;
        document.getElementById("text_open").innerHTML = '开机：'+data.openTime;
        document.getElementById("text_stop").innerHTML = '停机：'+data.offTime;
        document.getElementById("text_timeE").innerHTML = '开机效率：'+parseInt(data.timeE)+'%';
        document.getElementById("text_cycle").innerHTML = 'Max周期：'+data.maxCycle;
        document.getElementById("text_pieces").innerHTML = '数量：'+data.pieces;
        document.getElementById("text_workE").innerHTML = '生产效率：'+parseInt(data.workE)+'%';

        let period_data = select_data.filter(item=>item['MachCode']==params.name);

        let period_info_new = {}

        for(let i in period_data){
            if(period_data[i]['DateStartShift'] in period_info_new){
                let onTime =parseFloat(period_data[i]['TimeOn']);
                let offTime = parseFloat(period_data[i]['TimeOff']);
                let cycle = parseInt(period_data[i]['Cycle']);
                let total_time = onTime+offTime;
                let workE = (parseInt(period_data[i]['Pieces'])/(total_time/cycle)).toFixed(2);
                let timeE = (onTime/total_time).toFixed(2);
                period_info_new[period_data[i]['DateStartShift']]['pieces'] += parseInt(period_data[i]['Pieces']);
                period_info_new[period_data[i]['DateStartShift']]['workE'].push(workE)
                period_info_new[period_data[i]['DateStartShift']]['timeE'].push(timeE)
            }else{
                let pieces = parseInt(period_data[i]['Pieces']);
                let onTime =parseFloat(period_data[i]['TimeOn']);
                let offTime = parseFloat(period_data[i]['TimeOff']);
                let cycle = parseInt(period_data[i]['Cycle']);
                let total_time = onTime+offTime;
                let workE = (pieces/(total_time/cycle)).toFixed(2);
                let timeE = (onTime/total_time).toFixed(2);
                period_info_new[period_data[i]['DateStartShift']]={'time':new Date(period_data[i]['DateStartShift']),'workE':[workE],'timeE':[timeE],'pieces':pieces};

            }


        }

        let average = (array) => array.reduce((a, b) => parseFloat(a)+parseFloat(b)) / array.length;
        for (let j in period_info_new){
            let t = period_info_new[j]['timeE']
            let w = period_info_new[j]['workE']
            t = average(t);
            w = average(w);
            period_info_new[j]['timeE'] = t.toFixed(2);
            period_info_new[j]['workE'] = w.toFixed(2);
        }

        machine_product(period_info_new);
        console.log(period_info_new)

    })
}
