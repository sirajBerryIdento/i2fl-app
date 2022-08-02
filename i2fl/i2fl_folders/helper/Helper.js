function getDateFromString(data,split_by, index) {
    return data.split(split_by)[index];
}
function transformToDateFormat(date) {// 2022-09-06 to 06-09-2022(dd-mm-yyyy)
    // return date.substring(6, 8) + "/" + date.substring(4, 6) + "/" + date.substring(0, 4);
    let date_splitted = date.split('-');
    return date_splitted[2]+'-'+date_splitted[1]+date_splitted[0];
}
function toLuccaDateFormate(date){ //from 20220906 to result: 2022-09-06
    return date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8); 
}
function isHalfDay(luccaLeaves, id) {
    var instanceId = id.split("-");
    instanceId = instanceId[0] + "-" + instanceId[1];
    var counter = 0;
    luccaLeaves.forEach((leave) => {
        if (leave.id.includes(instanceId)) {
            counter++
        }
    });

    if (counter == 2) { //PM and AM
        return false;
    }
    counter = 0;
    return true;
}
//yyyy-MM-dd to dd/MM/yyyy
function luccaToFitnetDateConvertor(day, month, year) {
    console.log('day, month, year: ',day, month, year);
    return ((day > 9) ? day : '0' + day) + "/" + ((month > 9) ? month : '0' + month) + "/" + year;
}
function isAm (id) {
    r = id.split('-')[2];
    return r==='AM' ;
}

module.exports = { getDateFromString, transformToDateFormat,isHalfDay, luccaToFitnetDateConvertor, isAm, toLuccaDateFormate};
