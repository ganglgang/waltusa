

function data_load(sd,st,ed,et,file){

    text_clean();
    charts_clean();
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


        if(parseInt(time_end-time_start)===43200000){
            if(st=='19:00:00'){
                time_array =TimeGenerate(1140);
                result_data = Generator(1140,select_data)

            }
            else{
                time_array =TimeGenerate(420);
                result_data = Generator(420,select_data)

            }



            for(let i = 0; i < 25;i++){
                total_counts+=result_data[time_array[i]].length
                valueData.push(result_data[time_array[i]].length);
            }
            document.getElementById('sankey_diagram').style.height = 300+'px';
            shift_chart(time_array,valueData,result_data);

        }else{
            while(time_start <= time_end){
                let t = new_time_transfer(time_start)
                time_array.push(t);
                new Date(time_start.setHours( time_start.getHours() + 12))
            }
            time_array.push(new_time_transfer(time_start));
            document.getElementById('sankey_diagram').style.height = 850+'px';
            shifts_data(time_array,select_data);

        }




        // time_array -> time_data
    })
}


function shifts_data(time_array,raw_data){
    let count_data = []
    for (let i = 0;  i<time_array.length-1;i++){
        let start_time = time_array[i];
        start_time = '2020-'+start_time;
        start_time = new Date(Date.parse(start_time));
        let end_time = time_array[i+1];
        end_time = '2020-'+end_time;
        end_time = new Date(Date.parse(end_time));
        let new_select = raw_data.filter(item=>item['DateRec']>=start_time && item['DateRec']<end_time)
        count_data.push(new_select.length)
    }
    shift_chart(time_array.slice(0,time_array.length-2),count_data.slice(0,count_data.length-1),raw_data)
}

function shift_chart(time_array,valueData,result_data){
    if (document.getElementById('date_data') != null) {
        echarts.dispose(document.getElementById('date_data'))
    }
    let myChart = echarts.init(document.getElementById('date_data'));
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
            data: time_array
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            name: '发生次数：',
            data: valueData,
            type: 'line',
            areaStyle: {},
            markPoint: {
                data: [
                    {type: 'max', name: '最大值'},
                ]
            },
            color:'#3349db'
        }]
    };
    myChart.clear();
    myChart.setOption(option);
    myChart.on('click',  function(param) {
        if(param['name'].includes('-')){
            let time = [];
            let select_time_start = new Date(Date.parse('2020-'+ param['name']))
            //deep copy
            let select_time_end = new Date(Date.parse('2020-'+ param['name']))
            new Date(select_time_end.setHours( select_time_end.getHours() + 12))
            let new_result_data = result_data.filter(item=>item['DateRec']>=select_time_start && item['DateRec']<select_time_end);

            sankey_diagram(param['name'],new_result_data,param['value']);
        }else{
            sankey_diagram(param['name'],result_data[param['name']],param['value']);
        }
    });
}

function new_time_transfer(time_start){

    let month = time_start.getMonth();
    let date = time_start.getDate();
    let hour = time_start.getHours();
    let minute = time_start.getMinutes();
    let second = time_start.getSeconds();
    let time = ((month+1)>=10 ? (month+1):'0'+(month+1))+
        '-'+
        ((date+1)<10 ? '0'+date:date)+
        ' '+
        ((hour+1)<10 ? '0'+hour:hour)+
        ':'+
        ((minute+1)<10 ? '0'+minute:minute)+
        ':'+
        ((second+1)<10 ? '0'+second:second)
    return time;
}


function sankey_diagram(time,result_data,count){
    if (document.getElementById('sankey_diagram') != null) {
        echarts.dispose(document.getElementById('sankey_diagram'))
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

    let mach_no = Object.keys(mach_sort).sort(function(a,b){
        return mach_sort[b]['count']-mach_sort[a]['count'];})

    mach_no.forEach(function(d){
        error_data.push({name:d})
    })


    let myChart = echarts.init(document.getElementById('sankey_diagram'));
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

function charts_clean(){
    if (document.getElementById('sankey_diagram') != null) {
        echarts.dispose(document.getElementById('sankey_diagram'))
    }
    if (document.getElementById('error_summary_bar') != null) {
        echarts.dispose(document.getElementById('error_summary_bar'))
    }
    if (document.getElementById('error_summary_line') != null) {
        echarts.dispose(document.getElementById('error_summary_line'))
    }
    if (document.getElementById('error_summary_line') != null) {
        echarts.dispose(document.getElementById('error_summary_line'))
    }
    if (document.getElementById('table_chart_shifts') != null) {
        echarts.dispose(document.getElementById('table_chart_shifts'))
    }

    if (document.getElementById('machine_product') != null) {
        echarts.dispose(document.getElementById('machine_product'))
    }

}

function text_clean(){
    document.getElementById("text_id").innerHTML = '机器ID：';
    document.getElementById("text_open").innerHTML = '开机：';
    document.getElementById("text_stop").innerHTML = '停机：';
    document.getElementById("text_timeE").innerHTML = '开机效率：';
    document.getElementById("text_cycle").innerHTML = 'Max周期：';
    document.getElementById("text_pieces").innerHTML = '数量：';
    document.getElementById("text_workE").innerHTML = '生产效率：';
}