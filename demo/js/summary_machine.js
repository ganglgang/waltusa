
function machine_summary(caty,start_time,file,sort){

    if (document.getElementById('no_machine_detail') != null) {
        echarts.dispose(document.getElementById('no_machine_detail'))
    }
    if (document.getElementById('no_machine_detail2') != null) {
        echarts.dispose(document.getElementById('no_machine_detail2'))
    }
    $('#machine_tab').remove()

    d3.csv(file, function(data) {
        for (let i = 0; i < data.length; i++) {
            let temp_start = data[i]['DateRec'];
            temp_start = temp_start.replace("-", "/");
            temp_start = new Date(Date.parse(temp_start));
            data[i]['DateRec'] = temp_start;

            let temp_end = data[i]['DateEndStop'];
            temp_end = temp_end.replace("-", "/");
            temp_end = new Date(Date.parse(temp_end));
            data[i]['DateEndStop'] = temp_end;
        }
        let result_data = Generator(start_time, data);
        let timeData =TimeGenerate(start_time);


        //echarts param set
        let tooltip_name;
        let color_bar;

        // set x_data and y_data
        let x_data = [];
        let y_data = [];

        let machine_data = clean_load_data(timeData,result_data);
        let title;

        //
        machine_details(caty,result_data,machine_data,timeData);

        for (let item in machine_data){
            x_data.push(machine_data[item]['MachCode']);
        }
        if(caty ==1){
            title = '机器停机次数分布'
            if(sort=='Yes'){
                let x_data_count_sorted = summarySort(machine_data,'count');
                x_data = x_data_count_sorted;
            }
            for(let n = 0; n< x_data.length;n++){
                y_data.push(machine_data[x_data[n]]['count'])
            }
            color_bar = '#3398DB'
            tooltip_name = '发生次数：';
        }else{
            title = '机器停机时间分布(分钟)'
            if(sort=='Yes'){
                let x_data_count_sorted = summarySort(machine_data,'duration');
                x_data = x_data_count_sorted;
            }
            for(let n = 0; n< x_data.length;n++){
                y_data.push((machine_data[x_data[n]]['duration']/60000).toFixed(2))
            }
            color_bar = 'PURPLE'
            tooltip_name = '停机时间(分钟)：';

        }


        if (document.getElementById('machine_counts') != null) {
            echarts.dispose(document.getElementById('machine_counts'))
        }

        let myChart = echarts.init(document.getElementById('machine_counts'));

        let option = {
            title: {
                text: title,
            },
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
                    data: x_data,
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
                    data:y_data,

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
            console.log(result_data)
            No_machine_information(params.name,result_data,timeData)
            machine_error_dist(params.name,result_data,timeData)
        });

    })
}


function summarySort(dict,key){
    let dic = dict;
    let res_counts = Obect.keys(dic).sort(function(a,b){
        return dic[b][key]-dic[a][key];
    });
    return res_counts;
}


function clean_load_data(start_time,data){

    let summary_dict = {}
    for(let i in start_time){
        let time = start_time[i];
        for (let j in data[time]){
            let obj = data[time][j];
            if(obj['MachCode'] in summary_dict){
                let s_time = obj['DateRec'];
                let e_time = obj['DateEndStop']
                let duration = e_time.getTime()-s_time.getTime()
                summary_dict[obj['MachCode']]['duration']+=duration
                summary_dict[obj['MachCode']]['count']+=1;
            }else{
                let s_time = obj['DateRec'];
                let e_time = obj['DateEndStop']
                let duration = e_time.getTime()-s_time.getTime()
                duration=Math.floor(duration/(1000))
                summary_dict[obj['MachCode']] = {'MachCode':obj['MachCode'],'count':1,'duration':duration}
            }
        }
    }
    return summary_dict;

}