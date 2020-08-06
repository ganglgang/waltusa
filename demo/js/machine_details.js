function machine_details(caty,raw_data,machine_data,timeline) {

    document.getElementById('machine_detail').style.height = 360+'px';

    if (document.getElementById('machine_detail') != null) {
        echarts.dispose(document.getElementById('machine_detail'))
    }

    let myChart = echarts.init(document.getElementById('machine_detail'));

    //load data
    let pie_data = [];
    let total_count = 0;
    let total_time = 0;
    let text;
    if (caty == 1){

        let x_data_count_sorted = summarySort(machine_data,'count');
        for(let j = 10; j<Object.keys(machine_data).length;j++){
            total_count+=machine_data[x_data_count_sorted[j]]['count']
        }
        pie_data.push({value:total_count,name:'Other Machines'})

        for(let i = 0;i<10;i++){
            let in_data = {value:machine_data[x_data_count_sorted[i]]['count'],name:'No.'+x_data_count_sorted[i].toString()}
            total_count+=machine_data[x_data_count_sorted[i]]['count']
            pie_data.push(in_data)
        }
        text = '班次总计发生故障次数：'+total_count.toString()
    }else{
        let x_data_time_sorted = summarySort(machine_data,'duration');
        for(let m = 10; m<Object.keys(machine_data).length;m++){
            total_time+=machine_data[x_data_time_sorted[m]]['duration']
        }
        pie_data.push({value:(total_time/60000).toFixed(2),name:'Other Machines'})

        for(let i = 0;i<10;i++){
            let in_data = {value:(machine_data[x_data_time_sorted[i]]['duration']/60000).toFixed(2),name:'No.'+x_data_time_sorted[i].toString()}
            total_time+=machine_data[x_data_time_sorted[i]]['duration']
            pie_data.push(in_data)
        }
        text = '班次总计发生故障时间（分钟）--时间可重叠：'+(total_time/60000).toFixed(2).toString()
    }




    let option = {
        title: {
            text: text,
            subtext: 'Rank前10台机器',
            left: 'left'
        },
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
        },



        series: [
            {
                type: 'pie',
                radius: '65%',
                center: ['40%', '60%'],
                data: pie_data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    myChart.clear();

    myChart.setOption(option);


}

function No_machine_information(machine_number,result_data,timeline){
    let id = machine_number;
    let id_information = load_machine_data(machine_number,result_data,timeline);
    let valueData = [];
    for(let i = 0; i < 25;i++){
        valueData.push(id_information[timeline[i]].length);
    }
    let text = '机器'+id.toString()+': 时段产生总故障 '+valueData.reduce(function (a,b) {
        return a+b;
    })
    if (document.getElementById('no_machine_detail') != null) {
        echarts.dispose(document.getElementById('no_machine_detail'))
    }
    document.getElementById('no_machine_detail').style.height = 240 +'px';

    let myChart = echarts.init(document.getElementById('no_machine_detail'));
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
    myChart.on('click', function (params) {
        addTable(params.name,id_information);

    });
}

function machine_error_dist(machine_number,result_data,timeline){
    let id = machine_number;
    let id_information = [];
    for(let i in timeline) {
        let time = timeline[i];
        let obj = result_data[time]
        for(i in obj){
            if (obj[i]['MachCode']==id.toString()){
                id_information.push(obj[i])
            }
        }
    }
    // 该机器错误分布
    let dist={}
    for (let i in id_information){
        if(id_information[i]['StopCode'] in dist){

            dist[id_information[i]['StopCode']]['count']+=1
        }else{

            dist[id_information[i]['StopCode']] = {'description':id_information[i]['description'],'count':1}
        }
    }
    if (document.getElementById('no_machine_detail2') != null) {
        echarts.dispose(document.getElementById('no_machine_detail2'))
    }
    document.getElementById('no_machine_detail2').style.height = 240 +'px';

    let myChart = echarts.init(document.getElementById('no_machine_detail2'));
    let x_data;
    let y_data = [];
    let text= '机器'+machine_number.toString() + ': 错误分布类型图'
    x_data = Object.keys(dist).sort(function(a,b){
        return parseInt(dist[b]['count'])-parseInt(dist[a]['count']);
    });

    x_data.forEach(function(d,i){
        y_data.push(parseInt(dist[d]['count']))
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
            data: x_data,
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

function load_machine_data(machine_number,result_data,timeline){
    let id = machine_number;
    let id_information = {};
    for(let i in timeline) {
        let time = timeline[i];
        id_information[time] = []
        let obj = result_data[time]
        for(i in obj){
            if (obj[i]['MachCode']==id.toString()){
                id_information[time].push(obj[i])
            }
        }
    }
    return id_information
}

function addTable(time,information) {

    if (document.getElementById('no_machine_detail2') != null) {
        echarts.dispose(document.getElementById('no_machine_detail2'))
    }

    let row_name = ['description','DateRec','DateEndStop','duration']
    let thead =  ['Description','DateRecord','DateEndStop','Duration']
    var myTableDiv = document.getElementById("no_machine_detail");

    $('#machine_tab').remove()
    var table = document.createElement('TABLE');
    table.setAttribute("id", "machine_tab");
    table.border = '1';

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);

    for (var i = 0; i < information[time].length+1; i++) {
        if(i==0){
            let tr = document.createElement('TR');
            tableBody.appendChild(tr);
            for (let m =0; m<4;m++){
                let td = document.createElement('TD');
                td.width = '175';
                td.appendChild(document.createTextNode(thead[m]));
                tr.appendChild(td);

            }
            continue;
        }
        let machine_data = information[time][i-1]
        console.log(machine_data)
        var tr = document.createElement('TR');
        tableBody.appendChild(tr);

        for (let j = 0; j < 4; j++) {
            let td = document.createElement('TD');
            td.width = '175';
            if(j==1 || j==2){
                let time=time_transfer(machine_data[row_name[j]]);
                td.appendChild(document.createTextNode(time));
            }else if(j==3){
                let time=calculate_duration(machine_data[row_name[2]]-machine_data[row_name[1]]);
                td.appendChild(document.createTextNode(time));

            }else{
                td.appendChild(document.createTextNode(machine_data[row_name[j]]));
            }
            tr.appendChild(td);
        }
    }
    myTableDiv.appendChild(table);

}

function time_transfer(date){
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    if(h<10){
        h = "0"+h.toString();
    }
    if(m<10){
        m = "0"+m.toString();
    }
    if(s<10){
        s = "0"+s.toString();
    }
    let time = h+":"+m+":"+s;
    return time;
}

function calculate_duration(duration){

    let time = Math.floor(duration / 1000);
    let h = Math.floor(time / 3600);
    let m = Math.floor(time / 60 % 60);
    let s = Math.floor(time % 60);
    if (h < 10) {
        h = "0" + h.toString();
    }
    if (m < 10) {
        m = "0" + m.toString();
    }
    if (s < 10) {
        s = "0" + s.toString();
    }
    time = h + ":" + m + ":" + s
    return time
}