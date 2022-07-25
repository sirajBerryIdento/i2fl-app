function getDateFromId(data) {
    return data.id.split("-")[1];
}
function transformToDateFormat(date) { //returns this format: dd-MM-yyyy
    return date.substring(6, 8) + "/" + date.substring(4, 6) + "/" + date.substring(0, 4);
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
    return day + "/" + ((month > 9) ? month : '0' + month) + "/" + year;
}
function isAm (id) {
    r = id.split('-')[2];
    return r==='AM' ;
}

module.exports = { getDateFromId, transformToDateFormat,isHalfDay, luccaToFitnetDateConvertor, isAm};
