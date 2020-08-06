

function fileLoad(start_time,file){
    main_chart(start_time,file);
    summary_table(1,start_time,file,'previous');
    machine_summary(1,start_time,file,'No');

}


function TimeGenerate(start_time) {

    let x = 30; //minutes interval
    let times = []; // time array
    let tt = start_time; // start time
    let limit = Math.floor(tt / 60)+12;
//loop to increment the time and push results in array
    for (let i = 0; tt <= limit * 60; i++) {
        let hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
        let mm = (tt % 60); // getting minutes of the hour in 0-55 format
        times[i] = ("0" + (hh%24)).slice(-2) + ':' + ("0" + mm).slice(-2); // pushing data in array in [00:00 - 12:00 AM/PM format]
        tt = tt + x;
    }
    return times
}


function Generator(start_time,data){
    let result = []
    let time_line = TimeGenerate(start_time);
    let new_line = []

    let date1 = data[0]['DateRec'].toLocaleDateString();
    let date2 = data[data.length-1]['DateRec'].toLocaleDateString();


    let standard_time;
    if(start_time==1140){

    }else{
        standard_time = date2+' '+'07:00';
        standard_time = new Date(Date.parse(standard_time));
        date1 = date2;

    }
    let date = data[0]['DateRec'].toLocaleDateString();
    time_line.forEach(function(d,i){
        result[d] = [];
        if(i>=10){
            d=date2+" "+d;
        }else{
            d=date1+" "+d;
        }

        d = new Date(Date.parse(d));
        new_line.push(d);
    })

    if(start_time==1140){
        for (let i = 0; i < data.length;i++){
            for(let j = 1; j< new_line.length;j++){
                if (data[i]['DateRec'] < new_line[j]){
                    result[time_line[j]].push(data[i]);
                    break;
                }

            }
        }
    }else{

        for (let i = 0; i < data.length;i++){
            for(let j = 1; j< new_line.length;j++){
                if (data[i]['DateRec'] < new_line[j] && standard_time<data[i]['DateRec']){
                    result[time_line[j]].push(data[i]);
                    break;
                }

            }
        }
    }
    return result;
}