
function efficiency(sd,st,ed,et,file,option){
    let time_start = new Date(Date.parse(sd+' '+st));
    let time_end = new Date(Date.parse(ed+' '+et));


    if(time_start >= time_end){
        alert('Start Time or End Time is incorrect! Please re-select')
    }

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
        let select_data = data.filter(item=>item['DateRec']>=time_start && item['DateRec']<=time_end)
        //two cases-1:in one shift; 2: more than one shift
        let time_array = []
        let result_data;
        let valueData = [];
        let total_counts = 0;


        //load other charts function
        if(parseInt(time_end-time_start)===43200000){
            let tag;
            if(st=='19:00:00'){
                time_array =TimeGenerate(1140);
                result_data = Generator(1140,select_data)
                tag = 1140;

            }else{
                time_array =TimeGenerate(420);
                result_data = Generator(420,select_data)
                tag=420;
            }

            //chart function
            let machine_data = clean_load_data(time_array,result_data);
            //load clean data
            let new_clean_data = []
            for(let i in time_array){
                for(let j in result_data[time_array[i]]){
                    let obj = result_data[time_array[i]][j]
                    new_clean_data.push(obj);
                }
            }

            kaiji_number(machine_data,new_clean_data,result_data,tag,sd,st,ed,et,option);


            //


        }else{
            let tag = 0
            let machine_data = shifts_machine_data(select_data);
            kaiji_number(machine_data,select_data,data,0,sd,st,ed,et,option);
            //kaiji_timeE(machine_data);

        }
    })
}


function shifts_machine_data(data){
    let summary_dict = {}
    for (let i in data){
        let obj = data[i];
        if(obj['MachCode'] in summary_dict){
            let s_time = obj['DateRec'];
            let e_time = obj['DateEndStop']
            let duration = e_time.getTime()-s_time.getTime()
            if(duration){
                summary_dict[obj['MachCode']]['duration']+=duration
            }
            summary_dict[obj['MachCode']]['count']+=1;
        }else{
            let s_time = obj['DateRec'];
            let e_time = obj['DateEndStop']
            let duration = e_time.getTime()-s_time.getTime()
            if(duration){
                duration = 0
            }
            duration=Math.floor(duration/(1000))
            summary_dict[obj['MachCode']] = {'MachCode':obj['MachCode'],'count':1,}
            summary_dict[obj['MachCode']] = {'MachCode':obj['MachCode'],'count':1,'duration':duration}

        }
    }
    return summary_dict;
}


function kaiji_number(machine_data,raw_data,result_data,tag,sd,st,ed,et,option_button){

    let x_data=[];
    let y_data=[];
    let color_bar;
    let tooltip_name;

    if (option_button=='error_counts'){
        color_bar = '#3398DB'
        tooltip_name = '发生次数：';
        for (let item in machine_data){
            x_data.push(machine_data[item]['MachCode']);
        }
        for(let n = 0; n< x_data.length;n++){
            y_data.push(machine_data[x_data[n]]['count'])
        }

    }else{
        color_bar = '#AC8AF1'
        tooltip_name = '停机时间(分钟)：';
        for (let item in machine_data){
            x_data.push(machine_data[item]['MachCode']);
        }
        for(let n = 0; n< x_data.length;n++){
            y_data.push((machine_data[x_data[n]]['duration']/60000).toFixed(2));
        }
    }

    if (document.getElementById('kaiji_number') != null) {
        echarts.dispose(document.getElementById('kaiji_number'))
    }

    let myChart = echarts.init(document.getElementById('kaiji_number'));

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
        let no_machine = raw_data.filter(item=>item['MachCode']==params.name)

        machine_error_distribution(no_machine);
        if(tag==420){
            let t_array =TimeGenerate(420);
            let id = params.name;
            let id_information = load_machine_data(id,result_data,t_array);
            let valueData = [];
            for(let i = 0; i < 25;i++){
                valueData.push(id_information[t_array[i]].length);
            }

            machine_error_information(id,t_array,valueData);
        }else if(tag==1140){
            let t_array =TimeGenerate(1140);
            let id = params.name;
            let id_information = load_machine_data(id,result_data,t_array);
            let valueData = [];
            for(let i = 0; i < 25;i++){
                valueData.push(id_information[t_array[i]].length);
            }
            machine_error_information(id,t_array,valueData);
        }else{
            console.log('test1')
            let time_start = new Date(Date.parse(sd+' '+st));
            let time_end = new Date(Date.parse(ed+' '+et));
            console.log(time_start)
            machine_error_information_shifts(params.name,raw_data,time_start,time_end)

        }

    });
}
function kaiji_timeE(machine_data){
    if (document.getElementById('kaiji_number') != null) {
        echarts.dispose(document.getElementById('kaiji_number'))
    }
    let myChart = echarts.init(document.getElementById('kaiji_number'));

    let title = '机器停机时间分布(分钟):'
    let color_bar = '#AC8AF1'
    let tooltip_name = '停机时间(分钟)：';


    let x_data=[];
    let y_data=[];
    for (let item in machine_data){
        x_data.push(machine_data[item]['MachCode']);
    }
    for(let n = 0; n< x_data.length;n++){
        y_data.push((machine_data[x_data[n]]['duration']/60000).toFixed(2));
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

}

