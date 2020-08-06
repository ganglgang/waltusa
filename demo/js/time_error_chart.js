
function main_chart(start_time,file) {
    if (document.getElementById('error_dist') != null) {
        echarts.dispose(document.getElementById('error_dist'))
    }
    d3.csv(file, function(data){
        drop_down(data);
        for(let i = 0; i < data.length;i++){

            let temp_start = data[i]['DateRec'];
            temp_start = temp_start.replace("-","/");
            temp_start = new Date(Date.parse(temp_start));
            data[i]['DateRec'] = temp_start;

            let temp_end = data[i]['DateEndStop'];
            temp_end = temp_end.replace("-","/");
            temp_end = new Date(Date.parse(temp_end));
            data[i]['DateEndStop'] = temp_end;
        }
        let result_data = Generator(start_time,data);
        let timeData =TimeGenerate(start_time);
        let valueData = [];
        let total_counts = 0;

        for(let i = 0; i < 25;i++){
            total_counts+=result_data[timeData[i]].length
            valueData.push(result_data[timeData[i]].length);
        }


        if (document.getElementById('machine') != null) {
            echarts.dispose(document.getElementById('machine'))
        }
        let myChart = echarts.init(document.getElementById('machine'));
        let text = '时段发生故障分布'

        let option = {
            title: {
                text:text ,
                x:'left'
            },
            tooltip: {
                show:true,
                transitionDuration:0,
                trigger: 'axis'
            },

            xAxis: {
                type: 'category',
                data: timeData
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                name: '发生次数：',
                data: valueData,
                type: 'line',
                markPoint: {
                    data: [
                        {type: 'max', name: '最大值'},
                    ]
                }
            }]
        };
        myChart.clear();
        myChart.setOption(option);

        myChart.on('click',  function(param) {
            console.log(param['value'])
            error_dist(param['name'],result_data[param['name']],param['value']);
        });


    });



}


function error_dist(time,result_data,count){
    if (document.getElementById('error_dist') != null) {
        echarts.dispose(document.getElementById('error_dist'))
    }

    let error_data = [{name:'Total Error'}]
    let data =[]
    let error_links = []
    let error_dict = {}
    let text = time+'前半小时产生故障数: '+count

    for (let i in result_data){
        if(result_data[i]['StopCode'] in error_dict){
            error_dict[result_data[i]['StopCode']]['value']+=1
        }else{
            data.push(result_data[i]['StopCode'])
            error_dict[result_data[i]['StopCode']] = {value:1,target:result_data[i]['StopCode'],source:'Total Error',description:result_data[i]['description']}
        }
    }

    let stop_code_sort = Object.keys(error_dict).sort(function(a,b){
        return error_dict[b]['value']-error_dict[a]['value'];})
    stop_code_sort.forEach(function(d){
        error_data.push({name:d})

    })



    for(let j in error_dict){
        error_links.push(error_dict[j])
    }

    //distribute error to each machine
    let mach_sort = {}
    for(let c in data){
        let error_machine_dict = {}
        let code = result_data.filter(item=>item['StopCode']===data[c]);
        for (let machine in code){

            if(code[machine]['MachCode'] in mach_sort){
                mach_sort[code[machine]['MachCode']]['count']+=1
            }else{
                mach_sort[code[machine]['MachCode']] = {'count':1}
            }

            if(code[machine]['MachCode'] in error_machine_dict){
                error_machine_dict[code[machine]['MachCode']]['value']+=1
            }else{
                error_machine_dict[code[machine]['MachCode']] = {value:1,target:code[machine]['MachCode'],source:code[machine]['StopCode'],description:code[machine]['description']}

            }

        }
        for(let no in error_machine_dict){
            error_links.push(error_machine_dict[no])
        }
    }

    console.log(mach_sort)
    let mach_no = Object.keys(mach_sort).sort(function(a,b){
        return mach_sort[b]['count']-mach_sort[a]['count'];})

    mach_no.forEach(function(d){
        error_data.push({name:d})
    })


    let myChart = echarts.init(document.getElementById('error_dist'));
    let option = {
        title: {
            text:text ,
            x:'left'
        },
        tooltip: {
            show:true,
            transitionDuration:0,
            trigger: 'item',
            triggerOn: 'mousemove',
            formatter:function (obj) {
                console.log(obj)
                if(obj['dataType']==='edge'){
                    if(obj['data']['source']==='Total Error'){
                        return obj['data']['source']+'->'+obj['data']['description']+": "+obj['data']['value']
                    }else{
                        return obj['data']['description']+'->'+"No."+obj['data']['target']+": "+obj['data']['value']
                    }
                }

            }
        },
        series: {
            type: 'sankey',
            top:30,
            layout: 'none',
            focusNodeAdjacency: 'allEdges',
            layoutIterations: 0,
            data: error_data,
            links:error_links
        }
    };
    myChart.clear();
    myChart.setOption(option)
}


function drop_down(data){
    let drop = {}
    for(let i = 0; i < data.length;i++){
        let item = data[i];
        if (item['StopCode'] in drop){
            continue;
        }else{
            drop[item['StopCode']]={'StopCode':item['StopCode'],'description':item['description']}
        }
    }
    let drop_index = Object.keys(drop).sort(function(a,b){
        return parseInt(drop[a]['StopCode'])-parseInt(drop[b]['StopCode']);
    });

    var html = [];
    html.push("<option>" + 'StopCode Query' + "</option>")
    for (let i = 0; i < drop_index.length; i++) {//begin for loop

        //add the option elements to the html array
        html.push("<option>" + drop_index[i].toString()+": "+drop[drop_index[i]]['description'] + "</option>")

    }//end for loop
//add the option values to the select list with an id of sex
    document.getElementById("drop").innerHTML = html.join("");


}