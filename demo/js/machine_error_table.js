function machine_error_table(sd,st,ed,et,file,index,value){

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
        let new_result_data = []

        //two cases-1:in one shift; 2: more than one shift
        let time_array = []
        let result_data;
        let valueData = [];
        let total_counts = 0;


        //load other charts function
        if(parseInt(time_end-time_start)===43200000){
            if(st=='19:00:00'){
                time_array =TimeGenerate(1140);
                result_data = Generator(1140,select_data)

            }else{
                time_array =TimeGenerate(420);
                result_data = Generator(420,select_data)
            }

            for (let i in time_array ){
                for(let item in result_data[time_array[i]]){
                    new_result_data.push(result_data[time_array[i]][item])
                }
            }

            //error table
            if(index=='previous'){
                draw_table(new_result_data,0,value);
            }else{
                draw_table(new_result_data,5,value);
            }



        }else{
            new_result_data = select_data;
            if(index=='previous'){
                draw_table(new_result_data,0,value);
            }else{
                draw_table(new_result_data,5,value);
            }
        }

        //onclick stop code
        let table = document.getElementById("error_body_result_shifts");
        if (table != null) {
            for (let i = 0; i < table.rows.length; i++) {
                table.rows[i].onclick = function () {
                    let str = this.cells[0].innerHTML;
                    let start = str.indexOf(':')+1
                    let machine_data = new_result_data.filter(item=>item['StopCode']==str.slice(start,str.length))
                    draw_table_charts(machine_data);
                };
            }
        }

    })


}





function draw_table_charts(machineData){

    let machine_errorCode = {}
    let stopCode = machineData[0]['StopCode']
    for (let item in machineData) {
        let machine = machineData[item];
        let s_time = machine['DateRec'];
        let e_time = machine['DateEndStop']
        let duration = e_time.getTime()-s_time.getTime()
        let duration_min = Math.floor(duration/60000)
        duration=Math.floor(duration)

        if(machine['MachCode'] in machine_errorCode){
            machine_errorCode[machine['MachCode']]['Count']+=1
            machine_errorCode[machine['MachCode']]['Duration']+=duration_min
            machine_errorCode[machine['MachCode']]['start'].push(time_transfer(s_time))
            machine_errorCode[machine['MachCode']]['end'].push(time_transfer(e_time))
            machine_errorCode[machine['MachCode']]['single_dtime'].push(calculate_duration(duration))

        }else{
            machine_errorCode[machine['MachCode']] = {'MachCode':machine['MachCode'],'Count':1,'Duration':duration_min,'start':[time_transfer(s_time)],'end':[time_transfer(e_time)],'single_dtime':[calculate_duration(duration)]}
        }

    }

    let res_counts = Object.keys(machine_errorCode).sort(function(a,b){
        return machine_errorCode[a]['Count']-machine_errorCode[b]['Count'];
    });
    let x_data;
    let y_data1 = [];
    let y_data2 = [];
    let text = '故障码分布:'+stopCode

    x_data = res_counts;
    x_data.forEach(function (d,i) {
        y_data1.push(machine_errorCode[d]['Count']);
        y_data2.push(machine_errorCode[d]['Duration']);
    })
    x_data=x_data.map(item=>'No:'+item);




    if (document.getElementById('table_chart_shifts') != null) {
        echarts.dispose(document.getElementById('table_chart_shifts'))
    }

    let myChart = echarts.init(document.getElementById('table_chart_shifts'));
    let option = {
        title: {
            text: text,
        },
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['产生次数'],
            orient: 'vertical',
            position:'left'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            boundaryGap: [0, 0.01]
        },
        yAxis: {
            type: 'category',
            data: x_data,
            axisLabel: { //xAxis，yAxis，axis都有axisLabel属性对象
                show: true, //默认为true，设为false后下面都没有意义了
                interval: 0, //此处关键， 设置文本标签全部显
            }
        },
        series: [
            {
                name: '产生次数',
                type: 'bar',
                data: y_data1,
                color: '#F39C12',
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            position: 'right',
                            textStyle: {
                                color: '#800080'
                            }
                        }
                    }
                }
            },


        ]
    };
    myChart.clear();

    myChart.setOption(option);
}

function draw_table(resultData,start,value){
    $("#error_body_result_shifts").empty();
    let result_data = resultData;

    let total = 0;
    let stopCounts = {};

    for(let item in result_data){
        total +=1;
        let code = result_data[item]['StopCode']
        let s_time = result_data[item]['DateRec'];
        let e_time = result_data[item]['DateEndStop'];
        let duration = 0;
        if(s_time && e_time){
            duration = e_time.getTime()-s_time.getTime()
            duration=Math.floor(duration/(1000))
        }

        if (code in stopCounts){

            stopCounts[code]['downtime']+=duration
            stopCounts[code]['counts'] +=1;
        }else{
            stopCounts[code] ={'stopCode':code,'description':result_data[item]['description'],'counts':1,'proportion':0,'downtime':duration}
        }
    }

    for(let item in stopCounts){
        stopCounts[item]['proportion'] = (stopCounts[item]['counts']/total*100).toFixed(2)
    }
    let sorted_code = vSort(stopCounts);
    let errorCountTable = []
    let errorCountTime = []
    let end = start + 5;
    for (let i = start; i < end;i++){
        errorCountTable.push(stopCounts[sorted_code[0][i]])
        errorCountTime.push(stopCounts[sorted_code[1][i]])
    }
    if (parseInt(value)==1){
        create_counts_shifts(errorCountTable,start);
    }else{
        create_duration(errorCountTime,start);
    }
}

function create_counts_shifts(top_data,start){
    let content_html = '';
    for(let i = 0;i<top_data.length;i++){
        let index = i+1+start;
        let content ='<tr><td>'+'<strong>'+index+'</strong>'+':'+top_data[i]['stopCode']+'</td><td>' + top_data[i]['description'] + '</td><td>' + top_data[i]['counts']+'</td><td>' + top_data[i]['proportion']+" %"+'</td></tr>';
        content_html += content + '\n';
    }
    document.getElementById("table_diff_shifts").innerHTML ='Percentage';
    document.getElementById("error_body_result_shifts").innerHTML =content_html;
}
function create_duration(top_data,start){
    let content_html = '';
    for(let i = 0;i<top_data.length;i++){
        let time = top_data[i]['downtime'];
        let h = Math.floor(time/3600);
        let m = Math.floor(time/60%60);
        let s = Math.floor(time % 60);
        if(h<10){
            h = "0"+h.toString();
        }
        if(m<10){
            m = "0"+m.toString();
        }
        if(s<10){
            s = "0"+s.toString();
        }
        time = h+":"+m+":"+s
        let index = i+1+start;
        let content = '<tr><td>'+'<strong>'+index+'</strong>'+':'+top_data[i]['stopCode']+'</td><td>' + top_data[i]['description']+ '</td><td>' + top_data[i]['counts'] + '</td><td>'  + time+'</td></tr>';
        content_html += content + '\n';
    }
    document.getElementById("table_diff_shifts").innerHTML ='Duration';
    document.getElementById("error_body_result_shifts").innerHTML =content_html;
}