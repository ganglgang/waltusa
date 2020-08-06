function summary_table(cty,start_time,file,position){
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
        let total = 0;
        let stopCounts = {}
        let timeData =TimeGenerate(start_time);
        for (let i in timeData ){
            for(let item in result_data[timeData[i]]){
                total +=1;
                let code = result_data[timeData[i]][item]['StopCode']
                let s_time = result_data[timeData[i]][item]['DateRec'];
                let e_time = result_data[timeData[i]][item]['DateEndStop'];
                let duration = e_time.getTime()-s_time.getTime()
                duration=Math.floor(duration/(1000))
                if (code in stopCounts){

                    stopCounts[code]['downtime']+=duration
                    stopCounts[code]['counts'] +=1;
                }else{
                    stopCounts[code] ={'stopCode':code,'description':result_data[timeData[i]][item]['description'],'counts':1,'proportion':0,'downtime':duration}
                }
            }


        }
        for(let item in stopCounts){
            stopCounts[item]['proportion'] = (stopCounts[item]['counts']/total*100).toFixed(2)
        }
        let sorted_code = vSort(stopCounts);
        let errorCountTable = []
        let errorCountTime = []
        let first;
        let end;

        // set table page split
        if(position==='previous'){
            console.log('hhahaha')
            first = 0;
            end = 5;
        }else{
            first = 5;
            end = 10;
        }


        for (let i = first; i < end;i++){
            errorCountTable.push(stopCounts[sorted_code[0][i]])
            errorCountTime.push(stopCounts[sorted_code[1][i]])

        }
        if(cty==1){
            create_counts(errorCountTable)
            console.log(errorCountTable)


        }else{
            console.log(errorCountTime)
            create_duration(errorCountTime)


        }

        //onclick stop code
        var table = document.getElementById("error_body_result");
        if (table != null) {
            for (var i = 0; i < table.rows.length; i++) {
                table.rows[i].onclick = function () {
                    table_chart(this.cells[0].innerHTML,timeData,result_data);
                };
            }
        }

    })
    //
}



function vSort(dict){
    let result = []
    let dic = dict;
    let res_counts = Object.keys(dic).sort(function(a,b){
        return dic[b]['counts']-dic[a]['counts'];
    });
    result.push(res_counts);
    let res_down = Object.keys(dic).sort(function(a,b){
        return dic[b]['downtime']-dic[a]['downtime'];
    });
    result.push(res_down);
    return result;
}

function create_counts(top_data){
    let content_html = '';
    for(let i = 0;i<top_data.length;i++){
        let content = '<tr><td>'+top_data[i]['stopCode']+'</td><td>' + top_data[i]['description'] + '</td><td>' + top_data[i]['counts']+'</td><td>' + top_data[i]['proportion']+" %"+'</td></tr>';
        content_html += content + '\n';
    }
    document.getElementById("table_diff").innerHTML ='Percentage';

    document.getElementById("error_body_result").innerHTML =content_html;
}

function create_duration(top_data){
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
        let content = '<tr><td>'+top_data[i]['stopCode']+'</td><td>' + top_data[i]['description']+ '</td><td>' + top_data[i]['counts'] + '</td><td>'  + time+'</td></tr>';
        content_html += content + '\n';
    }
    document.getElementById("table_diff").innerHTML ='Duration';

    document.getElementById("error_body_result").innerHTML =content_html;

}



function table_chart(stopCode,timeData,result_data){

    let machine_errorCode = {}
    for (let i in timeData ) {
        for (let item in result_data[timeData[i]]) {
            let machine = result_data[timeData[i]][item]
            if(machine['StopCode'] == stopCode){
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




    if (document.getElementById('table_chart') != null) {
        echarts.dispose(document.getElementById('table_chart'))
    }

    let myChart = echarts.init(document.getElementById('table_chart'));
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
    myChart.on('click', function (params) {
        table_record(params.name.replace("No:",""),machine_errorCode);

    });

}

function table_record(id, data){
    let input_data = data[id];
    let start_time = input_data['start']
    let end_time = input_data['end']


    let row_name = ['DateRec: No.'+id,'DateEndStop','Duration']
    let thead =  ['start','end','single_dtime']
    let myTableDiv = document.getElementById("table_chart");

    $('#machine_tab2').remove()
    let table = document.createElement('TABLE');
    table.setAttribute("id", "machine_tab2");
    table.border = '1';

    let tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);


    let tr = document.createElement('TR');
    tableBody.appendChild(tr);
    for (let m =0; m<3;m++){
        let td = document.createElement('TD');
        td.width = '175';
        td.appendChild(document.createTextNode(row_name[m]));
        tr.appendChild(td);
    }


    for (let i = 0; i < start_time.length; i++) {

        let tr = document.createElement('TR');
        tableBody.appendChild(tr);

        for (let j = 0; j < 3; j++) {
            let td = document.createElement('TD');
            td.width = '175';
            td.appendChild(document.createTextNode(input_data[thead[j]][i]));
            tr.appendChild(td);
        }
    }
    myTableDiv.appendChild(table);

}