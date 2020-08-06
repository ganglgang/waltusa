function machine_error_distribution(machine_data){

    // 该机器错误分布
    let machine_number = machine_data[0]['MachCode']
    let dist={}
    for (let i in machine_data){
        if(machine_data[i]['StopCode'] in dist){

            dist[machine_data[i]['StopCode']]['count']+=1
        }else{

            dist[machine_data[i]['StopCode']] = {'description':machine_data[i]['description'],'count':1}
        }
    }
    if (document.getElementById('error_summary_bar') != null) {
        echarts.dispose(document.getElementById('error_summary_bar'))
    }
    document.getElementById('error_summary_bar').style.height = 280 +'px';

    let myChart = echarts.init(document.getElementById('error_summary_bar'));
    let x_data;
    let y_data = [];
    let text= '机器'+machine_number.toString() + ': 错误分布类型图'
    x_data = Object.keys(dist).sort(function(a,b){
        return parseInt(dist[b]['count'])-parseInt(dist[a]['count']);
    });
    let new_x_data = []
    x_data.forEach(function(d,i){
        let count = parseInt(dist[d]['count']);
        if(count>=2){
            new_x_data.push(d)
            y_data.push(count)

        }
    })
    let option = {
        title: {
            text:text,
        },
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            },
            formatter: function (params) {
                return dist[params[0]['name']]['description']
            }
        },
        xAxis: {
            type: 'category',
            data: new_x_data,
            axisLabel: {
                show: true, //默认为true，设为false后下面都没有意义了
                interval: 0, //此处关键， 设置文本标签全部显示
                rotate: 45, //标签旋转角度，对于长文本标签设置旋转可避免文本重叠
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: y_data,
            type: 'bar',

            color: '#3398DB',
            itemStyle: {
                normal: {
                    label: {
                        show: true,
                        position: 'top',
                        textStyle: {
                            color: '#800080'
                        }
                    }
                }
            }


        }]
    };
    myChart.clear();

    myChart.setOption(option)

}


function machine_error_information_shifts(id,raw_data,time_start,time_end){
    console.log(time_start)

    let new_raw_data = raw_data.filter(item=>item['MachCode']==id);
    let time_array = [];
    while(time_start <= time_end){
        let t = new_time_transfer(time_start)
        time_array.push(t);
        new Date(time_start.setHours( time_start.getHours() + 12))
    }
    time_array.push(new_time_transfer(time_start));
    let count_data = [];
    for (let i = 0;  i<time_array.length-1;i++){
        let start_time = time_array[i];
        start_time = '2020-'+start_time;
        start_time = new Date(Date.parse(start_time));
        let end_time = time_array[i+1];
        end_time = '2020-'+end_time;
        end_time = new Date(Date.parse(end_time));
        let new_select = new_raw_data.filter(item=>item['DateRec']>=start_time && item['DateRec']<end_time)
        count_data.push(new_select.length)
    }
    let timeline = time_array.slice(0,time_array.length-2);
    let valueData = count_data.slice(0,count_data.length-1)
    machine_error_information(id,timeline,valueData)
}

function machine_error_information(id,timeline,valueData){
    let text = '机器'+id.toString()+': 时段产生总故障 '+valueData.reduce(function (a,b) {
        return a+b;
    })
    if (document.getElementById('error_summary_line') != null) {
        echarts.dispose(document.getElementById('error_summary_line'))
    }
    document.getElementById('error_summary_line').style.height = 280 +'px';

    let myChart = echarts.init(document.getElementById('error_summary_line'));
    let option = {
        title: {
            text: text,
        },
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'axis'
        },

        xAxis: {
            type: 'category',
            data: timeline
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            name:'发生次数：',
            data: valueData,
            type: 'line',
            markPoint: {
                data: [
                    {type: 'max', name: '最大值'},
                ]
            },
            color: '#3398DB',

        }]
    };
    myChart.clear();

    myChart.setOption(option);
   /* myChart.on('click', function (params) {
        addTable(params.name,id_information);

    });*/
}